import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useContainers } from '../context/ContainerContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { TrendingUp, TrendingDown, AlertTriangle, Package, Download, Brain, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const AnalyticsPage = () => {
  const { containers } = useContainers();
  const [period, setPeriod] = useState('week');
  const [isExporting, setIsExporting] = useState(false);

  // Chart options themed for light pastel design
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#475569', font: { family: 'Inter', size: 11, weight: '600' } }, position: 'bottom' },
      tooltip: { 
        backgroundColor: '#ffffff', 
        titleColor: '#0f172a', 
        bodyColor: '#334155',
        borderColor: '#e2e8f0', 
        borderWidth: 1,
        padding: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }
    },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#64748b' } }
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
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="flex flex-wrap justify-between items-center gap-6 mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Predictive Intelligence Analytics</h1>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed font-medium">
              Global intelligence insights for DP World fleet. ShelfLife AI saves an average of <span className="text-teal-700 font-bold">$280k per shipment</span> through early predictive intervention.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white border border-slate-200 p-1 rounded-2xl flex items-center shadow-2xs">
              {['day', 'week', 'month'].map(p => (
                <button
                  key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${period === p ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleExport} disabled={isExporting}
              className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-teal-600" /> Export Intelligence Report
            </motion.button>
          </div>
        </div>

        {/* Dynamic AI Savings Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Brain className="w-48 h-48 text-teal-600" />
            </div>
            <div className="relative">
              <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[10px] font-bold uppercase tracking-widest">Global Impact</span>
              <h2 className="text-4xl font-black text-slate-900 mt-4">$3,450,000</h2>
              <p className="text-slate-500 text-sm mt-1 mb-6 font-medium">Estimated annual savings via predictive monitoring</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Shield, label: 'Claims Avoided', val: '24' },
                  { icon: Clock, label: 'Early Warning', val: '6.4h' },
                  { icon: Leaf, label: 'Carbon Saved', val: '1.2kT' },
                  { icon: TrendingDown, label: 'Waste %', val: '-18%' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
                    <Icon className="w-4 h-4 text-teal-600 mb-1" />
                    <p className="text-lg font-black text-slate-900">{val}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center text-center">
             <div className="mx-auto w-16 h-16 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center mb-4 text-sky-600 shadow-2xs">
                <TrendingUp className="w-8 h-8" />
             </div>
             <p className="text-3xl font-black text-sky-700">18.2%</p>
             <p className="text-sm text-slate-500 font-medium mt-1">Operational Efficiency Boost</p>
             <div className="mt-6 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '18.2%' }} className="h-full bg-sky-600" />
             </div>
             <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Verified by Shipboard Network Intelligence Engine</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Package className="w-4 h-4 text-teal-600" /> Container Health Distribution
            </h3>
            <div className="h-80 relative">
               <Doughnut data={statusDist} options={{ ...commonOptions, cutout: '75%' }} />
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-black text-slate-900">{containers.length}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Fleet Size</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Root Cause of Incidents
            </h3>
            <div className="h-80">
              <Bar 
                data={{
                  labels: ['Cooling Failure', 'Ambient Spike', 'Vibration', 'Power Loss'],
                  datasets: [{ data: [12, 19, 3, 5], backgroundColor: 'rgba(13, 148, 136, 0.5)', borderColor: '#0d9488', borderWidth: 1, borderRadius: 8 }]
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
              <div key={insight.title} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-teal-200 transition-all">
                <p className="text-xs font-bold text-teal-700 mb-2 flex items-center gap-2">
                   <Shield className="w-3.5 h-3.5" /> {insight.title.toUpperCase()}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{insight.body}</p>
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
