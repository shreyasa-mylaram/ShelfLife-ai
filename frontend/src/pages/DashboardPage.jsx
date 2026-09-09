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
import { Shield, Cpu, Ship, Brain, TrendingDown, Zap, Compass, LineChart, FileText, LayoutGrid } from 'lucide-react';
import ShipmentMap from '../components/ShipmentMap';
import RerouteEngine from '../components/RerouteEngine';

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
      className="mb-8 rounded-3xl overflow-hidden relative shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #eff6ff 100%)',
        border: '1px solid #ccfbf1',
      }}
    >
      <div className="relative px-6 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Left: Title + Tagline */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-100/70 flex items-center justify-center border border-teal-200 shadow-xs">
                <Brain className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">ShelfLife AI — Vessel Cold Chain Platform</h2>
                <p className="text-xs text-slate-500 font-medium">Solving $18B annual cargo spoilage · Vessel Local Area Network · Marine Intelligence</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 max-w-xl mt-3 leading-relaxed">
              Forecasting spoilage <span className="text-teal-700 font-bold">6 hours before it happens</span>, operating seamlessly over the ship's local network across open-ocean voyages.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: Cpu,         label: 'Shipboard AI Core',     color: 'text-teal-800',   bg: '#f0fdfa', border: '#99f6e4' },
                { icon: Ship,        label: 'Vessel Local Network',  color: 'text-sky-800',    bg: '#f0f9ff', border: '#bae6fd' },
                { icon: Shield,      label: 'Continuous Telemetry',  color: 'text-emerald-800',bg: '#ecfdf5', border: '#a7f3d0' },
                { icon: TrendingDown,label: '32x ROI Preservation',  color: 'text-amber-800',  bg: '#fffbeb', border: '#fde68a' },
              ].map(({ icon: Icon, label, color, bg, border }) => (
                <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color} shadow-2xs`}
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-3 h-3" />{label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live Fleet Stats */}
          <div className="flex gap-3 flex-wrap">
            <div className="hidden md:block text-right pr-4 border-r border-slate-200">
               <p className="text-[10px] text-slate-400 font-black uppercase">Ship LAN Status</p>
               <p className="text-xs text-teal-700 font-bold">VESSEL_LAN_01 :: OPTIMAL (100%)</p>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-black text-teal-700">{avgHealth}%</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Fleet Health</p>
            </div>
            {criticalCount > 0 && (
              <div className="text-center px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
                <p className="text-2xl font-black text-rose-600">{criticalCount}</p>
                <p className="text-[11px] text-rose-600/80 font-semibold mt-0.5">Critical</p>
              </div>
            )}
            {warningCount > 0 && (
              <div className="text-center px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
                <p className="text-2xl font-black text-amber-600">{warningCount}</p>
                <p className="text-[11px] text-amber-700/80 font-semibold mt-0.5">Warning</p>
              </div>
            )}
            <div className="text-center px-4 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-black text-emerald-600">$9B</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Industry Impact</p>
            </div>
          </div>
        </div>

        {/* Bottom: DP World integration chips */}
        <div className="mt-5 pt-4 border-t border-teal-100/60 flex flex-wrap gap-2 items-center">
          <Zap className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-xs text-slate-500 font-medium">Integrates with:</span>
          {['DP World CARGOES Flow', 'DP World Stablecoin Insurance', 'Port Community Systems', 'Shipboard AIS & NMEA'].map(t => (
            <span key={t} className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 font-medium shadow-2xs">{t}</span>
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
  const [activeTab, setActiveTab] = useState('overview');
  const [rerouteState, setRerouteState] = useState({ blockedZone: null, rerouteData: [] });
  const [selectedRouteId, setSelectedRouteId] = useState(null);

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
    // Normal container update hook
  }, [isOnline, pendingSyncCount]);

  // Auto-update lastUpdate when containers change
  useEffect(() => { setLastUpdate(new Date()); }, [containers]);

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

          {/* Hero Banner */}
          <HeroBanner containers={containers} isOnline={isOnline} />

          {/* Stats + Filter Cards */}
          <StatsCards activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {/* Clean Segmented Workspace Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'overview', label: 'Fleet & Map View', icon: LayoutGrid, count: containers.length },
                { id: 'reroute',  label: 'Crisis & Reroute Engine', icon: Compass, badge: 'WAR DEFENSE' },
                { id: 'forecast', label: 'AI Thermal Forecaster', icon: LineChart },
                { id: 'audit',    label: 'Immutable Audit Trail', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${isActive ? 'bg-teal-700/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black tracking-wide ${isActive ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400 font-medium px-2 hidden sm:block">
              {activeTab === 'overview' && 'Displaying active containers & maritime telemetry'}
              {activeTab === 'reroute'  && 'Evaluating chokepoints & shelf-life survival options'}
              {activeTab === 'forecast' && '6-hour predictive thermal decay models'}
              {activeTab === 'audit'    && 'Cryptographically signed chain of custody'}
            </div>
          </div>

          {/* Section 1: Fleet & Map Overview */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Map */}
              <ShipmentMap 
                containers={containers} 
                blockedZone={rerouteState.blockedZone}
                rerouteData={rerouteState.rerouteData}
                selectedRouteId={selectedRouteId}
              />
              {/* Fleet Grid */}
              <FleetGrid filter={activeFilter} />
            </motion.div>
          )}

          {/* Section 2: Crisis & Reroute Engine */}
          {activeTab === 'reroute' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ShipmentMap 
                containers={containers} 
                blockedZone={rerouteState.blockedZone}
                rerouteData={rerouteState.rerouteData}
                selectedRouteId={selectedRouteId}
              />
              <RerouteEngine 
                onRerouteActive={setRerouteState}
                onRouteSelect={setSelectedRouteId}
                selectedRouteId={selectedRouteId}
              />
            </motion.div>
          )}

          {/* Section 3: AI Thermal Forecaster */}
          {activeTab === 'forecast' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <TemperatureChart />
            </motion.div>
          )}

          {/* Section 4: Audit Trail */}
          {activeTab === 'audit' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <AuditTrail />
            </motion.div>
          )}

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
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 shadow-teal-600/20"
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
          <div className="mt-6 text-center text-xs text-slate-400">
            Live telemetry · Last cycle {lastUpdate.toLocaleTimeString()} · Vessel Local Network (Shipboard LAN)
            {!isOnline && <span className="ml-2 text-sky-700 font-semibold">· Shipboard Intranet Active</span>}
          </div>
        </div>
    </div>
  );
};

export default DashboardPage;
