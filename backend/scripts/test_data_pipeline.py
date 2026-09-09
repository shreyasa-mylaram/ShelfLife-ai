"""
SHELFLIFE AI - Data Pipeline Test Suite
Validates the full data pipeline: collection, preprocessing, feature engineering,
splits, validation checks, and data loader functions.
"""

import logging
import sys
from pathlib import Path

import pandas as pd
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ml_models.data_preprocessor import DataPreprocessor
from ml_models.data_validator import DataValidator
from ml_models.data_loader import (
    load_training_data,
    load_unified_data,
    load_feature_names,
    load_product_types
)


def run_pipeline_tests():
    """Execute end-to-end verification tests."""
    logger.info("==================================================")
    logger.info("🧪 RUNNING SHELFLIFE AI DATA PIPELINE TEST SUITE")
    logger.info("==================================================")

    # 1. Test Data Loader
    logger.info("[Test 1/5] Testing Data Loaders...")
    X_train, y_train, X_val, y_val, X_test, y_test = load_training_data()
    feature_names = load_feature_names()
    product_types = load_product_types()
    unified_df = load_unified_data()

    assert not X_train.empty, "X_train is empty!"
    assert not y_train.empty, "y_train is empty!"
    assert len(X_train) == len(y_train), "X_train and y_train row mismatch!"
    assert len(X_val) == len(y_val), "X_val and y_val row mismatch!"
    assert len(X_test) == len(y_test), "X_test and y_test row mismatch!"
    logger.info("✅ Test 1 Passed: Data Loaders successfully returned matrices.")

    # 2. Test Split Proportions (70% / 15% / 15%)
    logger.info("[Test 2/5] Testing Train/Val/Test Split Proportions...")
    total_samples = len(X_train) + len(X_val) + len(X_test)
    train_ratio = len(X_train) / total_samples
    val_ratio = len(X_val) / total_samples
    test_ratio = len(X_test) / total_samples

    logger.info(f"Split proportions -> Train: {train_ratio:.3f}, Val: {val_ratio:.3f}, Test: {test_ratio:.3f}")
    assert 0.69 <= train_ratio <= 0.71, f"Train split unexpected ratio: {train_ratio}"
    assert 0.14 <= val_ratio <= 0.16, f"Val split unexpected ratio: {val_ratio}"
    assert 0.14 <= test_ratio <= 0.16, f"Test split unexpected ratio: {test_ratio}"
    logger.info("✅ Test 2 Passed: Split proportions match 70% / 15% / 15% specification.")

    # 3. Test Feature Columns & Dimension Alignment
    logger.info("[Test 3/5] Testing Feature Alignment...")
    expected_features = [
        'temperature', 'humidity', 'vibration', 'cooling_power',
        'product_type_encoded', 'temperature_rolling_mean',
        'temperature_rolling_std', 'temperature_slope',
        'humidity_to_temp_ratio', 'cumulative_exposure',
        'temperature_spike_count', 'cooling_efficiency',
        'lag_1', 'lag_3', 'lag_6'
    ]
    for feat in expected_features:
        assert feat in X_train.columns, f"Missing feature in X_train: {feat}"
        assert feat in X_val.columns, f"Missing feature in X_val: {feat}"
        assert feat in X_test.columns, f"Missing feature in X_test: {feat}"

    assert list(X_train.columns) == feature_names, "feature_names.json mismatch with X_train columns!"
    logger.info(f"✅ Test 3 Passed: All {len(expected_features)} model features aligned.")

    # 4. Test Preprocessor Transformations on Sample Data
    logger.info("[Test 4/5] Testing DataPreprocessor on New Sample Data...")
    sample_raw = pd.DataFrame({
        "container_id": ["TEST-01", "TEST-01", "TEST-01", "TEST-01", "TEST-01", "TEST-01", "TEST-01"],
        "timestamp": pd.date_range("2026-01-01", periods=7, freq="1h"),
        "temperature": [2.0, 2.2, 2.5, 3.1, 4.2, 5.0, 6.2],
        "humidity": [50.0, 52.0, 55.0, 58.0, 60.0, 65.0, 70.0],
        "vibration": [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6],
        "cooling_power": [85.0, 80.0, 75.0, 60.0, 50.0, 40.0, 30.0],
        "product_type": ["vaccines"] * 7,
        "failure": [0, 0, 0, 0, 1, 1, 1]
    })

    preprocessor = DataPreprocessor()
    clean_sample = preprocessor.clean_data(sample_raw)
    feat_sample = preprocessor.engineer_features(clean_sample)
    
    assert "temperature_rolling_mean" in feat_sample.columns
    assert "cooling_efficiency" in feat_sample.columns
    assert "cumulative_exposure" in feat_sample.columns
    logger.info("✅ Test 4 Passed: Preprocessor feature transformations operational.")

    # 5. Test Data Validator
    logger.info("[Test 5/5] Testing DataValidator Audit...")
    validator = DataValidator()
    report = validator.validate(unified_df)
    
    assert "overall_quality_score" in report
    assert "checks" in report
    assert report["checks"]["required_columns_present"]["passed"] is True
    logger.info(f"✅ Test 5 Passed: DataValidator audit finished with score {report['overall_quality_score']}/100.")

    logger.info("==================================================")
    logger.info("🎉 ALL PIPELINE TESTS PASSED SUCCESSFULLY!")
    logger.info("==================================================")


if __name__ == "__main__":
    run_pipeline_tests()
