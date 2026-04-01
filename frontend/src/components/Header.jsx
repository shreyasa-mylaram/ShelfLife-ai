import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContainers } from '../context/ContainerContext';
import { Wifi, UploadCloud, Package, Zap, LayoutDashboard, BarChart3 } from 'lucide-react';

const Header = () => {
  const { isOnline, lastSyncTime, pendingSyncCount, toggleConnectivity, forceSync } = useContainers();
  const location = useLocation();

  return (
    <header className="bg-dark-header border-b-2 border-primary shadow-lg sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Package className="w-8 h-8 text-primary" />
                <Zap className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  SHELF LIFE AI
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Freshness Guaranteed | Edge-First Cold Chain Intelligence</p>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex gap-2">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  location.pathname === '/' 
                    ? 'bg-primary/20 text-primary border border-primary/50' 
                    : 'text-gray-400 hover:bg-dark-lighter'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-1" />
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  location.pathname === '/analytics' 
                    ? 'bg-primary/20 text-primary border border-primary/50' 
                    : 'text-gray-400 hover:bg-dark-lighter'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Analytics
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-500/20 border border-green-500' : 'bg-yellow-500/20 border border-yellow-500'}`}>
              <Wifi className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-yellow-500'}`} />
              <span className="text-xs hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-lighter border border-primary/30">
              <UploadCloud className="w-4 h-4 text-primary" />
              <span className="text-xs">Sync: {lastSyncTime}</span>
              {pendingSyncCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">
                  {pendingSyncCount}
                </span>
              )}
            </div>
            
            <button
              onClick={toggleConnectivity}
              className="px-3 py-1.5 rounded-full bg-dark-lighter border border-gray-600 hover:border-primary transition-all text-sm hidden sm:block"
            >
              Toggle
            </button>
            
            <button
              onClick={forceSync}
              className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-dark transition-all text-sm"
            >
              Sync
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;