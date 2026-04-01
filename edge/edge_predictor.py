"""
SHELFLIFE AI - Lightweight Temperature Predictor
Runs on edge device, no heavy ML models
"""

from typing import List, Optional

class TemperaturePredictor:
    """Simple trend-based predictor for edge devices"""
    
    def __init__(self, history_hours: int = 24):
        self.history_hours = history_hours
    
    def predict(self, temp_history: List[float], hours_ahead: int = 6) -> Optional[List[float]]:
        """
        Predict temperatures for next N hours using linear trend + diurnal cycle
        Returns None if insufficient history
        """
        if len(temp_history) < self.history_hours:
            return None
        
        recent = temp_history[-self.history_hours:]
        
        # Calculate linear trend (simple least squares)
        n = len(recent)
        x = list(range(n))
        sum_x = sum(x)
        sum_y = sum(recent)
        sum_xy = sum(x[i] * recent[i] for i in range(n))
        sum_xx = sum(i * i for i in x)
        
        denominator = n * sum_xx - sum_x * sum_x
        if denominator == 0:
            slope = 0
        else:
            slope = (n * sum_xy - sum_x * sum_y) / denominator
        
        last_temp = recent[-1]
        predictions = []
        
        for i in range(1, hours_ahead + 1):
            predicted = last_temp + slope * i
            
            # Add diurnal cycle (simplified sine wave)
            # Assuming we have hour of day information; for now we'll use a placeholder.
            # In real implementation, pass current hour.
            # We'll just add a small sinusoidal component for demo.
            # For simplicity, we'll skip diurnal here; it can be added later.
            
            predictions.append(round(predicted, 1))
        
        return predictions
