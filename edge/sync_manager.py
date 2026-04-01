"""
SHELFLIFE AI - Sync Manager
Handles uploading data to cloud when network available
"""

import requests
import time
from typing import List, Dict
from datetime import datetime

class SyncManager:
    """Manages syncing local data to cloud"""
    
    def __init__(self, container_id: str, cloud_base_url: str = "http://backend:8000"):
        self.container_id = container_id
        self.cloud_url = f"{cloud_base_url}/api/offline/sync"
        self.last_sync = None
        self.is_online = False
    
    def check_connectivity(self) -> bool:
        """Check if network is available"""
        try:
            import socket
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            self.is_online = True
            return True
        except:
            self.is_online = False
            return False
    
    def sync_readings(self, readings: List) -> int:
        """Sync sensor readings; returns number successfully synced"""
        if not readings:
            return 0
        
        success_count = 0
        for reading in readings:
            try:
                response = requests.post(self.cloud_url, json={
                    'container_id': self.container_id,
                    'type': 'sensor_data',
                    'data': {
                        'timestamp': reading[1],
                        'temperature': reading[2],
                        'humidity': reading[3],
                        'vibration': reading[4],
                        'cooling_power': reading[5],
                        'door_open': reading[6],
                        'days_in_transit': reading[7]
                    }
                }, timeout=5)
                
                if response.status_code == 200:
                    success_count += 1
            except:
                pass
        return success_count
    
    def sync_alerts(self, alerts: List) -> int:
        """Sync alerts; returns number successfully synced"""
        if not alerts:
            return 0
        
        success_count = 0
        for alert in alerts:
            try:
                response = requests.post(self.cloud_url, json={
                    'container_id': self.container_id,
                    'type': 'alert',
                    'data': {
                        'timestamp': alert[1],
                        'alert_type': alert[2],
                        'severity': alert[3],
                        'message': alert[4],
                        'action': alert[5]
                    }
                }, timeout=5)
                
                if response.status_code == 200:
                    success_count += 1
            except:
                pass
        return success_count
