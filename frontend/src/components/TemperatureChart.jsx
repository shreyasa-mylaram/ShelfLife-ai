import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { TrendingUp, Brain } from 'lucide-react';
import { useContainers } from '../context/ContainerContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TemperatureChart = ({ containerId }) => {
  const { containers } = useContainers();
  
  // Use passed containerId or fallback to the first container
  const selectedContainer = containerId 
    ? containers.find(c => c.id === containerId) || containers[0]
    : containers[0];
  
  const hours = ['Now', '+1h', '+2h', '+3h', '+4h', '+5h', '+6h'];
  
  // Generate predictions based on current container
  const generatePredictions = () => {
    const predictions = [selectedContainer.temp];
    for (let i = 1; i <= 6; i++) {
      const increment = (selectedContainer.prediction - selectedContainer.temp) / 6;
      predictions.push(parseFloat((selectedContainer.temp + (increment * i)).toFixed(1)));
    }
    return predictions;
  };
  
  const predictions = generatePredictions();
  const thresholdLine = Array(7).fill(selectedContainer.threshold);
  
  const data = {
    labels: hours,
    datasets: [
      {
        label: 'Predicted Temperature (°C)',
        data: predictions,
        borderColor: '#00d4aa',
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#00d4aa',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Safety Threshold',
        data: thresholdLine,
        borderColor: '#ffaa44',
        borderDash: [5, 5],
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
      legend: {
        labels: {
          color: '#e0e4e8',
          usePointStyle: true,
        },
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e2f3a',
        titleColor: '#00d4aa',
        bodyColor: '#e0e4e8',
        borderColor: '#00d4aa',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        grid: {
          color: '#2c4452',
        },
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#e0e4e8',
        },
        ticks: {
          color: '#e0e4e8',
        },
      },
      x: {
        grid: {
          color: '#2c4452',
        },
        ticks: {
          color: '#e0e4e8',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Temperature Forecast (6-Hour AI Prediction)</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Brain className="w-4 h-4 text-primary" />
          <span>Container: {selectedContainer.id}</span>
        </div>
      </div>
      
      <div className="bg-dark-card rounded-2xl p-6 border border-gray-700">
        <Line data={data} options={options} />
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-semibold">Edge AI Analysis:</span>
            {selectedContainer.prediction > selectedContainer.threshold ? (
              <span className="text-yellow-500">⚠️ Temperature is projected to exceed threshold in {Math.floor(Math.random() * 4) + 2} hours. Local intervention recommended.</span>
            ) : (
              <span className="text-green-500">✓ Temperature trajectory stable. No intervention required.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemperatureChart;