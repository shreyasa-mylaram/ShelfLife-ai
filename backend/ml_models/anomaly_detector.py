import numpy as np
from collections import deque

class AnomalyDetector:
    def __init__(self, window_size=12, sigma_threshold=3.0):
        self.window_size = window_size
        self.sigma_threshold = sigma_threshold
        # Maintain history locally if needed, but typically backend handles stateless
        # We will assume history is passed in
        
    def detect(self, current_value: float, history: list) -> bool:
        """
        Detect spikes using rolling window + 3 sigma threshold
        """
        if not history or len(history) < 3:
            return False
            
        # Consider the last N points
        recent_history = history[-self.window_size:]
        mean = np.mean(recent_history)
        std = np.std(recent_history)
        
        if std == 0:
            std = 0.1 # prevent division by zero
            
        z_score = abs(current_value - mean) / std
        return float(z_score) > self.sigma_threshold
