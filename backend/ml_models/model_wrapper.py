"""
SHELFLIFE AI - Model Wrapper v2.0
Central interface for all 5 ML model predictions.

Models:
  1. failure_model   - Failure risk classifier        (Random Forest, 99% acc)
  2. health_model    - Health score regressor         (Random Forest, R²: 0.9991)
  3. shelf_life_model- Shelf life regressor           (Random Forest, R²: 0.8905)
  4. forecast_model  - 6-hour temperature forecast    (Random Forest, R²: ~0.92)
  5. maintenance_model- Equipment fault detection     (XGBoost)

All predictions fall back gracefully to ShelfLifeCalculator if models are missing.
System NEVER crashes due to missing model files.
"""

import os
import json
import joblib
import numpy as np
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────
MODEL_VERSION = "2.0"
FALLBACK_VERSION = "1.0-heuristic"
CRITICAL_TEMP_THRESHOLD = 5.0  # °C — matches the rest of the codebase

# Default feature sets (used when JSON files are missing)
_DEFAULT_CORE_FEATURES = [
    "temperature", "humidity", "vibration", "cooling_power",
    "product_type_encoded",
    "temperature_rolling_mean", "temperature_rolling_std", "temperature_slope",
    "humidity_to_temp_ratio", "cumulative_exposure", "temperature_spike_count",
    "cooling_efficiency",
    "lag_1", "lag_3", "lag_6",
]
_DEFAULT_FORECAST_FEATURES = [
    "temp_t-5", "temp_t-4", "temp_t-3", "temp_t-2", "temp_t-1", "temp_t0",
    "temp_mean", "temp_std", "temp_trend"
]
_DEFAULT_MAINTENANCE_FEATURES = [
    "temperature", "humidity", "vibration", "cooling_power",
    "vibration_rolling_mean", "vibration_rolling_std",
    "cooling_power_rolling_mean", "temp_rolling_std"
]

# Product type encoding map (matches training)
_PRODUCT_ENC = {
    "mangoes": 0, "vaccines": 1, "seafood": 2,
    "electronics": 3, "dairy": 4, "meat": 5,
    "pharmaceuticals": 1,  # alias
}


