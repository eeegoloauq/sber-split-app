import pytesseract
import re
from PIL import Image

# --- Configuration --- #

# IMPORTANT: If Tesseract is not in your system's PATH, you need to specify its location.
# Setting the command path explicitly based on user input.
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# Example for macOS (if installed via Homebrew, usually in PATH, but if not):
# pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'
# Example for Linux (usually in PATH):
# pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'

# Specify language(s) for OCR (e.g., 'eng' for English, 'rus' for Russian)
# Use '+' to combine languages, e.g., 'eng+rus'
TESSERACT_LANG = 'eng+rus'

# Default Tesseract configuration options
# Try different PSM modes: 3 (Default), 4 (Column), 6 (Block), 11 (Sparse)
DEFAULT_TESSERACT_CONFIG = ''
# Consider adding whitelist: ' -c tessedit_char_whitelist=0123456789.,АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'
# DEFAULT_TESSERACT_CONFIG = '--psm 6 -c tessedit_char_whitelist=0123456789.,АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'

def extract_text_from_image(image_path, lang=TESSERACT_LANG, config=DEFAULT_TESSERACT_CONFIG):
    """Extracts text from an image file using Tesseract OCR.

    Args:
        image_path (str): The path to the image file.
        lang (str, optional): Language string for Tesseract. Defaults to TESSERACT_LANG.
        config (str, optional): Additional configuration flags for Tesseract (e.g., '--psm 6').
                                Defaults to DEFAULT_TESSERACT_CONFIG.

    Returns:
        str: The extracted text, or None if an error occurs.
    """
    try:
        # Use pytesseract to do OCR on the image with specified language and config
        text = pytesseract.image_to_string(Image.open(image_path), lang=lang, config=config)
        # Use triple quotes for multi-line f-string
        print(f"""---
Tesseract Raw Output for {image_path}:
{text}
---""")
        return text
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        return None
    except pytesseract.TesseractNotFoundError:
        print("Error: Tesseract is not installed or not in your PATH.")
        print("Please install Tesseract and ensure it's accessible.")
        print("See: https://github.com/tesseract-ocr/tesseract#installation")
        # You might need to uncomment and set `pytesseract.tesseract_cmd` path
        # at the top of this file if Tesseract is installed but not in PATH.
        return None
    except Exception as e:
        print(f"Error during OCR processing for {image_path}: {e}")
        return None

def parse_receipt_text(text):
    """Parses the raw text extracted from a receipt to find items and total.

    Args:
        text (str): The raw text output from OCR.

    Returns:
        dict: A dictionary containing parsed data:
              {'items': list of dicts [{'name': str, 'price': float, 'quantity': int}],
               'total_amount': float or None}
              Returns empty structure if parsing fails.

    NOTE: This is a VERY basic parser. Real receipts have diverse formats.
          This will likely need significant improvement using Regular Expressions (regex)
          or more advanced parsing techniques.
    """
    items = []
    total_amount = None

    if not text:
        return {'items': items, 'total_amount': total_amount}

    lines = text.strip().split('\n')

    # --- Extremely Simple Parsing Logic (Example) --- #
    # This tries to find lines that might contain an item name and a price.
    # It looks for lines with text followed by numbers (potentially price).
    # This is NOT robust and will fail on many receipt formats.
    item_pattern = re.compile(r'^(.*?)\s+([\d,.]+)\s*$', re.IGNORECASE | re.MULTILINE)
    # Attempt to find a total amount (looks for lines starting with TOTAL, ИТОГО etc.)
    total_pattern = re.compile(r'^(?:TOTAL|ИТОГО|ВСЕГО|SUM|AMOUNT)\b.*?\s+([\d,.]+)\s*$', re.IGNORECASE)

    print("--- Parsing Receipt Text ---")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        print(f"Processing line: '{line}'")

        # Check for total first
        total_match = total_pattern.search(line)
        if total_match:
            try:
                # Replace comma with dot for float conversion
                price_str = total_match.group(1).replace(',', '.')
                total_amount = float(price_str)
                print(f"  Found potential total: {total_amount}")
                # Don't add total as an item, continue to next line
                continue
            except ValueError:
                print(f"  Could not parse potential total amount: {total_match.group(1)}")
                pass # Ignore if conversion fails

        # Check for items (basic pattern)
        item_match = item_pattern.match(line)
        if item_match:
            item_name = item_match.group(1).strip()
            price_str = item_match.group(2).replace(',', '.')

            # Basic check: avoid adding lines that are likely just the total again
            if item_name.upper() in ['TOTAL', 'ИТОГО', 'ВСЕГО', 'SUM', 'AMOUNT']:
                print(f"  Skipping likely total line found by item pattern: '{line}'")
                continue

            # Basic check: avoid adding lines with only numbers (maybe tax or change?)
            if item_name.replace('.', '').replace(',', '').isdigit():
                print(f"  Skipping likely numeric-only line: '{line}'")
                continue

            try:
                price = float(price_str)
                # Assume quantity is 1 for now, real parsing would look for quantity indicators (e.g., '2 x')
                items.append({'name': item_name, 'price': price, 'quantity': 1})
                print(f"  Found potential item: Name='{item_name}', Price={price}")
            except ValueError:
                print(f"  Could not parse potential item price: {price_str} in line '{line}'")
                pass # Ignore if conversion fails
        else:
             print(f"  Line did not match item or total pattern: '{line}'")

    print(f"--- Parsing Complete. Total: {total_amount}, Items Found: {len(items)} ---")

    # If total wasn't found via keyword, maybe the last parsed number is the total?
    # This is a guess and might be wrong.
    if total_amount is None and items:
        # Check if the last 'item' looks more like a total
        last_potential_item = items[-1]
        # If the name is something generic or the price is much higher than others, guess it's total
        # Heuristic: Check if the last item price is > sum of all other items? (crude)
        sum_others = sum(item['price'] for item in items[:-1])
        if sum_others > 0 and last_potential_item['price'] > sum_others:
             print(f"Guessing last item is total: {last_potential_item}")
             total_amount = last_potential_item['price']
             items.pop() # Remove it from items list
        # Alternative guess: highest value is total?
        # prices = [item['price'] for item in items]
        # if prices:
        #    potential_total = max(prices)
        #    # Add more checks here

    return {'items': items, 'total_amount': total_amount}
 