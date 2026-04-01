import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContainers } from '../context/ContainerContext';
import StatsCards from '../components/StatsCards';
import FleetGrid from '../components/FleetGrid';
import TemperatureChart from '../components/TemperatureChart';
import AuditTrail from '../components/AuditTrail';
import { useWebSocket } from '../hooks/useWebSocket';
import toast from 'react-hot-toast';
import { NOTIFICATIONS } from '../utils/constants';

const DashboardPage = () => {
  const { containers, isOnline, pendingSyncCount, forceSync } = useContainers();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // WebSocket for real-time updates
  useWebSocket('container-update', (data) => {
    console.log('Real-time container update:', data);
    setLastUpdate(new Date());
  });

  useWebSocket('alert', (alert) => {
    // Show toast notification for alerts
    if (alert.type === 'warning') {
      toast(NOTIFICATIONS.TEMP_WARNING(alert.containerId, alert.temp), {
        icon: '⚠️',
        duration: 5000,
      });
    } else if (alert.type === 'critical') {
      toast.error(NOTIFICATIONS.TEMP_CRITICAL(alert.containerId, alert.temp), {
        duration: 10000,
      });
    }
  });

  // Connection status notifications
  useEffect(() => {
    if (!isOnline) {
      toast(NOTIFICATIONS.CONNECTION_LOST, {
        icon: '📡',
        duration: 3000,
      });
    } else {
      if (pendingSyncCount > 0) {
        toast.success(NOTIFICATIONS.CONNECTION_RESTORED, {
          duration: 3000,
        });
      }
    }
  }, [isOnline, pendingSyncCount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-dark to-dark/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Update Indicator */}
        <div className="mb-4 text-right text-sm text-gray-400">
          Last update: {lastUpdate.toLocaleTimeString()}
          {!isOnline && (
            <span className="ml-2 text-yellow-500">(Offline Mode)</span>
          )}
        </div>

        <StatsCards />
        <FleetGrid />
        <TemperatureChart />
        <AuditTrail />

        {/* Floating Sync Button */}
        {pendingSyncCount > 0 && isOnline && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-8 right-8"
          >
            <button
              onClick={forceSync}
              className="px-6 py-3 bg-primary text-dark font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 animate-pulse"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync {pendingSyncCount} batch{pendingSyncCount > 1 ? 'es' : ''}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardPage;
