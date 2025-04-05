import os

# Determine the absolute path of the directory where this config file is located
basedir = os.path.abspath(os.path.dirname(__file__))

# Construct the absolute path to the database file
db_path = os.path.join(basedir, 'app.db')
# Ensure forward slashes for cross-platform compatibility and potential sqlite quirks
db_path_uri_compatible = db_path.replace('\\', '/')

class Config:
    # --- General Flask Settings --- #
    # SECRET_KEY is used for session security, CSRF protection, etc.
    # IMPORTANT: Change this to a complex random value in production!
    # You can generate one using: python -c 'import secrets; print(secrets.token_hex())'
    # Best practice: Store the secret key in environment variables, not directly in code.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-should-really-change-this-default-key'

    # --- Database Configuration --- #
    # We use SQLite for simplicity in development.
    # The database file (app.db) will be created in the 'backend' directory (basedir).
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + db_path_uri_compatible # Use path with forward slashes

    # Disable SQLAlchemy event system if not needed, can improve performance
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- File Upload Settings --- #
    # Define directories relative to the backend root (basedir)
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    PROCESSED_FOLDER = os.path.join(basedir, 'processed_images')

    # Optional: Limit maximum file size for uploads (e.g., 16MB)
    # MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # --- Image Enhancer Settings (Optional) --- #
    # Default values used if not specified in the enhancer call
    ENHANCER_SHARPNESS = 4.0
    ENHANCER_CONTRAST = 1.3
    ENHANCER_BLUR = 3

    # --- OCR Settings --- #
    # Language for Tesseract OCR (can be overridden in ocr_service.py)
    OCR_LANGUAGE = 'eng+rus'
    # Path to Tesseract executable (only needed if not in system PATH)
    # TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe' # Example for Windows

# You could define other configurations like DevelopmentConfig, ProductionConfig, TestingConfig
# class DevelopmentConfig(Config):
#     DEBUG = True

# class ProductionConfig(Config):
#     DEBUG = False
#     # Use a different database like PostgreSQL
#     # SQLALCHEMY_DATABASE_URI = os.environ.get('PROD_DATABASE_URL')
#     # Ensure SECRET_KEY is set via environment variable

# class TestingConfig(Config):
#     TESTING = True
#     SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' # Use in-memory DB for tests
#     WTF_CSRF_ENABLED = False # Disable CSRF forms in tests
#     SECRET_KEY = 'test-secret-key' 