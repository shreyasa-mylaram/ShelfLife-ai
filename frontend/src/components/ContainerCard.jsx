import React from 'react';
import HealthGauge from './HealthGauge';
import { NavLink } from 'react-router-dom';

const ContainerCard = ({ containerId, healthScore = 100, temperature, location, status }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{containerId}</h3>
          <p className="text-sm text-gray-500">{location || "Unknown Location"}</p>
        </div>
        <HealthGauge score={healthScore} size="sm" animate={false} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500 uppercase">Temp</p>
          <p className="font-semibold text-sm">{temperature ? `${temperature}°C` : 'N/A'}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded flex items-center justify-center">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            status === 'critical' ? 'bg-red-100 text-red-800' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {status ? status.toUpperCase() : 'NORMAL'}
          </span>
        </div>
      </div>

      <NavLink 
        to={`/container/${containerId}`} 
        className="w-full block text-center py-2 bg-blue-50 text-blue-600 rounded-md font-medium text-sm hover:bg-blue-100 transition-colors"
      >
        View Details
      </NavLink>
    </div>
  );
};

export default ContainerCard;
