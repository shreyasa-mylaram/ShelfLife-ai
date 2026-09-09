import React from 'react';
import { Link } from 'react-router-dom';
import { useContainers } from '../context/ContainerContext';
import { AlertTriangle, ShieldCheck, Activity, Zap, Radio } from 'lucide-react';

const RightSidebar = () => {
  const { containers } = useContainers();

  const alertContainers = containers.filter(c => c.status !== 'normal');

  return (
    <aside className="w-72 bg-white border-l border-slate-200 min-h-screen flex flex-col p-4 gap-5 shrink-0 shadow-xs hidden xl:flex">
      
      {/* Header Widget */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            Tactical Operations
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {containers.length} Nodes
        </span>
      </div>

      {/* Critical Attention Stream */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Active Exceptions
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${alertContainers.length ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {alertContainers.length ? `${alertContainers.length} At Risk` : 'All Clear'}
          </span>
        </div>

        <div className="space-y-2">
          {alertContainers.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-emerald-900">Zero Thermal Breaches</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">All cargo operating within safe stability limits.</p>
            </div>
          ) : (
            alertContainers.map((c) => (
              <Link
                to={`/container/${c.id}`}
                key={c.id}
                className="block p-3 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-all hover:shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                    {c.id}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">{c.cargo}</span>
                  <span className="font-bold text-rose-600">{c.temp}°C</span>
                </div>
                {c.breachInHours && (
                  <div className="mt-1 text-[10px] font-bold text-rose-600/90 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Spoilage threat in {c.breachInHours}h
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Fleet Rapid Switcher */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-teal-600" />
            Fleet Roster
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Quick Telemetry</span>
        </div>

        <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {containers.map((c) => (
            <Link
              to={`/container/${c.id}`}
              key={c.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${c.status === 'normal' ? 'bg-emerald-500' : c.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`} />
                <div>
                  <div className="font-mono font-bold text-slate-800 leading-none">{c.id}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.cargo}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-700">{c.temp}°C</div>
                <div className="text-[10px] text-teal-700 font-semibold">{c.healthScore || 85}% HP</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ship Local Network Status Footer */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
          <span>Ship LAN Telemetry</span>
          <span className="text-emerald-600">Connected</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-teal-600 w-full" />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Vessel Local Area Network &middot; AIS Bridge Operational
        </p>
      </div>

    </aside>
  );
};

export default RightSidebar;
