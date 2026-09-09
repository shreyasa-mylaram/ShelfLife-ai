"""
SHELFLIFE AI - Predictions API v2.0

Endpoints:
  GET  /api/predictions/{container_id}/all         - All 5 predictions
  GET  /api/predictions/{container_id}/forecast    - 6-hour temperature forecast
  GET  /api/predictions/{container_id}/maintenance - Equipment fault detection
  GET  /api/predictions/status                     - Model load status
  POST /api/predictions/test                       - Test with raw sensor data
"""

from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.shipment import Shipment

router = APIRouter()

# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class SensorInput(BaseModel):
    """Sensor data for the /test endpoint."""
    temperature: float = Field(4.0, description="Temperature in °C")
    humidity: float = Field(80.0, description="Relative humidity %")
    vibration: float = Field(0.1, description="Vibration level (g)")
    cooling_power: float = Field(100.0, description="Compressor power %")
    days_in_transit: float = Field(0.0, description="Days cargo has been in transit")
    product_type: str = Field("mangoes", description="Product category")
    temp_history: Optional[List[float]] = Field(
        None, description="Historical temperatures (newest last)"
    )


# ─── Lazy model-wrapper loader ────────────────────────────────────────────────

def _get_wrapper():
    """Return a ModelWrapper instance. Safe — never raises."""
    try:
        from ml_models.model_wrapper import ModelWrapper
        return ModelWrapper()
    except Exception:
        return None

def _get_prediction_service():
    """Return the singleton PredictionService."""
    try:
        from app.services.prediction_service import prediction_service
        return prediction_service
    except Exception:
        return None


# ─── Helper ───────────────────────────────────────────────────────────────────

def _require_shipment(container_id: str, db: Session) -> Shipment:
    shipment = db.query(Shipment).filter(
        Shipment.container_id == container_id
    ).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment '{container_id}' not found")
    return shipment


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/status", summary="Model load status")
async def get_model_status():
    """
    Returns which ML models are loaded and their versions.
    Always returns 200 — even in fallback mode.
    """
    svc = _get_prediction_service()
    if svc:
        return svc.get_model_status()

    # Last-resort: direct wrapper call
    wrapper = _get_wrapper()
    if wrapper:
        return wrapper.get_model_status()

    return {
        "status": "service_unavailable",
        "models": {},
        "version": "N/A",
        "checked_at": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/{container_id}/all", summary="All 5 predictions for a container")
async def get_all_predictions(
    container_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns all 5 ML predictions for the given container:
    - Failure risk
    - Health score
    - Shelf life remaining
    - 6-hour temperature forecast
    - Maintenance / fault detection
    """
    _require_shipment(container_id, db)

    svc = _get_prediction_service()
    if svc:
        result = svc.get_all_predictions(container_id)
    else:
        result = {
            "failure": {"risk": 0.0, "status": "UNKNOWN"},
            "health": {"score": 75.0, "status": "UNKNOWN"},
            "shelf_life": {"remaining_days": 7.0, "status": "UNKNOWN"},
            "forecast": {"predicted": [4.0] * 6, "breach_risk": False},
            "maintenance": {"risk": 0.0, "fault_type": "UNKNOWN"},
            "models_loaded": False,
            "mode": "unavailable",
        }

    return {
        "container_id": container_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **result,
    }


@router.get("/{container_id}/forecast", summary="6-hour temperature forecast")
async def get_forecast(
    container_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns a 6-hour temperature forecast for the container.
    Includes breach risk flag and estimated breach hour.
    """
    _require_shipment(container_id, db)

    svc = _get_prediction_service()
    if svc:
        result = svc.get_6h_forecast(container_id)
    else:
        result = {
            "current": 4.0,
            "predicted": [4.0] * 6,
            "breach_risk": False,
            "breach_hour": None,
            "threshold": 5.0,
            "source": "unavailable",
        }

    return {
        "container_id": container_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "forecast": result,
    }


@router.get("/{container_id}/maintenance", summary="Equipment fault detection")
async def get_maintenance(
    container_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns equipment health status and predicted fault type for the container.
    """
    _require_shipment(container_id, db)

    svc = _get_prediction_service()
    if svc:
        result = svc.get_maintenance_alert(container_id)
    else:
        result = {
            "risk": 0.0,
            "risk_pct": 0.0,
            "fault_type": "UNKNOWN",
            "confidence": 0.0,
            "status": "UNKNOWN",
            "source": "unavailable",
        }

    return {
        "container_id": container_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "maintenance": result,
    }


@router.post("/test", summary="Test predictions with raw sensor data")
async def test_predictions(payload: SensorInput):
    """
    Accept raw sensor data and return all 5 predictions immediately.
    Useful for testing the ML pipeline without a database container.
    """
    sensor_data = payload.model_dump(exclude={"temp_history"})
    temp_history = payload.temp_history or [payload.temperature]

    svc = _get_prediction_service()
    if svc and svc.wrapper:
        result = svc.wrapper.predict_all(sensor_data, temp_history)
    else:
        # Attempt direct wrapper
        wrapper = _get_wrapper()
        if wrapper:
            result = wrapper.predict_all(sensor_data, temp_history)
        else:
            result = {
                "failure": {"risk": 0.0, "status": "UNKNOWN"},
                "health": {"score": 75.0, "status": "UNKNOWN"},
                "shelf_life": {"remaining_days": 7.0, "status": "UNKNOWN"},
                "forecast": {"predicted": [4.0] * 6, "breach_risk": False},
                "maintenance": {"risk": 0.0, "fault_type": "UNKNOWN"},
                "models_loaded": False,
                "mode": "unavailable",
            }

    return {
        "input": payload.model_dump(),
        "predictions": result,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