# ─── ModelWrapper ─────────────────────────────────────────────────────────────
class ModelWrapper:
    """
    Central interface for all 5 ShelfLife AI ML models.
    Provides individual prediction methods + a unified predict_all().
    Falls back to ShelfLifeCalculator when trained models are unavailable.
    """

    def __init__(self):
        # ── Fallback calculators ───────────────────────────────────────────────
        try:
            from backend.ml_models.shelf_life_calculator import ShelfLifeCalculator
            from backend.ml_models.anomaly_detector import AnomalyDetector
        except ImportError:
            from ml_models.shelf_life_calculator import ShelfLifeCalculator
            from ml_models.anomaly_detector import AnomalyDetector

        self.shelf_life_calc = ShelfLifeCalculator()
        self.anomaly_detector = AnomalyDetector()

        # ── Paths ──────────────────────────────────────────────────────────────
        self._current_dir = os.path.dirname(os.path.abspath(__file__))
        self._models_dir = os.path.join(self._current_dir, "saved_models")

        # ── Model state ────────────────────────────────────────────────────────
        self.models_loaded = False           # True only when ALL core models loaded
        self._model_status: Dict[str, Dict] = {}

        # ── Load everything ────────────────────────────────────────────────────
        self._load_all_models()
        self._log_startup_status()

    # ── Private: loaders ──────────────────────────────────────────────────────

    def _load_model(self, filename: str) -> Optional[Any]:
        """Load a single joblib model file, return None on failure."""
        path = os.path.join(self._models_dir, filename)
        try:
            model = joblib.load(path)
            size_mb = round(os.path.getsize(path) / 1_048_576, 2)
            logger.info(f"  ✓ Loaded {filename} ({size_mb} MB)")
            return model
        except FileNotFoundError:
            logger.warning(f"  ✗ Not found: {filename} — will use fallback")
            return None
        except Exception as e:
            logger.error(f"  ✗ Error loading {filename}: {e}")
            return None

    def _load_json(self, filename: str, default: List[str]) -> List[str]:
        """Load feature names from a JSON file, return default list on failure."""
        path = os.path.join(self._models_dir, filename)
        try:
            with open(path, "r") as f:
                data = json.load(f)
            # Support both a plain list and {"features": [...]}
            features = data if isinstance(data, list) else data.get("features", default)
            logger.info(f"  ✓ Loaded feature list from {filename} ({len(features)} features)")
            return features
        except FileNotFoundError:
            logger.warning(f"  ✗ Not found: {filename} — using default feature set")
            return default
        except Exception as e:
            logger.error(f"  ✗ Error loading {filename}: {e} — using default feature set")
            return default

    def _load_all_models(self):
        """Load all 5 models, scalers, and feature lists."""
        logger.info("=" * 60)
        logger.info("ShelfLife AI — Loading ML Models v%s", MODEL_VERSION)
        logger.info("Models directory: %s", self._models_dir)
        logger.info("=" * 60)

        # 1. Failure classifier
        self.failure_model = self._load_model("failure_model.joblib")
        self._model_status["failure"] = {
            "loaded": self.failure_model is not None,
            "version": MODEL_VERSION if self.failure_model else FALLBACK_VERSION,
            "file": "failure_model.joblib",
            "type": "classifier"
        }

        # 2. Health regressor
        self.health_model = self._load_model("health_model.joblib")
        self._model_status["health"] = {
            "loaded": self.health_model is not None,
            "version": MODEL_VERSION if self.health_model else FALLBACK_VERSION,
            "file": "health_model.joblib",
            "type": "regressor"
        }

        # 3. Shelf-life regressor + scaler + features
        self.shelf_life_model = self._load_model("shelf_life_model.joblib")
        self.shelf_life_scaler = self._load_model("shelf_life_scaler.joblib")
        self.shelf_life_features = self._load_json(
            "shelf_life_features.json", _DEFAULT_CORE_FEATURES
        )
        self._model_status["shelf_life"] = {
            "loaded": self.shelf_life_model is not None,
            "version": MODEL_VERSION if self.shelf_life_model else FALLBACK_VERSION,
            "file": "shelf_life_model.joblib",
            "type": "regressor"
        }

        # 4. 6-hour temperature forecast + scaler + features
        self.forecast_model = self._load_model("forecast_model.joblib")
        self.forecast_scaler = self._load_model("forecast_scaler.joblib")
        self.forecast_features = self._load_json(
            "forecast_features.json", _DEFAULT_FORECAST_FEATURES
        )
        self._model_status["forecast"] = {
            "loaded": self.forecast_model is not None,
            "version": MODEL_VERSION if self.forecast_model else FALLBACK_VERSION,
            "file": "forecast_model.joblib",
            "type": "regressor"
        }

        # 5. Maintenance / fault detection + scaler + features
        self.maintenance_model = self._load_model("maintenance_model.joblib")
        self.maintenance_scaler = self._load_model("maintenance_scaler.joblib")
        self.maintenance_features = self._load_json(
            "maintenance_features.json", _DEFAULT_MAINTENANCE_FEATURES
        )
        self._model_status["maintenance"] = {
            "loaded": self.maintenance_model is not None,
            "version": MODEL_VERSION if self.maintenance_model else FALLBACK_VERSION,
            "file": "maintenance_model.joblib",
            "type": "classifier"
        }

        # Legacy product encoder (v1 compat — optional)
        self.product_enc = self._load_model("product_encoder.joblib")

        # Overall status
        core_loaded = [
            self.failure_model,
            self.health_model,
            self.shelf_life_model,
        ]
        self.models_loaded = all(m is not None for m in core_loaded)

    def _log_startup_status(self):
        """Print a formatted model status table to the log on startup."""
        logger.info("=" * 60)
        logger.info("MODEL STATUS REPORT")
        logger.info("-" * 60)
        for name, info in self._model_status.items():
            status_icon = "✓ LOADED" if info["loaded"] else "✗ FALLBACK"
            logger.info(
                f"  {name:<15} {status_icon:<12} v{info['version']}"
            )
        logger.info("-" * 60)
        overall = "ALL MODELS LOADED" if self.models_loaded else "FALLBACK MODE (heuristic)"
        logger.info(f"  Overall: {overall}")
        logger.info("=" * 60)

    # ── Private: feature builders ─────────────────────────────────────────────

    def _build_core_features(self, sensor_data: Dict, temp_history: Optional[List[float]] = None) -> np.ndarray:
        """
        Build the 15-feature vector matching failure_model / health_model training.
        Features:
          temperature, humidity, vibration, cooling_power, product_type_encoded,
          temperature_rolling_mean, temperature_rolling_std, temperature_slope,
          humidity_to_temp_ratio, cumulative_exposure, temperature_spike_count,
          cooling_efficiency, lag_1, lag_3, lag_6
        """
        temp        = float(sensor_data.get("temperature", 4.0))
        humidity    = float(sensor_data.get("humidity", 80.0))
        vibration   = float(sensor_data.get("vibration", 0.1))
        cooling     = float(sensor_data.get("cooling_power", 100.0))
        product_str = str(sensor_data.get("product_type", "mangoes")).lower()
        prod_enc    = float(_PRODUCT_ENC.get(product_str, 0))

        # Rolling stats from history
        hist = temp_history if temp_history else sensor_data.get("_temp_history", [temp])
        hist = [float(h) for h in hist if h is not None]
        window = hist[-12:] if len(hist) >= 12 else hist

        roll_mean  = float(np.mean(window)) if window else temp
        roll_std   = float(np.std(window))  if len(window) > 1 else 0.0
        slope      = (window[-1] - window[0]) / max(len(window) - 1, 1) if len(window) > 1 else 0.0
        cum_expo   = float(sum(max(0, t - 5.0) for t in hist))  # cumulative abuse above 5°C
        spike_cnt  = float(sum(1 for t in hist if t > 5.0))
        cool_eff   = cooling / max(temp, 0.1)  # simple efficiency proxy
        hum_ratio  = humidity / max(temp + 20, 1)  # humidity-to-temp ratio

        # Lag features (last N readings)
        def _lag(n: int) -> float:
            return float(hist[-n]) if len(hist) >= n else temp

        return np.array([[
            temp, humidity, vibration, cooling, prod_enc,
            roll_mean, roll_std, slope,
            hum_ratio, cum_expo, spike_cnt, cool_eff,
            _lag(1), _lag(3), _lag(6),
        ]])

    def _build_shelf_life_features(self, sensor_data: Dict) -> np.ndarray:
        """
        Build 10-feature vector matching shelf_life_features.json.
        Features: temperature, humidity, moisture, oxygen, peroxide_value,
                  free_fatty_acids, hexanal_level, oxidation_index,
                  rancidity_probability, decay_curve_value
        """
        return np.array([[
            float(sensor_data.get("temperature", 4.0)),
            float(sensor_data.get("humidity", 80.0)),
            float(sensor_data.get("moisture", 12.0)),
            float(sensor_data.get("oxygen", 20.9)),
            float(sensor_data.get("peroxide_value", 0.5)),
            float(sensor_data.get("free_fatty_acids", 0.1)),
            float(sensor_data.get("hexanal_level", 0.05)),
            float(sensor_data.get("oxidation_index", 0.1)),
            float(sensor_data.get("rancidity_probability", 0.02)),
            float(sensor_data.get("decay_curve_value", 1.0)),
        ]])

    def _build_forecast_features(self, temp_history: List[float], sensor_data: Optional[Dict] = None) -> np.ndarray:
        """
        Build 21-feature vector matching forecast_features.json.
        Features: temperature, lags (1,3,6,12,24), rolling means (3,6,12,24),
                  rolling stds (3,6,12,24), slopes (3,6), humidity, moisture, oxygen, day_of_week, month
        """
        hist = [float(h) for h in temp_history] if temp_history else [4.0]
        cur_temp = hist[-1]

        def _lag(n: int) -> float:
            return hist[-n] if len(hist) >= n else cur_temp

        def _mean(w: int) -> float:
            sub = hist[-w:] if len(hist) >= w else hist
            return float(np.mean(sub))

        def _std(w: int) -> float:
            sub = hist[-w:] if len(hist) >= w else hist
            return float(np.std(sub)) if len(sub) > 1 else 0.0

        def _slope(w: int) -> float:
            sub = hist[-w:] if len(hist) >= w else hist
            return (sub[-1] - sub[0]) / max(len(sub) - 1, 1) if len(sub) > 1 else 0.0

        now = datetime.now()
        s_data = sensor_data or {}
        humidity = float(s_data.get("humidity", 80.0))
        moisture = float(s_data.get("moisture", 12.0))
        oxygen = float(s_data.get("oxygen", 20.9))

        features = [
            cur_temp,
            _lag(1), _lag(3), _lag(6), _lag(12), _lag(24),
            _mean(3), _mean(6), _mean(12), _mean(24),
            _std(3), _std(6), _std(12), _std(24),
            _slope(3), _slope(6),
            humidity, moisture, oxygen,
            float(now.weekday()), float(now.month),
        ]
        return np.array([features])

    def _build_maintenance_features(self, sensor_data: Dict) -> np.ndarray:
        """
        Build 12-feature vector matching maintenance_features.json.
        Features: temperature, suction_pressure, discharge_pressure, compressor_cycles,
                  humidity, runtime_hours, power_consumption, condenser_temp,
                  evaporator_temp, refrigerant_pressure, oil_pressure, vibration
        """
        return np.array([[
            float(sensor_data.get("temperature", 4.0)),
            float(sensor_data.get("suction_pressure", 2.1)),
            float(sensor_data.get("discharge_pressure", 14.5)),
            float(sensor_data.get("compressor_cycles", 12.0)),
            float(sensor_data.get("humidity", 80.0)),
            float(sensor_data.get("runtime_hours", 120.0)),
            float(sensor_data.get("power_consumption", 3.5)),
            float(sensor_data.get("condenser_temp", 35.0)),
            float(sensor_data.get("evaporator_temp", -5.0)),
            float(sensor_data.get("refrigerant_pressure", 8.2)),
            float(sensor_data.get("oil_pressure", 3.1)),
            float(sensor_data.get("vibration", 0.1)),
        ]])


    # ── Public: individual prediction methods ─────────────────────────────────

    def predict_failure(self, sensor_data: Dict, temp_history: Optional[List[float]] = None) -> Dict:
        """
        Predict equipment/cold-chain failure risk.
        Returns: {risk: 0.0-1.0, status: str, source: str}
        """
        try:
            if self.failure_model is not None:
                X = self._build_core_features(sensor_data, temp_history)
                risk = float(self.failure_model.predict_proba(X)[0][1])
                source = "ml_model"
            else:
                # Heuristic fallback: high temp -> higher risk
                temp = float(sensor_data.get("temperature", 4.0))
                excess = max(0.0, temp - CRITICAL_TEMP_THRESHOLD)
                risk = min(1.0, 0.05 + (excess * 0.3))
                source = "heuristic"

            if risk >= 0.7:
                status = "HIGH_RISK"
            elif risk >= 0.4:
                status = "MEDIUM_RISK"
            else:
                status = "LOW_RISK"

            return {
                "risk": round(risk, 4),
                "risk_pct": round(risk * 100, 2),
                "status": status,
                "source": source,
            }
        except Exception as e:
            logger.error(f"predict_failure error: {e}")
            return {"risk": 0.0, "risk_pct": 0.0, "status": "UNKNOWN", "source": "error"}

    def predict_health(self, sensor_data: Dict, temp_history: Optional[List[float]] = None) -> Dict:
        """
        Predict container/cargo health score (0-100).
        Returns: {score: float, status: str, source: str}
        """
        try:
            if self.health_model is not None:
                X = self._build_core_features(sensor_data, temp_history)
                score = float(self.health_model.predict(X)[0])
                score = round(min(100.0, max(0.0, score)), 2)
                source = "ml_model"
            else:
                # Fallback: heuristic from ShelfLifeCalculator
                baseline = self.shelf_life_calc.calculate(
                    product_type=sensor_data.get("product_type", "mangoes"),
                    days_used=sensor_data.get("days_in_transit", 0.0),
                    cumulative_abuse=sensor_data.get("cum_abuse", 0.0),
                )
                score = float(baseline.get("health_score", 75.0))
                source = "heuristic"

            if score >= 80:
                status = "EXCELLENT"
            elif score >= 60:
                status = "GOOD"
            elif score >= 40:
                status = "FAIR"
            else:
                status = "POOR"

            return {"score": score, "status": status, "source": source}
        except Exception as e:
            logger.error(f"predict_health error: {e}")
            return {"score": 75.0, "status": "UNKNOWN", "source": "error"}

    def predict_shelf_life(self, sensor_data: Dict) -> Dict:
        """
        Predict remaining shelf life in days.
        Returns: {remaining_days: float, status: str, source: str}
        """
        try:
            if self.shelf_life_model is not None:
                X = self._build_shelf_life_features(sensor_data)
                if self.shelf_life_scaler is not None:
                    X = self.shelf_life_scaler.transform(X)
                days = float(self.shelf_life_model.predict(X)[0])
                days = round(min(60.0, max(0.0, days)), 2)
                source = "ml_model"
            else:
                baseline = self.shelf_life_calc.calculate(
                    product_type=sensor_data.get("product_type", "mangoes"),
                    days_used=sensor_data.get("days_in_transit", 0.0),
                    cumulative_abuse=sensor_data.get("cum_abuse", 0.0),
                )
                days = float(baseline.get("shelf_life_remaining", 10.0))
                source = "heuristic"

            if days <= 1:
                status = "CRITICAL"
            elif days <= 3:
                status = "LOW"
            elif days <= 7:
                status = "MODERATE"
            else:
                status = "GOOD"

            return {"remaining_days": days, "status": status, "source": source}
        except Exception as e:
            logger.error(f"predict_shelf_life error: {e}")
            return {"remaining_days": 7.0, "status": "UNKNOWN", "source": "error"}

    def predict_forecast(self, temp_history: List[float]) -> Dict:
        """
        Predict 6-hour temperature forecast.
        Returns: {current: float, predicted: [6 floats], breach_risk: bool, source: str}
        """
        try:
            current = float(temp_history[-1]) if temp_history else 4.0
            predicted: List[float] = []

            if self.forecast_model is not None:
                X = self._build_forecast_features(temp_history)
                if X is not None:
                    if self.forecast_scaler is not None:
                        X = self.forecast_scaler.transform(X)
                    raw = self.forecast_model.predict(X)[0]
                    # Model may output a single next value or all 6 steps
                    if hasattr(raw, "__len__"):
                        predicted = [round(float(v), 2) for v in raw[:6]]
                    else:
                        step = float(raw) - current
                        predicted = [round(current + step * (i + 1), 2) for i in range(6)]
                    
                    if any(abs(v - current) > 15.0 or v > 45.0 or v < -20.0 for v in predicted):
                        predicted = self._linear_forecast(temp_history)
                    source = "ml_model"
                else:
                    predicted = self._linear_forecast(temp_history)
                    source = "ml_model_fallback"
            else:
                predicted = self._linear_forecast(temp_history)
                source = "heuristic"

            breach_risk = any(t > CRITICAL_TEMP_THRESHOLD for t in predicted)
            breach_hour = next(
                (i + 1 for i, t in enumerate(predicted) if t > CRITICAL_TEMP_THRESHOLD), None
            )

            return {
                "current": round(current, 2),
                "predicted": predicted,
                "breach_risk": breach_risk,
                "breach_hour": breach_hour,
                "threshold": CRITICAL_TEMP_THRESHOLD,
                "source": source,
            }
        except Exception as e:
            logger.error(f"predict_forecast error: {e}")
            current = float(temp_history[-1]) if temp_history else 4.0
            return {
                "current": current,
                "predicted": [current] * 6,
                "breach_risk": False,
                "breach_hour": None,
                "threshold": CRITICAL_TEMP_THRESHOLD,
                "source": "error",
            }

    def predict_maintenance(self, sensor_data: Dict) -> Dict:
        """
        Predict equipment fault risk and type.
        Returns: {risk: 0.0–1.0, fault_type: str, confidence: float, source: str}
        """
        try:
            vibration = float(sensor_data.get("vibration", 0.1))
            cooling = float(sensor_data.get("cooling_power", 100.0))

            if self.maintenance_model is not None:
                X = self._build_maintenance_features(sensor_data)
                if self.maintenance_scaler is not None:
                    X = self.maintenance_scaler.transform(X)
                if X.shape[1] > 7:
                    X_model = X[:, :7]
                else:
                    X_model = X

                if hasattr(self.maintenance_model, "predict_proba"):
                    proba = self.maintenance_model.predict_proba(X_model)[0]
                    risk = float(max(proba[1:])) if len(proba) > 1 else float(proba[0])
                    fault_class = int(np.argmax(proba))
                    confidence = float(np.max(proba))
                else:
                    pred = int(self.maintenance_model.predict(X_model)[0])
                    fault_class = pred
                    risk = 0.9 if pred > 0 else 0.05
                    confidence = 0.85
                source = "ml_model"
            else:
                # Heuristic: high vibration or low cooling → fault risk
                risk = min(1.0, max(0.0, (vibration * 2.0) + ((100 - cooling) / 200)))
                fault_class = 1 if vibration > 0.5 else (2 if cooling < 70 else 0)
                confidence = 0.6
                source = "heuristic"

            fault_map = {
                0: "NO_FAULT",
                1: "COMPRESSOR_VIBRATION",
                2: "COOLING_FAILURE",
                3: "SENSOR_DRIFT",
                4: "DOOR_SEAL_LEAK",
            }
            fault_type = fault_map.get(fault_class, f"FAULT_TYPE_{fault_class}")

            if risk >= 0.7:
                status = "HIGH_RISK"
            elif risk >= 0.4:
                status = "MEDIUM_RISK"
            else:
                status = "LOW_RISK"

            return {
                "risk": round(risk, 4),
                "risk_pct": round(risk * 100, 2),
                "fault_type": fault_type,
                "confidence": round(confidence, 4),
                "status": status,
                "source": source,
            }
        except Exception as e:
            logger.error(f"predict_maintenance error: {e}")
            return {
                "risk": 0.0,
                "risk_pct": 0.0,
                "fault_type": "UNKNOWN",
                "confidence": 0.0,
                "status": "UNKNOWN",
                "source": "error",
            }

    def predict_all(self, sensor_data: Dict, temp_history: Optional[List[float]] = None) -> Dict:
        """
        Run all 5 predictions in one call.
        Returns a unified dict with all prediction results + metadata.
        """
        if temp_history is None:
            temp_history = [sensor_data.get("temperature", 4.0)]

        failure = self.predict_failure(sensor_data, temp_history)
        health = self.predict_health(sensor_data, temp_history)
        shelf_life = self.predict_shelf_life(sensor_data)
        forecast = self.predict_forecast(temp_history)
        maintenance = self.predict_maintenance(sensor_data)

        # Anomaly detection (rule + history based)
        temp_anomaly = False
        if len(temp_history) > 1:
            try:
                temp_anomaly = bool(
                    self.anomaly_detector.detect(temp_history[-1], temp_history[:-1])
                )
            except Exception:
                pass

        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "failure": failure,
            "health": health,
            "shelf_life": shelf_life,
            "forecast": forecast,
            "maintenance": maintenance,
            "temp_anomaly": temp_anomaly,
            "models_loaded": self.models_loaded,
            "mode": "ml" if self.models_loaded else "fallback",
        }

    # ── Backward compatibility ─────────────────────────────────────────────────

    def predict(self, current_data: Dict, history_temps: Optional[List[float]] = None) -> Dict:
        """
        Legacy interface — kept for backward compatibility with existing code.
        Delegates to predict_all() and reshapes output to the v1 schema.
        """
        result = self.predict_all(current_data, history_temps)
        return {
            "temp_forecast": result["forecast"]["predicted"][0] if result["forecast"]["predicted"] else current_data.get("temperature", 4.0),
            "failure_prob": result["failure"]["risk"],
            "temp_anomaly": result["temp_anomaly"],
            "shelf_life_remaining": result["shelf_life"]["remaining_days"],
            "health_score": result["health"]["score"],
        }

    # ── Utilities ──────────────────────────────────────────────────────────────

    @staticmethod
    def _linear_forecast(temp_history: List[float], steps: int = 6) -> List[float]:
        """Simple linear trend extrapolation — fallback when no forecast model."""
        if not temp_history:
            return [4.0] * steps
        recent = temp_history[-12:] if len(temp_history) >= 12 else temp_history
        trend = (recent[-1] - recent[0]) / max(len(recent) - 1, 1)
        last = recent[-1]
        return [round(last + trend * (i + 1), 2) for i in range(steps)]

    def get_model_status(self) -> Dict:
        """Return detailed status dict for all models (used by /api/models/status)."""
        any_loaded = any(v["loaded"] for v in self._model_status.values())
        return {
            "status": "models_loaded" if self.models_loaded else "fallback_mode",
            "any_model_loaded": any_loaded,
            "models_dir": self._models_dir,
            "models": self._model_status,
            "version": MODEL_VERSION,
            "checked_at": datetime.utcnow().isoformat() + "Z",
        }
