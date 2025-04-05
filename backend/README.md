# Sber Split App - Backend README

Welcome to the backend documentation for the Sber Split App! This guide is designed for beginners to help you understand the project structure, set it up, and run it.

## Project Goal

The goal of this backend is to power a web application that helps users split restaurant bills. It works by:

1.  Accepting an uploaded photo of a receipt.
2.  Improving the quality of the image (using the `image_enhancer.py` script).
3.  Using Optical Character Recognition (OCR) to read the text (items, prices, total) from the enhanced image.
4.  Storing the receipt information in a database.
5.  Providing options to split the bill among different people (e.g., equally or based on who ordered what).
6.  Offering an API (Application Programming Interface) for the frontend (the user interface you see in the browser) to interact with.

## Project Structure

Here's a breakdown of the main files and folders in the `backend` directory:

```
backend/
├── app/                  # Main Flask application package
│   ├── __init__.py       # Initializes the Flask app and extensions (like the database)
│   ├── models.py         # Defines the database structure (tables for receipts, items)
│   ├── routes.py         # Defines the API endpoints (URLs) the frontend will call
│   ├── services/         # Contains business logic modules
│   │   ├── __init__.py   # Makes 'services' a Python package
│   │   ├── ocr_service.py # Handles extracting text from images (OCR)
│   │   └── split_service.py # Handles the logic for splitting the bill
│   ├── static/           # (Optional) Folder for static files like CSS, JS (if backend serves them)
│   └── templates/        # (Optional) Folder for HTML templates (if backend serves them)
├── python-image-enhancer/ # (Original folder, script moved to root)
│   └── image_enhancer.py # (Original location)
├── uploads/              # Stores the original receipt images uploaded by users
├── processed_images/     # Stores the enhanced images created by image_enhancer.py
├── migrations/           # Stores database migration scripts (created by Flask-Migrate)
├── .env                  # (Optional/Recommended) Stores environment variables (like secret keys, database URLs) - **DO NOT COMMIT THIS TO GIT**
├── app.db                # The SQLite database file (will be created on first run)
├── config.py             # Configuration settings for the Flask app (e.g., database location, secret key)
├── image_enhancer.py     # Script for improving image quality (moved here for easier import)
├── requirements.txt      # Lists the Python libraries needed for the project
├── run.py                # The main script to start the backend server
└── README.md             # This file!
```

## Setup Instructions

Follow these steps carefully to get the backend running on your computer.

**1. Prerequisites:**

