import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { Link } from 'react-router-dom';
import { Thermometer, Droplets, Battery, MapPin, Package, Brain, Ship, AlertTriangle, CloudOff } from 'lucide-react';

const FleetGrid = ({ filter = 'all' }) => {
  const { containers } = useContainers();
  
  const filteredContainers = containers.filter(container => {
    if (filter === 'alerts') return container.status !== 'normal';
    if (filter === 'sync') return container.syncStatus === 'pending';
    if (filter === 'waste') return container.status === 'normal'; // Waste reduction showcases optimally saved containers
    return true; 
  });

  const getStatusStyles = (status) => {
    switch(status) {
      case 'normal':
        return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500', label: '✓ Normal' };
      case 'warning':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500', label: '⚠ Warning' };
      case 'critical':
        return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500', label: '🔴 Critical' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500', label: 'Unknown' };
    }
  };

  const getGridTitle = () => {
    switch(filter) {
      case 'alerts': return 'Predictive Alerts';
      case 'sync': return 'Pending Sync';
      case 'waste': return 'Waste Reduction';
      default: return 'Active Container Fleet';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Ship className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">{getGridTitle()}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContainers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-dark-card border border-gray-700 border-dashed rounded-2xl">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
            <p className="text-lg font-medium text-gray-300">
              {filter === 'sync' ? "All active containers have their local edge data fully synced to the Cloud." :
               filter === 'alerts' ? "All Clear! No critical alerts. Produce is safe." :
               "No containers match the active filter."}
            </p>
          </div>
        ) : filteredContainers.map((container) => {
          const statusStyle = getStatusStyles(container.status);
          const isPredictionWarning = container.prediction > container.threshold;
          
          return (
            <Link
              to={`/fleet/${container.id}`}
              key={container.id}
              className="bg-dark-card rounded-2xl overflow-hidden border border-gray-700 hover:border-primary transition-all duration-300 hover:transform hover:-translate-y-1 group block cursor-pointer"
            >
              <div className="bg-dark-lighter px-5 py-3 flex justify-between items-center border-b border-gray-700">
                <span className="font-bold text-lg flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  {container.id}
                </span>
                <div className="flex items-center gap-2">
                  {container.syncStatus === 'pending' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-500 border border-orange-500 flex items-center gap-1">
                      <CloudOff className="w-3 h-3" /> Sync Pending
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                    {statusStyle.label}
                  </span>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-3xl font-bold">
                    <Thermometer className="w-6 h-6 text-gray-400" />
                    <span>{container.temp}°C</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Droplets className="w-4 h-4" />
                    <span>{container.humidity}% RH</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Package className="w-4 h-4 text-primary" />
                  <span>{container.cargo}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{container.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Battery className="w-4 h-4" />
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${container.battery > 50 ? 'bg-green-500' : container.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${container.battery}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{container.battery}%</span>
                </div>
                
                <div className={`mt-3 p-3 rounded-xl ${isPredictionWarning ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-primary/5 border border-primary/20'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-gray-300">AI Forecast (6h):</span>
                    <span className={`font-bold ${isPredictionWarning ? 'text-yellow-500' : 'text-primary'}`}>
                      {container.prediction}°C
                    </span>
                  </div>
                  {isPredictionWarning && (
                    <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Intervention recommended
                    </p>
                  )}
                </div>
                
                <div 
                  className="w-full mt-4 text-center text-primary text-sm transition-colors flex items-center justify-center gap-2 group-hover:text-primary/80"
                >
                  <span>View Freshness Evidence</span>
                  <span className="transform transition-transform group-hover:translate-x-1">→</span>
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