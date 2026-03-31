"""
SHELFLIFE AI - Data Simulator (Final)
Generates realistic sensor data with explicit failure scenarios and ML‑ready features.
"""

import random
import csv
import math
from datetime import datetime, timedelta
from typing import Dict, Generator, Optional

# Set seed for reproducibility
random.seed(42)

class ContainerSimulator:
    """
    Simulates a container journey with configurable failure scenario.
    Generates temperature, humidity, vibration, door status, location,
    and derived features like shelf‑life remaining, health score, etc.
    """
    
    def __init__(self, container_id: str, product_type: str, journey_days: int = 30,
                 scenario: str = "normal", start_date: Optional[datetime] = None):
        """
        Args:
            container_id: Unique container identifier
            product_type: mangoes, vaccines, seafood, electronics
            journey_days: Duration of journey in days
            scenario: "normal", "cooling_failure", "door_open_long", "storm"
            start_date: Fixed start date (default: 2024-01-01)
        """
        self.container_id = container_id
        self.product_type = product_type
        self.journey_days = journey_days
        self.scenario = scenario
        self.current_hour = 0
        self.start_date = start_date or datetime(2024, 1, 1)
        
        # Product‑specific thresholds and parameters
        self.product_config = {
            'mangoes': {
                'temp_min': 10, 'temp_max': 15,
                'optimal_temp': 12.5,
                'humidity_max': 90,
                'base_shelf_life_days': 15,
                'sensitivity': 0.08
            },
            'vaccines': {
                'temp_min': 2, 'temp_max': 8,
                'optimal_temp': 5,
                'humidity_max': 60,
                'base_shelf_life_days': 30,
                'sensitivity': 0.12
            },
            'seafood': {
                'temp_min': -2, 'temp_max': 0,
                'optimal_temp': -1,
                'humidity_max': 95,
                'base_shelf_life_days': 7,
                'sensitivity': 0.10
            },
            'electronics': {
                'temp_min': -20, 'temp_max': 60,
                'optimal_temp': 20,
                'humidity_max': 80,
                'base_shelf_life_days': 365,
                'sensitivity': 0.01
            }
        }
        self.config = self.product_config.get(product_type, self.product_config['mangoes'])
        
        # State variables
        self.cooling_degradation = 0.0          # 0..100, percentage of cooling loss
        self.has_failure = False
        self.failure_hour = None
        self.cumulative_abuse = 0.0             # degree‑hours above or below threshold
        self.shelf_life_remaining = self.config['base_shelf_life_days']
        
        # Route waypoints (Mumbai → London)
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
        
        # Scenario‑specific setup
        if scenario == "cooling_failure":
            # Cooling failure starts between day 18 and 22 (432‑528 hours)
            self.failure_trigger_hour = random.randint(432, 528)
        elif scenario == "door_open_long":
            # Door open at random port stops for a longer duration
            # Choose a port waypoint (index 1..len-1, excluding start/end)
            port_indices = [2, 3, 4, 5, 6]  # intermediate ports
            self.door_open_waypoint = random.choice([self.route[i] for i in port_indices])
            self.door_open_duration_hours = random.randint(4, 12)  # open for 4‑12 hours
            self.door_open_start_hour = None
        elif scenario == "storm":
            # Storm in Arabian Sea (hours 120‑240)
            self.storm_start = 120
            self.storm_end = 240
    
    def _diurnal_cycle(self, hour: int) -> float:
        """Sine wave diurnal variation, range -2 to +2"""
        return 2 * math.sin(2 * math.pi * (hour - 6) / 24)
    
    def generate_temperature(self) -> float:
        """Temperature with realistic patterns and scenario effects"""
        opt = self.config['optimal_temp']
        
        # Base: optimal + diurnal
        temp = opt + self._diurnal_cycle(self.current_hour % 24)
        
        # Cooling degradation (normal wear)
        if self.current_hour > 240:
            degradation_factor = (self.current_hour - 240) / 240  # 0..1 over remaining journey
            self.cooling_degradation = min(100, degradation_factor * 30)  # up to 30% loss
            temp += degradation_factor * 2   # slight warming due to less cooling
        else:
            self.cooling_degradation = 0
        
        # Scenario effects
        if self.scenario == "cooling_failure":
            if not self.has_failure and self.current_hour >= self.failure_trigger_hour:
                self.has_failure = True
                self.failure_hour = self.current_hour
            if self.has_failure:
                hours_since = self.current_hour - self.failure_hour
                # Rapid warming: +5°C in first hour, then +1°C per hour
                failure_impact = min(15, 5 + hours_since * 0.8)
                temp += failure_impact
        elif self.scenario == "door_open_long":
            # Check if we are at the chosen waypoint and within its hour range
            if self.door_open_waypoint is not None:
                wp_hour = self.door_open_waypoint['hour']
                if self.current_hour == wp_hour:
                    # Door opens at the start of the waypoint hour
                    self.door_open_start_hour = self.current_hour
                if (self.door_open_start_hour is not None and
                    self.current_hour >= self.door_open_start_hour and
                    self.current_hour < self.door_open_start_hour + self.door_open_duration_hours):
                    # Door open: immediate strong temperature rise
                    temp += random.uniform(5, 12)
        elif self.scenario == "storm":
            if self.storm_start <= self.current_hour <= self.storm_end:
                # Storm: occasional temperature spikes, otherwise slight drop
                if random.random() < 0.15:
                    temp += random.uniform(2, 5)
                else:
                    temp -= random.uniform(1, 3)
        
        # Add noise
        temp += random.uniform(-0.5, 0.5)
        
        # Clamp to realistic range
        return round(max(-30, min(60, temp)), 1)
    
    def generate_humidity(self, temperature: float) -> float:
        """Humidity correlated with temperature, with product max constraint"""
        # Inverse relationship: colder = higher humidity
        base = 80 - (temperature - self.config['optimal_temp']) * 1.5
        humidity = base + random.uniform(-10, 10)
        humidity = min(humidity, self.config['humidity_max'])
        return max(0, round(humidity, 1))
    
    def generate_vibration(self) -> float:
        """Simulate rough seas and handling events"""
        vibration = random.uniform(0.05, 0.2)
        
        if self.scenario == "storm":
            if self.storm_start <= self.current_hour <= self.storm_end:
                vibration += random.uniform(0.5, 2.0)
        
        # Port handling (first 6 hours of each waypoint)
        if any(abs(self.current_hour - wp['hour']) < 6 for wp in self.route):
            vibration += random.uniform(0.3, 0.8)
        
        return round(vibration, 2)
    
    def get_cooling_power(self) -> int:
        """Cooling power % (inverse of degradation)"""
        power = max(0, 100 - self.cooling_degradation)
        power += random.uniform(-5, 5)
        return max(0, min(100, int(power)))
    
    def get_door_status(self) -> bool:
        """Simulate door opening events"""
        # For door_open_long scenario, door is open during defined periods
        if self.scenario == "door_open_long" and self.door_open_start_hour is not None:
            if self.current_hour >= self.door_open_start_hour and \
               self.current_hour < self.door_open_start_hour + self.door_open_duration_hours:
                return True
        # Normal random opening (low probability)
        if random.random() < 0.02:
            return True
        # Port handling: higher probability
        if any(abs(self.current_hour - wp['hour']) < 6 for wp in self.route):
            return random.random() < 0.1
        return False
    
    def get_location(self) -> Dict:
        """Correctly interpolate lat/lng based on journey progress"""
        total_hours = self.journey_days * 24
        progress = self.current_hour / total_hours
        # Linear interpolation along the route segments
        n = len(self.route)
        # Find which segment we are in
        for i in range(n - 1):
            start = self.route[i]
            end = self.route[i + 1]
            if start['hour'] <= self.current_hour <= end['hour']:
                # Segment progress ratio
                if end['hour'] == start['hour']:
                    ratio = 0
                else:
                    ratio = (self.current_hour - start['hour']) / (end['hour'] - start['hour'])
                lat = start['lat'] + ratio * (end['lat'] - start['lat'])
                lng = start['lng'] + ratio * (end['lng'] - start['lng'])
                # Determine location name based on closest waypoint
                if ratio < 0.5:
                    location_name = start['name']
                else:
                    location_name = end['name']
                return {'lat': round(lat, 2), 'lng': round(lng, 2), 'location': location_name}
        # Fallback (should not happen)
        return {'lat': self.route[-1]['lat'], 'lng': self.route[-1]['lng'], 'location': self.route[-1]['name']}
    
    def update_shelf_life(self, temperature: float):
        """Decay shelf life based on temperature abuse, with threshold to avoid over-penalty"""
        opt = self.config['optimal_temp']
        sensitivity = self.config['sensitivity']
        
        # Only count abuse if deviation > 1°C from optimal (avoids tiny fluctuations)
        if abs(temperature - opt) > 1.0:
            deviation = abs(temperature - opt) - 1.0
            self.cumulative_abuse += deviation
        
        # Shelf life remaining = base - (abuse * sensitivity)
        remaining = self.config['base_shelf_life_days'] - (self.cumulative_abuse * sensitivity)
        self.shelf_life_remaining = max(0, remaining)
    
    def get_health_score(self) -> int:
        """Health score 0‑100 based on remaining shelf life"""
        if self.config['base_shelf_life_days'] == 0:
            return 100
        score = (self.shelf_life_remaining / self.config['base_shelf_life_days']) * 100
        return max(0, min(100, int(score)))
    
    def get_sensor_data(self) -> Dict:
        """Generate a complete sensor reading with derived features"""
        temp = self.generate_temperature()
        humidity = self.generate_humidity(temp)
        vibration = self.generate_vibration()
        cooling = self.get_cooling_power()
        door = self.get_door_status()
        location = self.get_location()
        
        # Update shelf‑life and cumulative abuse
        self.update_shelf_life(temp)
        health = self.get_health_score()
        
        # Determine failure type and time to failure
        failure = 0
        failure_type = ""
        time_to_failure = None
        
        # Immediate failures
        if temp > self.config['temp_max']:
            failure = 1
            failure_type = "temperature_high"
            time_to_failure = 0
        elif temp < self.config['temp_min']:
            failure = 1
            failure_type = "temperature_low"
            time_to_failure = 0
        elif door:
            failure = 1
            failure_type = "door_open"
            time_to_failure = 0
        elif vibration > 1.0:
            failure = 1
            failure_type = "storm_damage"
            time_to_failure = 0
        
        # Predictive cooling failure (before threshold is crossed)
        if self.scenario == "cooling_failure" and not failure:
            if self.has_failure:
                failure = 1
                failure_type = "temperature_high"
                time_to_failure = 0
            else:
                hours_until = max(0, self.failure_trigger_hour - self.current_hour)
                if hours_until <= 24:   # predict only when close
                    failure_type = "predicted_cooling_failure"
                    time_to_failure = hours_until
        
        return {
            'container_id': self.container_id,
            'timestamp': (self.start_date + timedelta(hours=self.current_hour)).isoformat(),
            'product_type': self.product_type,
            'temperature': temp,
            'humidity': humidity,
            'vibration': vibration,
            'cooling_power': cooling,
            'door_open': door,
            'days_in_transit': round(self.current_hour / 24, 1),
            'hours_elapsed': self.current_hour,
            'latitude': location['lat'],
            'longitude': location['lng'],
            'location_name': location['location'],
            'failure': failure,
            'failure_type': failure_type,
            'time_to_failure': time_to_failure,
            'shelf_life_remaining': round(self.shelf_life_remaining, 2),
            'health_score': health,
            'temp_deviation': round(temp - self.config['optimal_temp'], 2),
            'cumulative_temp_abuse': round(self.cumulative_abuse, 2),
            'cooling_degradation': round(self.cooling_degradation, 2)
        }
    
    def stream(self) -> Generator:
        """Generate data hour by hour"""
        total_hours = self.journey_days * 24
        for hour in range(total_hours):
            self.current_hour = hour
            yield self.get_sensor_data()


