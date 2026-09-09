#!/usr/bin/env python3
"""
SHELFLIFE AI - Multi-Container Sensor Telemetry Simulator
Simulates realistic IoT sensor telemetry for shipping containers and streams
readings to the ShelfLife AI backend API (/api/sensors/{container_id}).

Features:
- Realistic oscillating temperatures per cargo profile (pharma, produce, seafood, etc.)
- Humidity, vibration, cooling power, door status, and transit progress simulation
- Configurable interval (default: 5 seconds)
- Supports single-shot (--once), fixed cycles (--cycles N), or infinite loop
"""

import sys
import os
import time
import math
import random
import argparse
import logging
from datetime import datetime, timezone

try:
    import httpx
except ImportError:
    import requests as httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("sensor_simulator")

# Simulated container profiles with target ranges and baseline attributes
CONTAINER_PROFILES = {
    "CONT-001": {
        "name": "General Reefer - Fresh Produce",
        "product_type": "fresh_produce",
        "base_temp": 3.6,
        "amplitude": 1.2,
        "period": 30,       # cycles
        "humidity_base": 85.0,
        "vibration_base": 0.08,
        "lat": 25.2048,
        "lon": 55.2708,
    },
    "DPW-1024A": {
        "name": "DP World Reefer 1024A - Pharmaceuticals",
        "product_type": "pharmaceuticals",
        "base_temp": 3.0,
        "amplitude": 0.8,
        "period": 24,
        "humidity_base": 65.0,
        "vibration_base": 0.05,
        "lat": 24.4539,
        "lon": 54.3773,
    },
    "DPW-1024B": {
        "name": "DP World Reefer 1024B - Fresh Produce",
        "product_type": "fresh_produce",
        "base_temp": 3.8,
        "amplitude": 1.4,
        "period": 20,
        "humidity_base": 82.0,
        "vibration_base": 0.09,
        "lat": 26.2285,
        "lon": 50.5860,
    },
    "DPW-1024C": {
        "name": "DP World Reefer 1024C - Seafood",
        "product_type": "seafood",
        "base_temp": 1.5,
        "amplitude": 1.1,
        "period": 28,
        "humidity_base": 90.0,
        "vibration_base": 0.12,
        "lat": 25.0754,
        "lon": 55.1713,
    },
    "DPW-1024D": {
        "name": "DP World Reefer 1024D - Vaccines",
        "product_type": "vaccines",
        "base_temp": 2.2,
        "amplitude": 0.6,
        "period": 36,
        "humidity_base": 60.0,
        "vibration_base": 0.04,
        "lat": 25.3573,
        "lon": 55.4033,
    },
}


class SensorSimulator:
    """Generates telemetry and dispatches to the ShelfLife AI API."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self.step_count = 0

    def generate_reading(self, container_id: str, profile: dict) -> dict:
        """Calculate dynamic, realistic sensor telemetry for a container."""
        step = self.step_count
        period = profile["period"]
        phase = (step % period) / period * (2 * math.pi)

        # Sinusoidal thermal drift with gaussian noise
        temp_oscillation = profile["amplitude"] * math.sin(phase)
        noise = random.gauss(0, 0.15)
        temperature = round(profile["base_temp"] + temp_oscillation + noise, 2)

        # Humidity correlated with temperature fluctuations
        humidity_noise = random.gauss(0, 1.2)
        humidity = round(max(30.0, min(99.0, profile["humidity_base"] - temp_oscillation * 1.5 + humidity_noise)), 1)

        # Vibration with occasional mechanical bumps
        vib_bump = random.choice([0.0, 0.0, 0.0, 0.25]) if random.random() < 0.1 else 0.0
        vibration = round(profile["vibration_base"] + abs(random.gauss(0, 0.02)) + vib_bump, 3)

        # Cooling power responds inversely if temperature rises
        cooling_power = int(max(60, min(100, 100 - max(0.0, temperature - 4.0) * 10 + random.randint(-2, 2))))

        # Cargo door status: open rarely (<2% of cycles)
        door_open = random.random() < 0.02

        # Small geographic drift along sea route
        lat = round(profile["lat"] + (step * 0.002), 4)
        lon = round(profile["lon"] + (step * 0.003), 4)
        days_in_transit = round(2.0 + (step * (5.0 / 86400.0)), 2)

        now_iso = datetime.now(timezone.utc).isoformat()

        return {
            "timestamp": now_iso,
            "temperature": temperature,
            "humidity": humidity,
            "vibration": vibration,
            "cooling_power": cooling_power,
            "door_open": door_open,
            "latitude": lat,
            "longitude": lon,
            "days_in_transit": days_in_transit,
            "light_lux": round(random.choice([0.0, 10.0, 180.0, 220.0]) if profile.get("product_type") == "fresh_produce" else random.uniform(100, 300), 1),
        }

    def send_reading(self, container_id: str, payload: dict) -> bool:
        """Send a single reading payload to /api/sensors/{container_id}."""
        endpoint = f"{self.base_url}/api/sensors/{container_id}"
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.post(endpoint, json=payload)
                if resp.status_code in (200, 201):
                    logger.info(
                        f"[{container_id}] -> {payload['temperature']}°C, {payload['humidity']}%, "
                        f"vib: {payload['vibration']}g (HTTP {resp.status_code})"
                    )
                    return True
                else:
                    logger.warning(
                        f"[{container_id}] Failed: HTTP {resp.status_code} - {resp.text[:100]}"
                    )
                    return False
        except Exception as exc:
            logger.error(f"[{container_id}] Connection error: {exc}")
            return False

    def run_cycle(self) -> dict:
        """Simulate one reading for all configured containers."""
        results = {}
        for cid, profile in CONTAINER_PROFILES.items():
            payload = self.generate_reading(cid, profile)
            success = self.send_reading(cid, payload)
            results[cid] = {"reading": payload, "success": success}
        self.step_count += 1
        return results

    def run_loop(self, interval: float = 5.0, max_cycles: int = None):
        """Continuous simulation loop."""
        logger.info(f"Starting Sensor Simulator against {self.base_url} (Interval: {interval}s)")
        logger.info(f"Simulating {len(CONTAINER_PROFILES)} containers: {list(CONTAINER_PROFILES.keys())}")
        cycle = 0
        try:
            while True:
                cycle += 1
                logger.info(f"--- Cycle #{cycle} ---")
                self.run_cycle()

                if max_cycles and cycle >= max_cycles:
                    logger.info(f"Reached requested {max_cycles} cycles. Exiting.")
                    break

                time.sleep(interval)
        except KeyboardInterrupt:
            logger.info("Simulator stopped by user (Ctrl+C).")


def main():
    parser = argparse.ArgumentParser(description="ShelfLife AI - Sensor Simulator")
    parser.add_argument("--url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--interval", type=float, default=5.0, help="Interval in seconds (default: 5.0)")
    parser.add_argument("--cycles", type=int, default=None, help="Stop after N cycles (default: run forever)")
    parser.add_argument("--once", action="store_true", help="Run exactly one cycle and exit")
    args = parser.parse_args()

    simulator = SensorSimulator(base_url=args.url)

    if args.once:
        logger.info("Running single telemetry cycle...")
        results = simulator.run_cycle()
        all_ok = all(v["success"] for v in results.values())
        print(f"\nSingle cycle completed. All containers successful: {all_ok}")
        sys.exit(0 if all_ok else 1)
    else:
        simulator.run_loop(interval=args.interval, max_cycles=args.cycles)


if __name__ == "__main__":
    main()
