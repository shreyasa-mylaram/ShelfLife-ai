"""
SHELFLIFE AI - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import shipments, sensors, alerts

# Import all models so they register with Base
from app.models import shipment, sensor, alert

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShelfLife AI API",
    description="Predictive container monitoring system for global trade",
    version="1.0.0",
    debug=settings.API_DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(shipments.router, prefix="/api/shipments", tags=["shipments"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["sensors"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])

@app.get("/")
async def root():
    return {
        "message": "ShelfLife AI API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "backend"}