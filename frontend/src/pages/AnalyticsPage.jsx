import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useContainers } from '../context/ContainerContext';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { TrendingUp, AlertTriangle, DollarSign, Package, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatNumber } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const AnalyticsPage = () => {
  const { containers } = useContainers();
  const [period, setPeriod] = useState('week');
  const [analyticsData, setAnalyticsData] = useState({
    totalContainers: 0,
    alertsCount: 0,
    avgTemperature: 0,
    wasteReduction: 15.5,
    savings: 2840000
  });

  useEffect(() => {
    const total = containers.length;
    const alerts = containers.filter(c => c.status !== 'normal').length;
    const avgTemp = containers.reduce((sum, c) => sum + c.temp, 0) / total;
    
    setAnalyticsData({
      totalContainers: total,
      alertsCount: alerts,
      avgTemperature: avgTemp,
      wasteReduction: 15.5,
      savings: 2840000
    });
  }, [containers]);

  // Status distribution chart
  const statusData = {
    labels: ['Normal', 'Warning', 'Critical'],
    datasets: [
      {
        data: [
          containers.filter(c => c.status === 'normal').length,
          containers.filter(c => c.status === 'warning').length,
          containers.filter(c => c.status === 'critical').length
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  // Temperature trends chart
  const tempTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Average Temperature',
        data: [2.8, 3.1, 3.4, 3.2, 3.5, 3.3, 3.1],
        borderColor: CHART_COLORS.temperature,
        backgroundColor: `${CHART_COLORS.temperature}20`,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Threshold',
        data: [4, 4, 4, 4, 4, 4, 4],
        borderColor: CHART_COLORS.threshold,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        pointRadius: 0,
      }
    ],
  };

  // Alerts by type chart
  const alertsByTypeData = {
    labels: ['Temperature', 'Humidity', 'Battery', 'Connectivity'],
    datasets: [
      {
        label: 'Number of Alerts',
        data: [12, 5, 3, 2],
        backgroundColor: 'rgba(0, 212, 170, 0.5)',
        borderColor: CHART_COLORS.temperature,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e0e4e8' }
      }
    },
    scales: {
      y: {
        grid: { color: '#2c4452' },
        ticks: { color: '#e0e4e8' }
      },
      x: {
        grid: { color: '#2c4452' },
        ticks: { color: '#e0e4e8' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e0e4e8' }
      }
    }
  };

  const handleExport = () => {
    toast.success('Exporting analytics report...');
    // Implement export logic
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
          <div>
            <h1 className="text-2xl font-bold text-primary">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">Performance metrics and insights</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-card rounded-lg border border-gray-600">
              <Calendar className="w-4 h-4 text-primary" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent outline-none text-sm"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-dark transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold">{analyticsData.totalContainers}</p>
            <p className="text-sm text-gray-400 mt-1">Active Containers</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <p className="text-2xl font-bold">{analyticsData.alertsCount}</p>
            <p className="text-sm text-gray-400 mt-1">Active Alerts</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500">Reduction</span>
            </div>
            <p className="text-2xl font-bold">{analyticsData.wasteReduction}%</p>
            <p className="text-sm text-gray-400 mt-1">Waste Reduction</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500">Estimated</span>
            </div>
            <p className="text-2xl font-bold">${formatNumber(analyticsData.savings)}</p>
            <p className="text-sm text-gray-400 mt-1">Annual Savings</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Container Status Distribution</h2>
            <div className="h-80">
              <Doughnut data={statusData} options={doughnutOptions} />
            </div>
          </div>

          {/* Alerts by Type */}
          <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Alerts by Type</h2>
            <div className="h-80">
              <Bar data={alertsByTypeData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Temperature Trends */}
        <div className="bg-dark-card rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold mb-4">Temperature Trends</h2>
          <div className="h-96">
            <Line data={tempTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-card rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-sm text-green-500 mb-2">SUCCESS METRIC</h3>
            <p className="text-2xl font-bold mb-2">94%</p>
            <p className="text-gray-400 text-sm">Containers operating within threshold</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-yellow-500/30">
            <h3 className="text-sm text-yellow-500 mb-2">PREDICTIVE ALERTS</h3>
            <p className="text-2xl font-bold mb-2">23</p>
            <p className="text-gray-400 text-sm">Potential failures identified early</p>
          </div>

          <div className="bg-dark-card rounded-2xl p-6 border border-primary/30">
            <h3 className="text-sm text-primary mb-2">CO2 SAVED</h3>
            <p className="text-2xl font-bold mb-2">1,284</p>
            <p className="text-gray-400 text-sm">Metric tons reduced this year</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
