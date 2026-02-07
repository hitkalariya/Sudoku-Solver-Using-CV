from flask import Flask
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    with app.app_context():
        from . import routes
        app.register_blueprint(routes.bp)

    return app
