import { useEffect, useState, useCallback } from 'react';
import websocketService from '../services/websocket';

export const useWebSocket = (event, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket if not already connected
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    // Update connection status
    const checkConnection = setInterval(() => {
      setIsConnected(websocketService.isConnected());
    }, 1000);

    // Subscribe to event if provided
    if (event && onMessage) {
      websocketService.on(event, onMessage);
    }

    return () => {
      clearInterval(checkConnection);
      if (event && onMessage) {
        websocketService.off(event, onMessage);
      }
    };
  }, [event, onMessage]);

  const emit = useCallback((eventName, data) => {
    websocketService.emit(eventName, data);
  }, []);

  return { isConnected, emit };
};
