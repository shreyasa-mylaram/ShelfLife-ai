import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { Ship, AlertTriangle, Leaf } from 'lucide-react';

const StatsCards = ({ activeFilter, onFilterChange = () => {} }) => {
  const { containers } = useContainers();

  const activeContainers = containers.length;
  const alertCount = containers.filter(c => c.status !== 'normal').length;
  const normalCount = containers.filter(c => c.status === 'normal').length;

  const cards = [
    {
      id: 'all',
      title: 'Active Containers',
      value: activeContainers,
      sub: 'Currently in transit',
      icon: Ship,
      color: '#0d9488', // Teal
      pastelBg: '#f0fdfa',
      pastelBorder: '#99f6e4',
      glow: 'rgba(13,148,136,0.15)',
    },
    {
      id: 'alerts',
      title: 'Predictive Alerts',
      value: alertCount,
      sub: '6-hour AI forecast issues',
      icon: AlertTriangle,
      color: '#d97706', // Amber
      pastelBg: '#fffbeb',
      pastelBorder: '#fde68a',
      glow: 'rgba(217,119,6,0.15)',
      pulse: alertCount > 0,
    },
    {
      id: 'sync',
      title: 'Ship Network Sync',
      value: `${activeContainers}/${activeContainers}`,
      sub: 'All telemetry live over Vessel LAN',
      icon: Ship,
      color: '#0284c7', // Sky blue
      pastelBg: '#f0f9ff',
      pastelBorder: '#bae6fd',
      glow: 'rgba(2,132,199,0.15)',
    },
    {
      id: 'waste',
      title: 'Waste Prevented',
      value: `${normalCount}/${activeContainers}`,
      sub: '15-20% insurance claim reduction',
      icon: Leaf,
      color: '#059669', // Emerald
      pastelBg: '#ecfdf5',
      pastelBorder: '#a7f3d0',
      glow: 'rgba(5,150,105,0.15)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className="relative rounded-3xl p-5 cursor-pointer transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md"
            style={{
              background: isActive ? card.pastelBg : '#ffffff',
              border: `1px solid ${isActive ? card.color : '#e2e8f0'}`,
              boxShadow: isActive ? `0 10px 25px -5px ${card.glow}` : '0 2px 8px -2px rgba(100,116,139,0.06)',
            }}
          >
            <div className="relative flex justify-between items-start mb-3">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">{card.title}</p>
              <div className="p-2 rounded-xl" style={{ background: card.pastelBg, border: `1px solid ${card.pastelBorder}` }}>
                <Icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-3xl font-black relative" style={{ color: isActive ? card.color : '#0f172a' }}>
              {card.value}
              {card.pulse && card.value > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </p>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">{card.sub}</p>

            {isActive && (
              <div className="mt-3 h-1 rounded-full w-1/3" style={{ background: card.color }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;