"""
SHELFLIFE AI - Sensor Models
"""

from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    vibration = Column(Float, default=0.0)
    cooling_power = Column(Integer, default=100)
    door_open = Column(Boolean, default=False)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    days_in_transit = Column(Float, default=0.0)
    
    # Relationship
    shipment = relationship("Shipment", back_populates="readings")