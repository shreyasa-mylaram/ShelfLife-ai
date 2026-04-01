import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContainers } from '../context/ContainerContext';
import { useShipmentData } from '../hooks/useShipmentData';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Thermometer, 
  Droplets, 
  Battery, 
  MapPin, 
  Package,
  AlertTriangle,
  Brain,
  Download,
  RefreshCw
} from 'lucide-react';
import { formatTemperature, formatHumidity, getBatteryColor, formatTimestamp } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { containers } = useContainers();
  const { data, loading, history, refresh } = useShipmentData(id);
  const [selectedPeriod, setSelectedPeriod] = useState('day');

  const container = containers.find(c => c.id === id) || data?.[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading container data...</p>
        </div>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Container not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: history.map(h => h.temp),
        borderColor: CHART_COLORS.temperature,
        backgroundColor: `${CHART_COLORS.temperature}20`,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Threshold',
        data: Array(history.length).fill(container.threshold),
        borderColor: CHART_COLORS.threshold,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e0e4e8' }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        grid: { color: '#2c4452' },
        title: { display: true, text: 'Temperature (°C)', color: '#e0e4e8' }
      },
      x: {
        grid: { color: '#2c4452' },
        ticks: { color: '#e0e4e8' }
      }
    }
  };

  const handleExport = () => {
    toast.success('Export started. Download will begin shortly.');
    // Implement export logic
  };

  const handleRefresh = () => {
    refresh();
    toast.success('Data refreshed');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-dark to-dark/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-dark-card rounded-lg hover:bg-dark-lighter transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary">{container.id}</h1>
              <p className="text-gray-400 text-sm">{container.cargo} • {container.location}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-dark-card border border-gray-600 rounded-lg hover:border-primary transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-dark transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Thermometer className="w-5 h-5 text-primary" />
              <p className="text-gray-400">Temperature</p>
            </div>
            <p className="text-3xl font-bold">{formatTemperature(container.temp)}</p>
            <p className="text-sm text-gray-500 mt-2">Threshold: {formatTemperature(container.threshold)}</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Droplets className="w-5 h-5 text-blue-500" />
              <p className="text-gray-400">Humidity</p>
            </div>
            <p className="text-3xl font-bold">{formatHumidity(container.humidity)}</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Battery className="w-5 h-5 text-green-500" />
              <p className="text-gray-400">Battery</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getBatteryColor(container.battery)}`}
                  style={{ width: `${container.battery}%` }}
                />
              </div>
              <span className="text-sm">{container.battery}%</span>
            </div>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-purple-500" />
              <p className="text-gray-400">AI Prediction</p>
            </div>
            <p className="text-3xl font-bold">{formatTemperature(container.prediction)}</p>
            <p className="text-sm text-gray-500 mt-2">6 hours forecast</p>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-dark-card rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Temperature History</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 bg-dark-lighter border border-gray-600 rounded-lg text-sm"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-dark-card rounded-2xl p-6 border border-primary/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-lighter rounded-xl">
              <p className="text-sm text-gray-400 mb-2">Temperature Trend</p>
              <p className="text-lg">
                {container.prediction > container.threshold ? (
                  <span className="text-yellow-500">⚠️ Expected to exceed threshold in 2-3 hours</span>
                ) : (
                  <span className="text-green-500">✓ Temperature stable within range</span>
                )}
              </p>
            </div>
            <div className="p-4 bg-dark-lighter rounded-xl">
              <p className="text-sm text-gray-400 mb-2">Recommendation</p>
              <p className="text-lg">
                {container.prediction > container.threshold ? (
                  'Increase cooling capacity. Monitor closely next 2 hours.'
                ) : (
                  'Normal operations continue. Next check in 6 hours.'
                )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Container ID</p>
              <p className="font-mono text-primary">{container.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Cargo Type</p>
              <p>{container.cargo}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p>{container.location}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Last Updated</p>
              <p>{formatTimestamp(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DetailPage;
