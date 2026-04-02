"""
SHELFLIFE AI - Alert Service
"""

import logging
from datetime import datetime
from typing import Dict, List
from .notification_service import notification_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertService:
    SEVERITY_CRITICAL = "CRITICAL"
    SEVERITY_HIGH = "HIGH"
    SEVERITY_WARNING = "WARNING"
    SEVERITY_INFO = "INFO"
    
    def __init__(self):
        self.alert_history = []
    
    def create_alert(self, shipment_id: int, container_id: str, 
                     alert_type: str, severity: str, 
                     message: str, action: str = None) -> Dict:
        alert_data = {
            'shipment_id': shipment_id,
            'container_id': container_id,
            'alert_type': alert_type,
            'severity': severity,
            'message': message,
            'action': action,
            'timestamp': datetime.now().isoformat(),
            'resolved': False
        }
        self.alert_history.append(alert_data)
        
        if severity == self.SEVERITY_CRITICAL:
            recipients = {
                'email': ['captain@ship.com', 'port_control@dpworld.com'],
                'sms': [],  # Add phone numbers for demo
                'whatsapp': []
            }
            notification_service.send_critical_alert(alert_data, recipients)
        
        logger.info(f"Alert: {severity} - {alert_type} for {container_id}")
        return alert_data

alert_service = AlertService() 
