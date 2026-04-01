"""
SHELFLIFE AI - Anomaly Detector
Detects unusual patterns in sensor data
"""

import numpy as np
from typing import List, Dict, Optional

class AnomalyDetector:
    """Statistical anomaly detection using rolling window"""
    
    def __init__(self, window_size: int = 60, std_threshold: float = 3.0):
        self.window_size = window_size
        self.std_threshold = std_threshold
    
    def detect_temperature_spike(self, temp_history: List[float], current_temp: float) -> Optional[Dict]:
        """Detect if current temperature is a spike"""
        if len(temp_history) < self.window_size:
            return None
        
        window = temp_history[-self.window_size:]
        mean = np.mean(window)
        std = np.std(window)
        
        if abs(current_temp - mean) > self.std_threshold * std:
            return {
                'type': 'temperature_spike',
                'message': f"Temperature {current_temp}°C is {abs(current_temp - mean):.1f}°C above normal",
                'severity': 'WARNING'
            }
        return None
    
    def detect_vibration_spike(self, vibration_history: List[float], current_vibration: float) -> Optional[Dict]:
        """Detect sudden increase in vibration"""
        if len(vibration_history) < 10:
            return None
        
        recent = vibration_history[-10:]
        recent_mean = np.mean(recent)
        
        if current_vibration > recent_mean * 2:
            return {
                'type': 'vibration_spike',
                'message': f"Vibration spike: {current_vibration}g (normal ~{recent_mean:.2f}g)",
                'severity': 'INFO'
            }
        return None
    
    def detect_cooling_drop(self, cooling_history: List[int], current_cooling: int) -> Optional[Dict]:
        """Detect drop in cooling efficiency"""
        if len(cooling_history) < 6:
            return None
        
        recent = cooling_history[-6:]
        recent_mean = np.mean(recent)
        
        if current_cooling < recent_mean - 15:
            return {
                'type': 'cooling_drop',
                'message': f"Cooling power dropped to {current_cooling}% (was {recent_mean:.0f}%)",
                'severity': 'WARNING'
            }
        return None
