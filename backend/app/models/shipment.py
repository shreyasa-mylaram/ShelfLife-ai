"""
SHELFLIFE AI - Shipment Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, unique=True, index=True, nullable=False)
    product_type = Column(String, nullable=False)
    journey_days = Column(Integer, default=30)
    status = Column(String, default="active")
    health_score = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    readings = relationship("SensorReading", back_populates="shipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="shipment", cascade="all, delete-orphan")