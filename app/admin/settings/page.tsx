'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface Settings {
  botName: string;
  botStatus: 'online' | 'offline' | 'maintenance';
  webhookUrl: string;
  refreshInterval: number;
  maxEvents: number;
  theme: 'dark' | 'light';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    botName: 'RajaOTP Bot',
    botStatus: 'online',
    webhookUrl: 'http://localhost:3000/api/bot/event',
    refreshInterval: 5,
    maxEvents: 1000,
    theme: 'dark',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400">Configure bot and dashboard settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">General</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bot Name</label>
            <input
              type="text"
              value={settings.botName}
              onChange={(e) => handleChange('botName', e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bot Status</label>
            <select
              value={settings.botStatus}
              onChange={(e) => handleChange('botStatus', e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="online">🟢 Online</option>
              <option value="offline">🔴 Offline</option>
              <option value="maintenance">🟡 Maintenance</option>
            </select>
          </div>
        </div>

        {/* API Settings */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">API & Webhook</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
            <input
              type="text"
              value={settings.webhookUrl}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Dashboard Settings */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Dashboard</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Refresh Interval (seconds)</label>
            <input
              type="number"
              value={settings.refreshInterval}
              onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
              min="1"
              max="60"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Storage Settings */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Storage</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Max Events to Keep</label>
            <input
              type="number"
              value={settings.maxEvents}
              onChange={(e) => handleChange('maxEvents', parseInt(e.target.value))}
              min="100"
              max="10000"
              step="100"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium">Settings saved</span>
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-900/20 transition"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
