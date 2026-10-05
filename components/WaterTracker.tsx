'use client';

import React, { useState, useEffect } from 'react';
import { Droplet, Plus, RotateCcw } from 'lucide-react';

interface WaterTrackerProps {
  currentMl: number;
  targetMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
}

export function WaterTracker({
  currentMl,
  targetMl,
  onAddWater,
  onResetWater,
}: WaterTrackerProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const percentage = isMounted ? Math.min(100, Math.round((currentMl / (targetMl || 2500)) * 100)) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      
      {/* Left: Hydration Metrics */}
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
          <Droplet className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Daily Hydration Tracking</h3>
            <span className="text-xs font-bold text-cyan-400">
              {isMounted ? `${percentage}%` : '---'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Logged: <strong className="text-white">{isMounted ? currentMl : '---'}</strong> / {isMounted ? targetMl : '---'} ml</span>
            <span>&bull;</span>
            <span>~{isMounted ? Math.round(currentMl / 250) : '---'} of {isMounted ? Math.round(targetMl / 250) : '---'} glasses</span>
          </div>

          {/* Progress bar */}
          <div className="w-full sm:w-64 h-2 bg-slate-950 rounded-full mt-2 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={() => onAddWater(250)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+250 ml (Glass)</span>
        </button>

        <button
          type="button"
          onClick={() => onAddWater(500)}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+500 ml (Bottle)</span>
        </button>

        {isMounted && currentMl > 0 && (
          <button
            type="button"
            onClick={onResetWater}
            title="Reset water intake"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
}