def generate_training_dataset(num_journeys: int = 100, scenario: Optional[str] = None):
    """
    Generate a CSV dataset for training.
    If scenario is provided, all journeys use that scenario; otherwise, mix.
    """
    scenarios = ["normal", "cooling_failure", "door_open_long", "storm"]
    product_types = ["mangoes", "vaccines", "seafood", "electronics"]
    
    print("Generating training dataset...")
    
    with open('training_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'container_id', 'timestamp', 'product_type', 'temperature', 'humidity',
            'vibration', 'cooling_power', 'door_open', 'days_in_transit', 'hours_elapsed',
            'latitude', 'longitude', 'location_name', 'failure', 'failure_type',
            'time_to_failure', 'shelf_life_remaining', 'health_score', 'temp_deviation',
            'cumulative_temp_abuse', 'cooling_degradation'
        ])
        
        for i in range(num_journeys):
            product = random.choice(product_types)
            if scenario:
                sim_scenario = scenario
            else:
                sim_scenario = random.choice(scenarios)
            
            sim = ContainerSimulator(
                container_id=f"CONT{i:04d}",
                product_type=product,
                journey_days=30,
                scenario=sim_scenario
            )
            
            for data in sim.stream():
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
                    data['hours_elapsed'],
                    data['latitude'],
                    data['longitude'],
                    data['location_name'],
                    data['failure'],
                    data['failure_type'],
                    data['time_to_failure'] if data['time_to_failure'] is not None else -1,
                    data['shelf_life_remaining'],
                    data['health_score'],
                    data['temp_deviation'],
                    data['cumulative_temp_abuse'],
                    data['cooling_degradation']
                ])
            
            if (i+1) % 20 == 0:
                print(f"  Generated {i+1} journeys...")
    
    print(f"\n✅ Dataset saved: training_data.csv")
    print(f"   {num_journeys} journeys × 30 days × 24 hours = {num_journeys * 30 * 24} rows")
    print("   Columns: 21 features including failure_type, shelf_life, health_score")


