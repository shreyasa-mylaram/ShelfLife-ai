 
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
    
        try:
            self.engine = create_engine(settings.DATABASE_URL)
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            # Test connection
            with self.engine.connect() as conn:
                pass
            logger.info("PostgreSQL connected successfully")
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}. Falling back to SQLite local database.")
            self.engine = create_engine("sqlite:///./shelflife_local.db", connect_args={"check_same_thread": False})
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            logger.info("SQLite local database initialized successfully")
    
    def get_session(self):
        """Get a database session"""
        return self.SessionLocal()
    
    def close(self):
        """Close database connection"""
        if self.engine:
            self.engine.dispose()
            logger.info("PostgreSQL disconnected")

postgres_manager = PostgresManager()
