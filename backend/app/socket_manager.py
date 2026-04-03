"""
SHELFLIFE AI - Socket.IO Manager
Provides real-time WebSocket support for live container sensor updates and alert pushes.
"""

import socketio
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Create async Socket.IO server (ASGI-compatible)
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

connected_clients = {}

@sio.event
async def connect(sid, environ):
    connected_clients[sid] = {'connected_at': datetime.now().isoformat()}
    logger.info(f"Client connected: {sid}")
    await sio.emit('server:welcome', {'message': 'ShelfLife AI real-time stream connected', 'sid': sid}, to=sid)

@sio.event
async def disconnect(sid):
    connected_clients.pop(sid, None)
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def client_ready(sid, data):
    logger.info(f"Client ready: {sid}")

@sio.event
async def client_join_container(sid, data):
    container_id = data.get('containerId')
    if container_id:
        await sio.enter_room(sid, f'container_{container_id}')
        logger.info(f"Client {sid} joined room: container_{container_id}")

@sio.event
async def client_leave_container(sid, data):
    container_id = data.get('containerId')
    if container_id:
        await sio.leave_room(sid, f'container_{container_id}')

async def broadcast_container_update(container_data: dict):
    """Broadcast sensor update to all connected clients."""
    await sio.emit('server:container-update', container_data)

async def broadcast_alert(alert_data: dict):
    """Broadcast a new alert event to all connected clients."""
    await sio.emit('server:alert', alert_data)

async def broadcast_prediction(prediction_data: dict):
    """Broadcast ML prediction to all connected clients."""
    await sio.emit('server:prediction', prediction_data)
