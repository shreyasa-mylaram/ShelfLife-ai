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
        days_in_transit=reading.days_in_transit,
        light_lux=reading.light_lux if reading.light_lux is not None else 150.0
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

    # ── Predictive AI Detection ──────────────────────────────────────────────
    # If the current temperature is safe, run comprehensive ML predictions.
    else:
        from app.services.prediction_service import prediction_service
        from datetime import timedelta
        
        # Fetch temperature history for this container
        recent = db.query(SensorReading.temperature).filter(
            SensorReading.shipment_id == shipment.id
        ).order_by(SensorReading.timestamp.desc()).limit(48).all()
        
        history = [r[0] for r in reversed(recent) if r[0] is not None]
        history.append(db_reading.temperature)
        
        # Build sensor snapshot for ML models
        sensor_snapshot = {
            "temperature": db_reading.temperature,
            "humidity":    db_reading.humidity or 80.0,
            "vibration":   db_reading.vibration or 0.1,
            "cooling_power": db_reading.cooling_power or 100.0,
            "days_in_transit": db_reading.days_in_transit or 0.0,
            "product_type": shipment.product_type or "mangoes",
        }
        
        # ── Run all ML predictions at once ────────────────────────────────────
        try:
            if prediction_service.wrapper:
                all_preds = prediction_service.wrapper.predict_all(sensor_snapshot, history)
            else:
                all_preds = None
        except Exception as pred_err:
            import logging
            logging.getLogger(__name__).error(f"predict_all error: {pred_err}")
            all_preds = None
        
        # ── 1. Failure Risk Alert ─────────────────────────────────────────────
        if all_preds:
            failure_risk = all_preds.get("failure", {}).get("risk", 0.0)
            if failure_risk > 0.7:
                from app.models.alert import Alert
                from app.services.alert_service import alert_service
                
                cutoff_time = datetime.now() - timedelta(minutes=30)
                recent_fail_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.alert_type == "FAILURE_RISK",
                    Alert.created_at >= cutoff_time
                ).first()
                
                if not recent_fail_alert:
                    risk_pct = round(failure_risk * 100, 1)
                    alert_service.create_alert(
                        shipment_id=shipment.id,
                        container_id=shipment.container_id,
                        alert_type="FAILURE_RISK",
                        severity="CRITICAL",
                        message=f"AI MODEL: {shipment.product_type} container {shipment.container_id} has a {risk_pct}% predicted failure probability.",
                        action="Inspect container immediately. Check cooling unit and seals."
                    )
                    db_alert = Alert(
                        shipment_id=shipment.id,
                        alert_type="FAILURE_RISK",
                        severity="CRITICAL",
                        message=f"AI MODEL: {risk_pct}% failure probability predicted.",
                        action="Inspect container immediately.",
                        resolved=False
                    )
                    db.add(db_alert)
                    db.commit()
        
        # ── 2. Maintenance Alert ──────────────────────────────────────────────
        if all_preds:
            maint = all_preds.get("maintenance", {})
            maintenance_risk = maint.get("risk", 0.0)
            if maintenance_risk > 0.7:
                from app.models.alert import Alert
                from app.services.alert_service import alert_service
                
                cutoff_time = datetime.now() - timedelta(minutes=30)
                recent_maint_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.alert_type == "MAINTENANCE_REQUIRED",
                    Alert.created_at >= cutoff_time
                ).first()
                
                if not recent_maint_alert:
                    fault_type = maint.get("fault_type", "UNKNOWN")
                    risk_pct = round(maintenance_risk * 100, 1)
                    alert_service.create_alert(
                        shipment_id=shipment.id,
                        container_id=shipment.container_id,
                        alert_type="MAINTENANCE_REQUIRED",
                        severity="WARNING",
                        message=f"AI MODEL: Equipment fault detected ({fault_type}) in container {shipment.container_id}. Risk: {risk_pct}%.",
                        action="Schedule maintenance inspection. Check compressor and cooling unit."
                    )
                    db_alert = Alert(
                        shipment_id=shipment.id,
                        alert_type="MAINTENANCE_REQUIRED",
                        severity="WARNING",
                        message=f"AI MODEL: {fault_type} — {risk_pct}% maintenance risk.",
                        action="Schedule maintenance inspection.",
                        resolved=False
                    )
                    db.add(db_alert)
                    db.commit()
        
        # ── 3. Predictive Temperature Breach Alert ────────────────────────────
        if len(history) >= 6:
            # Use real forecast model via prediction_service
            try:
                forecast_result = prediction_service.wrapper.predict_forecast(history) \
                    if prediction_service.wrapper \
                    else None
                forecast = forecast_result.get("predicted", []) if forecast_result else []
            except Exception:
                forecast = prediction_service.predict_temperature(history)
            
            if forecast and max(forecast) > CRITICAL_TEMP_THRESHOLD:
                from app.models.alert import Alert
                from app.services.alert_service import alert_service
                
                cutoff_time = datetime.now() - timedelta(minutes=30)
                recent_pred_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.severity == "PREDICTIVE_CRITICAL",
                    Alert.created_at >= cutoff_time
                ).first()
                
                if not recent_pred_alert:
                    max_forecast = max(forecast)
                    breach_hour = next(
                        (i + 1 for i, temp in enumerate(forecast) if temp > CRITICAL_TEMP_THRESHOLD), 6
                    )
                    
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
    # ── 4. Light Exposure Duration Monitoring ─────────────────────────────
    # Certain food cargos (fresh produce, ripening items, greens) need light exposure.
    # If continuous darkness (< 50 lux) exceeds 12 hours (or consecutive low readings), alert!
    FOOD_LIGHT_REQUIRED = {"fresh_produce", "mangoes", "produce", "fruits", "vegetables"}
    prod_type_lower = (shipment.product_type or "").lower()
    
    if any(item in prod_type_lower for item in FOOD_LIGHT_REQUIRED):
        MIN_LIGHT_LUX = 50.0
        current_lux = db_reading.light_lux if db_reading.light_lux is not None else 150.0
        
        if current_lux < MIN_LIGHT_LUX:
            # Query recent readings to inspect continuous dark duration
            recent_light_readings = db.query(SensorReading.light_lux, SensorReading.timestamp)\
                .filter(SensorReading.shipment_id == shipment.id)\
                .order_by(SensorReading.timestamp.desc())\
                .limit(48)\
                .all()
            
            dark_readings = 0
            for r_lux, _ in recent_light_readings:
                val = r_lux if r_lux is not None else 150.0
                if val < MIN_LIGHT_LUX:
                    dark_readings += 1
                else:
                    break
            
            # Each reading typically spans 15-30 mins in production or multiple cycles
            # If dark_readings >= 8 (approx 4-12 hours of uninterrupted darkness) or current_lux is critically 0 with history
            if dark_readings >= 8 or (current_lux < 10.0 and dark_readings >= 3):
                from app.models.alert import Alert
                from app.services.alert_service import alert_service
                from datetime import timedelta
                
                cutoff_time = datetime.now() - timedelta(minutes=30)
                recent_light_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.alert_type == "LIGHT_DEFICIENCY",
                    Alert.created_at >= cutoff_time
                ).first()
                
                if not recent_light_alert:
                    est_hours = max(12, int(dark_readings * 0.5 * 3))
                    msg = (
                        f"LIGHT ALERT: {shipment.product_type} container {shipment.container_id} "
                        f"detected in prolonged darkness ({current_lux:.0f} lux, threshold: {MIN_LIGHT_LUX:.0f} lux). "
                        f"Insufficient photoperiod exposure for {est_hours}+ hours."
                    )
                    act = "Activate container photoperiod lighting or inspect light ballast."
                    
                    alert_service.create_alert(
                        shipment_id=shipment.id,
                        container_id=shipment.container_id,
                        alert_type="LIGHT_DEFICIENCY",
                        severity="WARNING",
                        message=msg,
                        action=act
                    )
                    
                    db_alert = Alert(
                        shipment_id=shipment.id,
                        alert_type="LIGHT_DEFICIENCY",
                        severity="WARNING",
                        message=msg,
                        action=act,
                        resolved=False
                    )
                    db.add(db_alert)
                    db.commit()
                    
                    # Real-time WebSocket Alert broadcast
                    try:
                        from app.socket_manager import broadcast_alert
                        import asyncio
                        asyncio.create_task(broadcast_alert({
                            "containerId": shipment.container_id,
                            "severity": "WARNING",
                            "alert_type": "LIGHT_DEFICIENCY",
                            "message": msg,
                            "timestamp": datetime.now().isoformat()
                        }))
                    except Exception:
                        pass

    # Real-time WebSocket Container update broadcast
    try:
        from app.socket_manager import broadcast_container_update
        import asyncio
        asyncio.create_task(broadcast_container_update({
            "id": shipment.container_id,
            "temp": db_reading.temperature,
            "humidity": db_reading.humidity,
            "battery": db_reading.cooling_power,
            "light_lux": db_reading.light_lux,
            "vibration": db_reading.vibration
        }))
    except Exception:
        pass

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
