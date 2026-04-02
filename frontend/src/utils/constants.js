// API Endpoints
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8000';

// Temperature thresholds
export const TEMP_THRESHOLDS = {
  PHARMACEUTICALS: 4.0,
  FRESH_PRODUCE: 4.0,
  SEAFOOD: 4.0,
  VACCINES: 4.0,
  DAIRY: 4.0,
  DEFAULT: 4.0
};

// Status codes
export const STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

// Colors
export const COLORS = {
  primary: '#00d4aa',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#0a2b3e',
  darkLighter: '#1e3a4a',
  darkCard: '#1e2f3a',
  darkHeader: '#0f2f3f'
};

// Chart colors
export const CHART_COLORS = {
  temperature: '#00d4aa',
  threshold: '#ffaa44',
  humidity: '#3b82f6',
  battery: '#10b981'
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  FAST: 5000,
  NORMAL: 10000,
  SLOW: 30000
};

// Container types
export const CONTAINER_TYPES = [
  { value: 'pharmaceuticals', label: 'Pharmaceuticals', threshold: 4.0 },
  { value: 'fresh_produce', label: 'Fresh Produce', threshold: 4.0 },
  { value: 'seafood', label: 'Seafood', threshold: 4.0 },
  { value: 'vaccines', label: 'Vaccines', threshold: 4.0 },
  { value: 'dairy', label: 'Dairy', threshold: 4.0 }
];

// Locations
export const LOCATIONS = [
  'Arabian Sea',
  'Indian Ocean',
  'DPW Mumbai Terminal',
  'South China Sea',
  'Offline Mode - Dead Zone',
  'Singapore Port',
  'Dubai Port',
  'Rotterdam Terminal'
];

// Notification messages
export const NOTIFICATIONS = {
  TEMP_WARNING: (containerId, temp) => `⚠️ ${containerId}: Temperature at ${temp}°C - Approaching threshold`,
  TEMP_CRITICAL: (containerId, temp) => `🔴 ${containerId}: CRITICAL! Temperature at ${temp}°C - Immediate action required`,
  CONNECTION_LOST: '📡 Connection lost. Entering offline mode...',
  CONNECTION_RESTORED: '📶 Connection restored. Syncing data...',
  SYNC_COMPLETE: '✅ Data sync complete. Audit trail updated.'
};
