"""
SHELFLIFE AI - Shipment Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, unique=True, index=True, nullable=False)
    product_type = Column(String, nullable=False)
    journey_days = Column(Integer, default=30)
    status = Column(String, default="active")  # active, completed, failed
    health_score = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    vibration = Column(Float, default=0.0)
    cooling_power = Column(Integer, default=100)
    door_open = Column(Boolean, default=False)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    days_in_transit = Column(Float, default=0.0)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, index=True, nullable=False)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # CRITICAL, HIGH, WARNING, INFO
    message = Column(String, nullable=False)
    action = Column(String, nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True) 
