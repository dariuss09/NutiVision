'use client';

import React, { useState, useEffect } from 'react';
import { UserButton } from "@clerk/nextjs";
import { 
  Sparkles, 
  Camera, 
  History, 
  Target, 
  Bell, 
  Droplet,
  Plus,
  Dumbbell
} from 'lucide-react';
import { UserGoals } from '@/types/nutrition';

interface HeaderProps {
  activeTab: 'scanner' | 'history' | 'goals' | 'workout';
  setActiveTab: (tab: 'scanner' | 'history' | 'goals' | 'workout') => void;
  userGoals: UserGoals;
  todayCalories: number;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenGoals: () => void;
  onAddWater: (amountMl: number) => void;
}

export function Header({
  activeTab,
  setActiveTab,
  userGoals,
  todayCalories,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenGoals,
  onAddWater,
}: HeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const caloriePercent = isMounted ? Math.min(100, Math.round((todayCalories / (userGoals.calorieTarget || 2000)) * 100)) : 0;
  const waterPercent = isMounted ? Math.min(100, Math.round(((userGoals.currentWaterMl || 0) / (userGoals.waterTargetMl || 2500)) * 100)) : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
          
          {/* Top Row on Mobile (Logo + Actions) / Left on Desktop */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={() => setActiveTab('scanner')}
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-emerald-500/20">
                <img src="/icon.png" alt="NutriVision Logo" className="w-full h-full object-cover scale-[1.25]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    NutriVision
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AI 3.1
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex sm:hidden items-center space-x-2">
              <button
                onClick={onOpenGoals}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400"
              >
                <Bell className="w-4 h-4" />
                {isMounted && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <UserButton />
            </div>
          </div>

          {/* Quick Metrics Bar in Header (Desktop) */}
          <div className="hidden md:flex items-center space-x-5">
            <div 
              onClick={onOpenGoals}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
            >
              <div className="text-left">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <span>Today:</span>
                  <span className="text-white font-semibold">{isMounted ? todayCalories : '---'}</span>
                  <span>/ {isMounted ? userGoals.calorieTarget : '---'} kcal</span>
                </div>
                <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 group-hover:scale-105 transition">
                {isMounted ? `${caloriePercent}%` : '---'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Droplet className="w-4 h-4 text-cyan-400" />
              <div className="text-xs">
                <span className="font-semibold text-white">{isMounted ? userGoals.currentWaterMl || 0 : '---'}</span>
                <span className="text-slate-400">/{isMounted ? userGoals.waterTargetMl : '---'} ml</span>
              </div>
              <button 
                onClick={() => onAddWater(250)}
                className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Row on Mobile (Tabs) / Right on Desktop */}
          <div className="flex items-center w-full sm:w-auto justify-center">
            <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'scanner'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Scanner</span>
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>

              <button
                onClick={() => setActiveTab('workout')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'workout'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Workouts</span>
              </button>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-2 ml-2 border-l border-slate-800 pl-2">
              <button
                onClick={onOpenGoals}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 transition"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition"
              >
                <Bell className="w-4 h-4" />
                {isMounted && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <div className="pl-1 flex items-center">
                <UserButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
