"""
SHELFLIFE AI - Data Preprocessor
Handles cleaning, feature engineering, time-series transformations,
and stratified train/val/test splits for predictive cold-chain modeling.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_PRODUCTS = ['mangoes', 'vaccines', 'seafood', 'electronics', 'pharma', 'biologics', 'fresh_produce', 'dairy']
PRODUCT_THRESHOLDS = {
    'vaccines': 4.0,
    'pharma': 4.0,
    'biologics': 4.0,
    'seafood': 3.0,
    'dairy': 4.0,
    'fresh_produce': 5.0,
    'mangoes': 10.0,
    'electronics': 25.0
}


class DataPreprocessor:
    """End-to-end Preprocessor for sensor telemetry data."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: List[str] = []
        self.is_fitted: bool = False

    def standardize_raw_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map heterogeneous raw dataset columns to canonical schema."""
        data = df.copy()
        data.columns = [str(c).strip().lower().replace(" ", "_") for c in data.columns]

        # Identifier mapping
        if 'container_id' not in data.columns:
            for col in ['trip_id', 'shipment_id', 'store_id', 'device_id', 'sensor_id']:
                if col in data.columns:
                    data['container_id'] = data[col].astype(str)
                    break
            if 'container_id' not in data.columns:
                data['container_id'] = [f"CONT_{i // 200}" for i in range(len(data))]

        # Timestamp mapping
        if 'timestamp' not in data.columns:
            for col in ['dt', 'time', 'date', 'datetime']:
                if col in data.columns:
                    data['timestamp'] = pd.to_datetime(data[col], errors='coerce')
                    break
            if 'timestamp' not in data.columns or data['timestamp'].isna().all():
                data['timestamp'] = pd.date_range(end=pd.Timestamp.now(), periods=len(data), freq='10min')
        else:
            data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')

        data['timestamp'] = data['timestamp'].ffill().bfill()

        # Temperature mapping
        if 'temperature' not in data.columns:
            for col in ['temp_c', 'temp_mean_c', 'avg_temperature', 'temp', 'temperature_c']:
                if col in data.columns:
                    data['temperature'] = pd.to_numeric(data[col], errors='coerce')
                    break
            if 'temperature' not in data.columns:
                data['temperature'] = 4.0
        else:
            data['temperature'] = pd.to_numeric(data['temperature'], errors='coerce')

        # Humidity mapping
        if 'humidity' not in data.columns:
            for col in ['rh_mean', 'avg_humidity', 'relative_humidity', 'humid']:
                if col in data.columns:
                    data['humidity'] = pd.to_numeric(data[col], errors='coerce')
                    break
            if 'humidity' not in data.columns:
                data['humidity'] = 60.0
        else:
            data['humidity'] = pd.to_numeric(data['humidity'], errors='coerce')

        # Vibration mapping
        if 'vibration' not in data.columns:
            for col in ['vibration_index', 'accel', 'vibe']:
                if col in data.columns:
                    data['vibration'] = pd.to_numeric(data[col], errors='coerce')
                    break
            if 'vibration' not in data.columns:
                data['vibration'] = 0.2
        else:
            data['vibration'] = pd.to_numeric(data['vibration'], errors='coerce')

        # Cooling power mapping
        if 'cooling_power' not in data.columns:
            for col in ['cooling', 'power', 'chiller_load']:
                if col in data.columns:
                    data['cooling_power'] = pd.to_numeric(data[col], errors='coerce')
                    break
            if 'cooling_power' not in data.columns:
                data['cooling_power'] = 80.0
        else:
            data['cooling_power'] = pd.to_numeric(data['cooling_power'], errors='coerce')

        # Product type mapping
        if 'product_type' not in data.columns:
            for col in ['package_type', 'first_category_id', 'product_id', 'cargo']:
                if col in data.columns:
                    data['product_type'] = data[col].astype(str)
                    break
            if 'product_type' not in data.columns:
                data['product_type'] = 'pharma'

        product_map = {
            '0': 'vaccines', '1': 'pharma', '2': 'mangoes', '3': 'seafood',
            '4': 'fresh_produce', '5': 'dairy', 'ambient': 'pharma',
            'refrigerated': 'vaccines', 'frozen': 'seafood'
        }
        data['product_type'] = data['product_type'].astype(str).str.lower().map(
            lambda x: product_map.get(x, x if x in ALLOWED_PRODUCTS else 'pharma')
        )

        # Target label mapping
        if 'failure' not in data.columns:
            for col in ['silent_failure', 'excursion', 'failed', 'is_failure', 'spoilage']:
                if col in data.columns:
                    data['failure'] = pd.to_numeric(data[col], errors='coerce').fillna(0).astype(int)
                    break
            if 'failure' not in data.columns:
                data['failure'] = data.apply(
                    lambda r: 1 if r['temperature'] > PRODUCT_THRESHOLDS.get(r['product_type'], 4.0) + 1.5 else 0,
                    axis=1
                )
        else:
            data['failure'] = pd.to_numeric(data['failure'], errors='coerce').fillna(0).astype(int)

        data['failure'] = (data['failure'] > 0).astype(int)

        canonical_cols = [
            'container_id', 'timestamp', 'temperature', 'humidity',
            'vibration', 'cooling_power', 'product_type', 'failure'
        ]
        return data[canonical_cols].copy()

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize and clean raw dataset."""
        logger.info(f"Cleaning raw DataFrame with initial shape: {df.shape}")
        data = self.standardize_raw_df(df)

        data = data.dropna(subset=['container_id', 'temperature']).reset_index(drop=True)
        data = data.sort_values(by=['container_id', 'timestamp']).reset_index(drop=True)

        for col in ['temperature', 'humidity', 'vibration', 'cooling_power']:
            data[col] = data[col].ffill().fillna(data[col].median()).fillna(0.0)

        logger.info(f"Cleaned DataFrame shape: {data.shape}")
        return data

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create domain-specific cold-chain and time-series lag/window features."""
        logger.info("Generating domain-specific cold-chain features (C-vectorized)...")
        data = df.copy()
        data = data.sort_values(by=['container_id', 'timestamp']).reset_index(drop=True)

        # 1. Rolling statistics & Derivatives (Vectorized)
        data['temperature_rolling_mean'] = data['temperature'].rolling(window=6, min_periods=1).mean()
        data['temperature_rolling_std'] = data['temperature'].rolling(window=6, min_periods=1).std().fillna(0.0)

        # 2. Slope (rate of change, 3-point derivative)
        data['temperature_slope'] = data['temperature'].diff(periods=2).fillna(0.0) / 2.0

        # 3. Lag features (lag_1, lag_3, lag_6)
        data['lag_1'] = data['temperature'].shift(1).fillna(data['temperature'])
        data['lag_3'] = data['temperature'].shift(3).fillna(data['temperature'])
        data['lag_6'] = data['temperature'].shift(6).fillna(data['temperature'])

        # 4. Spikes & Cumulative thermal exposure above threshold
        thresh = data['product_type'].map(lambda p: PRODUCT_THRESHOLDS.get(p, 4.0))
        excess = (data['temperature'] - thresh).clip(lower=0.0)
        data['cumulative_exposure'] = excess.cumsum()

        is_spike = (data['temperature'] > thresh).astype(int)
        data['temperature_spike_count'] = is_spike.cumsum()

        # 5. Humidity to Temperature Ratio
        data['humidity_to_temp_ratio'] = data['humidity'] / (data['temperature'].abs() + 0.1)

        # 6. Cooling Efficiency: cooling_power / temperature_delta
        target_temps = data['product_type'].map(
            lambda p: PRODUCT_THRESHOLDS.get(p, 4.0) - 1.0
        )
        temp_delta = (data['temperature'] - target_temps).abs() + 0.1
        data['cooling_efficiency'] = data['cooling_power'] / temp_delta

        logger.info(f"Engineered features successfully. Total columns: {data.shape[1]}")
        return data

    def prepare_datasets(
        self,
        df: pd.DataFrame,
        target_col: str = 'failure',
        test_size: float = 0.15,
        val_size: float = 0.15,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
        """Preprocess, normalize, encode, and split into train/val/test."""
        cleaned = self.clean_data(df)
        engineered = self.engineer_features(cleaned)

        # Encode categorical variables
        cat_cols = ['product_type']
        for col in cat_cols:
            if col in engineered.columns:
                le = LabelEncoder()
                engineered[f"{col}_encoded"] = le.fit_transform(engineered[col].astype(str))
                self.label_encoders[col] = le

        # Select model features
        feature_cols = [
            'temperature', 'humidity', 'vibration', 'cooling_power',
            'product_type_encoded',
            'temperature_rolling_mean', 'temperature_rolling_std',
            'temperature_slope', 'humidity_to_temp_ratio',
            'cumulative_exposure', 'temperature_spike_count',
            'cooling_efficiency', 'lag_1', 'lag_3', 'lag_6'
        ]

        valid_features = [c for c in feature_cols if c in engineered.columns]
        self.feature_names = valid_features

        X = engineered[valid_features].copy()
        y = engineered[target_col].copy()

        # Handle class imbalance checks
        stratify_val = y if len(np.unique(y)) > 1 else None

        # Train (70%) + Temp (30%)
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y,
            test_size=(test_size + val_size),
            random_state=random_state,
            stratify=stratify_val
        )

        # Split Temp (30%) into Val (15%) and Test (15%)
        rel_test_size = test_size / (test_size + val_size)
        stratify_temp = y_temp if len(np.unique(y_temp)) > 1 else None
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp,
            test_size=rel_test_size,
            random_state=random_state,
            stratify=stratify_temp
        )

        # Fit Scaler on X_train only to prevent data leakage
        self.scaler.fit(X_train)
        self.is_fitted = True

        # Transform all splits
        X_train_scaled = pd.DataFrame(self.scaler.transform(X_train), columns=valid_features, index=X_train.index)
        X_val_scaled = pd.DataFrame(self.scaler.transform(X_val), columns=valid_features, index=X_val.index)
        X_test_scaled = pd.DataFrame(self.scaler.transform(X_test), columns=valid_features, index=X_test.index)

        logger.info(f"Split sizes - Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
        return X_train_scaled, X_val_scaled, X_test_scaled, y_train, y_val, y_test

    def save_processed_data(
        self,
        X_train: pd.DataFrame,
        X_val: pd.DataFrame,
        X_test: pd.DataFrame,
        y_train: pd.Series,
        y_val: pd.Series,
        y_test: pd.Series,
        output_dir: Optional[Path] = None
    ):
        """Save train/val/test splits and feature names to disk."""
        target_dir = output_dir or PROCESSED_DIR
        target_dir.mkdir(parents=True, exist_ok=True)

        X_train.to_csv(target_dir / "X_train.csv", index=False)
        X_val.to_csv(target_dir / "X_val.csv", index=False)
        X_test.to_csv(target_dir / "X_test.csv", index=False)

        y_train.to_csv(target_dir / "y_train.csv", index=False)
        y_val.to_csv(target_dir / "y_val.csv", index=False)
        y_test.to_csv(target_dir / "y_test.csv", index=False)

        with open(target_dir / "feature_names.json", "w") as f:
            json.dump({
                "features": self.feature_names,
                "num_features": len(self.feature_names),
                "target": "failure"
            }, f, indent=2)

        logger.info(f"Saved processed splits & feature_names.json -> {target_dir}")


def run_pipeline():
    """Main function to run preprocessor on primary raw dataset."""
    logger.info("Executing DataPreprocessor pipeline on raw dataset...")
    raw_files = list(RAW_DIR.glob("*.csv"))
    if not raw_files:
        raise FileNotFoundError(f"No raw datasets found in {RAW_DIR}")

    preprocessor = DataPreprocessor()
    standardized_dfs = []
    for f in raw_files:
        logger.info(f"Reading & standardizing {f.name}...")
        try:
            df = pd.read_csv(f)
            std_df = preprocessor.standardize_raw_df(df)
            standardized_dfs.append(std_df)
        except Exception as e:
            logger.warning(f"Could not read {f.name}: {e}")

    combined = pd.concat(standardized_dfs, ignore_index=True)
    logger.info(f"Total standardized records: {len(combined)}")

    X_train, X_val, X_test, y_train, y_val, y_test = preprocessor.prepare_datasets(combined)
    preprocessor.save_processed_data(X_train, X_val, X_test, y_train, y_val, y_test)
    logger.info("✅ DataPreprocessor finished successfully!")


if __name__ == "__main__":
    run_pipeline()
