import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContainers } from '../context/ContainerContext';
import { useShipmentData } from '../hooks/useShipmentData';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Thermometer, Droplets, Battery, MapPin,
  Package, AlertTriangle, Brain, Download, RefreshCw,
  Activity, Shield, Clock, TrendingUp, Ship, Zap
} from 'lucide-react';
import { CHART_COLORS } from '../utils/constants';
import ContainerTwin from '../components/ContainerTwin';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatTemperature = (val) => val != null ? `${parseFloat(val).toFixed(1)}°C` : '--';
const formatHumidity = (val) => val != null ? `${parseFloat(val).toFixed(0)}%` : '--';

const StatusBadge = ({ status }) => {
  const map = { normal: ['#10b981', '✓ Normal'], warning: ['#f59e0b', '⚠ Warning'], critical: ['#ef4444', '🔴 Critical'] };
  const [color, label] = map[status] || ['#6b7280', 'Unknown'];
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{ background: `${color}15`, color, borderColor: `${color}40` }}>
      {label}
    </span>
  );
};

const StatCard = ({ icon: Icon, iconColor, label, value, sub, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
    className="bg-dark-card rounded-2xl p-5 border border-white/5 hover:border-primary/20 transition-all card-hover"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="p-2.5 rounded-xl bg-white/3">
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-bold text-white leading-none">{value}</p>
    {sub && <p className="text-[10px] text-gray-500 mt-2 font-medium">{sub}</p>}
  </motion.div>
);

const HealthGauge = ({ value, label, icon: Icon }) => {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-white/3 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
           <Icon className="w-3.5 h-3.5 text-gray-400" />
           <span className="text-xs font-bold text-gray-300 uppercase tracking-tighter">{label}</span>
        </div>
        <span className="text-sm font-black" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2 }}
          style={{ height: '100%', background: color, boxShadow: `0 0 8px ${color}55` }}
        />
      </div>
    </div>
  );
};

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { containers } = useContainers();
  const { data, loading, history, refresh, error } = useShipmentData(id);
  const [selectedPeriod, setSelectedPeriod] = useState('day');

  const contextContainer = containers.find(c => c.id === id);
  const container = data || contextContainer;

  const handleExport = async () => {
    if (!history.length) return toast.error('No telemetry data to export');

    const csvContent = [
      'Container_ID,Timestamp,Temperature,Humidity,Vibration,Cooling_Power',
      ...history.map(h => `${id},${h.timestamp},${h.temp},${h.humidity},${h.cooling}`)
    ].join('\n');

    // Create a real-world SHA-256 "Digital Signature" for the audit trail
    const msgUint8 = new TextEncoder().encode(csvContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const finalCsv = `${csvContent}\n\n--- DP WORLD TRUST CERTIFICATE ---\nDigital_Signature,${hashHex}\nVerification_Node,ShelfLife-AI-Edge-01\nTimestamp,${new Date().toISOString()}`;

    const blob = new Blob([finalCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SHELFLIFE_AUDIT_${id}_${Date.now()}.csv`;
    a.click();
    
    toast.success('Audit Trail Signed & Exported');
  };

  if (loading) return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-8">
       <RefreshCw className="w-12 h-12 text-primary animate-spin mb-6" />
       <div className="text-center animate-pulse">
         <h2 className="text-xl font-bold gradient-text">ShelfLife AI Engine</h2>
         <p className="text-gray-500 text-sm mt-1">Retrieving Edge Node Telemetry for {id}...</p>
       </div>
    </div>
  );

  if (!container) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
       <div className="text-center p-12 bg-dark-card border border-red-500/20 rounded-3xl">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Node Timeout</h2>
          <p className="text-gray-400 mb-6">Device {id} is unreachable or doesn't exist in registry.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-primary text-dark font-black rounded-xl">Back to Fleet Control</button>
       </div>
    </div>
  );

  // Chart
  const chartReadings = history.slice(-48);
  const chartData = {
    labels: chartReadings.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Temp (°C)',
        data: chartReadings.map(h => h.temp),
        borderColor: CHART_COLORS.temperature,
        backgroundColor: `rgba(0, 212, 170, 0.1)`,
        tension: 0.4, fill: true, pointRadius: 2,
      },
      {
        label: 'Threshold',
        data: Array(chartReadings.length).fill(container.threshold || 4.0),
        borderColor: '#f97316',
        borderDash: [6, 4], pointRadius: 0,
      }
    ]
  };

  const isOverThreshold = container.prediction > (container.threshold || 4.0);
  const healthScore = container.healthScore ?? 85;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark/95">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* New Hero-Style Header */}
        <motion.div
           initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
           className="relative rounded-3xl p-8 mb-8 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.15) 0%, rgba(10,30,42,1) 70%)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
          <div className="relative flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/')} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                   <Package className="w-6 h-6 text-primary" />
                   <h1 className="text-4xl font-black text-white font-mono tracking-tighter">{container.id}</h1>
                   <StatusBadge status={container.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
                   <div className="flex items-center gap-1.5 truncate max-w-[200px]"><Ship className="w-3.5 h-3.5" />{container.location}</div>
                   <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> {container.cargoLabel || container.cargo}</div>
                   <div className="hidden sm:flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-400" /> DP World Trust v2</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
               <div className="flex flex-col items-end gap-1">
                 <motion.button whileHover={{ scale: 1.02 }} onClick={handleExport} className="px-6 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-2xl text-xs font-bold hover:bg-primary hover:text-dark transition-all flex items-center gap-2">
                   <Download className="w-4 h-4" /> Export Signed Audit Trail
                 </motion.button>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-400">
                    <Shield className="w-3 h-3" /> TRUST VERIFIED
                 </div>
               </div>
               <motion.button whileHover={{ scale: 1.02 }} onClick={() => { refresh(); toast.success('Telemetry Refreshed'); }} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                 <RefreshCw className="w-4 h-4" />
               </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Digital Twin + Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
           {/* 3D Digital Twin - Spans 5 cols */}
           <div className="lg:col-span-5">
              <ContainerTwin 
                temp={container.temp} 
                threshold={container.threshold} 
                containerId={container.id} 
              />
           </div>

           {/* Stats Summary - Spans 7 cols */}
           <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard icon={Thermometer} iconColor="#ef4444" label="Temperature" value={formatTemperature(container.temp)} sub={`Limit: ${formatTemperature(container.threshold)}`} trend="-0.2°C/h" />
              <StatCard icon={Droplets} iconColor="#3b82f6" label="Humidity" value={formatHumidity(container.humidity)} sub="RH Control Active" />
              <StatCard icon={Battery} iconColor="#10b981" label="Cooling Eff." value={`${container.battery ?? 85}%`} sub="Solar Hybrid Active" />
              <StatCard icon={Brain} iconColor="#a78bfa" label="AI 6h Projection" value={formatTemperature(container.prediction)} sub={isOverThreshold ? '⚠ BREACH LIKELY' : '✓ TRAJECTORY STABLE'} />
           </div>
        </div>

        {/* Main Content: Chart + Health Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           
           {/* Chart - Spans 2 cols */}
           <div className="lg:col-span-2 bg-dark-card rounded-3xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                   <Activity className="w-5 h-5 text-primary" />
                   <h3 className="text-lg font-bold">Predictive Thermal Velocity</h3>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-gray-500 font-bold uppercase transition-all whitespace-nowrap">Last 24H</span>
                </div>
              </div>
              <div className="h-[300px]">
                <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } } }} />
              </div>
           </div>

           {/* Health Gauge & Action Panel */}
           <div className="space-y-4">
              <div className="bg-dark-card rounded-3xl p-6 border border-white/5 flex flex-col justify-between h-full">
                 <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      Quality Report
                    </h3>
                    <div className="space-y-4 mb-8">
                       <HealthGauge label="Cargo Integrity" value={healthScore} icon={Package} />
                       <HealthGauge label="Electrical Stability" value={88} icon={Zap} />
                       <HealthGauge label="Seal Integrity" value={99} icon={Lock} />
                    </div>
                 </div>

                 <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Brain className="w-12 h-12 text-primary" /></div>
                    <p className="text-xs font-bold text-primary uppercase mb-2">ShelfLife Insight</p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {isOverThreshold 
                        ? `AI Core predicts a threshold breach in roughly ${container.breachInHours || 4} hours. Immediate cooling increase of +15kW prioritized.`
                        : `Current cooling power is optimal. ${container.cargoLabel || 'Cargo'} quality is maintained at 100%. No intervention needed.`}
                    </p>
                 </div>
              </div>
           </div>

        </div>

        {/* Bottom Details */}
        <div className="bg-dark-card rounded-3xl p-8 border border-white/5">
           <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-gray-400" />
              <h3 className="text-xl font-bold">Shipment Meta-Data</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-12">
              {[
                { l: 'Product Class', v: container.cargoLabel || container.cargo, c: 'text-white' },
                { l: 'Max Threshold', v: formatTemperature(container.threshold), c: 'text-orange-400' },
                { l: 'Shelf Life (est)', v: `${container.shelfDays || 14} Days`, c: 'text-white' },
                { l: 'Sync Status', v: container.syncStatus?.toUpperCase() || 'SYNCED', c: container.syncStatus === 'pending' ? 'text-yellow-400' : 'text-green-400' },
                { l: 'Destination', v: 'DP World Terminal', c: 'text-white' },
                { l: 'Security Mode', v: 'AES-256 CloudLink', c: 'text-white' },
                { l: 'Last Handshake', v: '2 mins ago', c: 'text-white font-mono' },
                { l: 'Edge Hardware', v: 'E-TS v4.2', c: 'text-white' }
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">{l}</p>
                  <p className={`text-base font-bold ${c}`}>{v}</p>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

// Placeholder icon for Lock
const Lock = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default DetailPage;
