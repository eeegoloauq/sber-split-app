from . import db
from datetime import datetime

# Define the database models using SQLAlchemy

class Receipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    storage_filename = db.Column(db.String(255), unique=True, nullable=False)
    processed_filename = db.Column(db.String(255), unique=True, nullable=True) # Path to enhanced image
    upload_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    raw_ocr_text = db.Column(db.Text, nullable=True) # Store the raw text from OCR
    parsed_total_amount = db.Column(db.Float, nullable=True) # Total amount parsed from OCR
    status = db.Column(db.String(50), default='uploaded') # e.g., uploaded, enhancing, ocr_complete, split_pending, split_complete, error

    # Relationship to items (one receipt has many items)
    items = db.relationship('Item', backref='receipt', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Receipt {self.id}: {self.original_filename} (Status: {self.status})>'

    def to_dict(self):
        """Returns a dictionary representation of the receipt."""
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'storage_filename': self.storage_filename,
            'processed_filename': self.processed_filename,
            'upload_timestamp': self.upload_timestamp.isoformat() + 'Z' if self.upload_timestamp else None,
            'raw_ocr_text': self.raw_ocr_text,
            'parsed_total_amount': self.parsed_total_amount,
            'status': self.status,
            'items': [item.to_dict() for item in self.items]
        }

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    price = db.Column(db.Float, nullable=False) # Price for a single unit
    receipt_id = db.Column(db.Integer, db.ForeignKey('receipt.id'), nullable=False)

    def __repr__(self):
        return f'<Item {self.id}: {self.name} ({self.quantity} x {self.price})>'

    def to_dict(self):
        """Returns a dictionary representation of the item."""
        return {
            'id': self.id,
            'name': self.name,
            'quantity': self.quantity,
            'price': self.price,
            'receipt_id': self.receipt_id
        }

# Potential future models:
# class Split(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     receipt_id = db.Column(db.Integer, db.ForeignKey('receipt.id'), nullable=False)
#     method = db.Column(db.String(50)) # e.g., 'equal', 'proportional'
#     split_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
#     # Store the results (maybe as JSON? or in a separate table?)
#     results = db.Column(db.JSON, nullable=True) # Requires JSON support in DB

# class PersonShare(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     split_id = db.Column(db.Integer, db.ForeignKey('split.id'), nullable=False)
#     person_name = db.Column(db.String(100))
#     amount_owed = db.Column(db.Float)
#     # Link to items they paid for if doing proportional split? 