# 📊 ShelfLife AI — Cold-Chain Data & Telemetry Documentation

This document provides complete documentation of the data sources, ingestion pipelines, feature engineering, schemas, quality metrics, and usage instructions for the ShelfLife AI predictive cold-chain monitoring system.

---

## 🌐 1. Data Sources & Provenance

ShelfLife AI integrates three complementary real-world datasets to train its predictive thermal and silent failure classification models:

| Dataset | Provider / Source | URL / Identifier | Records | Key Signals Captured |
| :--- | :--- | :--- | :--- | :--- |
| **Silent Failure Dataset** | Kaggle | `skarin/cold-chain-shipment-silent-failure-dataset` | ~8,000 | Silent compressor degradation, gradual upward drift, vibration index, recovery rate |
| **Nigeria Cold Chain** | Hugging Face | `electricsheepafrica/nigerian_transport_and_logistics_cold_chain` | ~180,000 | Rough road transit, power hiccups, tropical ambient exposure, GPS tracks |
| **FreshRetailNet-50K** | Hugging Face | `Dingdong-Inc/FreshRetailNet-50K` | ~15,000 | Multi-category perishables (produce, seafood, dairy), store transfer cycles |

---

## ⚙️ 2. Data Pipeline Architecture

```
  backend/data/raw/
  ├── cold_chain_silent_failure.csv
  ├── nigeria_cold_chain.csv
  └── fresh_retail_net_50k.csv
           │
           ▼
  [integrate_datasets.py] ──> backend/data/unified/training_data.csv (188,180 records)
           │
           ▼
  [data_preprocessor.py] ──> Feature Engineering & Scaling
           │
           ├── backend/data/processed/X_train.csv (70%)
           ├── backend/data/processed/X_val.csv   (15%)
           ├── backend/data/processed/X_test.csv  (15%)
           └── backend/data/processed/feature_names.json
```

---

## 🧪 3. Feature Dictionary & Engineering

The pipeline standardizes raw telemetry into 15 normalized ML features:

| Feature Name | Type | Description | Unit / Range |
| :--- | :--- | :--- | :--- |
| `temperature` | Numeric | Instantaneous cargo temperature | °C (-5.0 to 40.0) |
| `humidity` | Numeric | Relative humidity inside reefer | % (0.0 to 100.0) |
| `vibration` | Numeric | Vibration intensity / road turbulence | g-force (≥ 0.0) |
| `cooling_power` | Numeric | Reefer compressor electrical draw | % (0.0 to 100.0) |
| `product_type_encoded` | Categorical | LabelEncoded product category | Integer (0 to 7) |
| `temperature_rolling_mean` | Derived | 6-step rolling average temperature | °C |
| `temperature_rolling_std` | Derived | 6-step rolling volatility / standard dev | °C |
| `temperature_slope` | Derived | 3-point rate of temperature change ($\Delta T / \Delta t$) | °C/step |
| `humidity_to_temp_ratio` | Derived | Ratio of humidity to temperature ($\text{RH} / (\|T\| + 0.1)$) | Ratio |
| `cumulative_exposure` | Derived | Cumulative thermal degree-hours exceeding cargo threshold | Degree-hours |
| `temperature_spike_count` | Derived | Total count of threshold violations | Integer |
| `cooling_efficiency` | Derived | Cooling power delivered per degree delta | Power / $\Delta T$ |
| `lag_1` | Derived | 1-step previous temperature observation | °C |
| `lag_3` | Derived | 3-step previous temperature observation | °C |
| `lag_6` | Derived | 6-step previous temperature observation | °C |
| **`failure` (Target)** | **Binary** | **Cargo spoilage or critical thermal excursion flag** | **0 (Safe), 1 (Failure)** |

---

## 📈 4. Dataset Statistics & Class Distribution

- **Total Unified Telemetry Records**: `188,180`
- **Total Unique Shipments / Containers**: `> 1,200`
- **Class Balance**:
  - `Non-Failure (0)`: ~88.4%
  - `Failure / Excursion (1)`: ~11.6%
- **Product Classifications**:
  - Pharmaceuticals (`pharma`, threshold: 4.0°C)
  - Vaccines (`vaccines`, threshold: 4.0°C)
  - Seafood (`seafood`, threshold: 3.0°C)
  - Fresh Produce (`fresh_produce`, threshold: 5.0°C)
  - Dairy (`dairy`, threshold: 4.0°C)
  - Mangoes (`mangoes`, threshold: 10.0°C)
  - Biologics (`biologics`, threshold: 4.0°C)
  - Electronics (`electronics`, threshold: 25.0°C)

---

## 📊 5. Generated Visualizations

All visual artifacts are rendered and stored in `backend/data/visualizations/`:
1. `temperature_distribution.png`: Histogram and density curves showing operational vs breach thresholds.
2. `temperature_trend.png`: Time-series curve showcasing the 6-hour predictive warning lead time.
3. `temperature_by_product.png`: Boxplots comparing temperature spreads across cargo categories.
4. `correlation_heatmap.png`: Cross-feature correlations between thermal readings, cooling, and failure.
5. `failure_analysis.png`: Category-specific failure breakdown and normal vs failure thermal profiles.
6. `sensor_correlation_matrix.png`: Multi-sensor cross-dependency matrix.

---

## 💻 6. Quick Start: Loading Processed Data

```python
from backend.ml_models.data_loader import (
    load_training_data,
    load_unified_data,
    load_feature_names,
    load_product_types
)

# Load stratified train, validation, and test sets
X_train, y_train, X_val, y_val, X_test, y_test = load_training_data()
print(f"X_train shape: {X_train.shape}, y_train class 1 ratio: {y_train.mean():.3f}")

# Load feature names
features = load_feature_names()
print(f"Active model features: {features}")
```

---

## ⚠️ 7. Limitations & Edge Cases

1. **Dead Zone Ingestion**: When containers travel through mid-ocean dead zones, data is queued locally in SQLite on edge devices and synced upon reconnection.
2. **Compressor Silent Failures**: Silent failures exhibit normal vibration and nominal initial temperatures with degrading power efficiency. The engineered `cooling_efficiency` and `temperature_slope` features were specifically designed to catch these subtle degradation signatures.
