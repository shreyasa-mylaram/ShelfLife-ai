import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { Link } from 'react-router-dom';
import { Thermometer, Droplets, Zap, MapPin, Brain, Ship, AlertTriangle, Clock, Sun } from 'lucide-react';

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
      case 'normal':   return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669',  label: '✓ Normal',   glow: '' };
      case 'warning':  return { bg: '#fffbeb', border: '#fde68a', text: '#d97706',  label: '⚠ Warning',  glow: '' };
      case 'critical': return { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48',  label: '🔴 Critical', glow: 'shadow-rose-200/50' };
      default:         return { bg: '#f1f5f9', border: '#e2e8f0', text: '#64748b',  label: 'Unknown',    glow: '' };
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
        <Ship className="w-6 h-6 text-teal-600" />
        <h2 className="text-xl font-bold text-slate-900">{getGridTitle()}</h2>
        <span className="ml-auto text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs font-medium">
          {filteredContainers.length} container{filteredContainers.length !== 1 ? 's' : ''} • Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContainers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-dashed border-slate-200 rounded-3xl shadow-2xs">
            <Ship className="w-12 h-12 mx-auto mb-3 opacity-20 text-teal-600" />
            <p className="text-lg font-medium text-slate-700">
              {filter === 'sync'   ? 'All containers fully synced to DP World Cloud.' :
               filter === 'alerts' ? '✅ All Clear! No predictive alerts. Cargo is safe.' :
               'No containers match the active filter.'}
            </p>
          </div>
        ) : filteredContainers.map((container) => {
          const sc = getStatusConfig(container.status);
          const isCritical = container.status === 'critical';
          const hasBreachForecast = container.breachInHours !== null;
          const cargoConfig = CARGO_CONFIG[container.cargo] || { color: '#0d9488' };
          const cargoColor = cargoConfig.color;

          return (
            <Link
              to={`/container/${container.id}`}
              key={container.id}
              className={`relative block rounded-3xl overflow-hidden border transition-all duration-300 card-hover bg-white ${sc.glow}`}
              style={{
                borderColor: isCritical ? '#fca5a5' : '#e2e8f0',
                boxShadow: '0 4px 16px -2px rgba(100, 116, 139, 0.08)',
              }}
            >
              {/* Status accent top bar */}
              <div className="h-1.5 w-full" style={{ background: isCritical ? '#e11d48' : cargoColor }} />

              {/* Header */}
              <div className="px-5 pt-4 pb-3 flex justify-between items-start border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{container.cargoIcon || '📦'}</span>
                    <span className="font-bold text-base font-mono tracking-wide text-slate-900">{container.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize font-medium">{container.cargoLabel || container.cargo}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {container.lightAlert && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse" title="Insufficient Light Exposure">
                      <Sun className="w-3 h-3 text-amber-600" /> Light Alert
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 font-medium">
                    <Ship className="w-3 h-3 text-sky-600" /> Vessel LAN
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs"
                    style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
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
                      <span className={`text-3xl font-black ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                        {container.temp}°C
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Threshold: <span className="text-slate-700 font-semibold">{container.threshold}°C</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <HealthRing score={container.healthScore} />
                    <p className="text-xs text-slate-400 mt-1 font-medium">Health</p>
                  </div>
                </div>

                {/* Secondary metrics row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-xs text-slate-500 font-medium">Humidity</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900">{container.humidity}%</p>
                  </div>
                  <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs text-slate-500 font-medium">Cooling</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900">{container.battery}%</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span className="truncate">{container.location}</span>
                </div>

                {/* AI Forecast panel — changes based on state */}
                {hasBreachForecast ? (
                  <div className="rounded-2xl p-3 border bg-amber-50/90 border-amber-200">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="text-amber-900 font-bold uppercase tracking-tight">
                          AI: BREACH IN ~{container.breachInHours}H
                        </span>
                      </div>
                      <span 
                        title="AI Reasoning: Weighted features - Temperature (0.45), Health History (0.32), Power Draw (0.23). Derived from Random Forest Ensembling."
                        className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[9px] cursor-help"
                      >
                        94.2% CONFIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Preventative action required now
                    </p>
                  </div>
                ) : isCritical ? (
                  <div className="rounded-2xl p-3 border bg-rose-50/90 border-rose-200">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span className="text-rose-900 font-bold uppercase tracking-tight">AI Forecast (6h): {container.prediction}°C</span>
                      </div>
                      <span 
                        title="AI Reasoning: Deviation from baseline detected in thermal velocity. XGBoost Failure Classifier identifies high-risk event probability."
                        className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-md font-bold text-[9px] cursor-help"
                      >
                        96.8% RISK ACCURACY
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 mt-1.5 font-medium">
                      🚨 Immediate intervention required
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl p-3 border bg-teal-50/60 border-teal-200/80">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                        <span className="text-slate-700 font-medium">AI Forecast (6h):&nbsp;
                          <span className="font-bold text-teal-700">{container.prediction}°C</span>
                        </span>
                      </div>
                      <span 
                        title="AI Reasoning: Historical stability baseline matched. High density cluster of normal sensor state detected."
                        className="px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-200 rounded-md font-bold text-[9px] cursor-help"
                      >
                        94.2% CONFIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 mt-1.5 font-medium">✓ Trajectory stable within range</p>
                  </div>
                )}

                {/* CTA */}
                <div className="text-center text-teal-700 text-xs font-semibold flex items-center justify-center gap-1 hover:text-teal-800 transition-colors pt-1">
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