*   **Python 3:** Make sure you have Python 3 installed. You can check by opening your terminal (like PowerShell or Command Prompt on Windows) and typing `python --version` or `python3 --version`. If you don't have it, download it from [python.org](https://www.python.org/).
*   **pip:** Python's package installer. It usually comes with Python. Check with `pip --version` or `pip3 --version`.
*   **Git:** (Recommended) For version control. Download from [git-scm.com](https://git-scm.com/).
*   **Tesseract OCR Engine:** This is crucial for reading text from images.
    *   **Windows:** Download the installer from the [Tesseract at UB Mannheim page](https://github.com/UB-Mannheim/tesseract/wiki). During installation, **make sure to select the option to add Tesseract to your system PATH**. Also, consider adding language packs (like Russian, if your receipts are in Russian) during installation.
    *   **macOS:** Use Homebrew: `brew install tesseract tesseract-lang`
    *   **Linux (Debian/Ubuntu):** `sudo apt update && sudo apt install tesseract-ocr tesseract-ocr-rus` (add other language packs as needed, e.g., `tesseract-ocr-eng`).
    *   **Verify Installation:** Open a *new* terminal and type `tesseract --version`. If it shows the version, it's likely installed correctly and in your PATH. If not, you might need to manually add the installation directory to your system's PATH environment variable or specify the path in `backend/app/services/ocr_service.py`.

**2. Clone the Repository (if you haven't):**

```bash
git clone <your-repository-url>
cd sber-split-app # Or your project's main directory
```

**3. Navigate to the Backend Directory:**

Open your terminal and navigate into the `backend` folder:

```bash
cd backend
```

**4. Create a Virtual Environment (Highly Recommended):**

A virtual environment keeps the Python packages for this project separate from others on your system.

```bash
# Create the virtual environment (named 'venv')
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate
```

You should see `(venv)` at the beginning of your terminal prompt, indicating the virtual environment is active.

**5. Install Required Python Packages:**

While the virtual environment is active, install all the libraries listed in `requirements.txt`:

```bash
pip install -r requirements.txt
```

This might take a few minutes.

**6. (Optional but Recommended) Create a `.env` file:**

Create a file named `.env` (note the leading dot) inside the `backend` directory. Add the following line:

```
FLASK_APP=run.py
# You can add other configurations here later if needed, like a real SECRET_KEY
# SECRET_KEY='a-very-strong-and-random-secret-key'
```
This helps Flask find your main application file. The `SECRET_KEY` is important for security, especially in production, but the default in `config.py` is okay for local development *only*.

**7. Initialize/Migrate the Database:**

We use Flask-Migrate to manage changes to our database structure (`models.py`). Run these commands *once* initially:

```bash
# Make sure your venv is active and you are in the 'backend' directory
flask db init  # Creates the migrations folder (only needed the very first time)
flask db migrate -m "Initial database schema" # Creates a migration script based on models.py
flask db upgrade # Applies the migration to create the database (app.db)
```

If you change `models.py` later, you'll typically run `flask db migrate -m "Description of changes"` and `flask db upgrade` again.

## Running the Backend Server

With the setup complete, you can now run the backend server:

```bash
# Make sure your venv is active and you are in the 'backend' directory
flask run
```

You should see output similar to this:

```
 * Environment: development
 * Debug Mode: on
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: ...
```

This means your backend server is running locally on your machine at the address `http://127.0.0.1:5000/`. It's now ready to receive requests from the frontend (or tools like Postman/Insomnia for testing).

To stop the server, press `Ctrl + C` in the terminal where it's running.

## How It Works (Simplified)

1.  **Frontend Sends Request:** The user interacts with the frontend (web page), uploads a receipt image, and clicks a button. The frontend sends this image to a specific URL on the backend server (e.g., `POST /upload`).
2.  **Backend Receives Request (`routes.py`):** The `upload_receipt` function in `routes.py` handles this request.
3.  **Save & Enhance:** It saves the original image (`uploads/`) and calls the `enhance_image` function from `image_enhancer.py` to create a clearer version (`processed_images/`).
4.  **OCR (`ocr_service.py`):** The backend calls `extract_text_from_image` in `ocr_service.py`, which uses the external Tesseract program to "read" the text from the enhanced image.
5.  **Parse Text:** The `parse_receipt_text` function tries to find items and prices in the extracted text (this part is basic and might need improvement).
6.  **Database (`models.py`, `db`):** The backend creates a new `Receipt` record and associated `Item` records in the database (`app.db`) to store the information.
7.  **Backend Sends Response:** The backend sends back a confirmation message to the frontend, usually including the ID of the newly created receipt and the parsed data.
8.  **Splitting:** Later, the frontend might send another request (e.g., `POST /receipt/<id>/split`) with the receipt ID, a list of people, and the desired split method.
9.  **Calculate Split (`split_service.py`):** The backend retrieves the receipt data from the database, uses functions in `split_service.py` (like `split_equally`) to calculate how much each person owes, and saves the result.
10. **Return Split:** The backend sends the calculated split amounts back to the frontend to display to the user.

## Important Notes for Beginners

*   **OCR is Imperfect:** Reading text from images (especially photos of crumpled receipts) is challenging. The accuracy of Tesseract (and our basic parsing in `ocr_service.py`) might not be perfect. It might misread items, miss prices, or fail completely on blurry images. Improving OCR is a common challenge in these types of projects.
*   **Image Enhancement:** The `image_enhancer.py` script tries to help OCR by improving sharpness and contrast, but its effectiveness depends on the original image quality.
*   **Error Handling:** The code includes basic error handling (e.g., checking if a file exists, catching exceptions), but real-world applications need more robust error checks.
*   **Database:** We are using SQLite (`app.db`), which is a simple file-based database great for development. For larger applications, you might switch to databases like PostgreSQL or MySQL.
*   **Security:** The `SECRET_KEY` in `config.py` is just a placeholder. For a real application deployed online, you **must** use a strong, random secret key and keep it private (using environment variables via a `.env` file or system settings is standard practice). Never commit secret keys to Git.
*   **Dependencies:** The `requirements.txt` file ensures that anyone working on the project uses the same library versions, which helps avoid compatibility issues.
*   **Debugging:** The `debug=True` setting in `run.py` (used by `flask run`) provides helpful error messages in the browser and automatically restarts the server when you change code, which is great for development. **Never** run with debug mode enabled in production.

## Next Steps

*   **Test the API:** Use tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to send test requests to your running backend (e.g., upload an image to `http://127.0.0.1:5000/upload`).
*   **Improve OCR Parsing:** The `parse_receipt_text` function is very basic. You'll likely need to improve its logic (using more advanced Regular Expressions or even machine learning models) to handle different receipt formats reliably.
*   **Refine Splitting Logic:** Implement more sophisticated splitting options (e.g., handling taxes and tips separately, allowing users to assign specific items to specific people).
*   **Connect Frontend:** Work with the frontend developer to ensure they can correctly call the backend API endpoints and display the results.
*   **Add User Authentication:** If needed, add user accounts and login functionality.

This should give you a solid foundation for the backend. Feel free to ask more questions as you explore the code! 