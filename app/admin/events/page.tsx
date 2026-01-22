import React from 'react';
import BotEventsFeed from '@/app/admin/components/BotEventsFeed';

export default function BotEventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bot Activity</h1>
        <p className="text-gray-600">
          Real-time events from RajaOTP Bot via webhook
        </p>
      </div>

      <BotEventsFeed />
    </div>
  );
}
