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
    
    # ── Live Anomaly Detection & Auto-Alerting ─────────────────────────
    # If the temperature reading is critically high, we automatically generate 
    # a Twilio (SMS/WhatsApp) and SMTP email notification.
    CRITICAL_TEMP_THRESHOLD = 5.0
    WARNING_TEMP_THRESHOLD = 4.5
    
    if db_reading.temperature > CRITICAL_TEMP_THRESHOLD:
        from app.models.alert import Alert
        from app.services.alert_service import alert_service
        
        # Debounce logic: check if we already fired a critical alert for this
        # container in the last 30 minutes to prevent SMS/Email spam
        from datetime import timedelta
        cutoff_time = datetime.now() - timedelta(minutes=30)
        
        recent_alert = db.query(Alert).filter(
            Alert.shipment_id == shipment.id,
            Alert.severity == "CRITICAL",
            Alert.created_at >= cutoff_time
        ).first()
        
        if not recent_alert:
            # We haven't sent an alert in the last hour! Fire the notification.
            alert_service.create_alert(
                shipment_id=shipment.id,
                container_id=shipment.container_id,
                alert_type="TEMPERATURE_SPIKE",
                severity="CRITICAL",
                message=f"CRITICAL: {shipment.product_type} container {shipment.container_id} detected at {db_reading.temperature}°C (Threshold: {CRITICAL_TEMP_THRESHOLD}°C).",
                action="Immediate intervention required. Inspect cooling unit."
            )
            
            # Save the alert to the database so we have a record and the debounce logic works
            db_alert = Alert(
                shipment_id=shipment.id,
                alert_type="TEMPERATURE_SPIKE",
                severity="CRITICAL",
                message=f"CRITICAL: {shipment.product_type} container {shipment.container_id} detected at {db_reading.temperature}°C",
                action="Immediate intervention required",
                resolved=False
            )
            db.add(db_alert)
            db.commit()

    elif db_reading.temperature > WARNING_TEMP_THRESHOLD:
        from app.models.alert import Alert
        from app.services.alert_service import alert_service
        from datetime import timedelta
        
        cutoff_time = datetime.now() - timedelta(minutes=30)
        recent_alert = db.query(Alert).filter(
            Alert.shipment_id == shipment.id,
            Alert.severity == "WARNING",
            Alert.created_at >= cutoff_time
        ).first()
        
        if not recent_alert:
            alert_service.create_alert(
                shipment_id=shipment.id,
                container_id=shipment.container_id,
                alert_type="TEMPERATURE_WARNING",
                severity="WARNING",
                message=f"WARNING: {shipment.product_type} container {shipment.container_id} detected at {db_reading.temperature}°C (Threshold: {WARNING_TEMP_THRESHOLD}°C).",
                action="Monitor closely. Adjust cooling settings if trend continues."
            )
            
            db_alert = Alert(
                shipment_id=shipment.id,
                alert_type="TEMPERATURE_WARNING",
                severity="WARNING",
                message=f"WARNING: {shipment.product_type} container {shipment.container_id} detected at {db_reading.temperature}°C",
                action="Monitor closely. Adjust cooling settings.",
                resolved=False
            )
            db.add(db_alert)
            db.commit()

    # ── Predictive AI Detection ──────────────────────────────────────────
    # If the current temperature is perfectly safe, run the 6-hour ML forecast.
    else:
        from app.services.prediction_service import prediction_service
        
        recent = db.query(SensorReading.temperature).filter(
            SensorReading.shipment_id == shipment.id
        ).order_by(SensorReading.timestamp.desc()).limit(24).all()
        
        if len(recent) >= 6:  # Minimum history needed for trend prediction
            history = [r[0] for r in reversed(recent)]
            history.append(db_reading.temperature)
            
            forecast = prediction_service.predict_temperature(history)
            
            if forecast and max(forecast) > CRITICAL_TEMP_THRESHOLD:
                from app.models.alert import Alert
                from app.services.alert_service import alert_service
                from datetime import timedelta
                
                cutoff_time = datetime.now() - timedelta(minutes=30)
                recent_pred_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.severity == "PREDICTIVE_CRITICAL",
                    Alert.created_at >= cutoff_time
                ).first()
                
                if not recent_pred_alert:
                    max_forecast = max(forecast)
                    # Find the first index where it breaches the threshold
                    breach_hour = next((i + 1 for i, temp in enumerate(forecast) if temp > CRITICAL_TEMP_THRESHOLD), 6)
                    
                    alert_service.create_alert(
                        shipment_id=shipment.id,
                        container_id=shipment.container_id,
                        alert_type="PREDICTIVE_SPIKE",
                        severity="PREDICTIVE_CRITICAL",
                        message=f"AI FORECAST: {shipment.product_type} container {shipment.container_id} is currently normal, but is forecasted to breach {CRITICAL_TEMP_THRESHOLD}°C in approx {breach_hour} hours (Peak: {max_forecast}°C).",
                        action="Preventative intervention required. Inspect cooling unit immediately."
                    )
                    
                    db_alert = Alert(
                        shipment_id=shipment.id,
                        alert_type="PREDICTIVE_SPIKE",
                        severity="PREDICTIVE_CRITICAL",
                        message=f"AI FORECAST: forecasted breach of {CRITICAL_TEMP_THRESHOLD}°C (Peak: {max_forecast}°C).",
                        action="Preventative intervention required",
                        resolved=False
                    )
                    db.add(db_alert)
                    db.commit()

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
