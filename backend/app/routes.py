from flask import Blueprint, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename
import os
import uuid

from . import db
from .models import Receipt, Item
from image_enhancer import preprocess_for_ocr
from .services import ocr_service, split_service

bp = Blueprint('routes', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST'])
def upload_receipt():
    """Handles file upload, preprocessing, OCR, and database storage."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        # Generate a unique filename to prevent collisions and obscure original name
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        original_filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        processed_filename = f"enhanced_{unique_filename}"
        processed_filepath = os.path.join(current_app.config['PROCESSED_FOLDER'], processed_filename)

        try:
            # 1. Save the original file
            print(f"Saving original file to: {original_filepath}")
            file.save(original_filepath)

            # 2. Create initial Receipt record
            receipt = Receipt(
                original_filename=original_filename,
                storage_filename=unique_filename,
                status='upload_complete'
            )
            db.session.add(receipt)
            db.session.commit() # Commit to get the receipt ID
            print(f"Created initial Receipt DB record with ID: {receipt.id}")

            # 3. Preprocess the image for OCR
            receipt.status = 'preprocessing'
            db.session.commit()
            print(f"Starting image preprocessing for: {original_filepath}")
            # Use parameters from config or defaults for preprocessing
            contrast = current_app.config.get('ENHANCER_CONTRAST', 1.5)
            sharpness = current_app.config.get('ENHANCER_SHARPNESS', 2.0)

            # Call the new preprocessing function
            success = preprocess_for_ocr(original_filepath, processed_filepath,
                                         contrast=contrast, sharpness=sharpness)

            if not success:
                receipt.status = 'preprocessing_failed'
                db.session.commit()
                print(f"Image preprocessing failed for: {original_filepath}")
                return jsonify({"error": "Failed to preprocess image"}), 500

            receipt.processed_filename = processed_filename
            receipt.status = 'preprocessing_complete'
            db.session.commit()
            print(f"Image preprocessing successful. Saved to: {processed_filepath}")

            # 4. Perform OCR on the processed image
            receipt.status = 'ocr_inprogress'
            db.session.commit()
            print(f"Starting OCR for: {processed_filepath}")
            # Now passing the configured language and config string from ocr_service
            extracted_text = ocr_service.extract_text_from_image(processed_filepath)

            if extracted_text is None:
                receipt.status = 'ocr_failed'
                db.session.commit()
                print(f"OCR failed for: {processed_filepath}")
                # Decide if we should still proceed or return error
                return jsonify({"error": "Failed to extract text from image using OCR"}), 500

            receipt.raw_ocr_text = extracted_text
            receipt.status = 'ocr_complete'
            db.session.commit()
            print("OCR completed successfully.")

            # 5. Parse the extracted text
            receipt.status = 'parsing'
            db.session.commit()
            print("Starting text parsing...")
            parsed_data = ocr_service.parse_receipt_text(extracted_text)
            print(f"Parsing result: {parsed_data}")

            # 6. Store parsed items and total in the database
            receipt.parsed_total_amount = parsed_data.get('total_amount')
            db.session.commit() # Commit total amount

            # Clear existing items if any (e.g., if reparsing)
            Item.query.filter_by(receipt_id=receipt.id).delete()

            parsed_items = parsed_data.get('items', [])
            if parsed_items:
                for item_data in parsed_items:
                    # Basic validation
                    if isinstance(item_data.get('price'), (int, float)) and item_data.get('name'):
                        item = Item(
                            name=item_data['name'],
                            quantity=item_data.get('quantity', 1), # Default quantity 1
                            price=item_data['price'],
                            receipt_id=receipt.id
                        )
                        db.session.add(item)
                    else:
                        print(f"Skipping invalid parsed item data: {item_data}")
                db.session.commit() # Commit all added items
                print(f"Added {len(parsed_items)} parsed items to the database.")
            else:
                print("No valid items found during parsing.")

            receipt.status = 'parsing_complete' # Or maybe 'ready_for_split'?
            db.session.commit()

            # Return the processed receipt data
            return jsonify(receipt.to_dict()), 201 # 201 Created

        except Exception as e:
            db.session.rollback() # Rollback DB changes on error
            # Try to update status to error if receipt object exists
            try:
                rcpt = Receipt.query.get(receipt.id if 'receipt' in locals() and receipt else -1)
                if rcpt:
                    rcpt.status = 'processing_error'
                    db.session.commit()
            except Exception as db_err:
                print(f"Failed to update receipt status to error after main exception: {db_err}")

            print(f"Error processing upload: {e}")
            # Clean up created files on error?
            # if os.path.exists(original_filepath):
            #     os.remove(original_filepath)
            # if os.path.exists(processed_filepath):
            #     os.remove(processed_filepath)
            return jsonify({"error": f"An internal error occurred during processing: {str(e)}"}), 500

    else:
        return jsonify({"error": "File type not allowed"}), 400

@bp.route('/receipts', methods=['GET'])
def get_receipts():
    """Returns a list of all processed receipts."""
    try:
        receipts = Receipt.query.order_by(Receipt.upload_timestamp.desc()).all()
        return jsonify([r.to_dict() for r in receipts]), 200
    except Exception as e:
        print(f"Error fetching receipts: {e}")
        return jsonify({"error": "Failed to retrieve receipts"}), 500

@bp.route('/receipts/<int:receipt_id>', methods=['GET'])
def get_receipt(receipt_id):
    """Returns details for a specific receipt."""
    try:
        receipt = Receipt.query.get_or_404(receipt_id)
        return jsonify(receipt.to_dict()), 200
    except Exception as e:
        # Handle cases where ID is not found (get_or_404 handles typical case)
        if "404 Not Found" in str(e):
             abort(404, description="Receipt not found")
        print(f"Error fetching receipt {receipt_id}: {e}")
        return jsonify({"error": "Failed to retrieve receipt details"}), 500

@bp.route('/receipts/<int:receipt_id>', methods=['DELETE'])
def delete_receipt(receipt_id):
    """Deletes a receipt and its associated files and data."""
    try:
        receipt = Receipt.query.get_or_404(receipt_id)

        # Store paths before deleting the DB record
        original_filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], receipt.storage_filename)
        processed_filepath = os.path.join(current_app.config['PROCESSED_FOLDER'], receipt.processed_filename) if receipt.processed_filename else None

        # Delete the database record (cascading delete should handle items)
        db.session.delete(receipt)
        db.session.commit()
        print(f"Deleted Receipt DB record with ID: {receipt_id}")

        # Delete associated files
        if os.path.exists(original_filepath):
            os.remove(original_filepath)
            print(f"Deleted original file: {original_filepath}")
        else:
            print(f"Original file not found, skipping deletion: {original_filepath}")

        if processed_filepath and os.path.exists(processed_filepath):
            os.remove(processed_filepath)
            print(f"Deleted processed file: {processed_filepath}")
        elif processed_filepath:
             print(f"Processed file not found, skipping deletion: {processed_filepath}")

        return jsonify({"message": f"Receipt {receipt_id} deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        if "404 Not Found" in str(e):
            abort(404, description="Receipt not found")
        print(f"Error deleting receipt {receipt_id}: {e}")
        return jsonify({"error": "Failed to delete receipt"}), 500


@bp.route('/receipts/<int:receipt_id>/split', methods=['POST'])
def split_bill(receipt_id):
    """Calculates how to split the bill for a given receipt."""
    receipt = Receipt.query.get_or_404(receipt_id)

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    split_method = data.get('method') # e.g., 'equal', 'proportional'
    people = data.get('people') # Data needed depends on the method

    if not split_method or not people:
        return jsonify({"error": "Missing 'method' or 'people' in request data"}), 400

    # Use the parsed total if available, otherwise maybe error or allow override?
    total = receipt.parsed_total_amount
    items = [item.to_dict() for item in receipt.items]

    if total is None and split_method == 'equal':
        # Try to calculate total from items if parsed total is missing
        if items:
            calculated_total = sum(i['price'] * i['quantity'] for i in items)
            print(f"Warning: Parsed total missing for receipt {receipt_id}. Using calculated total from items: {calculated_total}")
            total = calculated_total
        else:
            return jsonify({"error": "Cannot perform equal split: Parsed total amount is missing and no items found."}), 400

    split_result = None
    try:
        if split_method == 'equal':
            if not isinstance(people, int) or people <= 0:
                return jsonify({"error": "For equal split, 'people' must be a positive integer representing the number of people."}), 400
            split_result = split_service.split_equally(total, people)

        elif split_method == 'proportional':
            # 'people' should be a dictionary mapping person name to item indices/IDs they are assigned
            # Example: {'Alice': [item_id1, item_id2], 'Bob': [item_id3]}
            if not isinstance(people, dict):
                 return jsonify({"error": "For proportional split, 'people' must be a dictionary mapping person to item assignments."}), 400
            # We pass the list of item dicts and the assignment dict
            split_result = split_service.split_proportionally(items, people)

        # TODO: Add handling for discounts, tips, taxes here or within split functions
        # discount = data.get('discount')
        # tip = data.get('tip')
        # if discount or tip:
        #     split_result = split_service.handle_discounts_and_tips(total, items, split_result, discount, tip, method=split_method)

        else:
            return jsonify({"error": f"Unsupported split method: {split_method}"}), 400

        # Check if the split service returned an error
        if isinstance(split_result, dict) and 'error' in split_result:
             return jsonify(split_result), 400 # Return error from service

        # TODO: Store the split result in the database? (Requires Split model)
        # new_split = Split(receipt_id=receipt.id, method=split_method, results=split_result)
        # db.session.add(new_split)
        # receipt.status = 'split_complete' # Update receipt status
        # db.session.commit()
        print(f"Successfully calculated split for receipt {receipt_id}. Method: {split_method}. Result: {split_result}")

        return jsonify(split_result), 200

    except Exception as e:
        print(f"Error during bill splitting for receipt {receipt_id}: {e}")
        return jsonify({"error": f"An internal error occurred during splitting: {str(e)}"}), 500 