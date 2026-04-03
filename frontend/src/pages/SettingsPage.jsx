import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Bell, 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
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
    className="bg-dark-card rounded-2xl border border-gray-700 overflow-hidden mb-6"
  >
    <div className="px-6 py-5 border-b border-gray-800 bg-white/3 flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="px-6 py-6 text-gray-300">
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
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">System Configuration</h1>
            <p className="text-gray-400 mt-1">Manage Edge AI parameters and notification routing</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-dark-card border border-gray-700 rounded-xl hover:border-primary/50 transition-colors"
            onClick={() => toast.success('Checking for Edge Node updates...')}
          >
            <RefreshCcw className="w-5 h-5 text-primary" />
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
              <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5 hover:border-primary/20 transition-colors">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Twilio SMS Gateway</p>
                    <p className="text-xs text-gray-500">Real-time alerts to +919398230252</p>
                  </div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 border border-primary/30">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-primary transition" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5 hover:border-primary/20 transition-colors">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">SMTP Email Relay</p>
                    <p className="text-xs text-gray-500">Encrypted audit-trail delivery</p>
                  </div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 border border-primary/30">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-primary transition" />
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* AI Thresholds */}
          <SettingsCard 
            title="Edge Intelligence" 
            subtitle="Fine-tune local ML anomaly detection thresholds"
            icon={Cpu}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Predictive Sensitivity</label>
                <input 
                  type="range" min="1" max="100" defaultValue="85"
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>Conservative</span>
                  <span>Responsive</span>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Sync Frequency (Dead Zone)</label>
                <select className="w-full bg-dark-lighter border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                  <option>Every 5 minutes</option>
                  <option selected>On Connection Handshake</option>
                  <option>Manual Sync Only</option>
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
             <div className="flex items-center gap-4 text-sm text-gray-400 p-4 bg-primary/5 border border-primary/10 rounded-xl mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <p>Integrates directly with DP World CARGOES Trust protocol for immutable temperature logging.</p>
            </div>
            <div className="space-y-4">
               <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Encryption Key (Port Handshake)</label>
                <input 
                  type="password" value="********-****-****-****-************"
                  readOnly
                  className="w-full bg-dark-lighter border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-500" 
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
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Reset to Defaults
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSaving}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg ${
                isSaving ? 'bg-gray-700 text-gray-500' : 'bg-primary text-dark hover:shadow-primary/20'
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
