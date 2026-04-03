import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv('.env')

print("SID:", os.getenv('TWILIO_ACCOUNT_SID')[:5] + "...")
print("TOKEN:", os.getenv('TWILIO_AUTH_TOKEN')[:5] + "...")

try:
    print("Fetching recent Twilio messages...")
    client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
    
    messages = client.messages.list(limit=5)
    
    if not messages:
        print("No recent messages found.")
    else:
        for record in messages:
            print(f"SID: {record.sid}")
            print(f"To: {record.to}")
            print(f"From: {record.from_}")
            print(f"Status: {record.status}")
            print(f"Error Code: {record.error_code}")
            print(f"Error Message: {record.error_message}")
            print("-" * 30)
except Exception as e:
    print("Twilio API failed:", e)
