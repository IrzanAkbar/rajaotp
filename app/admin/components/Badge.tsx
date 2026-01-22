'use client';

import React from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  error: 'bg-red-500/20 text-red-300 border border-red-500/40',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  info: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  default: 'bg-slate-700/50 text-slate-300 border border-slate-600',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function getEventBadgeVariant(eventType: string): BadgeVariant {
  switch (eventType) {
    case 'order_success':
    case 'deposit_success':
      return 'success';
    case 'order_refund':
    case 'bot_error':
      return 'error';
    case 'saldo_update':
      return 'info';
    default:
      return 'default';
  }
}

export function getEventBadgeLabel(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
