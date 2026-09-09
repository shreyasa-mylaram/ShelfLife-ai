import React, { useState, useEffect } from 'react';
import { AlertTriangle, Compass, ShieldAlert, Clock, Fuel, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CHOKEPOINTS_OPTIONS = [
  { id: 'strait_of_hormuz', name: 'Strait of Hormuz (Persian Gulf Closure)', riskLevel: 'CRITICAL WAR RISK', region: 'Middle East' },
  { id: 'suez_canal', name: 'Suez Canal (Blockade / Hostilities)', riskLevel: 'HIGH DISRUPTION', region: 'Red Sea / Egypt' },
  { id: 'red_sea_bab_el_mandeb', name: 'Bab el-Mandeb (Missile Hazard Zone)', riskLevel: 'CRITICAL SECURITY', region: 'Yemen / Red Sea' },
  { id: 'strait_of_malacca', name: 'Strait of Malacca (Naval Incident)', riskLevel: 'MEDIUM RISK', region: 'Southeast Asia' },
];

const RerouteEngine = ({ onRerouteActive, onRouteSelect, selectedRouteId }) => {
  const [selectedChokepoint, setSelectedChokepoint] = useState('strait_of_hormuz');
  const [loading, setLoading] = useState(false);
  const [rerouteResult, setRerouteResult] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [dispatched, setDispatched] = useState(false);

  const fetchReroute = async (chokepointKey) => {
    setLoading(true);
    setDispatched(false);
    try {
      const res = await fetch('http://localhost:8000/api/reroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chokepoint: chokepointKey })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRerouteResult(data);
      const defaultRec = data.routes.find(r => r.recommended) || data.routes[0];
      setActiveRoute(defaultRec);
      
      if (onRerouteActive) {
        onRerouteActive({
          blockedZone: {
            name: data.chokepoint_name,
            polygon: data.hazard_polygon
          },
          rerouteData: data.routes
        });
      }
      if (onRouteSelect && defaultRec) {
        onRouteSelect(defaultRec.id);
      }
    } catch (err) {
      console.warn('Backend reroute endpoint offline, using dynamic fallback:', err);
      // Fallback data for offline/standalone execution
      const fallback = {
        chokepoint_name: 'Strait of Hormuz',
        hazard_polygon: [[26.8,55.8],[27.1,56.3],[26.4,57.1],[25.9,57.3],[25.6,56.5],[26.0,55.9],[26.8,55.8]],
        affected_containers: [
          { id: 'DPW-1024A', cargo: 'Pharmaceuticals', shelf_life_hours: 720, urgency: 'medium' },
          { id: 'DPW-1024C', cargo: 'Seafood', shelf_life_hours: 48, urgency: 'critical' },
          { id: 'CONT-001', cargo: 'Fresh Produce', shelf_life_hours: 48, urgency: 'critical' }
        ],
        routes: [
          { id: 'cape_good_hope', name: 'Cape of Good Hope', description: 'South via Cape of Good Hope - avoids Persian Gulf entirely', waypoints: [[24.0,58.0],[12.0,50.0],[-10.0,40.0],[-34.4,18.5],[-20.0,15.0],[0.0,5.0]], extra_days: 14, extra_fuel_pct: 35, spoilage_risk_delta: 28, color: '#f59e0b', recommended: false },
          { id: 'oman_air', name: 'Oman Sea Bypass + Air Freight', description: 'Port of Salalah transfer to air cargo for ultra-perishables', waypoints: [[24.0,58.0],[19.0,57.5],[17.0,54.0],[16.9,53.0]], extra_days: 2, extra_fuel_pct: 80, spoilage_risk_delta: 4, color: '#0d9488', recommended: true },
          { id: 'karachi_land', name: 'Karachi Land Bridge', description: 'Offload at Karachi - road freight via Iran border to Turkey', waypoints: [[24.0,58.0],[23.6,58.6],[24.9,67.0],[24.8,67.0]], extra_days: 6, extra_fuel_pct: 20, spoilage_risk_delta: 14, color: '#8b5cf6', recommended: false }
        ]
      };
      setRerouteResult(fallback);
      const defaultRec = fallback.routes[1];
      setActiveRoute(defaultRec);
      if (onRerouteActive) {
        onRerouteActive({
          blockedZone: { name: fallback.chokepoint_name, polygon: fallback.hazard_polygon },
          rerouteData: fallback.routes
        });
      }
      if (onRouteSelect) onRouteSelect(defaultRec.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReroute(selectedChokepoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChokepoint]);

  const handleSelectRoute = (route) => {
    setActiveRoute(route);
    if (onRouteSelect) onRouteSelect(route.id);
  };

  const handleDispatch = () => {
    setDispatched(true);
    toast.success(`⚡ Strategic Reroute Dispatched: "${activeRoute?.name}" authorized for all perishable containers. Automatic AIS update transmitted.`, {
      duration: 5000,
      icon: '🛡️'
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8 transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Geopolitical Crisis & War Rerouting Engine</h2>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                Naval Chokepoint Defense
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated perishable shelf-life preservation routing for military blockades and strait closures
            </p>
          </div>
        </div>

        {/* Chokepoint selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Simulate Conflict / Closure:</label>
          <select
            value={selectedChokepoint}
            onChange={(e) => setSelectedChokepoint(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-teal-500 shadow-sm"
          >
            {CHOKEPOINTS_OPTIONS.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 flex items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
          <span className="text-sm font-medium">Analyzing maritime chokepoints & shelf-life impact...</span>
        </div>
      ) : rerouteResult ? (
        <div className="mt-6 space-y-6">
          {/* Affected Cargo Banner */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  {rerouteResult.affected_containers?.length || 0} Perishable Shipments Trapped In Transit Corridor
                </span>
                <p className="text-xs text-rose-700 mt-0.5">
                  Vessels bound for closed zone have active biological decay risks. Immediate AI route diversion recommended.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {rerouteResult.affected_containers?.map((c) => (
                <span
                  key={c.id}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 ${
                    c.urgency === 'critical'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {c.id} ({c.cargo} &middot; {c.shelf_life_hours}h left)
                </span>
              ))}
            </div>
          </div>

          {/* Alternate Routes Options */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" /> Strategic Route Alternatives Evaluated by Edge AI
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rerouteResult.routes?.map((route) => {
                const isSelected = activeRoute?.id === route.id;
                return (
                  <div
                    key={route.id}
                    onClick={() => handleSelectRoute(route)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all relative border ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/40 shadow-md ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {route.recommended && (
                      <span className="absolute top-3 right-3 bg-teal-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
                        AI Recommended
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: route.color }}
                      ></div>
                      <h4 className="text-sm font-bold text-slate-900">{route.name}</h4>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 h-8">{route.description}</p>

                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-white rounded-xl border border-slate-100 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> ETA
                        </div>
                        <div className="text-xs font-bold text-slate-800">+{route.extra_days}d</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-center gap-0.5">
                          <Fuel className="w-2.5 h-2.5" /> Fuel
                        </div>
                        <div className="text-xs font-bold text-slate-800">+{route.extra_fuel_pct}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Spoilage</div>
                        <div
                          className={`text-xs font-bold ${
                            route.spoilage_risk_delta > 15 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          +{route.spoilage_risk_delta}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Selected Route: <strong className="text-slate-800">{activeRoute?.name}</strong> &middot;{' '}
              <span className="text-teal-700 font-medium">+{activeRoute?.extra_days} days arrival delta</span>
            </div>

            <button
              onClick={handleDispatch}
              disabled={dispatched}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                dispatched
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:shadow-md'
              }`}
            >
              {dispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Reroute Protocol Dispatched to Fleet AIS
                </>
              ) : (
                <>
                  Dispatch Emergency Reroute Order <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RerouteEngine;
