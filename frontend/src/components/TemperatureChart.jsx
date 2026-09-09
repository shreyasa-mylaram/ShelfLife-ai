import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { TrendingUp, Brain, ChevronDown } from 'lucide-react';
import { useContainers } from '../context/ContainerContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TemperatureChart = ({ containerId }) => {
  const { containers } = useContainers();
  const [selectedId, setSelectedId] = useState(null);

  // Resolve which container to show
  const target = selectedId
    ? containers.find(c => c.id === selectedId) || containers[0]
    : containerId
      ? containers.find(c => c.id === containerId) || containers[0]
      : containers[0];

  if (!target) return null;

  const isCritical = target.status === 'critical';
  const isWarning  = target.status === 'warning';
  const isOverThreshold = target.prediction > target.threshold;

  const lineColor = isCritical ? '#e11d48' : isWarning ? '#d97706' : '#0d9488';

  // Build 7-point forecast from now → +6h
  const hours = ['Now', '+1h', '+2h', '+3h', '+4h', '+5h', '+6h'];
  const buildForecast = () => {
    const pts = [target.temp];
    for (let i = 1; i <= 6; i++) {
      const inc = (target.prediction - target.temp) / 6;
      pts.push(parseFloat((target.temp + inc * i).toFixed(2)));
    }
    return pts;
  };

  const forecast = buildForecast();
  const thresholdLine = Array(7).fill(target.threshold);

  const chartData = {
    labels: hours,
    datasets: [
      {
        label: 'AI Forecast (°C)',
        data: forecast,
        borderColor: lineColor,
        backgroundColor: `${lineColor}15`,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: forecast.map(v => v > target.threshold ? '#e11d48' : lineColor),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: `Safety Threshold (${target.threshold}°C)`,
        data: thresholdLine,
        borderColor: '#f97316',
        borderDash: [6, 4],
        backgroundColor: 'transparent',
        pointRadius: 0,
        fill: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: '#475569', usePointStyle: true, boxWidth: 8, font: { weight: '600' } }, position: 'top' },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}°C`
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#64748b', callback: v => `${v}°C` },
        title: { display: true, text: 'Temperature (°C)', color: '#64748b' },
      },
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#64748b' }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-900">6-Hour AI Temperature Forecast</h2>
        </div>
        {/* Container selector */}
        <div className="relative flex items-center gap-2">
          <Brain className="w-4 h-4 text-teal-600" />
          <select
            value={selectedId || target.id}
            onChange={e => setSelectedId(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 px-3 py-1.5 pr-8 rounded-xl focus:border-teal-600 focus:outline-none cursor-pointer shadow-2xs"
          >
            {containers.map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.cargoLabel || c.cargo}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <Line data={chartData} options={options} />

        {/* AI Analysis footer */}
        <div className={`mt-5 p-4 rounded-2xl border ${
          isOverThreshold ? 'bg-amber-50 border-amber-200 text-amber-900' :
          isCritical ? 'bg-rose-50 border-rose-200 text-rose-900' :
          'bg-teal-50/70 border-teal-200 text-teal-900'
        }`}>
          <div className="flex items-start gap-3">
            <Brain className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isOverThreshold ? 'text-amber-600' : isCritical ? 'text-rose-600' : 'text-teal-700'
            }`} />
            <div>
              <p className="text-sm font-bold mb-1">Edge AI Analysis — {target.id}</p>
              {isOverThreshold ? (
                <p className="text-sm text-amber-800">
                  ⚠️ Temperature is projected to exceed <strong>{target.threshold}°C</strong> threshold before +6h.
                  The local Edge AI Engine has queued a preventative alert.{target.breachInHours ? ` Estimated breach in ~${target.breachInHours}h.` : ''}
                </p>
              ) : isCritical ? (
                <p className="text-sm text-rose-800">
                  🚨 Container is currently above safe threshold. Immediate cooling intervention required.
                  SMS &amp; email alerts have been dispatched via DP World notification channel.
                </p>
              ) : (
                <p className="text-sm text-emerald-800">
                  ✅ Temperature trajectory is stable. <strong>{target.cargoLabel || target.cargo}</strong> forecasted to remain within {target.threshold}°C limit for the next 6 hours.
                  No action required.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureChart;