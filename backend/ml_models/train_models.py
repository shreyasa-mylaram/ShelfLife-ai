import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import joblib

def main():
    # Attempt to load the data from the data/ directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.abspath(os.path.join(current_dir, "../../data/training_data.csv"))
    
    if not os.path.exists(data_path):
        print(f"Data not found at {data_path}. Please run data_simulator.py to generate it.")
        return
        
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # We will use simple feature sets for demonstration
    # Features: temperature, humidity, vibration, cooling_power
    features = ['temperature', 'humidity', 'vibration', 'cooling_power']
    
    X = df[features]
    y_failure = df['failure']
    
    # For temperature forecasting, we'll just try to predict temp + noise to simulate future tracking
    # Ideally, we would shift rows, but a simple regressor is fine for this simulated setup
    y_temp = df['temperature'] + np.random.normal(0, 1, len(df))
    
    print("Training Temperature Predictor (Substituting LSTM with RandomForestRegressor)...")
    temp_model = RandomForestRegressor(n_estimators=10, max_depth=5, random_state=42)
    temp_model.fit(X, y_temp)
    
    print("Training Failure Predictor (Substituting XGBoost with RandomForestClassifier)...")
    failure_model = RandomForestClassifier(n_estimators=20, max_depth=5, random_state=42)
    failure_model.fit(X, y_failure)
    
    # Save models
    saved_models_dir = os.path.join(current_dir, "saved_models")
    os.makedirs(saved_models_dir, exist_ok=True)
    
    joblib.dump(temp_model, os.path.join(saved_models_dir, "lstm_temp_model.joblib"))
    joblib.dump(failure_model, os.path.join(saved_models_dir, "xgboost_failure.joblib"))
    
    print(f"Models successfully saved to {saved_models_dir}/")

if __name__ == "__main__":
    main()
