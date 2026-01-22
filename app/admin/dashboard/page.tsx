'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Activity, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/Card';
import { SkeletonCard } from '@/app/admin/components/Skeleton';
import BotEventsFeed from '@/app/admin/components/BotEventsFeed';

interface DashboardStats {
  totalUsers: number;
  totalBalance: number;
  activeUsers: number;
  loading: boolean;
  error: string | null;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'up',
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 hover:border-slate-700 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-bold text-slate-50">
              {value}
            </h3>
            {change && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
                <TrendIcon size={14} />
                {change}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent border border-blue-500/20 group-hover:border-blue-500/40 transition-all">
            <Icon size={24} className="text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBalance: 0,
    activeUsers: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=10000');
      const data = await response.json();

      if (!response.ok) {
        setStats(prev => ({
          ...prev,
          error: data.error || 'Failed to fetch stats',
          loading: false,
        }));
        return;
      }

      const users = data.data;
      const totalBalance = users.reduce((sum: number, user: any) => sum + (user.balance || 0), 0);
      const activeUsers = users.filter((u: any) => u.balance > 0).length;

      setStats({
        totalUsers: users.length,
        totalBalance,
        activeUsers,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setStats(prev => ({
        ...prev,
        error: err.message || 'Failed to fetch stats',
        loading: false,
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Dashboard</h1>
        <p className="text-slate-400 mb-6">Live bot statistics from RajaOTP</p>

        {stats.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : stats.error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            <p className="font-medium">Error loading statistics</p>
            <p className="text-sm mt-1">{stats.error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              change={stats.totalUsers > 0 ? '+5' : undefined}
              icon={Users}
              trend="up"
            />
            <StatCard
              title="Total Saldo"
              value={`Rp ${stats.totalBalance.toLocaleString('id-ID')}`}
              change="+5.2%"
              icon={TrendingUp}
              trend="up"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              change={stats.activeUsers > 0 ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` : undefined}
              icon={Activity}
              trend="neutral"
            />
            <StatCard
              title="Success Rate"
              value="92%"
              change="+2.4%"
              icon={BarChart3}
              trend="up"
            />
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Recent Activity</h2>
          <p className="text-sm text-slate-400 mt-1">Latest bot events and transactions</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 overflow-hidden">
          <BotEventsFeed />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-3">
          <p className="text-sm font-medium text-slate-400">Orders Today</p>
          <p className="text-2xl font-bold text-slate-100">24</p>
          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-3">
          <p className="text-sm font-medium text-slate-400">Refunds</p>
          <p className="text-2xl font-bold text-slate-100">2</p>
          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full" style={{ width: '8%' }}></div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 space-y-3">
          <p className="text-sm font-medium text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-slate-100">5</p>
          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
