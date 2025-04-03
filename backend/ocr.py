 
filename = 'checks/all (2).jpg'

from PIL import Image

# Load an image
img = Image.open(filename)
import pytesseract
# Use Tesseract to extract text
text = pytesseract.image_to_string(img, lang='rus')

# Print the extracted text
print(text)