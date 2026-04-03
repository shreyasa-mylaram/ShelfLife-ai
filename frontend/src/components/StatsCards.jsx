import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { Ship, AlertTriangle, CloudOff, Leaf, Brain } from 'lucide-react';

const StatsCards = ({ activeFilter, onFilterChange = () => {} }) => {
  const { containers, pendingSyncCount } = useContainers();

  const activeContainers = containers.length;
  const alertCount = containers.filter(c => c.status !== 'normal').length;
  const predictiveCount = containers.filter(c => c.breachInHours !== null).length;
  const normalCount = containers.filter(c => c.status === 'normal').length;

  const cards = [
    {
      id: 'all',
      title: 'Active Containers',
      value: activeContainers,
      sub: 'Currently in transit',
      icon: Ship,
      color: '#00d4aa', // Custom Teal
      glow: 'rgba(0,212,170,0.15)',
    },
    {
      id: 'alerts',
      title: 'Predictive Alerts',
      value: alertCount,
      sub: '6-hour AI forecast issues',
      icon: AlertTriangle,
      color: '#f59e0b', // Amber
      glow: 'rgba(245,158,11,0.15)',
      pulse: alertCount > 0,
    },
    {
      id: 'sync',
      title: 'Pending Sync',
      value: pendingSyncCount,
      sub: 'Data awaiting cloud upload',
      icon: CloudOff,
      color: '#8b5cf6', // Vivid Purple
      glow: 'rgba(139,92,246,0.15)',
    },
    {
      id: 'waste',
      title: 'Waste Prevented',
      value: `${normalCount}/${activeContainers}`,
      sub: '15-20% insurance claim reduction',
      icon: Leaf,
      color: '#10b981', // Emerald
      glow: 'rgba(16,185,129,0.15)',
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
            className="relative rounded-2xl p-5 cursor-pointer transition-all duration-200 overflow-hidden"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${card.glow}, rgba(10,30,42,0.95))`
                : 'rgba(10,30,42,0.7)',
              border: `1px solid ${isActive ? card.color : 'rgba(255,255,255,0.07)'}`,
              boxShadow: isActive ? `0 0 20px ${card.glow}` : 'none',
            }}
          >
            {/* Background shimmer when active */}
            {isActive && <div className="absolute inset-0 shimmer pointer-events-none" />}

            <div className="relative flex justify-between items-start mb-3">
              <p className="text-gray-400 text-xs uppercase tracking-widest">{card.title}</p>
              <div className="p-1.5 rounded-lg" style={{ background: `${card.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold relative" style={{ color: isActive ? card.color : '#ffffff' }}>
              {card.value}
              {card.pulse && card.value > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </p>
            <p className="text-gray-500 text-xs mt-1.5">{card.sub}</p>

            {isActive && (
              <div className="mt-2 h-0.5 rounded-full w-1/3" style={{ background: card.color }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;