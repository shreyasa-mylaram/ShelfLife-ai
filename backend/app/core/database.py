"""
SHELFLIFE AI - Database Connections
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

import logging

logger = logging.getLogger(__name__)

# Try connecting to PostgreSQL with a 2-second timeout, otherwise fall back to SQLite
try:
    engine = create_engine(settings.DATABASE_URL, connect_args={"connect_timeout": 2})
    with engine.connect() as conn:
        pass
    logger.info("Connected to PostgreSQL successfully")
except Exception as e:
    logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite local database.")
    # Ensure data directory exists
    import os
    os.makedirs("data", exist_ok=True)
    engine = create_engine("sqlite:///./data/shelflife.db", connect_args={"check_same_thread": False})
    logger.info("SQLite local database initialized successfully at ./data/shelflife.db")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
