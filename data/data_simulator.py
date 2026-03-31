"""
SHELFLIFE AI - Data Simulator
Generates realistic sensor data for container journeys
"""

import random
import csv
from datetime import datetime, timedelta
from typing import Dict, Generator

class ContainerSimulator:
    """
    Simulates sensor data for a container journey
    Generates realistic temperature, humidity, vibration patterns
    """
    
    def __init__(self, container_id: str, product_type: str, journey_days: int = 30):
        self.container_id = container_id
        self.product_type = product_type
        self.journey_days = journey_days
        self.current_hour = 0
        self.cooling_degradation = 0
        self.has_failure = False
        self.failure_hour = None
        
        # Product-specific thresholds
        self.product_config = {
            'mangoes': {
                'temp_min': 10, 'temp_max': 15,
                'humidity_max': 90,
                'base_shelf_life': 15,
                'sensitivity': 0.08
            },
            'vaccines': {
                'temp_min': 2, 'temp_max': 8,
                'humidity_max': 60,
                'base_shelf_life': 30,
                'sensitivity': 0.12
            },
            'seafood': {
                'temp_min': -2, 'temp_max': 0,
                'humidity_max': 95,
                'base_shelf_life': 7,
                'sensitivity': 0.10
            },
            'electronics': {
                'temp_min': -20, 'temp_max': 60,
                'humidity_max': 80,
                'base_shelf_life': 365,
                'sensitivity': 0.01
            }
        }
        
        self.config = self.product_config.get(
            product_type, 
            self.product_config['mangoes']
        )
        
        # Shipping route (Mumbai to London)
        self.route = [
            {'name': 'Mumbai', 'lat': 18.94, 'lng': 72.84, 'hour': 0},
            {'name': 'Arabian Sea', 'lat': 15.0, 'lng': 70.0, 'hour': 120},
            {'name': 'Gulf of Aden', 'lat': 12.0, 'lng': 48.0, 'hour': 240},
            {'name': 'Red Sea', 'lat': 20.0, 'lng': 38.0, 'hour': 360},
            {'name': 'Suez Canal', 'lat': 30.0, 'lng': 32.5, 'hour': 480},
            {'name': 'Mediterranean', 'lat': 35.0, 'lng': 25.0, 'hour': 600},
            {'name': 'Gibraltar', 'lat': 36.0, 'lng': -5.0, 'hour': 720},
            {'name': 'London', 'lat': 51.51, 'lng': -0.13, 'hour': 840}
        ]
    
    def generate_temperature(self) -> float:
        """Generate realistic temperature with failure patterns"""
        
        optimal_temp = (self.config['temp_min'] + self.config['temp_max']) / 2
        
        # Diurnal variation (day/night cycle)
        hour_of_day = self.current_hour % 24
        diurnal = 2 * (hour_of_day / 12 - 1) if hour_of_day < 12 else 2 * (1 - (hour_of_day - 12) / 12)
        diurnal = diurnal * 2  # Range -2 to +2
        
        # Cooling degradation after day 10 (240 hours)
        if self.current_hour > 240:
            degradation_rate = (self.current_hour - 240) / 240
            self.cooling_degradation = degradation_rate * 5
            
            # Random failure between days 18-22
            if not self.has_failure and 432 <= self.current_hour <= 528:
                if random.random() < 0.01:
                    self.has_failure = True
                    self.failure_hour = self.current_hour
        else:
            self.cooling_degradation = 0
        
        # Simulate failure event
        if self.has_failure:
            hours_since_failure = self.current_hour - self.failure_hour
            failure_impact = min(15, hours_since_failure * 0.5)
            temperature = optimal_temp + diurnal + self.cooling_degradation + failure_impact
        else:
            temperature = optimal_temp + diurnal + self.cooling_degradation
        
        # Add random noise
        temperature += random.uniform(-0.5, 0.5)
        
        return round(temperature, 1)
    
    def generate_humidity(self, temperature: float) -> float:
        """Humidity correlates with temperature"""
        base_humidity = 75
        temp_factor = (temperature - self.config['temp_min']) * 2
        humidity = base_humidity + temp_factor + random.uniform(-5, 5)
        return min(100, max(0, round(humidity, 1)))
    
    def generate_vibration(self) -> float:
        """Simulate rough seas and handling events"""
        vibration = random.uniform(0.05, 0.2)
        
        # Storm simulation
        if random.random() < 0.05:
            vibration += random.uniform(0.5, 1.5)
        
        # Port handling
        if self.current_hour % 120 < 6:
            vibration += random.uniform(0.3, 0.8)
        
        return round(vibration, 2)
    
    def get_cooling_power(self) -> int:
        """Calculate cooling system efficiency"""
        base_power = 100
        degradation_loss = self.cooling_degradation * 10
        power = max(0, base_power - degradation_loss)
        power += random.uniform(-5, 5)
        return max(0, min(100, int(power)))
    
    def get_location(self) -> Dict:
        """Get current location based on journey progress"""
        progress_hours = self.current_hour
        total_hours = self.journey_days * 24
        
        for i in range(len(self.route) - 1):
            if progress_hours <= self.route[i+1]['hour']:
                segment_start = self.route[i]
                segment_end = self.route[i+1]
                
                ratio = (progress_hours - segment_start['hour']) / (segment_end['hour'] - segment_start['hour'])
                lat = segment_start['lat'] + ratio * (segment_end['lat'] - segment_start['lat'])
                lng = segment_start['lng'] + ratio * (segment_end['lng'] - segment_start['lng'])
                return {'lat': round(lat, 2), 'lng': round(lng, 2), 'location': segment_end['name']}
        
        return {'lat': self.route[-1]['lat'], 'lng': self.route[-1]['lng'], 'location': self.route[-1]['name']}
    
    def get_door_status(self) -> bool:
        """Simulate door opening events"""
        if random.random() < 0.02:
            return True
        if self.current_hour % 120 < 6:
            return random.random() < 0.1
        return False
    
    def get_sensor_data(self) -> Dict:
        """Generate complete sensor reading"""
        temperature = self.generate_temperature()
        location = self.get_location()
        
        return {
            'container_id': self.container_id,
            'timestamp': (datetime.now() + timedelta(hours=self.current_hour)).isoformat(),
            'product_type': self.product_type,
            'temperature': temperature,
            'humidity': self.generate_humidity(temperature),
            'vibration': self.generate_vibration(),
            'cooling_power': self.get_cooling_power(),
            'door_open': self.get_door_status(),
            'days_in_transit': round(self.current_hour / 24, 1),
            'latitude': location['lat'],
            'longitude': location['lng'],
            'location_name': location['location']
        }
    
    def stream(self) -> Generator:
        """Stream data hour by hour"""
        total_hours = self.journey_days * 24
        
        for hour in range(total_hours):
            self.current_hour = hour
            yield self.get_sensor_data()


