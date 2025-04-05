# Sber Split App - Frontend README

This simple frontend provides a basic interface to test the Sber Split App backend.

## Features

*   Upload receipt images (JPG, PNG).
*   Display processing status and parsed results (items, total) from the backend.
*   View a history of processed receipts.
*   Load details of a receipt from history.
*   Delete receipts from history.
*   Test the "split equally" functionality.

## How to Use

1.  **Make sure the backend server is running.** Follow the instructions in `backend/README.md` to start the Flask server (usually with `flask run` in the `backend` directory). It should be accessible at `http://127.0.0.1:5000`.

2.  **Open `index.html` in your web browser.** You can usually just double-click the `index.html` file located in the `frontend` directory.

3.  **Upload an Image:**
    *   Click the "Choose File" button and select a receipt image.
    *   An image preview will appear.
    *   Click the "Upload and Process" button.
    *   Wait for the processing to complete. Status messages will appear.

4.  **View Results:**
    *   If successful, the "Processing Results" section will appear, showing the raw data received from the backend, a list of parsed items, and the parsed total amount.

5.  **Split the Bill (Equally):**
    *   Once results are shown, the "Split the Bill" section appears.
    *   Enter the number of people to split the bill between.
    *   Click "Calculate Split".
    *   The results of the split calculation will be displayed.

6.  **Receipt History:**
    *   The history section loads automatically.
    *   Click "Refresh History" to reload the list.
    *   Click on any receipt in the list to load its details into the main view.
    *   Click the "Delete" button next to a receipt to remove it (confirmation required).

## Important Notes

*   **Backend Must Be Running:** This frontend relies entirely on the backend API. If the backend isn't running or is inaccessible, the frontend won't work.
*   **CORS Errors:** If you run the backend and open the `index.html` file directly, you might encounter CORS (Cross-Origin Resource Sharing) errors in the browser console. This is a security feature of browsers. To fix this properly for development:
    *   **Option 1 (Recommended for Development): Install `Flask-CORS`**
        1.  Stop the backend server (`Ctrl+C`).
        2.  Activate your backend virtual environment (`venv\Scripts\Activate.ps1` or `source venv/bin/activate`).
        3.  Install Flask-CORS: `pip install Flask-CORS`
        4.  Add it to `requirements.txt`: Add `Flask-CORS` on a new line in `backend/requirements.txt`.
        5.  Modify `backend/app/__init__.py`:
            ```python
            # At the top with other imports
            from flask_cors import CORS

            # ... (keep existing code) ...

            def create_app(config_class=Config):
                app = Flask(__name__)
                app.config.from_object(config_class)

                # Initialize CORS - Allow all origins for development
                CORS(app) # You can configure origins more strictly for production

                # ... (rest of the create_app function) ...

                return app
            ```
        6.  Restart the backend server: `flask run`.
    *   **Option 2 (Simpler but Less Secure):** Use a browser extension that disables CORS checks (use **only** for temporary local development, **never** for browsing the web).
    *   **Option 3 (More Complex):** Serve the frontend files from the Flask backend itself or use a development server like `live-server` (requires Node.js/npm).
*   **Basic UI:** The styling is very minimal.
*   **Error Handling:** Basic error messages are shown, but more robust handling could be added.
*   **No Camera Access:** This version uses file uploads only.
