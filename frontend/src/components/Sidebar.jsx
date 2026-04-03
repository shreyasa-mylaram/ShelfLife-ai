import { NavLink } from 'react-router-dom';
import { useContainers } from '../context/ContainerContext';
import { LayoutGrid, BarChart3, Settings2, ShieldCheck, Globe, Ship, Zap, AlertOctagon, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ onClose }) => {
  const { containers, triggerAnomaly } = useContainers();
  const criticalCount = containers.filter(c => c.status === 'critical').length;
  const avgHealth = containers.length ? Math.round(containers.reduce((s, c) => s + c.healthScore, 0) / containers.length) : 100;

  const navItems = [
    { name: 'Fleet Overview', path: '/', icon: <LayoutGrid className="w-5 h-5 mr-3" /> },
    { name: 'Predictive Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5 mr-3" /> },
    { name: 'System Settings', path: '/settings', icon: <Settings2 className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-dark-card border-r border-white/5 text-white min-h-screen flex flex-col pt-4">
      
      {/* DP World Branded Logo Section */}
      <div className="px-6 pb-8 border-b border-white/5 mb-6 relative">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-0 right-4 p-2 text-gray-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Ship className="w-6 h-6 text-dark" />
          </div>
          <div>
             <h1 className="text-lg font-black tracking-tighter leading-none text-white">ShelfLife AI</h1>
             <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1">DP WORLD</p>
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
                    ? "bg-gradient-to-r from-blue-600/20 to-blue-600/5 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`
                }
              >
                {/* Active Indicator Dot */}
                <NavLink
                  to={item.path}
                >
                  {({ isActive }) => isActive && (
                    <motion.div layoutId="nav-dot" className="absolute -left-1 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  )}
                </NavLink>

                {item.icon}
                <span className="text-sm font-bold tracking-tight">{item.name}</span>
                {item.path === '/' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00d4aa]" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Identity & Status */}
      <div className="p-4 mx-3 mb-6 bg-white/3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center border border-white/10 overflow-hidden">
            <span className="font-bold text-[10px] text-white">DP</span>
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white leading-none">Global Terminal</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Fleet Operator 01</p>
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-white/10">
           <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Global Nodes</span>
              <span className="text-green-400">100% ONLINE</span>
           </div>
           <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Security</span>
              <span className="text-primary flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> TRUST-V2</span>
           </div>
        </div>
      </div>

      {/* NEW: Fleet Pulse Widget */}
      <div className="px-3 mb-4">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
           <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Fleet Pulse</span>
              <span className="text-xs font-bold text-white">{avgHealth}% HP</span>
           </div>
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${avgHealth}%` }} />
           </div>
           <button 
             onClick={triggerAnomaly}
             className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] font-black text-red-500 transition-all flex items-center justify-center gap-2 group"
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
