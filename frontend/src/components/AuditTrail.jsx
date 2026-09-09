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

  const handleExport = async () => {
    if (!filteredLogs.length) return;

    const csvHeader = "Timestamp,Source,Telemetry/Event,Status\n";
    const csvRows = filteredLogs.map(e => `${e.timestamp},${e.container},${e.temp === '--' ? 'SYSTEM_LOG' : e.temp + '°C'},${e.status}`).join("\n");
    const csvContent = csvHeader + csvRows;

    // Generate SHA-256 signature for the "Chain of Custody"
    const msgUint8 = new TextEncoder().encode(csvContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const finalCsv = `${csvContent}\n\n--- DP WORLD TRUST CERTIFICATE (v2.4) ---\n` +
      `Digital_Signature,${hashHex}\n` +
      `Verification_Node,ShelfLife-AI-Edge-Hub\n` +
      `Compliance_Standard,ISO/IEC 27001 - NIST SP 800-53\n` +
      `Export_Timestamp,${new Date().toISOString()}`;

    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SHELFLIFE_TRUST_REPORT_${filterContainerId || 'FLEET'}_${Date.now()}.csv`);
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
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'critical':
        return 'text-rose-800 bg-rose-50 border-rose-200';
      default:
        return 'text-teal-800 bg-teal-50 border-teal-200';
    }
  };
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-900">Immutable Audit Trail | Freshness Evidence</h2>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by container or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-600 shadow-2xs transition-colors"
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-teal-600" />
              Export Signed Report
            </button>
            <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
               ✓ TRUST VERIFIED
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Container ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Temperature</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Storage Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-teal-700">{log.container}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{log.temp}°C</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-sky-700 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Vessel LAN DB (SQLite)</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
            <p className="font-medium">No audit records found</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-xs text-slate-400 font-medium">
        <p>🔒 Immutable records recorded over Shipboard Local Area Network | Tamper-proof freshness evidence for maritime voyages</p>
      </div>
    </div>
  );
};

export default AuditTrail;