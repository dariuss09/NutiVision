'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  Droplet, 
  ShieldCheck, 
  Send, 
  Trash2, 
  AlertCircle,
  Flame,
  Sparkles
} from 'lucide-react';
import { NotificationSettings, AppNotification } from '@/types/nutrition';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSaveSettings: (settings: NotificationSettings) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onTriggerTestNotification: () => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onTriggerTestNotification,
}: NotificationCenterModalProps) {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [permissionState, setPermissionState] = useState<'default' | 'granted' | 'denied'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  if (!isOpen) return null;

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermissionState(result);
        const updated = {
          ...localSettings,
          enabled: result === 'granted',
          browserPermission: result,
        };
        setLocalSettings(updated);

        if (result === 'granted') {
          new Notification("NutriVision AI Reminders Active! 🥗", {
            body: "You'll receive daily meal log reminders and hydration prompts right on time.",
            icon: "/favicon.ico",
          });
        }
      } catch (e) {
        console.error("Error requesting notification permission:", e);
      }
    }
  };

  const handleToggleMaster = (val: boolean) => {
    const updated = { ...localSettings, enabled: val };
    setLocalSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Notifications & Alerts</h3>
              <p className="text-xs text-slate-400">Automated intake & hydration reminders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">System Push Notifications</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                permissionState === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {permissionState === 'granted' ? 'Active' : 'Permission Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Receive alerts even when NutriVision is running in the background.
            </p>
          </div>

          {permissionState !== 'granted' ? (
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition"
            >
              Enable Push
            </button>
          ) : (
            <button
              type="button"
              onClick={onTriggerTestNotification}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shrink-0 transition"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Ping</span>
            </button>
          )}
        </div>

        {/* Schedule Daily Meal Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Reminder Schedule</span>
            </h4>
            <button
              type="button"
              onClick={() => handleToggleMaster(!localSettings.enabled)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                localSettings.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {localSettings.enabled ? 'All Enabled' : 'Paused'}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            
            {/* Breakfast */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={localSettings.breakfastEnabled && localSettings.enabled}
                  onChange={(e) => {
                    const updated = { ...localSettings, breakfastEnabled: e.target.checked };
                    setLocalSettings(updated);
                  }}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Morning Breakfast Reminder</span>
                  <span className="text-[10px] text-slate-500">Log morning fuel & coffee</span>
                </div>
              </div>
              <input
                type="time"
                value={localSettings.breakfastTime}
                onChange={(e) => {
                  const updated = { ...localSettings, breakfastTime: e.target.value };
                  setLocalSettings(updated);
                }}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            {/* Lunch */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={localSettings.lunchEnabled && localSettings.enabled}
                  onChange={(e) => {
                    const updated = { ...localSettings, lunchEnabled: e.target.checked };
                    setLocalSettings(updated);
                  }}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Midday Lunch Check-In</span>
                  <span className="text-[10px] text-slate-500">Snap plate photo & verify macros</span>
                </div>
              </div>
              <input
                type="time"
                value={localSettings.lunchTime}
                onChange={(e) => {
                  const updated = { ...localSettings, lunchTime: e.target.value };
                  setLocalSettings(updated);
                }}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            {/* Dinner */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={localSettings.dinnerEnabled && localSettings.enabled}
                  onChange={(e) => {
                    const updated = { ...localSettings, dinnerEnabled: e.target.checked };
                    setLocalSettings(updated);
                  }}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Evening Dinner Tracker</span>
                  <span className="text-[10px] text-slate-500">Scan dinner & check daily protein</span>
                </div>
              </div>
              <input
                type="time"
                value={localSettings.dinnerTime}
                onChange={(e) => {
                  const updated = { ...localSettings, dinnerTime: e.target.value };
                  setLocalSettings(updated);
                }}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            {/* Daily Review */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={localSettings.dailyReviewEnabled && localSettings.enabled}
                  onChange={(e) => {
                    const updated = { ...localSettings, dailyReviewEnabled: e.target.checked };
                    setLocalSettings(updated);
                  }}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Evening Calorie Goal Summary</span>
                  <span className="text-[10px] text-slate-500">Review total intake & streak</span>
                </div>
              </div>
              <input
                type="time"
                value={localSettings.dailyReviewTime}
                onChange={(e) => {
                  const updated = { ...localSettings, dailyReviewTime: e.target.value };
                  setLocalSettings(updated);
                }}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>

            {/* Hydration Interval */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={localSettings.hydrationEnabled && localSettings.enabled}
                  onChange={(e) => {
                    const updated = { ...localSettings, hydrationEnabled: e.target.checked };
                    setLocalSettings(updated);
                  }}
                  className="rounded accent-cyan-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Hydration Reminders</span>
                  <span className="text-[10px] text-slate-500">Every 2 hours during daytime</span>
                </div>
              </div>
              <span className="text-xs text-cyan-400 font-semibold">Every 2 hrs</span>
            </div>

          </div>
        </div>

        {/* Notification Activity History */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Notification Activity Log ({notifications.length})
            </h4>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearNotifications}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition"
              >
                Clear All
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No recent notification logs.</p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkNotificationRead(notif.id)}
                  className={`p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-start justify-between gap-2 ${
                    notif.read
                      ? 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                      : 'bg-slate-950 border-emerald-500/30 text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                      <span>{notif.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

{/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveSettings(localSettings);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save to Cloud
          </button>
        </div>

      </div>
    </div>
  );
}
