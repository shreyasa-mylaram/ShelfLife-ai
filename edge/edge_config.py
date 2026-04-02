# edge_config.py

# Cloud API settings
CLOUD_API_URL = "http://localhost:8000/api/offline/sync"

# Sync settings
SYNC_INTERVAL_SECONDS = 300
MAX_SYNC_RETRIES = 5
RETRY_BACKOFF_MULTIPLIER = 2

# Product specific thresholds
PRODUCT_THRESHOLDS = {
    'mangoes': {
        'temp_max': 15,
        'temp_min': 10,
        'shelf_life_days': 15,
        'optimal_temp': 12.5
    },
    'vaccines': {
        'temp_max': 8,
        'temp_min': 2,
        'shelf_life_days': 30,
        'optimal_temp': 5
    },
    'seafood': {
        'temp_max': 0,
        'temp_min': -2,
        'shelf_life_days': 7,
        'optimal_temp': -1
    },
    'electronics': {
        'temp_max': 60,
        'temp_min': -20,
        'shelf_life_days': 365,
        'optimal_temp': 20
    }
}

# Alert Thresholds (deviation from optimal where alerts start firing)
ALERT_THRESHOLDS = {
    'temperature_warning_margin': 2.0,   # degrees before reaching max/min
    'humidity_max': 90,                  # baseline max percent
    'vibration_critical': 1.0            # g-force
}
