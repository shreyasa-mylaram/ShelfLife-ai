import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContainers } from '../context/ContainerContext';
import { Wifi, UploadCloud, Zap, CloudOff, RefreshCw, ShieldCheck, Menu, ChevronRight } from 'lucide-react';
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
    if (location.pathname === '/') return { title: 'Fleet Operations', color: 'text-primary' };
    if (location.pathname === '/analytics') return { title: 'Intelligence Center', color: 'text-blue-400' };
    if (location.pathname === '/settings') return { title: 'Edge Config', color: 'text-gray-400' };
    if (location.pathname.includes('/container/')) return { title: 'Node Detail', color: 'text-primary' };
    return { title: 'ShelfLife AI', color: 'text-primary' };
  };

  const context = getPageContext();

  return (
    <header className="bg-dark/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 py-3">
      {/* Neural Sync Scanline */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 h-[2px] w-[30%] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] z-50"
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
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
             >
                <Menu className="w-6 h-6" />
             </button>

             <div className="hidden lg:block">
                <div className="flex items-center gap-2 mb-0.5">
                   <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">DP World</span>
                   <ChevronRight className="w-3 h-3 text-gray-700" />
                   <h2 className={`text-sm font-black uppercase tracking-widest ${context.color}`}>{context.title}</h2>
                </div>
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-yellow-500'}`} />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{isOnline ? 'System Live' : 'Edge Mode Active'}</span>
                    <span className="text-[8px] text-primary/50 font-black ml-1 tracking-[0.2em]">UPTIME: {formatUptime(uptime)}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
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
                ? 'bg-blue-600/10 border-blue-600/20 text-blue-400' 
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
              <span className="hidden md:inline">{isOnline ? 'Cloud Linked' : 'Offline Engine'}</span>
            </motion.button>

             {/* Sync Status */}
             <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/3 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                   <UploadCloud className="w-4 h-4 text-blue-400" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Last Sync: {lastSyncTime}</span>
                </div>
                {pendingSyncCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-600 text-white rounded-md text-[10px] font-black animate-pulse shadow-[0_0_10px_rgba(234,88,12,0.4)]">
                     <Zap className="w-3 h-3" /> {pendingSyncCount} PENDING
                  </div>
                )}
             </div>

            {/* Sustainability Impact */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-colors">
               <div className="p-1 px-2 bg-emerald-500/20 rounded flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter italic">Impact</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300">-{co2Saved.toFixed(2)} kg CO₂</span>
               </div>
            </div>

            {/* Security Guard */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-white transition-colors group">
               <ShieldCheck className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Engine v2</span>
            </div>

            {/* Manual Sync Trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={forceSync}
              className="p-2.5 bg-primary text-dark rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all ml-2"
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