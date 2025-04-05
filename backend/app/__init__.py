from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import datetime
from werkzeug.utils import secure_filename
import uuid # For generating unique filenames

# Import configuration and custom modules
from config import Config
from .services import ocr_service, split_service

# Initialize Flask extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    """Factory function to create and configure the Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure instance folder exists (needed for SQLite)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass # Ignore if already exists

    # Initialize database and migrations with the app
    db.init_app(app)
    migrate.init_app(app, db)

    # --- Create Upload and Processed Image Directories --- #
    # These should be relative to the application root (where run.py is)
    # We store paths relative to the backend root in config
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        print(f"Created upload directory: {app.config['UPLOAD_FOLDER']}")
    if not os.path.exists(app.config['PROCESSED_FOLDER']):
        os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)
        print(f"Created processed image directory: {app.config['PROCESSED_FOLDER']}")

    # Import models here after db is initialized and within app context
    # to avoid circular imports and ensure models are registered.
    from . import models

    # Import and register blueprints (routes)
    from . import routes
    app.register_blueprint(routes.bp)

    # --- Basic Test Route --- #
    @app.route('/ping', methods=['GET'])
    def ping_pong():
        return jsonify('pong!')

    return app 