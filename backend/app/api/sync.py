"""
SHELFLIFE AI - Edge Sync API
Receives data from edge devices when network is available
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.models.shipment import Shipment
from app.models.sensor import SensorReading
from app.models.alert import Alert
from app.services.alert_service import alert_service

router = APIRouter()

@router.post("/sync")
async def sync_offline_data(
    container_id: str,
    type: str,
    data: dict,
    db: Session = Depends(get_db)
):
    """
    Receive synced data from edge device
    type: "sensor_data" or "alert"
    """
    
    # Find shipment
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    if type == "sensor_data":
        # Store sensor reading
        reading = SensorReading(
            shipment_id=shipment.id,
            timestamp=datetime.fromisoformat(data.get("timestamp")),
            temperature=data.get("temperature"),
            humidity=data.get("humidity"),
            vibration=data.get("vibration", 0),
            cooling_power=data.get("cooling_power", 100),
            door_open=data.get("door_open", False),
            latitude=data.get("latitude", 0),
            longitude=data.get("longitude", 0),
            days_in_transit=data.get("days_in_transit", 0)
        )
        db.add(reading)
        
    elif type == "alert":
        # Store alert
        alert = Alert(
            shipment_id=shipment.id,
            alert_type=data.get("alert_type"),
            severity=data.get("severity"),
            message=data.get("message"),
            action=data.get("action"),
            resolved=False
        )
        db.add(alert)
        
        # Trigger notifications for critical alerts
        if data.get("severity") == "CRITICAL":
            alert_service.create_alert(
                shipment_id=shipment.id,
                container_id=container_id,
                alert_type=data.get("alert_type"),
                severity=data.get("severity"),
                message=data.get("message"),
                action=data.get("action")
            )
    
    db.commit()
    
    return {"status": "synced", "type": type} 
