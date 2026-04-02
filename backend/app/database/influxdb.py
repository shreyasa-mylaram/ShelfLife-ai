"""
SHELFLIFE AI - InfluxDB Manager
"""

import logging
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from app.core.config import settings

logger = logging.getLogger(__name__)

class InfluxDBManager:
    """Manages InfluxDB connections for time-series data"""
    
    def __init__(self):
        self.client = None
        self.write_api = None
        self.query_api = None
        self.connect()
    
    def connect(self):
        """Create InfluxDB connection"""
        try:
            self.client = InfluxDBClient(
                url=settings.INFLUXDB_URL,
                token=settings.INFLUXDB_TOKEN,
                org=settings.INFLUXDB_ORG
            )
            self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
            self.query_api = self.client.query_api()
            logger.info("InfluxDB connected successfully")
        except Exception as e:
            logger.error(f"InfluxDB connection failed: {e}")
            raise
    
    def write_sensor_data(self, shipment_id: int, data: dict):
        """Write sensor reading to InfluxDB"""
        try:
            point = Point("sensor_readings") \
                .tag("shipment_id", str(shipment_id)) \
                .field("temperature", data.get("temperature")) \
                .field("humidity", data.get("humidity")) \
                .field("vibration", data.get("vibration", 0)) \
                .field("cooling_power", data.get("cooling_power", 100)) \
                .field("door_open", data.get("door_open", False)) \
                .field("latitude", data.get("latitude", 0)) \
                .field("longitude", data.get("longitude", 0)) \
                .time(data.get("timestamp"))
            
            self.write_api.write(bucket=settings.INFLUXDB_BUCKET, record=point)
            return True
        except Exception as e:
            logger.error(f"Failed to write sensor data: {e}")
            return False
    
    def close(self):
        """Close InfluxDB connection"""
        if self.client:
            self.client.close()
            logger.info("InfluxDB disconnected")

influxdb_manager = InfluxDBManager()
