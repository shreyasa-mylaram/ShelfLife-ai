import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const SensorCard = ({ title, value, unit, status, prediction }) => {
  const isCritical = status === 'critical';
  const isWarning = status === 'warning';
  const isNormal = status === 'normal' || !status;

  let borderColor = "border-gray-200";
  let icon = <Info className="w-5 h-5 text-gray-500" />;
  
  if (isCritical) {
    borderColor = "border-red-500";
    icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
  } else if (isWarning) {
    borderColor = "border-yellow-500";
    icon = <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  } else if (isNormal) {
    borderColor = "border-green-500";
    icon = <CheckCircle className="w-5 h-5 text-green-500" />;
  }

  return (
    <div className={`p-4 bg-white rounded-lg shadow border-l-4 ${borderColor} flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-sm font-medium text-gray-500">{unit}</span>
        </div>
        {prediction && (
          <p className="mt-2 text-xs text-blue-600 font-medium">
            Forecast: {prediction}
          </p>
        )}
      </div>
    </div>
  );
};

export default SensorCard;
