"""
SHELFLIFE AI - Alert Service
"""

import logging
from datetime import datetime
from typing import Dict, List
import os
from .notification_service import notification_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertService:
    SEVERITY_CRITICAL = "CRITICAL"
    SEVERITY_PREDICTIVE_CRITICAL = "PREDICTIVE_CRITICAL"
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
            # Parse from .env, fallback to default mock addresses if empty
            env_emails = os.getenv("ALERT_EMAILS", "captain@ship.com,port_control@dpworld.com")
            env_phones = os.getenv("ALERT_PHONES", "")
            
            emails_list = [e.strip() for e in env_emails.split(",") if e.strip()]
            phones_list = [p.strip() for p in env_phones.split(",") if p.strip()]

            recipients = {
                'email': emails_list,
                'sms': phones_list,
                'whatsapp': phones_list
            }
            notification_service.send_critical_alert(alert_data, recipients)
            
        elif severity == self.SEVERITY_WARNING:
            env_emails = os.getenv("ALERT_EMAILS_WARNING", os.getenv("ALERT_EMAILS", "captain@ship.com"))
            env_phones = os.getenv("ALERT_PHONES_WARNING", os.getenv("ALERT_PHONES", ""))
            
            emails_list = [e.strip() for e in env_emails.split(",") if e.strip()]
            phones_list = [p.strip() for p in env_phones.split(",") if p.strip()]

            recipients = {
                'email': emails_list,
                'sms': phones_list,
                'whatsapp': phones_list
            }
            notification_service.send_warning_alert(alert_data, recipients)
            
        elif severity == self.SEVERITY_PREDICTIVE_CRITICAL:
            env_emails = os.getenv("ALERT_EMAILS", "captain@ship.com,port_control@dpworld.com")
            env_phones = os.getenv("ALERT_PHONES", "")
            
            emails_list = [e.strip() for e in env_emails.split(",") if e.strip()]
            phones_list = [p.strip() for p in env_phones.split(",") if p.strip()]

            recipients = {
                'email': emails_list,
                'sms': phones_list,
                'whatsapp': phones_list
            }
            notification_service.send_critical_alert(alert_data, recipients)
        
        logger.info(f"Alert: {severity} - {alert_type} for {container_id}")
        return alert_data

alert_service = AlertService() 
