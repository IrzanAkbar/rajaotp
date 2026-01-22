'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Clock, RefreshCw, Zap } from 'lucide-react';
import { Badge, getEventBadgeVariant, getEventBadgeLabel } from './Badge';
import { SkeletonTable } from './Skeleton';

interface BotEvent {
  id: string;
  eventType: string;
  data: Record<string, any>;
  timestamp: string;
  receivedAt: string;
  processed: boolean;
}

interface EventStats {
  totalEvents: number;
  byType: Record<string, number>;
  uniqueUsers: number;
  latestEvent?: string;
  oldestEvent?: string;
}

export default function BotEventsFeed() {
  const [events, setEvents] = useState<BotEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchEvents = async () => {
    try {
      const url = filter 
        ? `/api/bot/events?type=${filter}&limit=50`
        : `/api/bot/events?limit=50`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (!autoRefresh) return;
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  return (
    <div className="space-y-4 py-4">
      {/* Header with Controls */}
      <div className="px-6 flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Events</h3>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.totalEvents || 0} total • {stats?.uniqueUsers || 0} users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200"
            title="Refresh"
          >
            <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
          </button>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border border-slate-600 bg-slate-800"
            />
            <span>Auto</span>
          </label>
        </div>
      </div>

      {/* Event Type Filters */}
      {!loading && stats && (
        <div className="px-6 flex gap-2 flex-wrap">
          {[
            { type: '', label: 'All' },
            { type: 'order_success', label: 'Success', count: stats.byType?.order_success },
            { type: 'order_refund', label: 'Refund', count: stats.byType?.order_refund },
            { type: 'saldo_update', label: 'Update', count: stats.byType?.saldo_update },
            { type: 'bot_error', label: 'Errors', count: stats.byType?.bot_error },
          ].map(({ type, label, count }) => (
            <button
              key={type || 'all'}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === type
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
              {count && count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Events Table */}
      <div className="px-6">
        {loading ? (
          <SkeletonTable />
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} className="mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-slate-400">No events yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {events.map(event => (
              <div
                key={event.id}
                className="bg-slate-800/50 hover:bg-slate-800 rounded-lg p-4 transition border border-slate-700 hover:border-slate-600 group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {getEventIcon(event.eventType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={getEventBadgeVariant(event.eventType)}>
                        {getEventBadgeLabel(event.eventType)}
                      </Badge>
                      {event.data?.userId && (
                        <span className="text-xs text-slate-400">
                          ID: {event.data.userId}
                        </span>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="text-sm text-slate-300 space-y-0.5">
                      {event.eventType === 'order_success' && (
                        <>
                          <p>Order: <span className="font-mono text-xs text-slate-400">{event.data?.orderId?.substring(0, 20) || 'N/A'}</span></p>
                          <p>Amount: <span className="font-semibold text-emerald-400">Rp {(event.data?.amount || 0).toLocaleString('id-ID')}</span></p>
                        </>
                      )}
                      {event.eventType === 'order_refund' && (
                        <>
                          <p>Refund: <span className="font-semibold text-red-400">Rp {(event.data?.refundAmount || 0).toLocaleString('id-ID')}</span> ({event.data?.reason || 'N/A'})</p>
                        </>
                      )}
                      {event.eventType === 'saldo_update' && (
                        <>
                          <p>Saldo changed: <span className="font-semibold text-blue-400">Rp {(event.data?.changeAmount || 0).toLocaleString('id-ID')}</span></p>
                          <p className="text-xs text-slate-500">{event.data?.reason || 'N/A'}</p>
                        </>
                      )}
                      {event.eventType === 'deposit_success' && (
                        <>
                          <p>Deposit: <span className="font-semibold text-emerald-400">Rp {(event.data?.depositAmount || 0).toLocaleString('id-ID')}</span> via {event.data?.channel || 'N/A'}</p>
                        </>
                      )}
                      {event.eventType === 'bot_error' && (
                        <>
                          <p className="text-red-400">{event.data?.message || 'Unknown error'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </p>
                    <p className="text-xs font-medium text-slate-400 whitespace-nowrap group-hover:text-slate-300">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'order_success':
      return <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />;
    case 'order_refund':
      return <XCircle size={20} className="text-red-600 dark:text-red-400" />;
    case 'saldo_update':
      return <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />;
    case 'deposit_success':
      return <Zap size={20} className="text-orange-600 dark:text-orange-400" />;
    case 'bot_error':
      return <AlertCircle size={20} className="text-red-600 dark:text-red-400" />;
    default:
      return <Clock size={20} className="text-slate-600 dark:text-slate-400" />;
  }
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    }
  } catch {
    return 'Unknown date';
  }
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return 'Unknown time';
  }
}
