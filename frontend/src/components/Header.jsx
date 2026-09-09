import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContainers } from '../context/ContainerContext';
import { Wifi, UploadCloud, Zap, RefreshCw, ShieldCheck, Menu, ChevronRight, Ship } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onMenuClick }) => {
  const { isOnline, lastSyncTime, pendingSyncCount, toggleConnectivity, forceSync } = useContainers();
  const location = useLocation();

  const [uptime, setUptime] = useState(0);
  const [co2Saved, setCo2Saved] = useState(1240.45);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    const co2Timer = setInterval(() => setCo2Saved(prev => prev + 0.01), 1500);
    
    // Simulate periodic "Neural Scans"
    const scanTimer = setInterval(() => {
      setIsScanning(false);
      setTimeout(() => setIsScanning(true), 100);
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(co2Timer);
      clearInterval(scanTimer);
    };
  }, []);

  const formatUptime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine page title and accent color based on route
  const getPageContext = () => {
    if (location.pathname === '/') return { title: 'Fleet Operations', color: 'text-teal-700' };
    if (location.pathname === '/analytics') return { title: 'Intelligence Center', color: 'text-sky-700' };
    if (location.pathname === '/settings') return { title: 'Edge Config', color: 'text-slate-700' };
    if (location.pathname.includes('/container/')) return { title: 'Node Detail', color: 'text-teal-700' };
    return { title: 'ShelfLife AI', color: 'text-teal-700' };
  };

  const context = getPageContext();

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 py-3 shadow-xs">
      {/* Neural Sync Scanline */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 h-[2px] w-[30%] bg-gradient-to-r from-transparent via-teal-400 to-transparent z-50"
          />
        )}
      </AnimatePresence>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Left: Mobile Menu & Page Context */}
          <div className="flex items-center gap-4">
             {/* Mobile Menu Icon */}
             <button 
                onClick={onMenuClick}
                className="lg:hidden p-2 text-slate-500 hover:text-slate-800 transition-colors"
             >
                <Menu className="w-6 h-6" />
             </button>

             <div className="hidden lg:block">
                <div className="flex items-center gap-2 mb-0.5">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">DP World</span>
                   <ChevronRight className="w-3 h-3 text-slate-400" />
                   <h2 className={`text-sm font-black uppercase tracking-widest ${context.color}`}>{context.title}</h2>
                </div>
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-500 animate-pulse' : 'bg-sky-500'}`} />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isOnline ? 'Ship LAN + SatLink' : 'Vessel Local Network (LAN)'}</span>
                    <span className="text-[8px] text-teal-600/70 font-black ml-1 tracking-[0.2em]">UPTIME: {formatUptime(uptime)}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                 <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">LIVE</span>
              </div>
           </div>
          
          {/* Right: System Status & Sync */}
          <div className="flex items-center gap-3">
            
            {/* Connectivity Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleConnectivity}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isOnline 
                ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100/70' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <Ship className="w-4 h-4 text-teal-600" />}
              <span className="hidden md:inline">{isOnline ? 'Satellite Linked' : 'Ship Local Network'}</span>
            </motion.button>

             {/* Sync Status */}
             <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                   <UploadCloud className="w-4 h-4 text-sky-600" />
                   <span className="text-[10px] font-bold text-slate-600 uppercase">Last Sync: {lastSyncTime}</span>
                </div>
                {pendingSyncCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-black animate-pulse shadow-sm">
                     <Zap className="w-3 h-3" /> {pendingSyncCount} PENDING
                  </div>
                )}
             </div>

            {/* Sustainability Impact */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl transition-colors">
               <div className="p-1 px-2 bg-emerald-100/70 rounded flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter italic">Impact</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800">-{co2Saved.toFixed(2)} kg CO₂</span>
               </div>
            </div>

            {/* Security Guard */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-800 transition-colors group">
               <ShieldCheck className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Engine v2</span>
            </div>

            {/* Manual Sync Trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={forceSync}
              className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all ml-2"
            >
              <RefreshCw className="w-4 h-4 font-bold" />
            </motion.button>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;