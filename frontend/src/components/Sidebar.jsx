import { NavLink } from 'react-router-dom';
import { useContainers } from '../context/ContainerContext';
import { LayoutGrid, BarChart3, Settings2, ShieldCheck, Globe, Ship, Zap, AlertOctagon, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ onClose }) => {
  const { containers, triggerAnomaly } = useContainers();
  const avgHealth = containers.length ? Math.round(containers.reduce((s, c) => s + c.healthScore, 0) / containers.length) : 100;

  const navItems = [
    { name: 'Fleet Overview', path: '/', icon: <LayoutGrid className="w-5 h-5 mr-3" /> },
    { name: 'Predictive Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5 mr-3" /> },
    { name: 'System Settings', path: '/settings', icon: <Settings2 className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 text-slate-800 min-h-screen flex flex-col pt-4 shadow-sm">
      
      {/* DP World Branded Logo Section */}
      <div className="px-6 pb-6 border-b border-slate-100 mb-5 relative">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-0 right-4 p-2 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shadow-sm">
            <Ship className="w-5 h-5 text-teal-700" />
          </div>
          <div>
             <h1 className="text-lg font-black tracking-tighter leading-none text-slate-900">ShelfLife AI</h1>
             <p className="text-[10px] uppercase tracking-widest text-teal-600 font-bold mt-1">DP WORLD</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                    ? "bg-teal-50/90 text-teal-700 border border-teal-200/80 font-bold shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  }`
                }
              >
                {/* Active Indicator Dot */}
                <NavLink
                  to={item.path}
                >
                  {({ isActive }) => isActive && (
                    <motion.div layoutId="nav-dot" className="absolute -left-1 w-1.5 h-6 bg-teal-600 rounded-r-full" />
                  )}
                </NavLink>

                {item.icon}
                <span className="text-sm tracking-tight">{item.name}</span>
                {item.path === '/' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-sm" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Identity & Status */}
      <div className="p-4 mx-3 mb-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
            DP
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 leading-none">Global Terminal</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Fleet Operator 01</p>
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-slate-200/60">
           <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Global Nodes</span>
              <span className="text-emerald-600">100% ONLINE</span>
           </div>
           <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Security</span>
              <span className="text-teal-700 flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> TRUST-V2</span>
           </div>
        </div>
      </div>

      {/* NEW: Fleet Pulse Widget */}
      <div className="px-3 mb-4">
        <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4">
           <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Fleet Pulse</span>
              <span className="text-xs font-bold text-slate-900">{avgHealth}% HP</span>
           </div>
           <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-teal-600 transition-all duration-1000" style={{ width: `${avgHealth}%` }} />
           </div>
           <button 
             onClick={triggerAnomaly}
             className="w-full py-2 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-[10px] font-black text-rose-600 transition-all flex items-center justify-center gap-2 group shadow-sm"
           >
              <AlertOctagon className="w-3.5 h-3.5 group-hover:animate-pulse" />
              DEMO: INJECT ANOMALY
           </button>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;
