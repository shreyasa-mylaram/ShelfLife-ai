"""
SHELFLIFE AI - Alerts API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.shipment import Shipment
from app.models.alert import Alert
from app.schemas.shipment import AlertResponse
from app.services.alert_service import alert_service

router = APIRouter()

@router.get("/{container_id}", response_model=List[AlertResponse])
async def get_alerts(
    container_id: str,
    unresolved_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get alerts for a container"""
    
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    query = db.query(Alert).filter(Alert.shipment_id == shipment.id)
    
    if unresolved_only:
        query = query.filter(Alert.resolved == False)
    
    alerts = query.order_by(Alert.created_at.desc()).all()
    return alerts

@router.put("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Mark an alert as resolved"""
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.resolved = True
    from datetime import datetime
    alert.resolved_at = datetime.now()
    
    db.commit()
    
    return {"message": "Alert resolved successfully", "alert_id": alert_id} 
