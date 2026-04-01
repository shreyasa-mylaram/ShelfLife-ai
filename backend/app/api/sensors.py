"""
SHELFLIFE AI - Sensors API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.shipment import Shipment
from app.models.sensor import SensorReading
from app.schemas.shipment import SensorReadingCreate, SensorReadingResponse

router = APIRouter()

@router.post("/{container_id}", response_model=SensorReadingResponse)
async def add_sensor_reading(
    container_id: str,
    reading: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    """Add a new sensor reading for a container"""
    
    # Find shipment
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Create reading
    db_reading = SensorReading(
        shipment_id=shipment.id,
        timestamp=reading.timestamp,
        temperature=reading.temperature,
        humidity=reading.humidity,
        vibration=reading.vibration,
        cooling_power=reading.cooling_power,
        door_open=reading.door_open,
        latitude=reading.latitude,
        longitude=reading.longitude,
        days_in_transit=reading.days_in_transit
    )
    
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    
    return db_reading

@router.get("/{container_id}/history", response_model=List[SensorReadingResponse])
async def get_sensor_history(
    container_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get sensor reading history for a container"""
    
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    readings = db.query(SensorReading)\
        .filter(SensorReading.shipment_id == shipment.id)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(limit)\
        .all()
    
    return readings

@router.get("/{container_id}/latest", response_model=SensorReadingResponse)
async def get_latest_reading(
    container_id: str,
    db: Session = Depends(get_db)
):
    """Get the latest sensor reading for a container"""
    
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    reading = db.query(SensorReading)\
        .filter(SensorReading.shipment_id == shipment.id)\
        .order_by(SensorReading.timestamp.desc())\
        .first()
    
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found")
    
    return reading 
