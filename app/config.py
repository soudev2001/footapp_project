# FootLogic V2 - Configuration

import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'FootLogic-secret-key-2026')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://soufiane:gogo@cluster0.05omqhe.mongodb.net/FootClubApp')
    
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

