import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Preferences</h3>
            <p className="mt-1 text-sm text-gray-500">Decide how you want to be notified when events occur.</p>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="email_alerts" name="email_alerts" type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email_alerts" className="font-medium text-gray-700">Email Alerts</label>
                  <p className="text-gray-500">Get notified when a shipment hits critical thresholds.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="sms_alerts" name="sms_alerts" type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="sms_alerts" className="font-medium text-gray-700">SMS Alerts</label>
                  <p className="text-gray-500">Receive SMS for time-sensitive immediate failure predictions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Threshold Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Global configurations for when predictions turn into alerts.</p>
          </div>
          <div className="px-6 py-5">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Temperature Deviation Margin (°C)</label>
                <input type="number" defaultValue={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vibration Spike Threshold (g-force)</label>
                <input type="number" step="0.1" defaultValue={1.5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
