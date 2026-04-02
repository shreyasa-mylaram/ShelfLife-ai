"""
SHELFLIFE AI - Shipments API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.shipment import Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentResponse

router = APIRouter()

@router.post("/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    container_id: str,
    product_type: str,
    journey_days: int = 30,
    db: Session = Depends(get_db)
):
    """Create a new shipment tracking"""
    
    # Check if container already exists
    existing = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Container already exists")
    
    # Create new shipment
    shipment = Shipment(
        container_id=container_id,
        product_type=product_type,
        journey_days=journey_days,
        status="active"
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    
    return shipment

@router.get("/", response_model=List[ShipmentResponse])
async def list_shipments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all shipments"""
    
    query = db.query(Shipment)
    if status_filter:
        query = query.filter(Shipment.status == status_filter)
    
    shipments = query.offset(skip).limit(limit).all()
    return shipments

@router.get("/{container_id}", response_model=ShipmentResponse)
async def get_shipment(
    container_id: str,
    db: Session = Depends(get_db)
):
    """Get shipment by container ID"""
    
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    return shipment

@router.delete("/{container_id}")
async def delete_shipment(
    container_id: str,
    db: Session = Depends(get_db)
):
    """Delete a shipment"""
    
    shipment = db.query(Shipment).filter(Shipment.container_id == container_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    db.delete(shipment)
    db.commit()
    
    return {"message": "Shipment deleted successfully", "container_id": container_id} 
