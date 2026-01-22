'use client';

import React from 'react';

export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-800 rounded w-24"></div>
          <div className="h-8 bg-slate-800 rounded w-32"></div>
        </div>
        <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-slate-800/50 border border-slate-700 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-slate-700 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-20"></div>
              <div className="h-3 bg-slate-700 rounded w-40"></div>
            </div>
            <div className="h-4 bg-slate-700 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-800 rounded animate-pulse"></div>
      ))}
    </div>
  );
}
