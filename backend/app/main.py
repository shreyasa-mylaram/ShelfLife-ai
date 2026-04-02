"""
SHELFLIFE AI - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.core.config import settings
from app.core.database import engine, Base
from app.api import shipments, sensors, alerts
from app.socket_manager import sio

# Import all models so they register with Base
from app.models import shipment, sensor, alert

# Create database tables
Base.metadata.create_all(bind=engine)

fastapi_app = FastAPI(
    title="ShelfLife AI API",
    description="Predictive container monitoring system for global trade",
    version="1.0.0",
    debug=settings.API_DEBUG
)

# CORS middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
fastapi_app.include_router(shipments.router, prefix="/api/shipments", tags=["shipments"])
fastapi_app.include_router(sensors.router,   prefix="/api/sensors",   tags=["sensors"])
fastapi_app.include_router(alerts.router,    prefix="/api/alerts",    tags=["alerts"])

@fastapi_app.get("/")
async def root():
    return {
        "message": "ShelfLife AI API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "backend"}

# Mount Socket.IO — the combined ASGI app uvicorn will serve
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)