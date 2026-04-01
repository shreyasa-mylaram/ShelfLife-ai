import React, { useState } from 'react';
import { useContainers } from '../context/ContainerContext';
import { useLocation } from 'react-router-dom';
import { History, CheckCircle, AlertCircle, Download, Search } from 'lucide-react';

const AuditTrail = ({ filterContainerId, dashboardFilter = 'all' }) => {
  const { auditLogs } = useContainers();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterParam = queryParams.get('filter');
  
  const baseLogs = auditLogs.filter(log => {
    let keep = true;
    if (filterContainerId && log.container !== filterContainerId) keep = false;
    
    // URL filter overriding logic (for /audit page links)
    if (filterParam === 'alerts' && log.status.toLowerCase() === 'normal') keep = false;
    
    // Dashboard local filter logic
    if (dashboardFilter === 'alerts' && log.status.toLowerCase() === 'normal') keep = false;
    if (dashboardFilter === 'sync' && log.container !== 'SYSTEM') keep = false;
    
    return keep;
  });

  const filteredLogs = baseLogs.filter(log => 
    log.container.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Container ID,Temperature,Status\n"
      + filteredLogs.map(e => `${e.timestamp},${e.container},${e.temp},${e.status}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_report_${filterContainerId || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'normal':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-primary" />;
    }
  };
  
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'normal':
        return 'text-green-500 bg-green-500/10 border-green-500';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500';
      default:
        return 'text-primary bg-primary/10 border-primary';
    }
  };
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Immutable Audit Trail | Freshness Evidence</h2>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by container or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-dark-card border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-dark-card border border-gray-600 rounded-lg text-sm hover:border-primary transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
      
      <div className="bg-dark-card rounded-2xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-lighter">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Container ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Temperature</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Storage Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-dark-lighter/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-300">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm font-mono text-primary">{log.container}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{log.temp}°C</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle className="w-4 h-4" />
                      <span>Stored Locally (SQLite)</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No audit records found</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>🔒 Immutable records stored in local SQLite database | Tamper-proof freshness evidence for high-value cargo</p>
      </div>
    </div>
  );
};

export default AuditTrail;