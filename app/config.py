# FootLogic V2 - Configuration

import os
import json
from dotenv import load_dotenv

# Load .env.dev for development
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.dev')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()  # fallback to .env
def load_admin_config():
    """Load admin configuration from admin_config.json"""
    config_path = os.path.join(os.path.dirname(__file__), 'admin_config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'FootLogic-secret-key-2026')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://soufiane:gogo@cluster0.05omqhe.mongodb.net/FootClubApp')
    ADMIN_CONFIG = load_admin_config()

    # Flask-Mail (Gmail SMTP) Config
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME', 'noreply@footlogic.com')

    # JWT for Mobile API
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', '24'))
    JWT_REFRESH_EXPIRATION_DAYS = int(os.environ.get('JWT_REFRESH_EXPIRATION_DAYS', '30'))

    # Stripe
    STRIPE_SECRET_KEY      = os.environ.get('STRIPE_SECRET_KEY', '')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
    STRIPE_WEBHOOK_SECRET  = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False
    MONGO_URI = os.environ.get(
        'MONGO_URI_TEST',
        'mongodb+srv://soufiane:gogo@cluster0.05omqhe.mongodb.net/FootClubApp_Test'
    )

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
