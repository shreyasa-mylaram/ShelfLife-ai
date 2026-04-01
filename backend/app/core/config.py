"""
SHELFLIFE AI - Configuration
Loads environment variables
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://shelflife:shelflife123@localhost:5432/shelflife_db")
    INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
    INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "admin:admin123")
    INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "my-org")
    INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "sensor_data")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # API
    API_DEBUG = os.getenv("API_DEBUG", "true").lower() == "true"
    API_SECRET_KEY = os.getenv("API_SECRET_KEY", "dev-secret-key")
    
    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sman-shreyanu-ams")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Gmail SMTP
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "")
    
    # Twilio
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Mock mode
    MOCK_NOTIFICATIONS = os.getenv("MOCK_NOTIFICATIONS", "false").lower() == "true"
    
    # Maps
    MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN", "using-leaflet")
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "mock-mode")

settings = Settings()