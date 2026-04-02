"""
SHELFLIFE AI - Local Storage Manager
Handles SQLite database operations for offline storage
"""

import sqlite3
from typing import Dict, List, Optional
from datetime import datetime

class LocalStorage:
    """Manages SQLite database for offline storage"""
    
    def __init__(self, container_id: str):
        self.container_id = container_id
        self.db_path = f"container_{container_id}.db"
        self.conn = None
        self.init_database()
    
    def init_database(self):
        """Create tables if they don't exist"""
        self.conn = sqlite3.connect(self.db_path)
        cursor = self.conn.cursor()
        
        # Sensor readings
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                temperature REAL,
                humidity REAL,
                vibration REAL,
                cooling_power REAL,
                door_open INTEGER,
                days_in_transit REAL,
                synced INTEGER DEFAULT 0
            )
        ''')
        
        # Alerts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                alert_type TEXT,
                severity TEXT,
                message TEXT,
                action TEXT,
                resolved INTEGER DEFAULT 0,
                synced INTEGER DEFAULT 0
            )
        ''')
        
        # Sync status
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sync_status (
                id INTEGER PRIMARY KEY,
                last_sync TEXT,
                pending_count INTEGER
            )
        ''')
        
        self.conn.commit()
    
    def save_reading(self, sensor_data: Dict):
        """Save a sensor reading"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO sensor_readings 
            (timestamp, temperature, humidity, vibration, cooling_power, door_open, days_in_transit, synced)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            sensor_data['timestamp'],
            sensor_data['temperature'],
            sensor_data['humidity'],
            sensor_data['vibration'],
            sensor_data['cooling_power'],
            1 if sensor_data.get('door_open') else 0,
            sensor_data['days_in_transit'],
            0
        ))
        self.conn.commit()
    
    def save_alert(self, alert: Dict):
        """Save an alert"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO alerts (timestamp, alert_type, severity, message, action, resolved, synced)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            alert['type'],
            alert['severity'],
            alert['message'],
            alert['action'],
            0,
            0
        ))
        self.conn.commit()
    
    def get_unsynced_readings(self) -> List:
        """Get all readings not yet synced"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM sensor_readings WHERE synced = 0')
        return cursor.fetchall()
    
    def get_unsynced_alerts(self) -> List:
        """Get all alerts not yet synced"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM alerts WHERE synced = 0')
        return cursor.fetchall()
    
    def mark_readings_synced(self, ids: List[int]):
        """Mark readings as synced"""
        if not ids:
            return
        cursor = self.conn.cursor()
        cursor.execute(f'UPDATE sensor_readings SET synced = 1 WHERE id IN ({",".join("?" * len(ids))})', ids)
        self.conn.commit()
    
    def mark_alerts_synced(self, ids: List[int]):
        """Mark alerts as synced"""
        if not ids:
            return
        cursor = self.conn.cursor()
        cursor.execute(f'UPDATE alerts SET synced = 1 WHERE id IN ({",".join("?" * len(ids))})', ids)
        self.conn.commit()
    
    def update_sync_status(self, pending_count: int):
        """Update the last sync time and pending count"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO sync_status (id, last_sync, pending_count)
            VALUES (1, ?, ?)
        ''', (datetime.now().isoformat(), pending_count))
        self.conn.commit()
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
