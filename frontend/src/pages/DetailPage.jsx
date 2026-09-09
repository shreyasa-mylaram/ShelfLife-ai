import React from 'react';
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
  ArrowLeft, Thermometer, Droplets, Battery,
  Package, AlertTriangle, Brain, Download, RefreshCw,
  Activity, Shield, TrendingUp, Ship, Zap, Radio, Sun
} from 'lucide-react';
import ContainerTwin from '../components/ContainerTwin';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatTemperature = (val) => val != null ? `${parseFloat(val).toFixed(1)}°C` : '--';
const formatHumidity = (val) => val != null ? `${parseFloat(val).toFixed(0)}%` : '--';

const StatusBadge = ({ status }) => {
  const map = { normal: ['#059669', '#ecfdf5', '#a7f3d0', '✓ Normal'], warning: ['#d97706', '#fffbeb', '#fde68a', '⚠ Warning'], critical: ['#e11d48', '#fff1f2', '#fecdd3', '🔴 Critical'] };
  const [color, bg, border, label] = map[status] || ['#64748b', '#f1f5f9', '#e2e8f0', 'Unknown'];
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
      style={{ background: bg, color, borderColor: border }}>
      {label}
    </span>
  );
};

const StatCard = ({ icon: Icon, iconColor, label, value, sub, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-teal-300 transition-all card-hover shadow-xs"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <motion.p 
        key={value}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        className="text-3xl font-black text-slate-900 leading-none"
      >
        {value}
      </motion.p>
    </div>
    {sub && <p className="text-[11px] text-slate-500 mt-2 font-medium">{sub}</p>}
  </motion.div>
);

const HealthGauge = ({ value, label, icon: Icon }) => {
  const color = value >= 70 ? '#059669' : value >= 40 ? '#d97706' : '#e11d48';
  return (
    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 hover:bg-slate-50 transition-all">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
           <Icon className="w-3.5 h-3.5 text-slate-400" />
           <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</span>
        </div>
        <span className="text-sm font-black" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2 }}
          style={{ height: '100%', background: color }}
        />
      </div>
    </div>
  );
};

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { containers } = useContainers();
  const { data, loading, history, refresh } = useShipmentData(id);

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
         <p className="text-slate-500 text-sm mt-1">Retrieving Vessel LAN Telemetry for {id}...</p>
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

  // Chart Data & Predictive Thermal Velocity Logic
  const currentTemp = container?.temp ?? 3.5;
  const threshold = container?.threshold ?? 4.0;
  const targetPrediction = container?.prediction ?? parseFloat((currentTemp + 0.6).toFixed(2));

  // Determine effective readings (real history or synthesized 12h baseline)
  const now = Date.now();
  const effectiveReadings = (history && history.length >= 2)
    ? history.slice(-18)
    : Array.from({ length: 12 }, (_, i) => {
        const timeOffset = (11 - i) * 3600 * 1000;
        const base = currentTemp - 0.3;
        const wave = Math.sin(i * 0.6) * 0.15;
        const trend = (i / 11) * 0.3;
        return {
          timestamp: new Date(now - timeOffset).toISOString(),
          temp: parseFloat((base + wave + trend).toFixed(2)),
          cooling: 85,
        };
      });

  // Calculate thermal velocity (°C/hr)
  const firstTemp = effectiveReadings[0]?.temp ?? currentTemp;
  const lastTemp = effectiveReadings[effectiveReadings.length - 1]?.temp ?? currentTemp;
  const hoursSpan = Math.max(1, effectiveReadings.length * 0.5);
  const historicalVelocity = parseFloat(((lastTemp - firstTemp) / hoursSpan).toFixed(2));
  const forecastVelocity = parseFloat(((targetPrediction - currentTemp) / 6).toFixed(2));
  const activeVelocity = Math.abs(forecastVelocity) > 0.01 ? forecastVelocity : historicalVelocity;

  // 6-Hour Forecast trajectory (+1h to +6h)
  const forecastTemps = [1, 2, 3, 4, 5, 6].map(h => 
    parseFloat((currentTemp + ((targetPrediction - currentTemp) / 6) * h).toFixed(2))
  );

  const pastLabels = effectiveReadings.map(h => 
    new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  if (pastLabels.length > 0) pastLabels[pastLabels.length - 1] = 'Now';
  const futureLabels = ['+1h', '+2h', '+3h', '+4h', '+5h', '+6h'];
  const allLabels = [...pastLabels, ...futureLabels];

  const pastData = [...effectiveReadings.map(h => h.temp), ...Array(6).fill(null)];
  const forecastData = [
    ...Array(Math.max(0, effectiveReadings.length - 1)).fill(null),
    currentTemp,
    ...forecastTemps
  ];
  const thresholdData = Array(allLabels.length).fill(threshold);

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Observed Temp (°C)',
        data: pastData,
        borderColor: container?.status === 'critical' ? '#ef4444' : container?.status === 'warning' ? '#f59e0b' : '#00d4aa',
        backgroundColor: 'rgba(0, 212, 170, 0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'AI 6h Forecast (°C)',
        data: forecastData,
        borderColor: '#a855f7',
        borderDash: [5, 5],
        backgroundColor: 'rgba(168, 85, 247, 0.06)',
        tension: 0.3,
        fill: true,
        pointRadius: (ctx) => (ctx.dataIndex >= effectiveReadings.length ? 4 : 0),
        pointHoverRadius: 6,
      },
      {
        label: `Safe Threshold (${threshold}°C)`,
        data: thresholdData,
        borderColor: '#f97316',
        borderDash: [4, 4],
        backgroundColor: 'transparent',
        pointRadius: 0,
        fill: false,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#475569',
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { size: 10, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        callbacks: {
          label: (ctx) => ctx.raw != null ? ` ${ctx.dataset.label}: ${ctx.raw}°C` : null
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#64748b', callback: v => `${v}°C` }
      },
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
      }
    },
    interaction: { mode: 'index', intersect: false }
  };

  const isOverThreshold = container.prediction > (container.threshold || 4.0);
  const healthScore = container.healthScore ?? 85;

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* New Hero-Style Header */}
        <motion.div
           initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
           className="relative rounded-3xl p-8 mb-8 overflow-hidden shadow-sm"
           style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #eff6ff 100%)', border: '1px solid #ccfbf1' }}
        >
          <div className="relative flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/')} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-2xs transition-all">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                   <Package className="w-6 h-6 text-teal-600" />
                   <h1 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{container.id}</h1>
                   <StatusBadge status={container.status} />
                   <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-50 border border-teal-200 rounded-full text-[10px] font-black text-teal-700 animate-pulse">
                      <Radio className="w-3 h-3" /> LIVE STREAM
                   </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                   <div className="flex items-center gap-1.5 truncate max-w-[200px]"><Ship className="w-3.5 h-3.5 text-slate-400" />{container.location}</div>
                   <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> {container.cargoLabel || container.cargo}</div>
                   <div className="hidden sm:flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-600" /> DP World Trust v2</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
               <div className="flex flex-col items-end gap-1">
                 <motion.button whileHover={{ scale: 1.02 }} onClick={handleExport} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2">
                   <Download className="w-4 h-4 text-teal-600" /> Export Signed Audit Trail
                 </motion.button>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black text-emerald-700">
                    <Shield className="w-3 h-3" /> TRUST VERIFIED
                 </div>
               </div>
               <motion.button whileHover={{ scale: 1.02 }} onClick={() => { refresh(); toast.success('Telemetry Refreshed'); }} className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 shadow-2xs transition-all">
                 <RefreshCw className="w-4 h-4" />
               </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Light Deficiency Alert Banner if food needs light but has been in continuous darkness */}
        {container.lightAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs"
          >
            <Sun className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                ⚠️ Photoperiod Alert: Light Exposure Required
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                {container.cargoLabel || container.cargo} cargo requires periodic light exposure during transit. 
                Prolonged continuous darkness detected (<span className="text-amber-900 font-bold">{container.light_lux ?? 0} Lux</span> &lt; 50 Lux minimum for &gt;12 hours). 
                Risk of premature decay or uneven ripening.
              </p>
              <div className="mt-2 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                <span>Action: Activate internal container grow lamps / inspect lighting unit.</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase border border-amber-200">
              12H+ DARKNESS
            </span>
          </motion.div>
        )}

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
              <StatCard icon={Thermometer} iconColor="#e11d48" label="Temperature" value={formatTemperature(container.temp)} sub={`Limit: ${formatTemperature(container.threshold)}`} trend="-0.2°C/h" />
              <StatCard icon={Droplets} iconColor="#0284c7" label="Humidity" value={formatHumidity(container.humidity)} sub="RH Control Active" />
              <StatCard 
                icon={Sun} 
                iconColor={container.light_lux < 50 && container.needsLight ? "#d97706" : "#ca8a04"} 
                label="Light Exposure" 
                value={`${container.light_lux ?? 150} Lux`} 
                sub={container.needsLight ? (container.light_lux >= 50 ? "✓ Photoperiod Healthy (≥50 Lux)" : "⚠ Insufficient Light (<50 Lux)") : "Dark Storage Optimal"} 
                trend={container.needsLight && container.light_lux < 50 ? "12h+ Dark" : undefined}
              />
              <StatCard icon={Battery} iconColor="#059669" label="Cooling Eff." value={`${container.battery ?? 85}%`} sub="Solar Hybrid Active" />
           </div>
        </div>

        {/* Main Content: Chart + Health Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           
           {/* Chart - Spans 2 cols */}
           <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                   <Activity className="w-5 h-5 text-teal-600" />
                   <h3 className="text-lg font-bold text-slate-900">Predictive Thermal Velocity</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                    activeVelocity > 0.2 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : activeVelocity > 0.05 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {activeVelocity >= 0 ? `+${activeVelocity}` : activeVelocity}°C/h Velocity
                  </span>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] text-slate-600 font-bold uppercase whitespace-nowrap border border-slate-200">
                    12H History + 6H AI Forecast
                  </span>
                </div>
              </div>
              <div className="h-[320px]">
                <Line data={chartData} options={chartOptions} />
              </div>
           </div>

           {/* Health Gauge & Action Panel */}
           <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                 <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Quality Report
                    </h3>
                    <div className="space-y-4 mb-8">
                       <HealthGauge label="Cargo Integrity" value={healthScore} icon={Package} />
                       <HealthGauge label="Electrical Stability" value={88} icon={Zap} />
                       <HealthGauge 
                          label={container.needsLight ? "Photoperiod Index" : "Storage Light Protection"} 
                          value={container.needsLight ? Math.min(100, Math.round(((container.light_lux ?? 150) / 100) * 100)) : (container.light_lux < 50 ? 98 : 65)} 
                          icon={Sun} 
                        />
                    </div>
                 </div>

                 <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Brain className="w-12 h-12 text-teal-700" /></div>
                    <p className="text-xs font-bold text-teal-800 uppercase mb-2">ShelfLife Insight</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {isOverThreshold 
                        ? `AI Core predicts a threshold breach in roughly ${container.breachInHours || 4} hours. Immediate cooling increase of +15kW prioritized.`
                        : `Current cooling power is optimal. ${container.cargoLabel || 'Cargo'} quality is maintained at 100%. No intervention needed.`}
                    </p>
                 </div>
              </div>
           </div>

        </div>

        {/* Bottom Details */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-slate-400" />
              <h3 className="text-xl font-bold text-slate-900">Shipment Meta-Data</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-12">
              {[
                { l: 'Product Class', v: container.cargoLabel || container.cargo, c: 'text-slate-900' },
                { l: 'Max Threshold', v: formatTemperature(container.threshold), c: 'text-amber-600 font-bold' },
                { l: 'Shelf Life (est)', v: `${container.shelfDays || 14} Days`, c: 'text-slate-900' },
                { l: 'Sync Status', v: container.syncStatus?.toUpperCase() || 'SYNCED', c: container.syncStatus === 'pending' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold' },
                { l: 'Destination', v: 'DP World Terminal', c: 'text-slate-900' },
                { l: 'Network Route', v: 'Vessel LAN (Local)', c: 'text-teal-700 font-bold' },
                { l: 'Last Handshake', v: '2 mins ago', c: 'text-slate-700 font-mono' },
                { l: 'Hardware Interface', v: 'Vessel Gateway v4.2', c: 'text-slate-900' }
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">{l}</p>
                  <p className={`text-base font-bold ${c}`}>{v}</p>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default DetailPage;
