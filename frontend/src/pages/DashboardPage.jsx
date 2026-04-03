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
import { Shield, Cpu, CloudOff, Brain, TrendingDown, Zap } from 'lucide-react';
import ShipmentMap from '../components/ShipmentMap';

const HeroBanner = ({ containers, isOnline }) => {
  const criticalCount = containers.filter(c => c.status === 'critical').length;
  const warningCount  = containers.filter(c => c.status === 'warning').length;
  const avgHealth = containers.length
    ? Math.round(containers.reduce((s, c) => s + (c.healthScore || 80), 0) / containers.length)
    : 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,170,0.12) 0%, rgba(10,30,42,0.98) 60%, rgba(59,130,246,0.08) 100%)',
        border: '1px solid rgba(0,212,170,0.2)',
      }}
    >
      {/* Scanline texture */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,170,0.012) 2px, rgba(0,212,170,0.012) 4px)',
        }} />

      <div className="relative px-6 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Left: Title + Tagline */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ShelfLife AI — Predictive Cold Chain Platform</h2>
                <p className="text-xs text-gray-400">Solving $18B annual cargo spoilage · 100% Offline-First · Edge AI</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-xl mt-3 leading-relaxed">
              Forecasting spoilage <span className="text-primary font-semibold">6 hours before it happens</span>, running completely offline on containers across open-ocean shipping routes. No internet required.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: Cpu,         label: 'Edge AI Engine',     color: 'text-primary',    bg: 'rgba(0,212,170,0.1)',  border: 'rgba(0,212,170,0.25)' },
                { icon: CloudOff,    label: '100% Offline-First', color: 'text-blue-400',   bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
                { icon: Shield,      label: 'Zero Data Loss',     color: 'text-green-400',  bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
                { icon: TrendingDown,label: '32x ROI',            color: 'text-yellow-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
              ].map(({ icon: Icon, label, color, bg, border }) => (
                <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-3 h-3" />{label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live Fleet Stats */}
          <div className="flex gap-4 flex-wrap">
            <div className="hidden md:block text-right pr-4 border-r border-white/5">
               <p className="text-[10px] text-gray-500 font-black uppercase">Edge Compute Status</p>
               <p className="text-xs text-primary font-bold">NODE_HUB_01 :: OPTIMAL (99.8%)</p>
            </div>
            <div className="text-center px-5 py-3 rounded-xl bg-white/4 border border-white/7">
              <p className="text-2xl font-bold text-primary">{avgHealth}%</p>
              <p className="text-xs text-gray-400 mt-0.5">Fleet Health</p>
            </div>
            {criticalCount > 0 && (
              <div className="text-center px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 pulse-critical">
                <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
                <p className="text-xs text-red-400/70 mt-0.5">Critical</p>
              </div>
            )}
            {warningCount > 0 && (
              <div className="text-center px-5 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
                <p className="text-xs text-yellow-400/70 mt-0.5">Warning</p>
              </div>
            )}
            <div className="text-center px-5 py-3 rounded-xl bg-white/4 border border-white/7">
              <p className="text-2xl font-bold text-green-400">$9B</p>
              <p className="text-xs text-gray-400 mt-0.5">Industry Impact</p>
            </div>
          </div>
        </div>

        {/* Bottom: DP World integration chips */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-2 items-center">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-gray-500">Integrates with:</span>
          {['DP World CARGOES Flow', 'DP World Stablecoin Insurance', 'Port Community Systems', 'InfluxDB · PostgreSQL · Redis'].map(t => (
            <span key={t} className="text-xs text-gray-400 bg-white/4 px-2.5 py-1 rounded-full border border-white/8">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const { containers, isOnline, pendingSyncCount, forceSync } = useContainers();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState('all');

  useWebSocket('container-update', (data) => {
    setLastUpdate(new Date());
  });

  useWebSocket('alert', (alert) => {
    if (alert.type === 'warning') {
      toast(NOTIFICATIONS.TEMP_WARNING(alert.containerId, alert.temp), { icon: '⚠️', duration: 5000 });
    } else if (alert.type === 'critical') {
      toast.error(NOTIFICATIONS.TEMP_CRITICAL(alert.containerId, alert.temp), { duration: 10000 });
    }
  });

  useEffect(() => {
    if (!isOnline) {
      toast('🌊 Entering connectivity dead zone. Edge AI active.', { icon: '📡', duration: 3000 });
    } else if (pendingSyncCount > 0) {
      toast.success('📶 Connectivity restored. Syncing audit trail...', { duration: 3000 });
    }
  }, [isOnline]);

  // Auto-update lastUpdate when containers change
  useEffect(() => { setLastUpdate(new Date()); }, [containers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 relative overflow-hidden">
        
        {/* Step 3: Offline Mode Scanning Overlay */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              key="offline-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-none border-[16px] border-yellow-500/10"
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(245,158,11,0.05) 100%)',
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/20 animate-scanline shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-yellow-500/90 text-dark font-black text-xs tracking-[0.2em] rounded-full shadow-2xl flex items-center gap-3">
                 <CloudOff className="w-4 h-4" /> 📡 EDGE AUTO-SURVIVAL MODE ACTIVE — NO CLOUD REQUIRED
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

          {/* Hero Banner */}
          <HeroBanner containers={containers} isOnline={isOnline} />

          {/* Stats + Filter Cards */}
          <StatsCards activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {/* Fleet Grid — filterable */}
          <FleetGrid filter={activeFilter} />

          {/* Predictive Fleet Map */}
          <div className="mb-8">
            <ShipmentMap containers={containers} />
          </div>

          {/* AI Forecast Chart */}
          <TemperatureChart />

          {/* Audit Trail */}
          <AuditTrail />

          {/* Floating Sync Button */}
          <AnimatePresence>
            {pendingSyncCount > 0 && isOnline && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed bottom-8 right-8"
              >
                <button
                  onClick={forceSync}
                  className="px-6 py-3 bg-primary text-dark font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 animate-glow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync {pendingSyncCount} batch{pendingSyncCount > 1 ? 'es' : ''} to Cloud
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Last update footer */}
          <div className="mt-6 text-center text-xs text-gray-600">
            Live data · Last polled {lastUpdate.toLocaleTimeString()} · Edge AI Engine active
            {!isOnline && <span className="ml-2 text-yellow-500">· Offline Mode (SQLite cache)</span>}
          </div>
        </div>
    </div>
  );
};

export default DashboardPage;
