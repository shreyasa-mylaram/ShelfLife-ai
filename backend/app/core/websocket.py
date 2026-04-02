 
"""
SHELFLIFE AI - WebSocket Manager
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, container_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        if container_id not in self.active_connections:
            self.active_connections[container_id] = set()
        self.active_connections[container_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, container_id: str):
        """Remove a WebSocket connection"""
        if container_id in self.active_connections:
            self.active_connections[container_id].discard(websocket)
            if not self.active_connections[container_id]:
                del self.active_connections[container_id]
    
    async def send_message(self, message: dict, container_id: str):
        """Send a message to all clients connected to a container"""
        if container_id in self.active_connections:
            for connection in self.active_connections[container_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast(self, message: dict):
        """Send a message to all connected clients"""
        for container_id in self.active_connections:
            await self.send_message(message, container_id)

manager = ConnectionManager()
