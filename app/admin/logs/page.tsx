'use client';

import BotEventsFeed from '@/app/admin/components/BotEventsFeed';

export default function LogsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Logs</h1>
        <p className="text-slate-400">System events and bot activity logs</p>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 overflow-hidden">
        <BotEventsFeed />
      </div>
    </div>
  );
}
