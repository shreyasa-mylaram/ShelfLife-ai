"""
SHELFLIFE AI - Alert Generator
Creates alerts based on sensor data and predictions
"""

from typing import List, Dict, Optional

class AlertGenerator:
    """Generates alerts based on thresholds and predictions"""
    
    def __init__(self, product_thresholds: Dict):
        self.thresholds = product_thresholds
    
    def generate(self, sensor_data: Dict, predictions: Optional[List[float]], 
                 anomalies: List[Dict]) -> List[Dict]:
        """Generate all alerts"""
        alerts = []
        current_temp = sensor_data['temperature']
        
        # 1. Predictive temperature alert
        if predictions and max(predictions) > self.thresholds['temp_max']:
            hours = self._hours_to_critical(predictions, self.thresholds['temp_max'])
            alerts.append({
                'type': 'TEMPERATURE_CRITICAL_PREDICTED',
                'severity': 'HIGH',
                'message': f"Temperature will reach {self.thresholds['temp_max']}°C in {hours} hours",
                'action': f"Move container to top deck within {hours} hours"
            })
        
        # 2. Current temperature alert
        if current_temp > self.thresholds['temp_max']:
            alerts.append({
                'type': 'TEMPERATURE_CRITICAL',
                'severity': 'CRITICAL',
                'message': f"Current temperature {current_temp}°C exceeds maximum {self.thresholds['temp_max']}°C",
                'action': "Immediate action required! Move container or inspect cooling system"
            })
        
        # 3. Cooling system degradation
        if sensor_data.get('cooling_power', 100) < 70:
            alerts.append({
                'type': 'COOLING_DEGRADED',
                'severity': 'WARNING',
                'message': f"Cooling efficiency at {sensor_data['cooling_power']}%",
                'action': "Schedule maintenance at next port"
            })
        
        # 4. High vibration
        if sensor_data.get('vibration', 0) > 1.0:
            alerts.append({
                'type': 'HIGH_VIBRATION',
                'severity': 'INFO',
                'message': f"High vibration detected: {sensor_data['vibration']}g",
                'action': "Check cargo lashing at next opportunity"
            })
        
        # 5. Door opened
        if sensor_data.get('door_open'):
            alerts.append({
                'type': 'DOOR_OPENED',
                'severity': 'INFO',
                'message': "Container door was opened",
                'action': "Verify cargo integrity at destination"
            })
        
        # 6. Anomalies
        for anomaly in anomalies:
            alerts.append({
                'type': anomaly['type'].upper(),
                'severity': anomaly.get('severity', 'INFO'),
                'message': anomaly['message'],
                'action': "Investigate cause"
            })
        
        return alerts
    
    def _hours_to_critical(self, predictions: List[float], threshold: float) -> int:
        """Find first hour when prediction exceeds threshold"""
        for i, temp in enumerate(predictions):
            if temp > threshold:
                return i + 1
        return len(predictions)
