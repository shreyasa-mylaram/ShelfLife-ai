import os
from dotenv import load_dotenv

# Load from current directory .env
load_dotenv('.env')

print("Testing Credentials from .env:")
print("SMTP_USER:", os.getenv('SMTP_USER'))
print("TWILIO_ACCOUNT_SID:", os.getenv('TWILIO_ACCOUNT_SID'))
print("ALERT_PHONES:", os.getenv('ALERT_PHONES'))

from twilio.rest import Client
import smtplib
from email.mime.text import MIMEText

# Try Twilio
try:
    print("\n--- Testing Twilio ---")
    client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
    msg = client.messages.create(
        body="ShelfLife-AI: Testing Twilio Setup",
        from_=os.getenv('TWILIO_PHONE_NUMBER'),
        to=os.getenv('ALERT_PHONES')
    )
    print("Twilio Success! SID:", msg.sid)
except Exception as e:
    print("Twilio Failed:", e)

# Try SMTP
try:
    print("\n--- Testing SMTP ---")
    server = smtplib.SMTP(os.getenv("SMTP_SERVER", "smtp.gmail.com"), int(os.getenv("SMTP_PORT", 587)))
    server.starttls()
    server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
    
    email_msg = MIMEText("ShelfLife-AI: Testing SMTP Setup", 'plain')
    email_msg['From'] = os.getenv("FROM_EMAIL")
    email_msg['To'] = os.getenv("ALERT_EMAILS")
    email_msg['Subject'] = "ShelfLife-AI Debug Test"
    
    server.send_message(email_msg)
    server.quit()
    print("SMTP Success!")
except Exception as e:
    print("SMTP Failed:", e)
