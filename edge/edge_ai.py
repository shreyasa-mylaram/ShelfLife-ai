"""
SHELFLIFE AI - Main Edge AI Engine
Orchestrates all modules
"""

import time
import random
from datetime import datetime
from typing import Dict, List, Optional

# Import our modules
from storage import LocalStorage
from edge_predictor import TemperaturePredictor
from edge_anomaly import AnomalyDetector
from edge_alerts import AlertGenerator
from sync_manager import SyncManager
from display import Display

class EdgeAI:
    """Main Edge AI engine that runs on container"""
    
    def __init__(self, container_id: str, product_type: str, journey_days: int = 30):
        self.container_id = container_id
        self.product_type = product_type
        self.journey_days = journey_days
        self.current_day = 0
        self.current_hour = 0
        self.running = True
        
        # Temperature history
        self.temp_history = []
        self.humidity_history = []
        self.vibration_history = []
        self.cooling_history = []
        
        # Product thresholds
        self.thresholds = {
            'mangoes': {'temp_min': 10, 'temp_max': 15, 'humidity_max': 90},
            'vaccines': {'temp_min': 2, 'temp_max': 8, 'humidity_max': 60},
            'seafood': {'temp_min': -2, 'temp_max': 0, 'humidity_max': 95},
            'electronics': {'temp_min': -20, 'temp_max': 60, 'humidity_max': 80}
        }.get(product_type, {'temp_min': 10, 'temp_max': 15, 'humidity_max': 90})
        
        # Initialize modules
        self.storage = LocalStorage(container_id)
        self.predictor = TemperaturePredictor(history_hours=24)
        self.anomaly_detector = AnomalyDetector()
        self.alert_generator = AlertGenerator(self.thresholds)
        self.sync_manager = SyncManager(container_id)
        self.display = Display()
        
        print(f"✅ Edge AI initialized for {container_id}")
        print(f"   Product: {product_type}")
        print(f"   Temp range: {self.thresholds['temp_min']}°C - {self.thresholds['temp_max']}°C")
        print(f"   Running OFFLINE mode")
    
    def read_sensors(self) -> Dict:
        """Simulate reading from sensors"""
        # For hackathon: generate realistic data
        optimal_temp = (self.thresholds['temp_min'] + self.thresholds['temp_max']) / 2
        
        # Day/night cycle
        hour_of_day = self.current_hour % 24
        diurnal = 2 * (hour_of_day / 12 - 1) if hour_of_day < 12 else 2 * (1 - (hour_of_day - 12) / 12)
        diurnal = diurnal * 2  # Range -2 to +2
        
        # Cooling degradation after day 10
        cooling_degradation = 0
        if self.current_day > 10:
            cooling_degradation = (self.current_day - 10) * 0.5
        
        # Random failure on day 18-20
        failure_impact = 0
        if 18 <= self.current_day <= 20 and random.random() < 0.05:
            failure_impact = random.uniform(5, 10)
        
        temperature = optimal_temp + diurnal + cooling_degradation + failure_impact
        temperature += random.uniform(-0.5, 0.5)
        temperature = round(max(self.thresholds['temp_min'] - 5, 
                                min(self.thresholds['temp_max'] + 10, temperature)), 1)
        
        # Humidity correlates with temperature
        base_humidity = 75
        temp_factor = (temperature - self.thresholds['temp_min']) * 2
        humidity = base_humidity + temp_factor + random.uniform(-5, 5)
        humidity = min(100, max(0, round(humidity, 1)))
        
        # Vibration
        vibration = random.uniform(0.05, 0.2)
        if random.random() < 0.05:  # Storm simulation
            vibration += random.uniform(0.5, 1.5)
        
        # Cooling power degrades over time
        cooling_power = max(0, 100 - cooling_degradation * 10)
        cooling_power += random.uniform(-5, 5)
        cooling_power = max(0, min(100, int(cooling_power)))
        
        # Door status
        door_open = random.random() < 0.02  # 2% chance
        
        return {
            'timestamp': datetime.now().isoformat(),
            'temperature': temperature,
            'humidity': humidity,
            'vibration': round(vibration, 2),
            'cooling_power': cooling_power,
            'door_open': door_open,
            'days_in_transit': round(self.current_day + self.current_hour / 24, 1)
        }
    
    def update_histories(self, sensor_data: Dict):
        """Update all history buffers"""
        self.temp_history.append(sensor_data['temperature'])
        self.humidity_history.append(sensor_data['humidity'])
        self.vibration_history.append(sensor_data['vibration'])
        self.cooling_history.append(sensor_data['cooling_power'])
        
        # Keep last 7 days (168 hours)
        if len(self.temp_history) > 168:
            self.temp_history = self.temp_history[-168:]
            self.humidity_history = self.humidity_history[-168:]
            self.vibration_history = self.vibration_history[-168:]
            self.cooling_history = self.cooling_history[-168:]
    
    def calculate_health_score(self, sensor_data: Dict, predictions: Optional[List[float]]) -> int:
        """Calculate container health score (0-100)"""
        score = 100
        
        # Temperature penalty
        temp = sensor_data['temperature']
        if temp > self.thresholds['temp_max']:
            score -= (temp - self.thresholds['temp_max']) * 10
        elif temp < self.thresholds['temp_min']:
            score -= (self.thresholds['temp_min'] - temp) * 5
        
        # Cooling system penalty
        if sensor_data['cooling_power'] < 70:
            score -= (70 - sensor_data['cooling_power']) * 0.5
        
        # Prediction penalty
        if predictions and max(predictions) > self.thresholds['temp_max']:
            score -= 20
        
        return max(0, min(100, int(score)))
    
    def run(self):
        """Main loop"""
        print("\n" + "="*60)
        print("🚢 SHELFLIFE AI - EDGE ENGINE STARTED")
        print("   Running in OFFLINE mode")
        print("="*60 + "\n")
        
        while self.running:
            try:
                # 1. Read sensors
                sensor_data = self.read_sensors()
                
                # 2. Update histories
                self.update_histories(sensor_data)
                
                # 3. Get predictions (offline)
                predictions = self.predictor.predict(self.temp_history, hours_ahead=6)
                
                # 4. Detect anomalies
                anomalies = []
                temp_anomaly = self.anomaly_detector.detect_temperature_spike(
                    self.temp_history, sensor_data['temperature'])
                if temp_anomaly:
                    anomalies.append(temp_anomaly)
                
                vib_anomaly = self.anomaly_detector.detect_vibration_spike(
                    self.vibration_history, sensor_data['vibration'])
                if vib_anomaly:
                    anomalies.append(vib_anomaly)
                
                cooling_anomaly = self.anomaly_detector.detect_cooling_drop(
                    self.cooling_history, sensor_data['cooling_power'])
                if cooling_anomaly:
                    anomalies.append(cooling_anomaly)
                
                # 5. Generate alerts
                alerts = self.alert_generator.generate(sensor_data, predictions, anomalies)
                
                # 6. Store data locally
                self.storage.save_reading(sensor_data)
                for alert in alerts:
                    self.storage.save_alert(alert)
                
                # 7. Calculate health score
                health_score = self.calculate_health_score(sensor_data, predictions)
                
                # 8. Update display
                self.display.update(
                    self.container_id,
                    self.current_day,
                    self.current_hour,
                    health_score,
                    sensor_data['temperature'],
                    alerts
                )
                
                # 9. Sync to cloud if possible
                if self.sync_manager.check_connectivity():
                    unsynced_readings = self.storage.get_unsynced_readings()
                    unsynced_alerts = self.storage.get_unsynced_alerts()
                    
                    if unsynced_readings or unsynced_alerts:
                        print(f"📡 Network available. Syncing...")
                        synced_readings = self.sync_manager.sync_readings(unsynced_readings)
                        synced_alerts = self.sync_manager.sync_alerts(unsynced_alerts)
                        
                        # Mark as synced
                        if synced_readings > 0:
                            ids = [r[0] for r in unsynced_readings[:synced_readings]]
                            self.storage.mark_readings_synced(ids)
                        if synced_alerts > 0:
                            ids = [a[0] for a in unsynced_alerts[:synced_alerts]]
                            self.storage.mark_alerts_synced(ids)
                        
                        pending = len(unsynced_readings) - synced_readings + len(unsynced_alerts) - synced_alerts
                        self.storage.update_sync_status(pending)
                
                # 10. Advance time
                self.current_hour += 1
                if self.current_hour >= 24:
                    self.current_hour = 0
                    self.current_day += 1
                
                # Check if journey ended
                if self.current_day >= self.journey_days:
                    print(f"\n✅ Journey completed! Container {self.container_id} has arrived.")
                    self.running = False
                    break
                
                # Wait 1 minute (simulate real-time)
                time.sleep(60)
                
            except KeyboardInterrupt:
                print("\n🛑 Edge AI stopped by user")
                self.running = False
            except Exception as e:
                print(f"❌ Error: {e}")
                time.sleep(60)
        
        self.storage.close()
        print("👋 Edge AI shutdown complete")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='ShelfLife AI Edge Engine')
    parser.add_argument('--container-id', required=True, help='Container ID')
    parser.add_argument('--product-type', default='mangoes',
                        choices=['mangoes', 'vaccines', 'seafood', 'electronics'],
                        help='Product type')
    parser.add_argument('--journey-days', type=int, default=30, help='Journey duration in days')
    args = parser.parse_args()
    
    edge = EdgeAI(args.container_id, args.product_type, args.journey_days)
    edge.run()
