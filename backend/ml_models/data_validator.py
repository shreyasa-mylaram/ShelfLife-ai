"""
SHELFLIFE AI - Data Validator
Validates data quality, completeness, schema compliance, and computes container quality scores.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
REPORT_PATH = DATA_DIR / "validation_report.json"

ALLOWED_PRODUCTS = [
    'mangoes', 'vaccines', 'seafood', 'electronics',
    'pharma', 'biologics', 'fresh_produce', 'dairy'
]

REQUIRED_COLUMNS = [
    'container_id', 'timestamp', 'temperature', 'humidity',
    'vibration', 'product_type'
]


class DataValidator:
    """Performs rigorous quality audits and scoring across cold-chain datasets."""

    def __init__(self, allowed_products: Optional[List[str]] = None):
        self.allowed_products = allowed_products or ALLOWED_PRODUCTS
        self.validation_results: Dict[str, Any] = {}

    def validate(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Audit dataset for quality, anomalies, integrity, and compute health scores."""
        logger.info(f"Validating dataset with {len(df)} records...")
        data = df.copy()

        # Map non-standard column names to canonical schema
        col_mappings = {
            'trip_id': 'container_id',
            'shipment_id': 'container_id',
            'store_id': 'container_id',
            'device_id': 'container_id',
            'temp_c': 'temperature',
            'temp_mean_c': 'temperature',
            'avg_temperature': 'temperature',
            'temp': 'temperature',
            'rh_mean': 'humidity',
            'avg_humidity': 'humidity',
            'relative_humidity': 'humidity',
            'vibration_index': 'vibration',
            'accel': 'vibration',
            'package_type': 'product_type',
            'first_category_id': 'product_type',
            'cargo': 'product_type',
            'dt': 'timestamp',
            'time': 'timestamp'
        }

        for src, dst in col_mappings.items():
            if src in data.columns and dst not in data.columns:
                data[dst] = data[src]

        # 1. Required Columns Check
        missing_required = [col for col in REQUIRED_COLUMNS if col not in data.columns]
        has_all_required = len(missing_required) == 0

        # Fill defaults for audit
        if 'container_id' not in data.columns:
            data['container_id'] = "CONT_0"
        if 'temperature' not in data.columns:
            data['temperature'] = 4.0
        if 'humidity' not in data.columns:
            data['humidity'] = 60.0
        if 'vibration' not in data.columns:
            data['vibration'] = 0.2
        if 'product_type' not in data.columns:
            data['product_type'] = 'pharma'
        if 'timestamp' not in data.columns:
            data['timestamp'] = pd.date_range(end=pd.Timestamp.now(), periods=len(data), freq='10min')

        # 2. Duplicate Timestamps per container
        dup_timestamps_count = int(data.duplicated(subset=['container_id', 'timestamp']).sum())

        # 3. Temperature Range Validation (-5°C to 40°C)
        t = pd.to_numeric(data['temperature'], errors='coerce')
        out_temp = (t < -5.0) | (t > 40.0)
        temp_out_of_bounds = int(out_temp.sum())
        temp_valid = temp_out_of_bounds == 0

        # 4. Humidity Range Validation (0% to 100%)
        h = pd.to_numeric(data['humidity'], errors='coerce')
        out_humid = (h < 0.0) | (h > 100.0)
        humid_out_of_bounds = int(out_humid.sum())
        humidity_valid = humid_out_of_bounds == 0

        # 5. Non-Negative Vibration Validation (>= 0.0)
        v = pd.to_numeric(data['vibration'], errors='coerce')
        neg_vib = v < 0.0
        negative_vib_count = int(neg_vib.sum())
        vibration_valid = negative_vib_count == 0

        # 6. Allowed Product Types Validation
        unique_prods = data['product_type'].dropna().astype(str).str.lower().unique().tolist()
        product_map = {
            '0': 'vaccines', '1': 'pharma', '2': 'mangoes', '3': 'seafood',
            '4': 'fresh_produce', '5': 'dairy', 'ambient': 'pharma',
            'refrigerated': 'vaccines', 'frozen': 'seafood'
        }
        mapped_prods = [product_map.get(p, p) for p in unique_prods]
        invalid_products = [p for p in mapped_prods if p not in self.allowed_products]

        # 7. Quality & Completeness Scores across core sensor attributes
        core_cols = ['temperature', 'humidity', 'vibration']
        core_completeness = (1.0 - data[core_cols].isnull().mean(axis=1)) * 100.0
        
        t_penalty = out_temp.astype(float) * 40.0
        h_penalty = out_humid.astype(float) * 20.0
        v_penalty = neg_vib.astype(float) * 20.0
        
        row_scores = np.clip(core_completeness - (t_penalty + h_penalty + v_penalty), 0.0, 100.0)
        avg_quality_score = round(float(row_scores.mean()), 1)

        self.validation_results = {
            "status": "PASSED" if avg_quality_score >= 80.0 else "WARNING",
            "overall_quality_score": avg_quality_score,
            "total_records": len(data),
            "checks": {
                "required_columns_present": {
                    "passed": has_all_required,
                    "missing": missing_required
                },
                "duplicate_timestamps": {
                    "passed": dup_timestamps_count == 0,
                    "count": dup_timestamps_count
                },
                "temperature_within_range": {
                    "passed": temp_valid,
                    "out_of_bounds_count": temp_out_of_bounds,
                    "range_celsius": "[-5.0, 40.0]"
                },
                "humidity_within_range": {
                    "passed": humidity_valid,
                    "out_of_bounds_count": humid_out_of_bounds,
                    "range_percent": "[0.0, 100.0]"
                },
                "vibration_non_negative": {
                    "passed": vibration_valid,
                    "negative_count": negative_vib_count
                },
                "product_type_valid": {
                    "passed": len(invalid_products) == 0,
                    "invalid_types": invalid_products,
                    "allowed_types": self.allowed_products
                }
            },
            "shipment_quality_summary": {
                "total_records_evaluated": len(data),
                "completeness_average_percent": round(float(core_completeness.mean()), 1),
                "records_meeting_80_percent_standard": int((row_scores >= 80.0).sum())
            }
        }

        return self.validation_results

    def save_report(self, output_path: Optional[Path] = None) -> Path:
        """Save the generated validation report to JSON."""
        target_path = output_path or REPORT_PATH
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "w") as f:
            json.dump(self.validation_results, f, indent=2)
        logger.info(f"Saved validation report -> {target_path}")
        return target_path


def run_validation():
    """Run validator across available datasets."""
    logger.info("Executing DataValidator audit...")
    raw_files = list((BASE_DIR / "data" / "raw").glob("*.csv"))
    if not raw_files:
        raise FileNotFoundError("No raw data files found to validate.")

    dfs = [pd.read_csv(f) for f in raw_files]
    combined = pd.concat(dfs, ignore_index=True)

    validator = DataValidator()
    report = validator.validate(combined)
    validator.save_report()

    logger.info(f"✅ Data validation complete. Quality Score: {report['overall_quality_score']}/100")


if __name__ == "__main__":
    run_validation()
