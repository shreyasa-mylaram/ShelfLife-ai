import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { Ship, AlertTriangle, CloudOff, TrendingDown } from 'lucide-react';

const StatsCards = ({ activeFilter, onFilterChange = () => {} }) => {
  const { containers, pendingSyncCount } = useContainers();
  
  const activeContainers = containers.length;
  const alertCount = containers.filter(c => c.status !== 'normal').length;
  
  const cards = [
    {
      id: "all",
      title: "Active Containers",
      value: activeContainers,
      sub: "Currently in transit",
      icon: Ship,
      color: "text-primary"
    },
    {
      id: "alerts",
      title: "Predictive Alerts",
      value: alertCount,
      sub: "6-hour forecast issues",
      icon: AlertTriangle,
      color: "text-yellow-500"
    },
    {
      id: "sync",
      title: "Pending Sync",
      value: pendingSyncCount,
      sub: "Data awaiting cloud upload",
      icon: CloudOff,
      color: "text-orange-500"
    },
    {
      id: "waste",
      title: "Waste Reduction",
      value: "15-20%",
      sub: "Estimated insurance claim reduction",
      icon: TrendingDown,
      color: "text-green-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const isActive = activeFilter === card.id;
        return (
          <div
            onClick={() => onFilterChange(card.id)}
            key={index}
            className={`bg-dark-card/60 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 block group cursor-pointer border ${isActive ? 'border-primary shadow-[0_0_15px_rgba(0,212,170,0.3)]' : 'border-primary/30 hover:border-primary'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <p className="text-gray-400 text-sm uppercase tracking-wider">{card.title}</p>
              <card.icon className={`w-5 h-5 ${card.color} transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
            </div>
            <p className="text-3xl font-bold text-primary mb-2">{card.value}</p>
            <p className="text-gray-500 text-xs">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;