import os
import joblib
import numpy as np
import logging

logger = logging.getLogger(__name__)

class ModelWrapper:
    def __init__(self):
        # We still keep the original calculator as a redundant fallback
        try:
            from backend.ml_models.shelf_life_calculator import ShelfLifeCalculator
            from backend.ml_models.anomaly_detector import AnomalyDetector
            self.shelf_life_calc = ShelfLifeCalculator()
            self.anomaly_detector = AnomalyDetector()
        except ImportError:
            # Handle standard python imports if running outside the package context
            from ml_models.shelf_life_calculator import ShelfLifeCalculator
            from ml_models.anomaly_detector import AnomalyDetector
            self.shelf_life_calc = ShelfLifeCalculator()
            self.anomaly_detector = AnomalyDetector()

        current_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(current_dir, "saved_models")
        
        try:
            # Load the real trained models
            self.shelf_life_model = joblib.load(os.path.join(models_dir, "shelf_life_model.joblib"))
            self.health_model = joblib.load(os.path.join(models_dir, "health_model.joblib"))
            self.failure_model = joblib.load(os.path.join(models_dir, "failure_model.joblib"))
            self.product_enc = joblib.load(os.path.join(models_dir, "product_encoder.joblib"))
            self.models_loaded = True
            logger.info("Real ML models loaded successfully from saved_models/")
        except FileNotFoundError:
            self.shelf_life_model = None
            self.health_model = None
            self.failure_model = None
            self.product_enc = None
            self.models_loaded = False
            logger.warning("ML models not found in saved_models/. Running in heuristic fallback mode.")

    def predict(self, current_data: dict, history_temps: list = None) -> dict:
        """
        Unified prediction function combining all real trained ML models.
        current_data contains: temperature, humidity, vibration, cooling_power, product_type
        """
        temp = current_data.get('temperature', 0.0)
        
        # 1. Anomaly Detection (Rule + History based)
        temp_anomaly = False
        if history_temps and len(history_temps) > 0:
            temp_anomaly = self.anomaly_detector.detect(temp, history_temps)
            
        # 2. Heuristic Baseline (Fallback)
        baseline = self.shelf_life_calc.calculate(
            product_type=current_data.get('product_type', 'mangoes'),
            days_used=current_data.get('days_used', 0.0),
            cumulative_abuse=current_data.get('cum_abuse', 0.0)
        )
        
        shelf_life_rem = baseline['shelf_life_remaining']
        health_score = baseline['health_score']
        failure_prob = 0.01

        # 3. Real ML Inference (Optimized)
        if self.models_loaded:
            try:
                # Encode product type
                prod_type = current_data.get('product_type', 'mangoes')
                try:
                    prod_enc = self.product_enc.transform([prod_type])[0]
                except (ValueError, KeyError):
                    # Fallback to the first class if unknown
                    prod_enc = 0

                # Features: temperature, humidity, vibration, cooling_power, product_type_enc
                features = np.array([[
                    temp,
                    current_data.get('humidity', 0.0),
                    current_data.get('vibration', 0.0),
                    current_data.get('cooling_power', 100.0),
                    prod_enc
                ]])
                
                # Predict regression targets
                shelf_life_rem = float(self.shelf_life_model.predict(features)[0])
                health_score = float(self.health_model.predict(features)[0])
                
                # Predict failure probability
                failure_prob = float(self.failure_model.predict_proba(features)[0][1])
                
            except Exception as e:
                logger.error(f"Inference error: {e}")

        return {
            "temp_forecast": round(temp + 0.2, 2), # Placeholder for 1h forecast
            "failure_prob": round(failure_prob, 4),
            "temp_anomaly": temp_anomaly,
            "shelf_life_remaining": round(max(0, shelf_life_rem), 2),
            "health_score": round(min(100, max(0, health_score)), 1)
        }
