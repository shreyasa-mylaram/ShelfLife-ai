 
"""
SHELFLIFE AI - PostgreSQL Manager
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

class PostgresManager:
    """Manages PostgreSQL connections"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.connect()
    
    def connect(self):
        """Create database connection"""
        try:
            self.engine = create_engine(settings.DATABASE_URL)
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            logger.info("PostgreSQL connected successfully")
        except Exception as e:
            logger.error(f"PostgreSQL connection failed: {e}")
            raise
    
    def get_session(self):
        """Get a database session"""
        return self.SessionLocal()
    
    def close(self):
        """Close database connection"""
        if self.engine:
            self.engine.dispose()
            logger.info("PostgreSQL disconnected")

postgres_manager = PostgresManager()
