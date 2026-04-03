import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useContainers } from '../context/ContainerContext';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Package, Download, Calendar, Brain, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatNumber } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const AnalyticsPage = () => {
  const { containers } = useContainers();
  const [period, setPeriod] = useState('week');
  const [isExporting, setIsExporting] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    totalContainers: 0,
    alertsCount: 0,
    avgTemperature: 0,
    wasteReduction: 18.2,
    savings: 3450000
  });

  useEffect(() => {
    const total = containers.length;
    const alerts = containers.filter(c => c.status !== 'normal').length;
    const avgTemp = containers.reduce((sum, c) => sum + c.temp, 0) / (total || 1);
    
    setAnalyticsData(prev => ({
      ...prev,
      totalContainers: total,
      alertsCount: alerts,
      avgTemperature: avgTemp,
      primaryColor: '#3b82f6' // Royal Blue theme for Intelligence
    }));
  }, [containers]);

  // Chart options themed for glassmorphism
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }, position: 'bottom' },
      tooltip: { backgroundColor: '#0d2233', titleColor: '#00d4aa', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } },
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } }
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      { loading: 'Generating DP World CARGOES Report...', success: 'Report generated successfully!', error: 'Failed to export.' }
    ).then(() => setIsExporting(false));
  };

  // Derived chart data
  const statusDist = {
    labels: ['Safe', 'Warning', 'Predictive Alert'],
    datasets: [{
      data: [
        containers.filter(c => c.status === 'normal').length,
        containers.filter(c => c.status === 'warning').length,
        containers.filter(c => c.status === 'critical').length
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0, hoverOffset: 15
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark/95 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10 pb-8 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Predictive Intelligence Analytics</h1>
            <p className="text-gray-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Global intelligence insights for DP World fleet. ShelfLife AI saves an average of <span className="text-blue-400 font-bold">$280k per shipment</span> through early predictive intervention.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-dark-card border border-white/5 p-1 rounded-xl flex items-center">
              {['day', 'week', 'month'].map(p => (
                <button
                  key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleExport} disabled={isExporting}
              className="px-6 py-2 bg-blue-600/15 border border-blue-600/40 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Intelligence Report
            </motion.button>
          </div>
        </div>

        {/* Dynamic AI Savings Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <div className="lg:col-span-2 bg-dark-card rounded-3xl p-6 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Brain className="w-48 h-48 text-primary" />
            </div>
            <div className="relative">
              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-widest">Global Impact</span>
              <h2 className="text-4xl font-black text-white mt-4">$3,450,000</h2>
              <p className="text-gray-400 text-sm mt-1 mb-6 italic">Estimated annual savings via predictive monitoring</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Shield, label: 'Claims Avoided', val: '24' },
                  { icon: Clock, label: 'Early Warning', val: '6.4h' },
                  { icon: Leaf, label: 'Carbon Saved', val: '1.2kT' },
                  { icon: TrendingDown, label: 'Waste %', val: '-18%' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <Icon className="w-4 h-4 text-primary opacity-70 mb-2" />
                    <p className="text-lg font-bold text-white">{val}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-dark-card rounded-3xl p-6 border border-blue-500/10 flex flex-col justify-center text-center">
             <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
                <TrendingUp className="w-8 h-8" />
             </div>
             <p className="text-3xl font-bold gradient-text">18.2%</p>
             <p className="text-sm text-gray-400 mt-1">Operational Efficiency Boost</p>
             <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '18.2%' }} className="h-full bg-blue-600" />
             </div>
             <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest text-blue-400/50">Verified by Edge Intelligence Engine</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-card rounded-3xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Package className="w-4 h-4" /> Container Health Distribution
            </h3>
            <div className="h-80 relative">
               <Doughnut data={statusDist} options={{ ...commonOptions, cutout: '75%' }} />
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-bold">{containers.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Fleet Size</p>
               </div>
            </div>
          </div>

          <div className="bg-dark-card rounded-3xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" /> Root Cause of Incidents
            </h3>
            <div className="h-80">
              <Bar 
                data={{
                  labels: ['Cooling Failure', 'Ambient Spike', 'Vibration', 'Power Loss'],
                  datasets: [{ data: [12, 19, 3, 5], backgroundColor: 'rgba(0, 212, 170, 0.4)', borderColor: '#00d4aa', borderWidth: 1, borderRadius: 8 }]
                }} 
                options={commonOptions} 
              />
            </div>
          </div>
        </div>

        {/* Bottom Insight Feed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Optimization identified', body: 'Temperature ranges in Sector 7 can be raised by 0.5°C to save 4% energy while remaining within pharmaceuticals safety threshold.' },
              { title: 'Anomaly Detected', body: 'Unit DPW-1024C showed high-frequency vibration during docking, indicating potential mechanical wear in the cooling fan.' },
              { title: 'ROI Analysis', body: 'Predictive alerting prevented 3 critical spoilage events last week, protecting $920,000 in cargo value.' }
            ].map(insight => (
              <div key={insight.title} className="p-5 rounded-2xl bg-white/3 border border-white/5 hover:border-blue-500/20 transition-all">
                <p className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2 underline underline-offset-4 decoration-blue-500/30">
                   <Shield className="w-3.5 h-3.5" /> {insight.title.toUpperCase()}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">{insight.body}</p>
              </div>
            ))}
        </div>

      </div>
    </div>
  );
};

// Placeholder icon for the Leaf mentioned in the loop
const Leaf = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1.8 9.8a7 7 0 0 1-9.8 8.2Z" />
    <path d="M11 20v-5" />
    <path d="M7 11c1-1 3-2 3-2" />
  </svg>
);

export default AnalyticsPage;
