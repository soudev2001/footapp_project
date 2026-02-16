# FootLogic V2 - Configuration

import os
import json

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
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

