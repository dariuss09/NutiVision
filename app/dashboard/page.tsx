/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

import { 
  Sparkles, 
  Camera, 
  History, 
  Target, 
  Bell, 
  TrendingUp, 
  CheckCircle, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { Header } from '@/components/Header';
import { VisionScanner } from '@/components/VisionScanner';
import { ManualRecipeBuilder } from '@/components/ManualRecipeBuilder';
import { NutritionDetailsCard } from '@/components/NutritionDetailsCard';
import { HistoryTracker } from '@/components/HistoryTracker';
import { WorkoutTracker } from '@/components/WorkoutTracker';
import { GoalSettingsModal } from '@/components/GoalSettingsModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { WaterTracker } from '@/components/WaterTracker';
import { 
  NutritionAnalysisResult, 
  UserGoals, 
  NotificationSettings, 
  AppNotification, 
  MealType 
} from '@/types/nutrition';
import { 
  INITIAL_USER_GOALS, 
  INITIAL_NOTIFICATION_SETTINGS, 
  getInitialMealHistory 
} from '@/lib/defaultHistory';

export default function HomePage() {

  
  const { user } = useUser();

  const convexHistory = useQuery(api.food.getFoodHistory, user ? { userId: user.id } : "skip");
  const convexGoals = useQuery(api.goals.getUserGoals, user ? { userId: user.id } : "skip");
  const setFoodHistoryMutation = useMutation(api.food.setFoodHistory);
  const saveGoalsMutation = useMutation(api.goals.saveUserGoals);


  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'goals' | 'workout'>('scanner');
  const [inputMode, setInputMode] = useState<'scan' | 'manual'>('scan');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [currentAnalysis, setCurrentAnalysis] = useState<NutritionAnalysisResult | null>(null);
  const initialConvexSync = useRef(false);

  // Persistence States with lazy initializers
  const [history, setHistory] = useState<NutritionAnalysisResult[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('nutrivision_history_v1');
        if (savedHistory) return JSON.parse(savedHistory);
      } catch (e) {
        console.error("Storage read error:", e);
      }
    }
    return getInitialMealHistory();
  });

  const [userGoals, setUserGoals] = useState<UserGoals>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedGoals = localStorage.getItem('nutrivision_goals_v1');
        if (savedGoals) return JSON.parse(savedGoals);
      } catch (e) {
        console.error("Storage read error:", e);
      }
    }
    return INITIAL_USER_GOALS;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('nutrivision_notif_settings_v1');
        if (savedSettings) return JSON.parse(savedSettings);
      } catch (e) {
        console.error("Storage read error:", e);
      }
    }
    return INITIAL_NOTIFICATION_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNotifs = localStorage.getItem('nutrivision_notifications_v1');
        if (savedNotifs) return JSON.parse(savedNotifs);
      } catch (e) {
        console.error("Storage read error:", e);
      }
    }
    return [
      {
        id: 'notif-1',
        timestamp: new Date().toISOString(),
        title: 'Welcome to NutriVision AI!',
        message: 'Snap any dish to estimate calories, macronutrients, and glycemic impact instantly.',
        type: 'health_tip',
        read: false,
      },
      {
        id: 'notif-2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        title: 'Hydration Goal Alert 💧',
        message: "You are halfway to your daily 2,600 ml water intake goal. Keep sipping!",
        type: 'hydration',
        read: true,
      },
    ];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastFired, setLastFired] = useState<Record<string, string>>({});

  // Modals
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), []);

  // Save changes to localStorage
  const saveHistory = (newHistory: NutritionAnalysisResult[]) => {
    // Ensure all base64 images are stripped so they don't break Convex or LocalStorage limits
    const safeHistory = newHistory.map(meal => {
      if (meal.imageUrl && meal.imageUrl.length > 500) {
        const { imageUrl, ...rest } = meal;
        return rest;
      }
      return meal;
    });

    setHistory(safeHistory);
    try {
      localStorage.setItem('nutrivision_history_v1', JSON.stringify(safeHistory));
      if (user) {
        setFoodHistoryMutation({ userId: user.id, history: safeHistory });
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

  const saveGoals = (updatedGoals: UserGoals) => {
    setUserGoals(updatedGoals);
    try {
      localStorage.setItem('nutrivision_goals_v1', JSON.stringify(updatedGoals));
      if (user) {
        saveGoalsMutation({ userId: user.id, data: updatedGoals });
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

// Sync convex to local state when it loads
  useEffect(() => {
    if (convexHistory !== undefined && !initialConvexSync.current) {
      initialConvexSync.current = true;
      if (convexHistory.length > 0) {
        const convexData = convexHistory.map(h => h.data);
        const local = localStorage.getItem('nutrivision_history_v1');
        let localData = [];
        try { if (local) localData = JSON.parse(local); } catch(e) {}
        
        // Merge convex and local (prefer local if it has MORE items, because it means a recent mutation hasn't synced yet)
        if (localData.length > convexData.length) {
          setFoodHistoryMutation({ userId: user?.id || '', history: localData });
        } else {
          setHistory(convexData);
          localStorage.setItem('nutrivision_history_v1', JSON.stringify(convexData));
        }
      } else if (user) {
        const local = localStorage.getItem('nutrivision_history_v1');
        let shouldSetEmpty = true;
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.length > 0) {
              setFoodHistoryMutation({ userId: user.id, history: parsed });
              shouldSetEmpty = false;
            }
          } catch(e) {}
        }
        if (shouldSetEmpty) {
          setHistory([]);
          localStorage.setItem('nutrivision_history_v1', '[]');
        }
      }
    }
  }, [convexHistory, user]);

  useEffect(() => {
    if (convexGoals !== undefined) {
      if (convexGoals && convexGoals.data) {
        setUserGoals(convexGoals.data);
        localStorage.setItem('nutrivision_goals_v1', JSON.stringify(convexGoals.data));
      } else if (user) {
        // Convex empty, push local
        const local = localStorage.getItem('nutrivision_goals_v1');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            saveGoalsMutation({ userId: user.id, data: parsed });
          } catch(e) {}
        }
      }
    }
  }, [convexGoals, user]);
  const saveNotificationSettings = (updated: NotificationSettings) => {
    setNotificationSettings(updated);
    try { localStorage.setItem('nutrivision_notif_settings_v1', JSON.stringify(updated)); } catch (e) {}
  };

const saveNotifications = (newNotifs: AppNotification[]) => {
    setNotifications(newNotifs);
    try { localStorage.setItem('nutrivision_notifications_v1', JSON.stringify(newNotifs)); } catch (e) {}
  };

  const fireNotification = (notif: AppNotification) => {
    // 1. Save in-app
    const updated = [notif, ...notifications];
    saveNotifications(updated);
    
    // 2. Send real Push Notification to Phone via Telegram API
    fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: notif.title,
        message: notif.message
      })
    }).catch(err => console.warn("Telegram push failed", err));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Compute Today's Total Calories
  const todayCalories = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return history
      .filter((m) => new Date(m.timestamp).toISOString().split('T')[0] === todayStr)
      .reduce((sum, m) => sum + (m.macros?.calories || 0), 0);
  }, [history]);

  // Unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add water helper
  const handleAddWater = (amountMl: number) => {
    const updatedWater = (userGoals.currentWaterMl || 0) + amountMl;
    const updatedGoals = { ...userGoals, currentWaterMl: updatedWater };
    saveGoals(updatedGoals);
    showToast(`Logged +${amountMl}ml water! (${updatedWater}/${userGoals.waterTargetMl} ml)`);

    // Check if goal reached
    if (updatedWater >= userGoals.waterTargetMl && (userGoals.currentWaterMl || 0) < userGoals.waterTargetMl) {
      const milestoneNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: "Daily Hydration Target Reached! 💧🏆",
        message: `Great job! You achieved your daily goal of ${userGoals.waterTargetMl} ml.`,
        type: 'milestone',
        read: false,
      };
      fireNotification(milestoneNotif);
    }
  };

  const handleResetWater = () => {
    const updatedGoals = { ...userGoals, currentWaterMl: 0 };
    saveGoals(updatedGoals);
    showToast("Water intake reset for today.");
  };

  // Handle analysis output from VisionScanner
  const handleAnalysisComplete = (result: NutritionAnalysisResult) => {
    setCurrentAnalysis(result);
  };

  // Log meal into intake history
  const handleLogMeal = (mealToLog: NutritionAnalysisResult) => {
    // Strip large base64 images to prevent Convex and localStorage quota errors
    const safeMeal = { ...mealToLog };
    if (safeMeal.imageUrl && safeMeal.imageUrl.length > 500) {
      delete safeMeal.imageUrl;
    }
    const updated = [safeMeal, ...history];
    saveHistory(updated);
    showToast(`Logged "${mealToLog.mealName}" (${mealToLog.macros.calories} kcal) to today! ✅`);

    // Check if daily calorie goal surpassed or reached
    const newTotal = todayCalories + mealToLog.macros.calories;
    if (newTotal >= userGoals.calorieTarget) {
      const alertNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: "Calorie Target Check-In 🔥",
        message: `You've reached ${newTotal} kcal today (Target: ${userGoals.calorieTarget} kcal).`,
        type: 'milestone',
        read: false,
      };
      fireNotification(alertNotif);
    }
  };

  const handleDeleteMeal = (id: string) => {
    const updated = history.filter((m) => m.id !== id);
    saveHistory(updated);
    showToast("Meal removed from intake history.");
  };

  const handleClearHistory = () => {
    saveHistory([]);
    showToast("All intake history cleared.");
  };

  const handleAddManualMeal = (meal: NutritionAnalysisResult) => {
    handleLogMeal(meal);
  };

  // Trigger test notification
  const handleTriggerTestNotification = () => {
    const testNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: "NutriVision Daily Reminder 🥗",
      message: "Time to log your healthy lunch! Snap a photo or write your ingredients.",
      type: 'reminder',
      read: false,
    };
    fireNotification(testNotif);
    showToast("Test notification sent! Check the bell icon or system tray.");

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(testNotif.title, {
          body: testNotif.message,
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.warn("Could not fire desktop notification:", err);
      }
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const handleClearNotifications = () => {
    saveNotifications([]);
  };



  
// Robust Timer for Reminders
  const lastFiredRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const dateStr = now.toISOString().split('T')[0];
      
      const checkAndFire = (enabled: boolean, time: string, type: string, title: string, msg: string) => {
        if (!enabled || !time) return;
        if (hhmm === time) {
          const key = `${dateStr}-${type}`;
          if (!lastFiredRef.current[key]) {
            lastFiredRef.current[key] = "true";
            
            // Fire safely using functional state update so we don't need `notifications` in deps
            setNotifications(prev => {
              const notif: AppNotification = {
                id: `notif-${Date.now()}`,
                timestamp: new Date().toISOString(),
                title,
                message: msg,
                type: 'reminder',
                read: false
              };
              const updated = [notif, ...prev];
              try { localStorage.setItem('nutrivision_notifications_v1', JSON.stringify(updated)); } catch(e){}
              
              // Send Telegram
              fetch('/api/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: notif.title, message: notif.message })
              }).catch(console.warn);
              
              return updated;
            });
          }
        }
      };

      if (notificationSettings.enabled) {
        checkAndFire(notificationSettings.breakfastEnabled, notificationSettings.breakfastTime, 'breakfast', 'Breakfast Reminder 🍳', "It's time for your morning fuel! Don't forget to log your breakfast.");
        checkAndFire(notificationSettings.lunchEnabled, notificationSettings.lunchTime, 'lunch', 'Lunch Reminder 🥗', "Time to eat! Log your lunch to keep your macros on track.");
        checkAndFire(notificationSettings.dinnerEnabled, notificationSettings.dinnerTime, 'dinner', 'Dinner Reminder 🍽️', "Dinner time! Snap a pic of your meal and hit your protein goals.");
        checkAndFire(notificationSettings.dailyReviewEnabled, notificationSettings.dailyReviewTime, 'review', 'Daily Review 📊', "Check your daily progress and prepare for tomorrow!");
      }
    }, 5000); // Check every 5s for better accuracy

    return () => clearInterval(interval);
  }, [notificationSettings]); // Only depend on settings!

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userGoals={userGoals}
        todayCalories={todayCalories}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenGoals={() => setIsGoalsModalOpen(true)}
        onAddWater={handleAddWater}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section (Prescribed by framework guidelines) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Machine Learning Vision &bull; Gemini 3.1 Pro</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Estimate Food Calories & Macros{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Instantly From A Photo
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Snap your plate and add a context sentence to guide the AI for pinpoint accuracy. 
              Our vision engine deconstructs volumetric ingredients, computes USDA caloric profiles, 
              tracks intake history over time, and delivers personalized daily notifications.
            </p>

            {/* Quick Hero Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('scanner');
                  setCurrentAnalysis(null);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Scan Food Now</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition"
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>View Intake Trends</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGoalsModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-800 transition"
              >
                <Target className="w-4 h-4 text-amber-400" />
                <span>Configure Goals ({isMounted ? userGoals.calorieTarget : '---'} kcal)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Daily Hydration Bar */}
        <WaterTracker
          currentMl={userGoals.currentWaterMl || 0}
          targetMl={userGoals.waterTargetMl || 2500}
          onAddWater={handleAddWater}
          onResetWater={handleResetWater}
        />

        {/* Tab View Content */}
        {activeTab === 'scanner' ? (
          <div className="space-y-8">
            {!currentAnalysis && (
              <div className="flex justify-center">
                <div className="bg-slate-900 rounded-xl p-1 inline-flex border border-slate-800">
                  <button 
                    onClick={() => setInputMode('scan')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition ${inputMode === 'scan' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Photo Scan
                  </button>
                  <button 
                    onClick={() => setInputMode('manual')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition ${inputMode === 'manual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Manual Recipe
                  </button>
                </div>
              </div>
            )}

            {/* If an analysis result is present, display details */}
            {currentAnalysis ? (
              <NutritionDetailsCard
                analysis={currentAnalysis}
                onLogMeal={handleLogMeal}
                onReset={() => setCurrentAnalysis(null)}
              />
            ) : inputMode === 'scan' ? (
              <VisionScanner
                onAnalysisComplete={handleAnalysisComplete}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
                selectedMealType={selectedMealType}
                setSelectedMealType={setSelectedMealType}
              />
            ) : (
              <ManualRecipeBuilder
                onAnalysisComplete={handleAnalysisComplete}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
                selectedMealType={selectedMealType}
                setSelectedMealType={setSelectedMealType}
              />
            )}
          </div>
        ) : activeTab === 'history' ? (
          <HistoryTracker
            history={history}
            userGoals={userGoals}
            onDeleteMeal={handleDeleteMeal}
            onClearHistory={handleClearHistory}
            onAddManualMeal={handleAddManualMeal}
          />
        ) : (
          <WorkoutTracker />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NutriVision AI &bull; Smart Food Vision & Nutritional Machine Learning</span>
          </div>
          <p className="text-slate-400">
            Powered by Gemini 3.1 Pro & USDA FoodData Central. Estimates are for informational wellness tracking.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <GoalSettingsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        userGoals={userGoals}
        onSaveGoals={saveGoals}
      />

      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        settings={notificationSettings}
        onSaveSettings={saveNotificationSettings}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
      />

    </div>
  );
}
