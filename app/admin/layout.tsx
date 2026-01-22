'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, LogOut, BarChart3, Users, Zap, Settings, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Zap, label: 'Bot Events', href: '/admin/events' },
    { icon: Clock, label: 'Logs', href: '/admin/logs' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-950 text-slate-100 transition-all duration-300 flex flex-col border-r border-slate-800 fixed h-full z-40`}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                RajaOTP
              </h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 transition group"
            >
              <Icon size={20} className="text-slate-400 group-hover:text-blue-400 transition" />
              {isSidebarOpen && (
                <span className="text-sm font-medium group-hover:text-slate-100 transition">
                  {label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition group"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isSidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300 bg-slate-950`}>
        {/* Top Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">Welcome back to RajaOTP Admin</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Bot Status Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-400">Bot Online</span>
            </div>
            {/* Refresh Button */}
            <button className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
