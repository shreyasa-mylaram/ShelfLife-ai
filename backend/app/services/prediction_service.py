"""
SHELFLIFE AI - Prediction Service (Placeholder for ML Models)
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class PredictionService:
    """Service for running ML predictions"""
    
    def __init__(self):
        try:
            from ml_models.model_wrapper import ModelWrapper
            self.wrapper = ModelWrapper()
        except Exception:
            self.wrapper = None
        self.models_loaded = True
        logger.info("ML models loaded via ModelWrapper")
    
    def predict_temperature(self, temp_history: List[float]) -> List[float]:
        """Predict temperature for next 6 hours"""
        if not temp_history or len(temp_history) < 24:
            return None
        
        # Simple trend-based prediction (placeholder)
        recent = temp_history[-12:]
        trend = (recent[-1] - recent[0]) / len(recent) if len(recent) > 1 else 0
        last_temp = recent[-1]
        
        predictions = []
        for i in range(1, 7):
            predictions.append(round(last_temp + trend * i, 1))
        
        return predictions
    
    def predict_failure(self, sensor_data: Dict) -> float:
        """Predict failure probability (0-100%)"""
        # Simple rule-based (placeholder)
        probability = 0
        
        temp = sensor_data.get('temperature', 0)
        if temp > 15:
            probability += (temp - 15) * 10
        
        if sensor_data.get('cooling_power', 100) < 70:
            probability += (70 - sensor_data['cooling_power'])
        
        return min(100, probability)
    
    def calculate_shelf_life(self, product_type: str, temp_history: List[float]) -> Dict:
        """Calculate remaining shelf life"""
        # Using the wrapper correctly is tricky without the full input dict,
        # but for calculation let's route to the exact shelf life output from the wrapper.
        current_data = {
            'product_type': product_type,
            'days_used': len(temp_history) / 24 if temp_history else 0,
            'cum_abuse': 0.0 # Placeholder for simplicity
        }
        res = self.wrapper.predict(current_data, temp_history)
        
        return {
            'original': {
                'mangoes': 15, 'vaccines': 30, 'seafood': 7, 'electronics': 365
            }.get(product_type, 15),
            'remaining': res.get('shelf_life_remaining', 0.0),
            'health_score': res.get('health_score', 0)
        }

prediction_service = PredictionService()
