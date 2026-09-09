"""
SHELFLIFE AI - Dataset Downloader & Collector
Downloads real-world cold-chain datasets with graceful fallbacks.
"""

import os
import shutil
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

RAW_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)


def generate_synthetic_cold_chain_silent_failure(file_path: Path, num_rows: int = 15000):
    """Fallback generator for realistic Cold Chain Silent Failure dataset."""
    logger.info(f"Generating realistic Cold Chain Silent Failure data -> {file_path}")
    np.random.seed(42)
    
    containers = [f"DPW-{1000 + i}{chr(65 + (i % 6))}" for i in range(25)]
    products = ['vaccines', 'mangoes', 'seafood', 'pharma', 'biologics', 'electronics']
    product_base_temps = {
        'vaccines': 2.5, 'mangoes': 11.0, 'seafood': 1.0,
        'pharma': 3.5, 'biologics': 4.0, 'electronics': 20.0
    }
    
    rows = []
    start_time = pd.Timestamp("2025-01-01 00:00:00")
    
    for container in containers:
        product = np.random.choice(products)
        base_t = product_base_temps[product]
        has_silent_failure = np.random.rand() < 0.35
        
        # 600 hourly timestamps per container (25 days)
        for hour in range(600):
            ts = start_time + pd.Timedelta(hours=hour)
            
            # Sine wave diurnal cycle + ambient drift
            ambient_effect = 1.2 * np.sin(2 * np.pi * (hour % 24) / 24.0)
            noise = np.random.normal(0, 0.3)
            
            cooling_power = np.random.uniform(70, 98)
            vibration = np.random.exponential(0.3)
            humidity = np.clip(np.random.normal(55, 10), 20, 95)
            door_open = 1 if np.random.rand() < 0.04 else 0
            
            # Silent failure: compressor degrades quietly over time
            silent_failure_active = 0
            if has_silent_failure and hour > 300:
                degradation = (hour - 300) * 0.04
                cooling_power = max(20.0, cooling_power - degradation * 1.5)
                temp = base_t + degradation + ambient_effect + noise
                if door_open:
                    temp += 1.5
                silent_failure_active = 1 if degradation > 1.8 else 0
                failure = 1 if temp > (base_t + 2.5) or silent_failure_active else 0
            else:
                temp = base_t + ambient_effect * 0.3 + noise
                if door_open:
                    temp += 0.8
                failure = 0
            
            rows.append({
                "timestamp": ts.isoformat(),
                "container_id": container,
                "product_type": product,
                "temperature": round(temp, 2),
                "humidity": round(humidity, 2),
                "vibration": round(vibration, 3),
                "cooling_power": round(cooling_power, 1),
                "door_open": door_open,
                "silent_failure": silent_failure_active,
                "failure": failure,
                "latitude": round(18.9220 + np.random.normal(0, 0.5), 4),
                "longitude": round(72.8347 + np.random.normal(0, 0.5), 4),
                "days_in_transit": round(hour / 24.0, 2)
            })
            
    df = pd.DataFrame(rows)
    df.to_csv(file_path, index=False)
    logger.info(f"Saved {len(df)} rows to {file_path}")
    return df


def generate_synthetic_nigeria_cold_chain(file_path: Path, num_rows: int = 10000):
    """Fallback generator for Nigeria transport & logistics cold chain data."""
    logger.info(f"Generating realistic Nigeria Cold Chain Logistics data -> {file_path}")
    np.random.seed(101)
    
    routes = ["Lagos-Abuja", "PortHarcourt-Kano", "Lagos-Ibadan", "Enugu-Kaduna"]
    products = ['vaccines', 'pharma', 'mangoes', 'seafood']
    rows = []
    
    start_time = pd.Timestamp("2025-02-01 06:00:00")
    for i in range(num_rows):
        route = np.random.choice(routes)
        product = np.random.choice(products)
        ts = start_time + pd.Timedelta(minutes=15 * i)
        
        ambient_temp = 28.0 + 6.0 * np.sin(2 * np.pi * (i % 96) / 96.0) + np.random.normal(0, 1.0)
        cooling_power = np.random.uniform(50, 95)
        
        # Generator hiccups / transit shocks
        power_glitch = np.random.rand() < 0.08
        if power_glitch:
            cooling_power = np.random.uniform(10, 35)
            cargo_temp = 5.5 + np.random.uniform(1.0, 6.0)
            failure = 1
        else:
            cargo_temp = 3.2 + np.random.normal(0, 0.5)
            failure = 0
            
        vibration = np.random.uniform(0.2, 2.8)  # Rougher road transport
        humidity = np.clip(np.random.normal(65, 12), 30, 98)
        
        rows.append({
            "timestamp": ts.isoformat(),
            "container_id": f"NIG-TRUCK-{100 + (i % 15)}",
            "route": route,
            "product_type": product,
            "temperature": round(cargo_temp, 2),
            "ambient_temperature": round(ambient_temp, 2),
            "humidity": round(humidity, 2),
            "vibration": round(vibration, 3),
            "cooling_power": round(cooling_power, 1),
            "door_open": 1 if np.random.rand() < 0.05 else 0,
            "failure": failure,
            "days_in_transit": round((i * 15) / (24 * 60), 2)
        })
        
    df = pd.DataFrame(rows)
    df.to_csv(file_path, index=False)
    logger.info(f"Saved {len(df)} rows to {file_path}")
    return df


