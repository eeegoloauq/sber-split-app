from app import create_app, db
from app.models import Receipt, Item # Add other models if you create them

# Create the Flask app instance using the factory function
# Load configuration from environment variables if available (e.g., FLASK_ENV)
app = create_app()

# This context push allows you to use `flask shell`
# to interact with the application context (app, db, models)
@app.shell_context_processor
def make_shell_context():
    return {'app': app, 'db': db, 'Receipt': Receipt, 'Item': Item}

# Note: Running the app is typically done via the Flask CLI:
# In your terminal (with venv activated):
# export FLASK_APP=run.py  (or set FLASK_APP=.env file)
# export FLASK_ENV=development (or set FLASK_DEBUG=1)
# flask run

# You can still run this script directly (`python run.py`),
# but using `flask run` is generally preferred for development
# as it provides better debugging and reloading features.
if __name__ == '__main__':
    # Run the app with debug mode enabled for development.
    # IMPORTANT: Never run with debug=True in a production environment!
    app.run(debug=True) 