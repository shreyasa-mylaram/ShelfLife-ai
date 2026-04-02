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
  Activity, Shield, Clock, TrendingUp
} from 'lucide-react';
import { CHART_COLORS } from '../utils/constants';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatTemperature = (val) => val != null ? `${parseFloat(val).toFixed(1)}°C` : '--';
const formatHumidity = (val) => val != null ? `${parseFloat(val).toFixed(0)}%` : '--';

const StatusBadge = ({ status }) => {
  const map = { normal: ['#10b981', '✓ Normal'], warning: ['#f59e0b', '⚠ Warning'], critical: ['#ef4444', '🔴 Critical'] };
  const [color, label] = map[status] || ['#6b7280', 'Unknown'];
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}55`,
      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px'
    }}>{label}</span>
  );
};

const StatCard = ({ icon: Icon, iconColor, label, value, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-dark-card rounded-2xl p-6 border border-gray-700 hover:border-primary/40 transition-colors"
  >
    <div className="flex items-center gap-3 mb-3">
      <div style={{ background: `${iconColor}22`, padding: 8, borderRadius: 10 }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {sub && <p className="text-sm text-gray-500 mt-2">{sub}</p>}
  </motion.div>
);

const HealthBar = ({ value, label }) => {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
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

  // Merge: prefer live API data, fall back to context data
  const contextContainer = containers.find(c => c.id === id);
  const container = data || contextContainer;

  const handleExport = () => {
    if (!history.length) { toast.error('No data to export'); return; }
    const csv = ['Timestamp,Temperature,Humidity,Cooling Power',
      ...history.map(h => `${h.timestamp},${h.temp},${h.humidity},${h.cooling}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${id}_sensor_export.csv`; a.click();
    toast.success('CSV export downloaded!');
  };

  const handleRefresh = () => { refresh(); toast.success('Data refreshed'); };

  // ── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading container telemetry...</p>
          <p className="text-gray-600 text-sm mt-2">{id}</p>
        </div>
      </div>
    );
  }

  // ── Not Found State ──────────────────────────────────────────────
  if (!container) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-white text-xl font-bold mb-2">Container Not Found</p>
          <p className="text-gray-400 mb-2">{id}</p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 transition font-semibold"
          >Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Chart Data ───────────────────────────────────────────────────
  const periodSlice = selectedPeriod === 'day' ? 48 : selectedPeriod === 'week' ? 336 : 1440;
  const chartReadings = history.slice(-periodSlice);

  const chartData = {
    labels: chartReadings.map(h => {
      const d = new Date(h.timestamp);
      return selectedPeriod === 'day' ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
    }),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: chartReadings.map(h => h.temp),
        borderColor: CHART_COLORS.temperature,
        backgroundColor: `${CHART_COLORS.temperature}20`,
        tension: 0.4, fill: true, pointRadius: 2,
      },
      {
        label: 'Threshold (4.0°C)',
        data: Array(chartReadings.length).fill(container.threshold || 4.0),
        borderColor: CHART_COLORS.threshold,
        borderDash: [6, 4], backgroundColor: 'transparent', pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { grid: { color: '#1e3a4a' }, ticks: { color: '#94a3b8' }, title: { display: true, text: 'Temperature (°C)', color: '#94a3b8' } },
      x: { grid: { color: '#1e3a4a' }, ticks: { color: '#94a3b8', maxTicksLimit: 10 } }
    }
  };

  // ── ML-derived insights ──────────────────────────────────────────
  const healthScore = container.health_score ?? 85;
  const shelfRemaining = container.shelf_life_remaining ?? '--';
  const prediction = container.prediction;
  const isOverThreshold = prediction > (container.threshold || 4.0);

  const avgTemp = history.length
    ? (history.reduce((s, h) => s + h.temp, 0) / history.length).toFixed(2)
    : container.temp;

  const exceedanceCount = history.filter(h => h.temp > (container.threshold || 4.0)).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-dark to-dark/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 bg-dark-card rounded-lg hover:bg-dark-lighter transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-primary font-mono">{container.id}</h1>
                <StatusBadge status={container.status} />
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {container.cargo} • {container.location} • {container.journey_days ?? '--'} day journey
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefresh} className="px-4 py-2 bg-dark-card border border-gray-600 rounded-lg hover:border-primary transition flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-dark transition flex items-center gap-2 text-sm font-semibold">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Thermometer} iconColor="#00d4aa" label="Temperature" value={formatTemperature(container.temp)} sub={`Threshold: ${formatTemperature(container.threshold)}`} />
          <StatCard icon={Droplets} iconColor="#3b82f6" label="Humidity" value={formatHumidity(container.humidity)} sub="Relative humidity" />
          <StatCard icon={Activity} iconColor="#10b981" label="Cooling Power" value={`${container.battery ?? '--'}%`} sub="Refrigeration unit" />
          <StatCard icon={Brain} iconColor="#a78bfa" label="6h Forecast" value={prediction ? formatTemperature(prediction) : 'Calculating...'} sub={isOverThreshold ? '⚠ Above threshold' : '✓ Within range'} />
        </div>

        {/* Health & Shelf Life Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Health & Quality Metrics</h2>
            </div>
            <div className="space-y-5">
              <HealthBar label="Cargo Health Score" value={healthScore} />
              <HealthBar label="Cooling System Efficiency" value={container.battery ?? 85} />
              <HealthBar label="Journey Completion" value={Math.min(100, Math.round((history.length / 96) * 100))} />
            </div>
          </div>
          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold">Shelf Life</h2>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold" style={{ color: healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                {shelfRemaining}
              </p>
              <p className="text-gray-400 mt-2 text-sm">days remaining</p>
            </div>
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <p className="text-gray-300">
                {healthScore >= 70 ? '✅ Product quality intact. No action required.' :
                 healthScore >= 40 ? '⚠️ Monitor closely. Quality degrading.' :
                 '🔴 Critical: Immediate inspection required!'}
              </p>
            </div>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-dark-card rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Temperature History</h2>
            </div>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 bg-dark-lighter border border-gray-600 rounded-lg text-sm"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          {chartReadings.length > 0 ? (
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No sensor readings available for this period</p>
              </div>
            </div>
          )}
          {/* Chart summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Temperature</p>
              <p className="font-bold text-primary">{formatTemperature(avgTemp)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Readings Logged</p>
              <p className="font-bold text-white">{history.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Threshold Breaches</p>
              <p className="font-bold" style={{ color: exceedanceCount > 0 ? '#ef4444' : '#10b981' }}>{exceedanceCount}</p>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-dark-card rounded-2xl p-6 mb-8" style={{ border: '1px solid rgba(0,212,170,0.25)', background: 'linear-gradient(135deg, rgba(0,212,170,0.05) 0%, rgba(10,43,62,0.95) 100%)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ background: 'rgba(0,212,170,0.15)', padding: 8, borderRadius: 10 }}>
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">AI Insights & Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-dark-lighter">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Temperature Trend</p>
              <p className="text-sm font-medium">
                {isOverThreshold
                  ? <span className="text-yellow-400">⚠️ Forecast exceeds threshold. Intervention recommended within 2 hours.</span>
                  : <span className="text-green-400">✅ Temperature stable. Forecast within safe range for next 6 hours.</span>}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-dark-lighter">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Anomaly Detection</p>
              <p className="text-sm font-medium">
                {exceedanceCount > 5
                  ? <span className="text-red-400">🔴 {exceedanceCount} threshold breaches detected. Review cooling unit.</span>
                  : exceedanceCount > 0
                  ? <span className="text-yellow-400">⚠️ {exceedanceCount} minor exceedances. Monitor closely.</span>
                  : <span className="text-green-400">✅ No anomalies detected in this period.</span>}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-dark-lighter">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Action Required</p>
              <p className="text-sm font-medium">
                {container.status === 'critical'
                  ? <span className="text-red-400">🚨 Immediately increase cooling. Alert port control.</span>
                  : container.status === 'warning'
                  ? <span className="text-yellow-400">⚠️ Increase cooling by 10%. Check door seals.</span>
                  : <span className="text-green-400">✅ Normal operations. Next inspection in 6 hours.</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Shipment Details</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Container ID', value: container.id, mono: true },
              { label: 'Cargo Type', value: container.cargo },
              { label: 'Current Location', value: container.location, icon: MapPin },
              { label: 'Journey Duration', value: `${container.journey_days ?? '--'} days` },
              { label: 'Health Score', value: `${healthScore}%` },
              { label: 'Shelf Life Left', value: `${shelfRemaining} days` },
              { label: 'Avg Temperature', value: formatTemperature(avgTemp) },
              { label: 'Sync Status', value: container.syncStatus ?? 'Synced' },
            ].map(({ label, value, mono, icon: Icon }) => (
              <div key={label}>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
                <div className="flex items-center gap-1">
                  {Icon && <Icon className="w-3 h-3 text-primary" />}
                  <p className={`${mono ? 'font-mono text-primary' : 'text-white'} text-sm font-medium`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default DetailPage;
