import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

def main():
    # Attempt to load the data from the data/ directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path inside the container (we will copy the data in for training)
    # The container maps /app to the backend directory
    # So relative to ml_models/, ../../data/ is where training_data.csv is placed (locally)
    # Inside docker we put it in /app/data/
    data_path = "/app/data/training_data.csv"
    
    if not os.path.exists(data_path):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.abspath(os.path.join(current_dir, "../../data/training_data.csv"))
            
    if not os.path.exists(data_path):
        print(f"Data not found at {data_path}! Please ensure data/training_data.csv exists.")
        return
            
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Preprocessing
    print("Preprocessing data...")
    le = LabelEncoder()
    # Handle the fact that some product_types might be missing or different
    df['product_type'] = df['product_type'].fillna('unknown')
    df['product_type_enc'] = le.fit_transform(df['product_type'])
    
    # Features: temperature, humidity, vibration, cooling_power, product_type
    features = ['temperature', 'humidity', 'vibration', 'cooling_power', 'product_type_enc']
    
    X = df[features]
    
    # Targets identified from CSV:
    # shelf_life_remaining (Regression)
    # health_score (Regression)
    # failure (Classification)
    
    # Training
    print("Training 1/3: Shelf Life Regressor...")
    shelf_life_model = RandomForestRegressor(n_estimators=30, max_depth=8, random_state=42)
    shelf_life_model.fit(X, df['shelf_life_remaining'])
    
    print("Training 2/3: Health Score Regressor...")
    health_model = RandomForestRegressor(n_estimators=30, max_depth=8, random_state=42)
    health_model.fit(X, df['health_score'])
    
    print("Training 3/3: Failure Classifier (Cooling Failures)...")
    failure_model = RandomForestClassifier(n_estimators=30, max_depth=8, random_state=42)
    failure_model.fit(X, df['failure'])
    
    # Save models and the label encoder
    saved_models_dir = os.path.join(current_dir, "saved_models")
    os.makedirs(saved_models_dir, exist_ok=True)
    
    joblib.dump(shelf_life_model, os.path.join(saved_models_dir, "shelf_life_model.joblib"))
    joblib.dump(health_model, os.path.join(saved_models_dir, "health_model.joblib"))
    joblib.dump(failure_model, os.path.join(saved_models_dir, "failure_model.joblib"))
    joblib.dump(le, os.path.join(saved_models_dir, "product_encoder.joblib"))
    
    print(f"Successfully saved 3 models and encoder to {saved_models_dir}/")

if __name__ == "__main__":
    main()
