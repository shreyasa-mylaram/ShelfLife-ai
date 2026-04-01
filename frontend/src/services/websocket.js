import { io } from 'socket.io-client';
import { WS_URL } from '../utils/constants';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('client:ready', { timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    // Setup default event handlers
    this.socket.on('server:container-update', (data) => {
      this.notifyListeners('container-update', data);
    });

    this.socket.on('server:alert', (data) => {
      this.notifyListeners('alert', data);
    });

    this.socket.on('server:prediction', (data) => {
      this.notifyListeners('prediction', data);
    });

    this.socket.on('server:sync-status', (data) => {
      this.notifyListeners('sync-status', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Emit events to server
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Join a specific container room
  joinContainer(containerId) {
    this.emit('client:join-container', { containerId });
  }

  // Leave a container room
  leaveContainer(containerId) {
    this.emit('client:leave-container', { containerId });
  }

  // Request historical data
  requestHistory(containerId, days = 7) {
    this.emit('client:request-history', { containerId, days });
  }

  // Acknowledge an alert
  acknowledgeAlert(alertId) {
    this.emit('client:acknowledge-alert', { alertId });
  }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;