def generate_training_dataset():
    """Generate training data for ML models"""
    
    print("Generating training dataset...")
    
    with open('training_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'container_id', 'timestamp', 'product_type', 
            'temperature', 'humidity', 'vibration', 
            'cooling_power', 'door_open', 'days_in_transit',
            'latitude', 'longitude', 'failure'
        ])
        
        # Generate 100 journeys
        for i in range(100):
            product = random.choice(['mangoes', 'vaccines', 'seafood', 'electronics'])
            sim = ContainerSimulator(f'CONT{i:03d}', product, 30)
            
            for data in sim.stream():
                max_temp = sim.config['temp_max']
                failure = 1 if data['temperature'] > max_temp else 0
                
                writer.writerow([
                    data['container_id'],
                    data['timestamp'],
                    data['product_type'],
                    data['temperature'],
                    data['humidity'],
                    data['vibration'],
                    data['cooling_power'],
                    1 if data['door_open'] else 0,
                    data['days_in_transit'],
                    data['latitude'],
                    data['longitude'],
                    failure
                ])
            
            if i % 20 == 0:
                print(f"  Generated {i+1} journeys...")
    
    print(f"\n✅ Training dataset generated: training_data.csv")
    print(f"   Total rows: 100 × 30 × 24 = 72,000 rows")


if __name__ == "__main__":
    generate_training_dataset()