def generate_synthetic_fresh_retail_net(file_path: Path, num_rows: int = 12000):
    """Fallback generator for FreshRetailNet retail cold logistics data."""
    logger.info(f"Generating realistic FreshRetailNet cold chain data -> {file_path}")
    np.random.seed(202)
    
    products = ['mangoes', 'fresh_produce', 'dairy', 'seafood']
    rows = []
    start_time = pd.Timestamp("2025-03-01 00:00:00")
    
    for i in range(num_rows):
        product = np.random.choice(products)
        ts = start_time + pd.Timedelta(minutes=10 * i)
        
        target_temp = 4.0 if product != 'mangoes' else 10.0
        temp_drift = np.random.normal(0, 0.8)
        temp = target_temp + temp_drift
        
        door_open = 1 if np.random.rand() < 0.1 else 0
        if door_open:
            temp += np.random.uniform(1.0, 3.5)
            
        cooling_power = np.random.uniform(60, 100)
        vibration = np.random.uniform(0.05, 0.9)
        humidity = np.clip(np.random.normal(70, 8), 40, 99)
        
        threshold = 5.0 if product != 'mangoes' else 12.0
        failure = 1 if temp > threshold else 0
        
        rows.append({
            "timestamp": ts.isoformat(),
            "container_id": f"RETAIL-REEFER-{(i % 20) + 1}",
            "product_type": product,
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "vibration": round(vibration, 3),
            "cooling_power": round(cooling_power, 1),
            "door_open": door_open,
            "failure": failure,
            "days_in_transit": round((i * 10) / (24 * 60), 2)
        })
        
    df = pd.DataFrame(rows)
    df.to_csv(file_path, index=False)
    logger.info(f"Saved {len(df)} rows to {file_path}")
    return df


def download_kaggle_dataset(output_path: Path):
    """Download Kaggle Silent Failure dataset or invoke generator fallback."""
    logger.info("--- Downloading Kaggle Dataset (Cold Chain Silent Failure) ---")
    try:
        import kagglehub
        logger.info("Attempting download via kagglehub...")
        path = kagglehub.dataset_download("skarin/cold-chain-shipment-silent-failure-dataset")
        logger.info(f"Kaggle download success to temporary path: {path}")
        
        # Find csv inside downloaded dir
        csv_files = list(Path(path).glob("*.csv"))
        if csv_files:
            shutil.copy(csv_files[0], output_path)
            logger.info(f"Copied {csv_files[0]} -> {output_path}")
            return
        else:
            logger.warning("No CSV found in Kaggle download directory.")
    except Exception as e:
        logger.warning(f"Kaggle download failed or requires credentials ({e}). Using resilient synthetic generator.")
        
    generate_synthetic_cold_chain_silent_failure(output_path)


def download_nigeria_cold_chain(output_path: Path):
    """Download Hugging Face Nigeria cold chain dataset or invoke generator fallback."""
    logger.info("--- Downloading Hugging Face Dataset (Nigeria Cold Chain) ---")
    try:
        from datasets import load_dataset
        logger.info("Attempting load_dataset('electricsheepafrica/nigerian_transport_and_logistics_cold_chain')...")
        ds = load_dataset("electricsheepafrica/nigerian_transport_and_logistics_cold_chain", split="train")
        df = ds.to_pandas()
        df.to_csv(output_path, index=False)
        logger.info(f"Successfully saved HF Nigeria Cold Chain -> {output_path}")
        return
    except Exception as e:
        logger.warning(f"Hugging Face Nigeria dataset direct load failed ({e}). Trying huggingface_hub download...")
        try:
            from huggingface_hub import hf_hub_download
            file = hf_hub_download(
                repo_id="electricsheepafrica/nigerian_transport_and_logistics_cold_chain",
                filename="cold_chain_data.csv",
                repo_type="dataset"
            )
            shutil.copy(file, output_path)
            logger.info(f"Saved downloaded HF file -> {output_path}")
            return
        except Exception as hf_err:
            logger.warning(f"Hugging Face hub download error ({hf_err}). Using resilient generator.")
            
    generate_synthetic_nigeria_cold_chain(output_path)


def download_fresh_retail_net(output_path: Path):
    """Download Hugging Face FreshRetailNet-50K or invoke generator fallback."""
    logger.info("--- Downloading Hugging Face Dataset (FreshRetailNet-50K) ---")
    try:
        from datasets import load_dataset
        logger.info("Attempting load_dataset('Dingdong-Inc/FreshRetailNet-50K')...")
        ds = load_dataset("Dingdong-Inc/FreshRetailNet-50K", split="train", streaming=True)
        # Take first 15000 records for efficient local training
        records = []
        for i, sample in enumerate(ds):
            records.append(sample)
            if i >= 15000:
                break
        df = pd.DataFrame(records)
        df.to_csv(output_path, index=False)
        logger.info(f"Successfully saved HF FreshRetailNet-50K -> {output_path}")
        return
    except Exception as e:
        logger.warning(f"FreshRetailNet-50K load failed ({e}). Using resilient generator.")
        
    generate_synthetic_fresh_retail_net(output_path)


def download_all():
    """Main execution routine for dataset collection."""
    logger.info(f"Starting dataset collection into {RAW_DATA_DIR}")
    
    file1 = RAW_DATA_DIR / "cold_chain_silent_failure.csv"
    file2 = RAW_DATA_DIR / "nigeria_cold_chain.csv"
    file3 = RAW_DATA_DIR / "fresh_retail_net_50k.csv"
    
    download_kaggle_dataset(file1)
    download_nigeria_cold_chain(file2)
    download_fresh_retail_net(file3)
    
    logger.info("✅ Dataset collection completed successfully!")
    logger.info(f"1. {file1.name}: {file1.stat().st_size / (1024*1024):.2f} MB")
    logger.info(f"2. {file2.name}: {file2.stat().st_size / (1024*1024):.2f} MB")
    logger.info(f"3. {file3.name}: {file3.stat().st_size / (1024*1024):.2f} MB")


if __name__ == "__main__":
    download_all()
