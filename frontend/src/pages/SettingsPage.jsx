import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Bell, 
  Shield, 
  Cpu, 
  Save, 
  RefreshCcw, 
  Zap, 
  Globe, 
  Lock 
} from 'lucide-react';

const SettingsCard = ({ title, subtitle, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mb-6"
  >
    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
      <div className="p-2 bg-teal-50 border border-teal-200/60 rounded-lg">
        <Icon className="w-5 h-5 text-teal-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
    <div className="px-6 py-6 text-slate-700">
      {children}
    </div>
  </motion.div>
);

const SettingsPage = () => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configuration updated and synced to Edge devices.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">System Configuration</h1>
            <p className="text-slate-500 mt-1">Manage Vessel Network parameters and notification routing</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-500/50 shadow-xs transition-colors"
            onClick={() => toast.success('Checking Shipboard LAN status...')}
          >
            <RefreshCcw className="w-5 h-5 text-teal-600" />
          </motion.button>
        </div>

        <form onSubmit={handleSave}>
          
          {/* Notifications */}
          <SettingsCard 
            title="Notification Pipeline" 
            subtitle="Configure multi-channel predictive alerting"
            icon={Bell}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:border-teal-300 transition-colors">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Twilio SMS Gateway</p>
                    <p className="text-xs text-slate-500">Real-time alerts to +919398230252</p>
                  </div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-teal-100 border border-teal-300">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-teal-600 transition shadow-xs" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:border-teal-300 transition-colors">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">SMTP Email Relay</p>
                    <p className="text-xs text-slate-500">Encrypted audit-trail delivery</p>
                  </div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-teal-100 border border-teal-300">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-teal-600 transition shadow-xs" />
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* AI Thresholds */}
          <SettingsCard 
            title="Shipboard Intelligence" 
            subtitle="Fine-tune local ML anomaly detection thresholds over Vessel LAN"
            icon={Cpu}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Predictive Sensitivity</label>
                <input 
                  type="range" min="1" max="100" defaultValue="85"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600" 
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>Conservative</span>
                  <span>Responsive</span>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Satellite Sync Interval</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:border-teal-500 focus:outline-none shadow-xs">
                  <option>Every 5 minutes</option>
                  <option selected>Continuous Shipboard LAN</option>
                  <option>Port Terminal Handshake</option>
                </select>
              </div>
            </div>
          </SettingsCard>

          {/* Security & Audit */}
          <SettingsCard 
            title="Security & Chain of Custody" 
            subtitle="Blockchain and encryption settings"
            icon={Shield}
          >
             <div className="flex items-center gap-4 text-sm text-teal-800 p-4 bg-teal-50/70 border border-teal-200/70 rounded-xl mb-4">
              <Zap className="w-5 h-5 text-teal-600 shrink-0" />
              <p>Integrates directly with DP World CARGOES Trust protocol for immutable temperature logging.</p>
            </div>
            <div className="space-y-4">
               <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Encryption Key (Port Handshake)</label>
                <input 
                  type="password" value="********-****-****-****-************"
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-500" 
                />
              </div>
            </div>
          </SettingsCard>

          {/* Action Footer */}
          <div className="flex justify-end gap-4 mt-8 pb-12">
             <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Reset to Defaults
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSaving}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${
                isSaving ? 'bg-slate-200 text-slate-400' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
              }`}
            >
              {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Syncing...' : 'Save & Deploy Configuration'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
