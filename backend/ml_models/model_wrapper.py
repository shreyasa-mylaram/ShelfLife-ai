import os
import joblib
import numpy as np

# We'll use scikit-learn models as stand-ins for LSTM and XGBoost due to requirements constraints
class ModelWrapper:
    def __init__(self):
        from backend.ml_models.shelf_life_calculator import ShelfLifeCalculator
        from backend.ml_models.anomaly_detector import AnomalyDetector
        
        self.shelf_life_calc = ShelfLifeCalculator()
        self.anomaly_detector = AnomalyDetector()
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(current_dir, "saved_models")
        
        try:
            self.temp_model = joblib.load(os.path.join(models_dir, "lstm_temp_model.joblib"))
            self.failure_model = joblib.load(os.path.join(models_dir, "xgboost_failure.joblib"))
        except FileNotFoundError:
            self.temp_model = None
            self.failure_model = None
            print("Warning: ML models not found in saved_models/. Running in fallback mode.")

    def predict(self, current_data: dict, history_temps: list = None) -> dict:
        """
        Unified prediction function combining all 4 models.
        current_data contains: temp, humidity, vibration, cooling, product_type, days_used, cum_abuse
        """
        # 1. Anomaly Detection based on temp
        temp_anomaly = False
        if history_temps and len(history_temps) > 0:
            temp_anomaly = self.anomaly_detector.detect(current_data.get('temperature', 0), history_temps)
            
        # 2. Shelf Life Calculator
        shelf_life_res = self.shelf_life_calc.calculate(
            product_type=current_data.get('product_type', 'mangoes'),
            days_used=current_data.get('days_used', 0.0),
            cumulative_abuse=current_data.get('cum_abuse', 0.0)
        )
        
        # 3. Temperature Forecast (LSTM Stand-in) & Failure Prob (XGBoost Stand-in)
        temp_forecast = current_data.get('temperature', 0)
        failure_prob = 0.01
        
        if self.temp_model and self.failure_model:
            # We construct the feature vector expected by our model
            # Let's say: [temp, humidity, vibration, cooling]
            features = np.array([[
                current_data.get('temperature', 0),
                current_data.get('humidity', 0),
                current_data.get('vibration', 0),
                current_data.get('cooling_power', 100)
            ]])
            
            try:
                temp_forecast = float(self.temp_model.predict(features)[0])
                failure_prob = float(self.failure_model.predict_proba(features)[0][1]) # Class 1 prob
            except Exception as e:
                print(f"Prediction error: {e}")
                
        return {
            "temp_forecast": round(temp_forecast, 2),
            "failure_prob": round(failure_prob, 4),
            "temp_anomaly": temp_anomaly,
            "shelf_life_remaining": shelf_life_res['shelf_life_remaining'],
            "health_score": shelf_life_res['health_score']
        }
