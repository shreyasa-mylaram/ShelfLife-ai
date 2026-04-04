# 🚢 ShelfLife AI - Predictive Cold Chain Monitoring
> **Ensuring Cargo Quality Through Edge Intelligence & Proactive Alerting**

![ShelfLife AI Banner](https://img.shields.io/badge/DP%20World-ShelfLife%20AI-00d4aa?style=for-the-badge&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![InfluxDB](https://img.shields.io/badge/InfluxDB-22ADF6?style=for-the-badge&logo=influxdb&logoColor=white)
![Edge AI](https://img.shields.io/badge/Edge%20AI-Proactive-blueviolet?style=for-the-badge)

## 🌎 The Problem
Each year, **$18 Billion** worth of perishable goods (pharmaceuticals, seafood, vaccines) are spoiled during ocean transit.
*   **Reactive Monitoring:** Current systems only alert operators *after* the temperature has already breached, leading to total cargo loss.
*   **Connectivity Dead Zones:** Most IoT solutions fail in the middle of the ocean where internet is unavailable.

## 🧠 The ShelfLife AI Solution
ShelfLife AI is an **Offline-First Predictive Monitoring Platform** that forecasts spoilage **6 hours before it happens**. 

1.  **Predictive Engine:** Uses Sinusoidal ML models to forecast temperature trajectory.
2.  **Offline-First Edge Nodes:** Runs locally on 100% offline Edge devices (Raspberry Pi/IoT Gateways) with SQLite caching.
3.  **Proactive Alerting:** Automatically sends multi-channel alerts (Twilio SMS/WhatsApp + SMTP Email) when the AI predicts a future breach.
4.  **Premium Fleet Control:** A high-fidelity DP World-branded dashboard for real-time fleet health visibility.

---

## 🛠️ Technical Architecture

### 1. Edge Layer (Simulation)
*   **Sinusoidal Simulator:** Generates realistic temperature wave patterns with Gaussian noise.
*   **Edge Sync Manager:** Handles data persistence during network "Dead Zones" and syncs to the cloud upon terminal entry.

### 2. Backend (FastAPI Core)
*   **FastAPI / Python 3.11:** High-performance asynchronous API handling.
*   **InfluxDB:** Time-series storage for 1,000,000+ sensor reading points.
*   **PostgreSQL:** Relational data for shipments, audit logs, and alert history.
*   **Twilio Service:** Integrated multi-channel notification routing.

### 3. Frontend (React + Framer Motion)
*   **Premium Glassmorphism UI:** Stunning, dark-themed dashboard with animated health rings.
*   **Live Charts (Chart.js):** Real-time thermal velocity visualization with 6-hour forecast lines.
*   **Fleet-wide Health Scoring:** Instant 0-100 quality metric per container.

---

## 🚀 Getting Started

### Prerequisites
*   Docker & Docker Compose

### Quick Run
```bash
# 1. Clone the repository
git clone https://github.com/your-username/ShelfLife-ai.git
cd ShelfLife-ai

# 2. Start the entire stack
docker-compose up --build
```

### Access Points
*   **Dashboard:**  https://shelflife-ai-frontend.onrender.com
*   **API Documentation:**  https://shelflife-ai-backend.onrender.com/docs
*   **InfluxDB Console:**  https://shelflife-ai-backend.onrender.com

---

## 💎 Hackathon Highlights (Completeness & Polish)
*   ✅ **Real-Time Simulation:** Temperatures oscillate realistically and trigger real alerts.
*   ✅ **Predictive Core:** System identifies "Future Critical" states and warns you early.
*   ✅ **Premium Aesthetics:** Every page (Dashboard, Analytics, Settings) is fully themed and polished.
*   ✅ **Business Impact:** Integrated $9B industry impact stats and ROI analysis.

---
**Developed for the DP World CARGOES Hackathon 2025**
