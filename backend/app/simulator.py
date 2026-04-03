import asyncio
import random
import math
import httpx
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

# Per-container simulation state persisted across cycles
# Each container has its own sinusoidal wave pattern + random noise
# so temperatures organically rise, fall, and occasionally breach thresholds
CONTAINER_PROFILES = {
    "DPW-1024A": {
        "base": 2.2,      # Lowered base
        "amplitude": 1.2, # Lowered amplitude
        "period": 120,
        "phase": 0,
        "noise": 0.2,
    },
    "DPW-1024B": {
        "base": 3.0,      # Lowered base
        "amplitude": 1.4,
        "period": 100,
        "phase": 20,
        "noise": 0.2,
    },
    "DPW-1024C": {
        "base": 1.8,      # Lowered base
        "amplitude": 1.0,
        "period": 150,
        "phase": 40,
        "noise": 0.2,
    },
    "DPW-1024D": {
        "base": 1.2,
        "amplitude": 0.8,
        "period": 180,
        "phase": 10,
        "noise": 0.15,
    },
    "DPW-1024E": {
        "base": 2.5,
        "amplitude": 1.0,
        "period": 130,
        "phase": 55,
        "noise": 0.2,
    },
}

# Track the current tick (step count) for each container
ticks = {k: v["phase"] for k, v in CONTAINER_PROFILES.items()}


def compute_temp(container: str) -> float:
    """
    Return the next simulated temperature reading using a sine wave with noise.
    This ensures temperatures are realistic, oscillating, and will naturally cross thresholds.
    """
    profile = CONTAINER_PROFILES[container]
    t = ticks[container]
    ticks[container] += 1  # advance the tick

    # Sine wave: base ± amplitude · sin(2π·t / period)
    sine_val = profile["amplitude"] * math.sin(2 * math.pi * t / profile["period"])
    noise = random.gauss(0, profile["noise"])
    temp = profile["base"] + sine_val + noise

    # Hard clamp: no container should go below -1°C or above 9°C in simulation
    temp = max(-1.0, min(9.0, temp))
    return round(temp, 2)


async def run_live_simulation():
    """
    Runs in the background of the FastAPI app.
    Each container follows a realistic sinusoidal temperature wave with Gaussian noise.
    Temperatures will naturally drift across thresholds, triggering live alerts via
    the sensor ingestion API which handles Twilio SMS + SMTP email notifications.
    """
    logger.info("Live Simulator Background Task Started — Sinusoidal Wave Mode")

    # Wait for the app and database to fully boot up on the platform
    logger.info("Simulator waiting 15s for API boot...")
    await asyncio.sleep(15)

    # Detect the correct local environment
    PORT = os.environ.get("PORT", "8000")
    LOCAL_URL = f"http://127.0.0.1:{PORT}"
    
    containers = list(CONTAINER_PROFILES.keys())

    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            for container in containers:
                try:
                    new_temp = compute_temp(container)

                    payload = {
                        "timestamp": datetime.now().isoformat(),
                        "temperature": new_temp,
                        "humidity": round(random.uniform(38, 80), 1),
                        "vibration": round(random.uniform(0.05, 1.5), 2),
                        "cooling_power": int(random.uniform(45, 100)),
                        "days_in_transit": round(random.uniform(1.0, 20.0), 1)
                    }

                    response = await client.post(
                        f"{LOCAL_URL}/api/sensors/{container}",
                        json=payload
                    )
                    if response.status_code not in (200, 201):
                        logger.error(
                            f"Simulator POST failed for {container}: "
                            f"{response.status_code} — {response.text[:200]}"
                        )
                    else:
                        logger.debug(f"Simulator → {container}: {new_temp}°C ✓")

                except Exception as e:
                    logger.warning(f"Simulator error for {container}: {e}")

            # 8-second heartbeat
            await asyncio.sleep(8)
