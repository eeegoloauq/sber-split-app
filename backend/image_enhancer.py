# -----------------------------------------------------------------------
# image_enhancer.py
# Version: 1.1 (Added Grayscaling and Adaptive Thresholding for OCR)
# Author: Vell Void
# GitHub: https://github.com/VellVoid
# Twitter: https://twitter.com/VellVoid
#
# This Python script enhances images using the OpenCV and PIL libraries,
# optimized for better OCR results.
# -----------------------------------------------------------------------


import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance
from tqdm import tqdm

# Function to preprocess image for better OCR results
def preprocess_for_ocr(image_path, output_path, contrast=1.5, sharpness=2.0):
    """Preprocesses an image for OCR: converts to grayscale, enhances contrast,
       sharpness, and applies adaptive thresholding.

    Args:
        image_path (str): Path to the input image.
        output_path (str): Path to save the processed image.
        contrast (float, optional): Contrast enhancement factor. Defaults to 1.5.
        sharpness (float, optional): Sharpness enhancement factor. Defaults to 2.0.

    Returns:
        bool: True if processing was successful, False otherwise.
    """
    try:
        # Load the image using OpenCV
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error: Could not load image at {image_path}")
            return False

        # 1. Convert to Grayscale
        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Enhance Contrast and Sharpness using PIL (can be more intuitive)
        pil_img = Image.fromarray(gray_img)

        if contrast > 1.0:
            enhancer = ImageEnhance.Contrast(pil_img)
            pil_img = enhancer.enhance(contrast)

        if sharpness > 1.0:
            enhancer = ImageEnhance.Sharpness(pil_img)
            pil_img = enhancer.enhance(sharpness)

        # Convert back to OpenCV format (grayscale)
        processed_img = np.array(pil_img)

        # 3. Skip Adaptive Thresholding for now - it might be too aggressive
        # binary_img = cv2.adaptiveThreshold(
        #     processed_img,
        #     255, # Max value to assign
        #     cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        #     cv2.THRESH_BINARY,
        #     11, # Block size (needs tuning, try 15, 17, etc.)
        #     2  # Constant C (needs tuning, try 3, 4, 5 etc.)
        # )

        # Optional: Add some noise reduction (e.g., median blur) if needed
        # processed_img = cv2.medianBlur(processed_img, 3) # Apply to grayscale if needed

        # Save the processed image (enhanced grayscale)
        success = cv2.imwrite(output_path, processed_img)
        if not success:
             print(f"Error: Could not save processed image to {output_path}")
             return False

        return True

    except Exception as e:
        print(f"Error preprocessing image {image_path}: {e}")
        return False


# --- Keep the old enhance_image for reference or other uses? --- #
# You might want to remove or rename this if preprocess_for_ocr is the primary method now.
def enhance_image_original(image_path, output_path, sharpness=4, contrast=1.3, blur=3):
    """Original enhance function: sharpness, contrast, blur on RGB image."""
    try:
        img = cv2.imread(image_path)
        if img is None: return False
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img)
        enhancer = ImageEnhance.Sharpness(pil_img)
        img_enhanced = enhancer.enhance(sharpness)
        enhancer = ImageEnhance.Contrast(img_enhanced)
        img_enhanced = enhancer.enhance(contrast)
        img_enhanced = np.array(img_enhanced)
        img_enhanced = cv2.GaussianBlur(img_enhanced, (blur, blur), 0)
        img_enhanced_pil = Image.fromarray(img_enhanced)
        img_enhanced_pil.save(output_path)
        return True
    except Exception as e:
        print(f"Error in enhance_image_original for {image_path}: {e}")
        return False
# ---------------------------------------------------------------- #

def process_directory(input_dir, output_dir_name, use_ocr_preprocessing=True, **kwargs):
    """Process all images in a directory, enhancing or preprocessing them.

    Args:
        input_dir (str): Path to the input directory with images.
        output_dir_name (str): Name of output directory to save enhanced images.
        use_ocr_preprocessing (bool): If True, use preprocess_for_ocr. If False, use original enhance.
        **kwargs: Additional arguments for the chosen processing function
                 (e.g., contrast, sharpness for preprocess_for_ocr).
    """

    output_dir = os.path.join(input_dir, output_dir_name)
    if not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
        except OSError as e:
            print(f"Error creating directory {output_dir}: {e}")
            return

    try:
        all_files = os.listdir(input_dir)
    except FileNotFoundError:
        print(f"Error: Input directory not found: {input_dir}")
        return
    except Exception as e:
        print(f"Error listing files in directory {input_dir}: {e}")
        return

    image_files = [f for f in all_files
                   if os.path.isfile(os.path.join(input_dir, f)) and
                      f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff'))]

    if not image_files:
        print(f"No image files found in {input_dir}")
        return

    print(f"Processing {len(image_files)} images from {input_dir}...")
    for filename in tqdm(image_files, desc="Processing images"): # Use tqdm for progress bar
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)

        if use_ocr_preprocessing:
            preprocess_for_ocr(input_path, output_path, **kwargs)
        else:
            # Pass only relevant kwargs if using original
            original_kwargs = {k: v for k, v in kwargs.items() if k in ['sharpness', 'contrast', 'blur']}
            enhance_image_original(input_path, output_path, **original_kwargs)

    print(f"Processed images saved to {output_dir}")

# Example usage:
# process_directory('path/to/your/images', 'ocr_processed', use_ocr_preprocessing=True, contrast=1.7)
# process_directory('path/to/your/images', 'enhanced_output', use_ocr_preprocessing=False, sharpness=4, contrast=1.3) 