def generate_demo_journeys():
    """Generate one CSV file per scenario with a single journey for demonstration."""
    scenarios = ["normal", "cooling_failure", "door_open_long", "storm"]
    product_types = ["mangoes", "vaccines", "seafood", "electronics"]
    
    for scenario in scenarios:
        # Choose a product appropriate for the scenario (e.g., vaccines for cooling_failure)
        if scenario == "cooling_failure":
            product = "vaccines"
        elif scenario == "door_open_long":
            product = "seafood"
        elif scenario == "storm":
            product = "mangoes"
        else:
            product = random.choice(product_types)
        
        sim = ContainerSimulator(
            container_id=f"DEMO_{scenario.upper()}",
            product_type=product,
            journey_days=30,
            scenario=scenario
        )
        
        filename = f"demo_{scenario}.csv"
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'container_id', 'timestamp', 'product_type', 'temperature', 'humidity',
                'vibration', 'cooling_power', 'door_open', 'days_in_transit', 'hours_elapsed',
                'latitude', 'longitude', 'location_name', 'failure', 'failure_type',
                'time_to_failure', 'shelf_life_remaining', 'health_score', 'temp_deviation',
                'cumulative_temp_abuse', 'cooling_degradation'
            ])
            for data in sim.stream():
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
                    data['hours_elapsed'],
                    data['latitude'],
                    data['longitude'],
                    data['location_name'],
                    data['failure'],
                    data['failure_type'],
                    data['time_to_failure'] if data['time_to_failure'] is not None else -1,
                    data['shelf_life_remaining'],
                    data['health_score'],
                    data['temp_deviation'],
                    data['cumulative_temp_abuse'],
                    data['cooling_degradation']
                ])
        print(f"Generated {filename}")


if __name__ == "__main__":
    # Generate main training dataset (mixed scenarios)
    generate_training_dataset(100)
    
    # Generate separate demo files for each scenario
    generate_demo_journeys()
