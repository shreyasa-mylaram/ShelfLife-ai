"""
SHELFLIFE AI - Shipment Schemas (Pydantic models)
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ShipmentBase(BaseModel):
    container_id: str
    product_type: str
    journey_days: int = 30

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    id: int
    status: str
    health_score: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SensorReadingBase(BaseModel):
    temperature: float
    humidity: float
    vibration: float = 0.0
    cooling_power: int = 100
    door_open: bool = False
    latitude: float = 0.0
    longitude: float = 0.0
    days_in_transit: float = 0.0

class SensorReadingCreate(SensorReadingBase):
    timestamp: datetime

class SensorReadingResponse(SensorReadingBase):
    id: int
    shipment_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    alert_type: str
    severity: str
    message: str
    action: Optional[str] = None

class AlertResponse(AlertBase):
    id: int
    shipment_id: int
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True