"""
SHELFLIFE AI - Notification Service
Handles email, SMS, and WhatsApp alerts
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from typing import Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationService:
    """Handles all notifications (Email, SMS, WhatsApp)"""
    
    def __init__(self):
        # Load from environment variables
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "")
        
        # Twilio
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "+13613044298")
        
        # Mock mode
        self.mock_mode = os.getenv("MOCK_NOTIFICATIONS", "false").lower() == "true"
        
        # Initialize Twilio client if credentials exist
        self.twilio_client = None
        if self.twilio_sid and self.twilio_token and not self.mock_mode:
            try:
                self.twilio_client = Client(self.twilio_sid, self.twilio_token)
                logger.info("Twilio client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio: {e}")
    
    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email using Gmail SMTP"""
        if self.mock_mode:
            logger.info(f"[MOCK] Would send email to: {to_email}")
            return True
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def send_sms(self, to_phone: str, message: str) -> bool:
        """Send SMS using Twilio"""
        if self.mock_mode:
            logger.info(f"[MOCK] Would send SMS to: {to_phone}")
            return True
        
        if not self.twilio_client:
            logger.error("Twilio client not initialized")
            return False
        
        try:
            message = self.twilio_client.messages.create(
                body=message[:160],
                from_=self.twilio_phone,
                to=to_phone
            )
            logger.info(f"SMS sent to {to_phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False
    
    def send_whatsapp(self, to_phone: str, message: str) -> bool:
        """Send WhatsApp message using Twilio"""
        if self.mock_mode:
            logger.info(f"[MOCK] Would send WhatsApp to: {to_phone}")
            return True
        
        if not self.twilio_client:
            logger.error("Twilio client not initialized")
            return False
        
        try:
            from_whatsapp = f"whatsapp:{self.twilio_phone}"
            to_whatsapp = f"whatsapp:{to_phone}"
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=from_whatsapp,
                to=to_whatsapp
            )
            logger.info(f"WhatsApp sent to {to_phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send WhatsApp: {e}")
            return False
    
    def send_critical_alert(self, alert_data: Dict, recipients: Dict) -> Dict:
        """Send critical alerts via all channels"""
        subject = f"[CRITICAL] {alert_data['alert_type']} - Container {alert_data['container_id']}"
        body = f"""
SHELFLIFE AI - Critical Alert

Container: {alert_data['container_id']}
Alert Type: {alert_data['alert_type']}
Message: {alert_data['message']}
Action: {alert_data.get('action', 'Inspect immediately')}
"""
        
        results = {'email': [], 'sms': [], 'whatsapp': []}
        
        for email in recipients.get('email', []):
            result = self.send_email(email, subject, body)
            results['email'].append({'to': email, 'success': result})
        
        sms_body = f"ShelfLife: {alert_data['container_id']} - {alert_data['message']}"
        for phone in recipients.get('sms', []):
            result = self.send_sms(phone, sms_body[:160])
            results['sms'].append({'to': phone, 'success': result})
        
        for phone in recipients.get('whatsapp', []):
            result = self.send_whatsapp(phone, body[:500])
            results['whatsapp'].append({'to': phone, 'success': result})
        
        return results

notification_service = NotificationService() 
