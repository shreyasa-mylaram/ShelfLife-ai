import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import TemperatureChart from '../components/TemperatureChart';
import AuditTrail from '../components/AuditTrail';
import { useContainers } from '../context/ContainerContext';

const ContainerDetails = () => {
  const { id } = useParams();
  const { containers } = useContainers();
  
  const container = containers.find(c => c.id === id);

  if (!container) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Container Not Found</h2>
        <Link to="/" className="text-primary hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 bg-dark-card border border-gray-700 hover:border-primary rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-primary w-6 h-6" /> 
            Container Details: {container.id}
          </h2>
          <p className="text-gray-400 text-sm">Cargo: {container.cargo} | Location: {container.location}</p>
        </div>
      </div>

      <TemperatureChart containerId={container.id} />
      
      <div className="mt-8">
        <AuditTrail filterContainerId={container.id} />
      </div>
    </div>
  );
};

export default ContainerDetails;
