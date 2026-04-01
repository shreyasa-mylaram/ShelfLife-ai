// Temperature formatting
export const formatTemperature = (temp) => {
  return `${temp.toFixed(1)}°C`;
};

// Date formatting
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
};

// Status formatting
export const getStatusColor = (status) => {
  switch(status.toLowerCase()) {
    case 'normal':
      return 'text-green-500 bg-green-500/10 border-green-500';
    case 'warning':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
    case 'critical':
      return 'text-red-500 bg-red-500/10 border-red-500';
    default:
      return 'text-primary bg-primary/10 border-primary';
  }
};

export const getStatusIcon = (status) => {
  switch(status.toLowerCase()) {
    case 'normal':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'critical':
      return '🔴';
    default:
      return '📦';
  }
};

// Battery status
export const getBatteryColor = (battery) => {
  if (battery > 70) return 'bg-green-500';
  if (battery > 30) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Humidity formatting
export const formatHumidity = (humidity) => {
  return `${humidity}% RH`;
};

// Container status
export const getContainerStatus = (temp, threshold) => {
  if (temp > threshold + 1) return 'critical';
  if (temp > threshold) return 'warning';
  return 'normal';
};

// Number formatting with units
export const formatNumber = (num, decimals = 0) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  return num.toString();
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};
