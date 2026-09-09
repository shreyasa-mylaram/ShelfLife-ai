"""
SHELFLIFE AI - Data Loader Utility
Provides clean programmatic access to processed training splits, unified datasets,
feature names, and product metadata for model training and evaluation.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
UNIFIED_DIR = BASE_DIR / "data" / "unified"

DEFAULT_PRODUCTS = [
    'mangoes', 'vaccines', 'seafood', 'electronics',
    'pharma', 'biologics', 'fresh_produce', 'dairy'
]


def load_training_data(
    processed_dir: Optional[Path] = None
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    """
    Load preprocessed and scaled train, validation, and test datasets.
    
    Returns:
        X_train (pd.DataFrame): Training feature matrix
        y_train (pd.Series): Training binary failure labels
        X_val (pd.DataFrame): Validation feature matrix
        y_val (pd.Series): Validation binary failure labels
        X_test (pd.DataFrame): Test feature matrix
        y_test (pd.Series): Test binary failure labels
    """
    p_dir = processed_dir or PROCESSED_DIR
    if not (p_dir / "X_train.csv").exists():
        raise FileNotFoundError(f"Processed splits not found in {p_dir}. Run data_preprocessor.py first.")

    X_train = pd.read_csv(p_dir / "X_train.csv")
    X_val = pd.read_csv(p_dir / "X_val.csv")
    X_test = pd.read_csv(p_dir / "X_test.csv")

    y_train = pd.read_csv(p_dir / "y_train.csv").squeeze("columns")
    y_val = pd.read_csv(p_dir / "y_val.csv").squeeze("columns")
    y_test = pd.read_csv(p_dir / "y_test.csv").squeeze("columns")

    logger.info(f"Loaded training data: Train={X_train.shape}, Val={X_val.shape}, Test={X_test.shape}")
    return X_train, y_train, X_val, y_val, X_test, y_test


def load_unified_data(unified_dir: Optional[Path] = None) -> pd.DataFrame:
    """
    Load the unified multi-source dataset containing raw sensor telemetry.
    
    Returns:
        pd.DataFrame: Complete unified dataset
    """
    u_dir = unified_dir or UNIFIED_DIR
    target = u_dir / "training_data.csv"
    if not target.exists():
        raise FileNotFoundError(f"Unified dataset not found at {target}. Run integrate_datasets.py first.")

    df = pd.read_csv(target)
    logger.info(f"Loaded unified dataset: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def load_feature_names(processed_dir: Optional[Path] = None) -> List[str]:
    """
    Load list of feature names used during preprocessing and model inference.
    
    Returns:
        List[str]: List of model feature names
    """
    p_dir = processed_dir or PROCESSED_DIR
    f_json = p_dir / "feature_names.json"
    if not f_json.exists():
        raise FileNotFoundError(f"Feature names file not found at {f_json}")

    with open(f_json, "r") as f:
        meta = json.load(f)
    return meta.get("features", [])


def load_product_types() -> List[str]:
    """
    Load list of supported cargo product types.
    
    Returns:
        List[str]: Supported product categories
    """
    return DEFAULT_PRODUCTS.copy()


if __name__ == "__main__":
    X_tr, y_tr, X_v, y_v, X_te, y_te = load_training_data()
    print("Features:", load_feature_names())
    print("Products:", load_product_types())
    print(f"X_train Shape: {X_tr.shape}, Positive Label Rate: {y_tr.mean():.4f}")
