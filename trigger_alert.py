import urllib.request
import json
import time

data = {
    "timestamp": "2026-04-03T11:42:00.000Z",
    "temperature": 8.0,
    "humidity": 90.0,
    "vibration": 0.2,
    "cooling_power": 10.0,
    "door_open": True,
    "latitude": 18.94,
    "longitude": 72.83,
    "days_in_transit": 15.5
}

# Sending to a DIFFERENT container to bypass the "1 alert per hour" anti-spam feature
req = urllib.request.Request(
    'http://localhost:8000/api/sensors/DPW-1024C',
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

# Wait a second for backend to fully wake up after restart
time.sleep(2)

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode('utf-8'))
except Exception as e:
    print("Failed:", str(e))
