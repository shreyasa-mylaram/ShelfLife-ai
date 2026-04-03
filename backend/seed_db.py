"""
SHELFLIFE AI - Database Seeder
Run this once after a fresh deployment to populate the DB with initial realistic container data.
Usage: python seed_db.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import random
from app.core.database import SessionLocal, engine, Base
from app.models.shipment import Shipment
from app.models.sensor import SensorReading

Base.metadata.create_all(bind=engine)

CONTAINERS = [
    {"container_id": "DPW-1024A", "product_type": "pharmaceuticals", "journey_days": 15},
    {"container_id": "DPW-1024B", "product_type": "fresh_produce",   "journey_days": 8},
    {"container_id": "DPW-1024C", "product_type": "seafood",         "journey_days": 6},
    {"container_id": "DPW-1024D", "product_type": "vaccines",        "journey_days": 20},
    {"container_id": "DPW-1024E", "product_type": "dairy",           "journey_days": 5},
]

PRODUCT_TEMPS = {
    "pharmaceuticals": (2.0, 4.0),
    "fresh_produce":   (2.0, 5.0),
    "seafood":         (0.0, 3.0),
    "vaccines":        (1.0, 3.0),
    "dairy":           (1.0, 4.0),
}

def seed():
    db = SessionLocal()
    try:
        existing = db.query(Shipment).count()
        if existing > 0:
            print(f"Database already has {existing} shipment(s). Skipping seed.")
            return

        print("Seeding database with initial container data...")
        now = datetime.utcnow()

        for c in CONTAINERS:
            shipment = Shipment(
                container_id=c["container_id"],
                product_type=c["product_type"],
                journey_days=c["journey_days"],
                status="active"
            )
            db.add(shipment)
            db.flush()  # get the generated ID

            # Seed 48 hours of sensor readings (one every 30 mins)
            temp_min, temp_max = PRODUCT_TEMPS[c["product_type"]]
            base_temp = random.uniform(temp_min, temp_max - 0.5)

            for i in range(96):  # 96 x 30min = 48 hours
                ts = now - timedelta(minutes=30 * (96 - i))
                drift = random.uniform(-0.3, 0.3)
                temp = round(max(temp_min, min(temp_max + 1.5, base_temp + drift)), 2)
                base_temp = temp

                reading = SensorReading(
                    shipment_id=shipment.id,
                    timestamp=ts,
                    temperature=temp,
                    humidity=round(random.uniform(40, 75), 1),
                    vibration=round(random.uniform(0.0, 0.5), 3),
                    cooling_power=round(random.uniform(75, 100), 1),
                    door_open=random.random() < 0.02,
                    latitude=round(random.uniform(10.0, 25.0), 5),
                    longitude=round(random.uniform(60.0, 90.0), 5),
                    days_in_transit=round(i * 0.5 / 24, 2)
                )
                db.add(reading)

            print(f"  ✓ Seeded {c['container_id']} ({c['product_type']})")

        db.commit()
        print("\n✅ Database seeded successfully! 5 containers, 96 readings each.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
