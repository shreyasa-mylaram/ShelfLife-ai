"""
SHELFLIFE AI - Integrated Prediction Service v2.0
Wraps ModelWrapper and adds per-container caching + convenience methods.
"""

import logging
import time
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)

# ─── Tiny in-memory cache ─────────────────────────────────────────────────────
class _PredictionCache:
    """Thread-safe(ish) TTL cache keyed by (container_id, prediction_type)."""

    def __init__(self, ttl_seconds: int = 60):
        self._cache: Dict[str, Dict] = {}
        self._ttl = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry and (time.monotonic() - entry["ts"] < self._ttl):
            return entry["value"]
        return None

    def set(self, key: str, value: Any):
        self._cache[key] = {"value": value, "ts": time.monotonic()}

    def invalidate(self, container_id: str):
        keys_to_remove = [k for k in self._cache if k.startswith(container_id)]
        for k in keys_to_remove:
            del self._cache[k]


_cache = _PredictionCache(ttl_seconds=60)


# ─── PredictionService ────────────────────────────────────────────────────────
class PredictionService:
    """
    High-level service for running ML predictions against live container data.
    All methods are safe — they never raise exceptions to callers.
    """

    def __init__(self):
        try:
            from ml_models.model_wrapper import ModelWrapper
            self.wrapper = ModelWrapper()
            self.ready = True
            logger.info("PredictionService: ModelWrapper initialized successfully")
        except Exception as e:
            logger.error(f"PredictionService: Failed to initialize ModelWrapper: {e}")
            self.wrapper = None
            self.ready = False

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _get_sensor_data_and_history(self, container_id: str) -> tuple:
        """
        Fetch the latest sensor snapshot + temp history for a container.
        Returns (sensor_data_dict, temp_history_list).
        Imported lazily to avoid circular imports at module load.
        """
        try:
            from app.core.database import SessionLocal
            from app.models.shipment import Shipment
            from app.models.sensor import SensorReading
            from sqlalchemy import desc

            db = SessionLocal()
            try:
                shipment = db.query(Shipment).filter(
                    Shipment.container_id == container_id
                ).first()
                if not shipment:
                    return {}, []

                # Latest reading
                latest = (
                    db.query(SensorReading)
                    .filter(SensorReading.shipment_id == shipment.id)
                    .order_by(desc(SensorReading.timestamp))
                    .first()
                )
                if not latest:
                    return {}, []

                sensor_data = {
                    "temperature": latest.temperature or 4.0,
                    "humidity": latest.humidity or 80.0,
                    "vibration": latest.vibration or 0.1,
                    "cooling_power": latest.cooling_power or 100.0,
                    "days_in_transit": latest.days_in_transit or 0.0,
                    "product_type": shipment.product_type or "mangoes",
                }

                # Temperature history (last 48 readings)
                history_rows = (
                    db.query(SensorReading.temperature)
                    .filter(SensorReading.shipment_id == shipment.id)
                    .order_by(SensorReading.timestamp.asc())
                    .limit(48)
                    .all()
                )
                temp_history = [r[0] for r in history_rows if r[0] is not None]

                return sensor_data, temp_history
            finally:
                db.close()
        except Exception as e:
            logger.error(f"_get_sensor_data_and_history({container_id}): {e}")
            return {}, []

    def _safe_wrapper_call(self, method_name: str, *args, default=None):
        """Call a ModelWrapper method safely, returning default on any exception."""
        if not self.wrapper:
            return default
        try:
            return getattr(self.wrapper, method_name)(*args)
        except Exception as e:
            logger.error(f"ModelWrapper.{method_name} error: {e}")
            return default

    # ── New v2 per-container methods ───────────────────────────────────────────

    def get_failure_risk(self, container_id: str) -> Dict:
        """Get failure risk prediction for a container (cached 60s)."""
        cache_key = f"{container_id}:failure"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        sensor_data, _ = self._get_sensor_data_and_history(container_id)
        result = self._safe_wrapper_call(
            "predict_failure", sensor_data,
            default={"risk": 0.0, "risk_pct": 0.0, "status": "UNKNOWN", "source": "no_data"}
        )
        _cache.set(cache_key, result)
        return result

    def get_health_score(self, container_id: str) -> Dict:
        """Get health score prediction for a container (cached 60s)."""
        cache_key = f"{container_id}:health"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        sensor_data, _ = self._get_sensor_data_and_history(container_id)
        result = self._safe_wrapper_call(
            "predict_health", sensor_data,
            default={"score": 75.0, "status": "UNKNOWN", "source": "no_data"}
        )
        _cache.set(cache_key, result)
        return result

    def get_shelf_life(self, container_id: str) -> Dict:
        """Get remaining shelf life prediction for a container (cached 60s)."""
        cache_key = f"{container_id}:shelf_life"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        sensor_data, _ = self._get_sensor_data_and_history(container_id)
        result = self._safe_wrapper_call(
            "predict_shelf_life", sensor_data,
            default={"remaining_days": 7.0, "status": "UNKNOWN", "source": "no_data"}
        )
        _cache.set(cache_key, result)
        return result

    def get_6h_forecast(self, container_id: str) -> Dict:
        """Get 6-hour temperature forecast for a container (cached 60s)."""
        cache_key = f"{container_id}:forecast"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        _, temp_history = self._get_sensor_data_and_history(container_id)
        result = self._safe_wrapper_call(
            "predict_forecast", temp_history,
            default={
                "current": 4.0,
                "predicted": [4.0] * 6,
                "breach_risk": False,
                "breach_hour": None,
                "threshold": 5.0,
                "source": "no_data",
            }
        )
        _cache.set(cache_key, result)
        return result

    def get_maintenance_alert(self, container_id: str) -> Dict:
        """Get equipment fault detection result for a container (cached 60s)."""
        cache_key = f"{container_id}:maintenance"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        sensor_data, _ = self._get_sensor_data_and_history(container_id)
        result = self._safe_wrapper_call(
            "predict_maintenance", sensor_data,
            default={
                "risk": 0.0, "risk_pct": 0.0, "fault_type": "UNKNOWN",
                "confidence": 0.0, "status": "UNKNOWN", "source": "no_data"
            }
        )
        _cache.set(cache_key, result)
        return result

    def get_all_predictions(self, container_id: str) -> Dict:
        """
        Run all 5 predictions for a container and return a unified result.
        Uses per-prediction caching internally.
        """
        cache_key = f"{container_id}:all"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        sensor_data, temp_history = self._get_sensor_data_and_history(container_id)
        result = self._safe_wrapper_call(
            "predict_all", sensor_data, temp_history,
            default={
                "failure": {"risk": 0.0, "status": "UNKNOWN"},
                "health": {"score": 75.0, "status": "UNKNOWN"},
                "shelf_life": {"remaining_days": 7.0, "status": "UNKNOWN"},
                "forecast": {"predicted": [4.0] * 6, "breach_risk": False},
                "maintenance": {"risk": 0.0, "fault_type": "UNKNOWN"},
                "models_loaded": False,
                "mode": "fallback",
            }
        )
        _cache.set(cache_key, result)
        return result

    def invalidate_cache(self, container_id: str):
        """Force-expire all cached predictions for a specific container."""
        _cache.invalidate(container_id)

    # ── v1 backward-compatible methods ────────────────────────────────────────

    def predict_temperature(self, temp_history: List[float]) -> List[float]:
        """[v1 compat] Predict temperature for next 6 hours."""
        if not self.wrapper:
            return self._linear_fallback(temp_history)
        result = self._safe_wrapper_call("predict_forecast", temp_history, default=None)
        if result:
            return result.get("predicted", self._linear_fallback(temp_history))
        return self._linear_fallback(temp_history)

    def predict_failure(self, sensor_data: Dict) -> float:
        """[v1 compat] Returns failure probability as 0–100 float."""
        result = self._safe_wrapper_call(
            "predict_failure", sensor_data, default={"risk": 0.01}
        )
        return round(result.get("risk", 0.01) * 100, 2)

    def calculate_shelf_life(
        self, product_type: str, sensor_data: Dict, history_temps: List[float]
    ) -> Dict:
        """[v1 compat] Calculate quality metrics."""
        enriched = {**sensor_data, "product_type": product_type}
        enriched["days_in_transit"] = len(history_temps) / 24 if history_temps else 0
        enriched["cum_abuse"] = (
            sum(max(0, t - 5.0) for t in history_temps) / 100 if history_temps else 0
        )

        if not self.wrapper:
            return {"remaining": 0, "health_score": 0}

        result = self._safe_wrapper_call(
            "predict_all", enriched, history_temps, default=None
        )
        if not result:
            return {"remaining": 0, "health_score": 0}

        return {
            "original": {
                "mangoes": 15, "vaccines": 30, "seafood": 7, "electronics": 365
            }.get(product_type, 15),
            "remaining": result["shelf_life"]["remaining_days"],
            "health_score": result["health"]["score"],
            "failure_prob": result["failure"]["risk"],
            "anomaly": result.get("temp_anomaly", False),
        }

    @staticmethod
    def _linear_fallback(temp_history: List[float], steps: int = 6) -> List[float]:
        if not temp_history:
            return [4.0] * steps
        recent = temp_history[-12:] if len(temp_history) >= 12 else temp_history
        trend = (recent[-1] - recent[0]) / max(len(recent) - 1, 1)
        return [round(recent[-1] + trend * (i + 1), 2) for i in range(steps)]

    def get_model_status(self) -> Dict:
        """Return model load status from ModelWrapper."""
        if not self.wrapper:
            return {
                "status": "service_unavailable",
                "models": {},
                "version": "N/A",
            }
        return self.wrapper.get_model_status()


# Module-level singleton
prediction_service = PredictionService()
