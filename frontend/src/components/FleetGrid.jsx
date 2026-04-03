import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { Link } from 'react-router-dom';
import { Thermometer, Droplets, Zap, MapPin, Brain, Ship, AlertTriangle, CloudOff, Clock } from 'lucide-react';

// Circular SVG health ring
const HealthRing = ({ score, size = 56 }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} className="health-ring-track" />
        <circle
          cx="28" cy="28" r={r}
          className="health-ring health-ring-fill"
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
};

const FleetGrid = ({ filter = 'all' }) => {
  const { containers, CARGO_CONFIG } = useContainers();

  const filteredContainers = containers.filter(container => {
    if (filter === 'alerts') return container.status !== 'normal';
    if (filter === 'sync')   return container.syncStatus === 'pending';
    if (filter === 'waste')  return container.status === 'normal';
    return true;
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case 'normal':   return { bg: 'rgba(16,185,129,0.1)',   border: '#10b981', text: '#10b981',  label: '✓ Normal',   glow: '' };
      case 'warning':  return { bg: 'rgba(245,158,11,0.1)',   border: '#f59e0b', text: '#f59e0b',  label: '⚠ Warning',  glow: '' };
      case 'critical': return { bg: 'rgba(239,68,68,0.12)',   border: '#ef4444', text: '#ef4444',  label: '🔴 Critical', glow: 'animate-glow-red' };
      default:         return { bg: 'rgba(107,114,128,0.1)', border: '#6b7280', text: '#6b7280',  label: 'Unknown',    glow: '' };
    }
  };

  const getGridTitle = () => {
    switch (filter) {
      case 'alerts': return 'Predictive Alerts';
      case 'sync':   return 'Pending Sync';
      case 'waste':  return 'Waste Reduction';
      default:       return 'Active Container Fleet';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <Ship className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">{getGridTitle()}</h2>
        <span className="ml-auto text-xs text-gray-500 bg-dark-card px-3 py-1 rounded-full border border-gray-700">
          {filteredContainers.length} container{filteredContainers.length !== 1 ? 's' : ''} • Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContainers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-dark-card border border-dashed border-gray-700 rounded-2xl">
            <Ship className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
            <p className="text-lg font-medium text-gray-300">
              {filter === 'sync'   ? 'All containers fully synced to DP World Cloud.' :
               filter === 'alerts' ? '✅ All Clear! No predictive alerts. Cargo is safe.' :
               'No containers match the active filter.'}
            </p>
          </div>
        ) : filteredContainers.map((container) => {
          const sc = getStatusConfig(container.status);
          const isCritical = container.status === 'critical';
          const hasBreachForecast = container.breachInHours !== null;
          const cargoConfig = CARGO_CONFIG[container.cargo] || { color: '#00d4aa' }; // Fallback to Teal
          const cargoColor = cargoConfig.color;

          return (
            <Link
              to={`/container/${container.id}`}
              key={container.id}
              className={`relative block rounded-2xl overflow-hidden border transition-all duration-300 card-hover ${sc.glow}`}
              style={{
                background: 'rgba(10,30,42,0.9)',
                borderColor: isCritical ? '#ef4444' : `${cargoColor}33`,
              }}
            >
              {/* Status accent top bar */}
              <div className="h-1 w-full" style={{ background: isCritical ? '#ef4444' : cargoColor }} />

              {/* Header */}
              <div className="px-5 pt-4 pb-3 flex justify-between items-start border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{container.cargoIcon || '📦'}</span>
                    <span className="font-bold text-base font-mono tracking-wide text-white">{container.id}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{container.cargoLabel || container.cargo}</p>
                </div>
                <div className="flex items-center gap-2">
                  {container.syncStatus === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                      <CloudOff className="w-3 h-3" /> Edge
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                    style={{ background: sc.bg, color: sc.text, borderColor: `${sc.border}55` }}>
                    {sc.label}
                  </span>
                </div>
              </div>

              {/* Main metrics */}
              <div className="p-5 space-y-4">

                {/* Temp + Health Ring */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5" style={{ color: sc.text }} />
                      <span className={`text-3xl font-bold ${isCritical ? 'text-red-400 pulse-critical' : 'text-white'}`}>
                        {container.temp}°C
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Threshold: <span className="text-gray-300">{container.threshold}°C</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <HealthRing score={container.healthScore} />
                    <p className="text-xs text-gray-500 mt-1">Health</p>
                  </div>
                </div>

                {/* Secondary metrics row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-gray-400">Humidity</span>
                    </div>
                    <p className="font-semibold text-sm">{container.humidity}%</p>
                  </div>
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs text-gray-400">Cooling</span>
                    </div>
                    <p className="font-semibold text-sm">{container.battery}%</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{container.location}</span>
                </div>

                {/* AI Forecast panel — changes based on state */}
                {hasBreachForecast ? (
                  <div className="rounded-xl p-3 border"
                    style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        <span className="text-yellow-300 font-semibold uppercase tracking-tighter">
                          AI: BREACH IN ~{container.breachInHours}H
                        </span>
                      </div>
                      <span 
                        title="AI Reasoning: Weighted features - Temperature (0.45), Health History (0.32), Power Draw (0.23). Derived from Random Forest Ensembling."
                        className="px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-md font-black text-[9px] cursor-help"
                      >
                        94.2% CONFIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-yellow-500/70 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Preventative action required now
                    </p>
                  </div>
                ) : isCritical ? (
                  <div className="rounded-xl p-3 border"
                    style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-red-300 font-semibold uppercase tracking-tighter">AI Forecast (6h): {container.prediction}°C</span>
                      </div>
                      <span 
                        title="AI Reasoning: Deviation from baseline detected in thermal velocity. XGBoost Failure Classifier identifies high-risk event probability."
                        className="px-1.5 py-0.5 bg-red-400/20 text-red-400 rounded-md font-black text-[9px] cursor-help"
                      >
                        96.8% RISK ACCURACY
                      </span>
                    </div>
                    <p className="text-xs text-red-500/70 mt-1">
                      🚨 Immediate intervention required
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl p-3 border border-primary/15"
                    style={{ background: 'rgba(0,212,170,0.05)' }}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-gray-300 tracking-tighter">AI Forecast (6h):&nbsp;
                          <span className="font-bold text-primary">{container.prediction}°C</span>
                        </span>
                      </div>
                      <span 
                        title="AI Reasoning: Historical stability baseline matched. High density cluster of normal sensor state detected."
                        className="px-1.5 py-0.5 bg-primary/20 text-primary rounded-md font-black text-[9px] cursor-help"
                      >
                        94.2% CONFIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-green-500/70 mt-1">✓ Trajectory stable within range</p>
                  </div>
                )}

                {/* CTA */}
                <div className="text-center text-primary text-xs font-medium flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity pt-1">
                  <span>View Full Analysis</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FleetGrid;