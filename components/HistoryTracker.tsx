'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Flame, 
  Download, 
  Trash2, 
  Filter, 
  Eye, 
  Plus, 
  Clock, 
  ChevronRight, 
  PieChart as PieChartIcon, 
  FileSpreadsheet,
  AlertCircle,
  X,
  Edit2
} from 'lucide-react';
import { NutritionAnalysisResult, UserGoals, MealType } from '@/types/nutrition';

interface HistoryTrackerProps {
  history: NutritionAnalysisResult[];
  userGoals: UserGoals;
  onDeleteMeal: (id: string) => void;
  onClearHistory: () => void;
  onAddManualMeal: (meal: NutritionAnalysisResult) => void;
}

type TimeRangeFilter = 'today' | '7days' | '30days' | 'all';

export function HistoryTracker({
  history,
  userGoals,
  onDeleteMeal,
  onClearHistory,
  onAddManualMeal,
}: HistoryTrackerProps) {
  const [timeFilter, setTimeFilter] = useState<TimeRangeFilter>('7days');
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<string>('all');
  const [selectedMealForModal, setSelectedMealForModal] = useState<NutritionAnalysisResult | null>(null);
  const [showManualAddModal, setShowManualAddModal] = useState<boolean>(false);

  // Manual Meal form state
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('400');
  const [manualProtein, setManualProtein] = useState('25');
  const [manualCarbs, setManualCarbs] = useState('40');
  const [manualFat, setManualFat] = useState('15');
  const [manualMealType, setManualMealType] = useState<MealType>('lunch');

  // Filter meals based on time range
  const filteredMeals = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return history.filter((meal) => {
      const mealDate = new Date(meal.timestamp).getTime();

      // Meal type filter
      if (selectedMealTypeFilter !== 'all' && meal.mealType !== selectedMealTypeFilter) {
        return false;
      }

      if (timeFilter === 'today') {
        return mealDate >= todayStart;
      } else if (timeFilter === '7days') {
        const sevenDaysAgo = todayStart - 6 * 24 * 60 * 60 * 1000;
        return mealDate >= sevenDaysAgo;
      } else if (timeFilter === '30days') {
        const thirtyDaysAgo = todayStart - 29 * 24 * 60 * 60 * 1000;
        return mealDate >= thirtyDaysAgo;
      }
      return true; // 'all'
    });
  }, [history, timeFilter, selectedMealTypeFilter]);

  // Aggregate statistics
  const stats = useMemo(() => {
    if (filteredMeals.length === 0) {
      return {
        totalCalories: 0,
        avgCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        avgHealthScore: 0,
        dayCount: 1,
      };
    }

    const uniqueDays = new Set(
      filteredMeals.map((m) => new Date(m.timestamp).toISOString().split('T')[0])
    );
    const dayCount = Math.max(1, uniqueDays.size);

    const totalCals = filteredMeals.reduce((acc, m) => acc + (m.macros.calories || 0), 0);
    const totalP = filteredMeals.reduce((acc, m) => acc + (m.macros.protein || 0), 0);
    const totalC = filteredMeals.reduce((acc, m) => acc + (m.macros.carbs || 0), 0);
    const totalF = filteredMeals.reduce((acc, m) => acc + (m.macros.fat || 0), 0);
    const totalScore = filteredMeals.reduce((acc, m) => acc + (m.healthScore || 75), 0);

    return {
      totalCalories: totalCals,
      avgCalories: Math.round(totalCals / dayCount),
      totalProtein: Math.round(totalP / dayCount),
      totalCarbs: Math.round(totalC / dayCount),
      totalFat: Math.round(totalF / dayCount),
      avgHealthScore: Math.round(totalScore / filteredMeals.length),
      dayCount,
    };
  }, [filteredMeals]);

  // Group meals by day for the daily trend chart
  const dailyChartData = useMemo(() => {
    const daysMap: { [key: string]: number } = {};
    const count = timeFilter === 'today' ? 1 : timeFilter === '7days' ? 7 : 14;
    
    // Build days array backwards from today
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daysMap[key] = 0;
    }

    history.forEach((m) => {
      const key = new Date(m.timestamp).toISOString().split('T')[0];
      if (daysMap[key] !== undefined) {
        daysMap[key] += m.macros.calories || 0;
      }
    });

    return Object.entries(daysMap).map(([dateStr, cals]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      return { dateStr, label, calories: cals };
    });
  }, [history, timeFilter]);

  // Export to CSV
  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'Timestamp',
      'Meal Name',
      'Meal Type',
      'Calories (kcal)',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Fiber (g)',
      'Health Score',
      'Glycemic Index',
      'Key Ingredients',
    ];

    const rows = history.map((m) => [
      `"${new Date(m.timestamp).toLocaleString()}"`,
      `"${m.mealName.replace(/"/g, '""')}"`,
      m.mealType,
      m.macros.calories,
      m.macros.protein,
      m.macros.carbs,
      m.macros.fat,
      m.macros.fiber,
      m.healthScore,
      m.glycemicIndex?.rating || 'N/A',
      `"${m.ingredients?.map((i) => i.name).join(', ') || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nutrivision-intake-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const cals = parseInt(manualCalories, 10) || 0;
    const prot = parseInt(manualProtein, 10) || 0;
    const carb = parseInt(manualCarbs, 10) || 0;
    const fat = parseInt(manualFat, 10) || 0;

    const newMeal: NutritionAnalysisResult = {
      id: `manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mealName: manualName.trim(),
      mealType: manualMealType,
      servingWeight: 'Standard portion',
      healthScore: 78,
      confidenceLevel: 'High',
      confidenceRationale: 'Manual entry logged by user.',
      glycemicIndex: { rating: 'Medium', explanation: 'Estimated standard glycemic response.' },
      macros: {
        calories: cals,
        protein: prot,
        carbs: carb,
        fat: fat,
        fiber: 4,
        sugar: 4,
        saturatedFat: Math.round(fat * 0.3),
        netCarbs: Math.max(0, carb - 4),
      },
      micros: {
        sodiumMg: 450,
        potassiumMg: 350,
        calciumMg: 80,
        ironMg: 2.0,
        vitaminCMg: 10,
        vitaminDIU: 0,
        cholesterolMg: 30,
      },
      ingredients: [
        { name: manualName.trim(), portion: '1 serving', calories: cals, proteinG: prot, carbsG: carb, fatG: fat, category: 'Other' },
      ],
      dietaryTags: ['Logged Entry'],
      allergens: [],
      healthPros: ['Quick balanced nutrition logged to keep daily records complete.'],
      healthWatchouts: ['Manual estimate.'],
      dietitianAdvice: 'Logging meals consistently is the #1 predictor of meeting body composition goals.',
    };

    onAddManualMeal(newMeal);
    setShowManualAddModal(false);
    setManualName('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner & Filters */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Intake Monitoring & Trends</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking your caloric trajectory, macronutrients, and meal consistency over time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Time Filter Pills */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            {(['today', '7days', '30days', 'all'] as TimeRangeFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTimeFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  timeFilter === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === '7days' ? '7 Days' : tab === '30days' ? '30 Days' : tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowManualAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Manual</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            title="Download CSV log"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Daily Average Calories */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Daily Intake</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-white">{stats.avgCalories}</span>
            <span className="text-xs text-slate-400 ml-1 font-bold">kcal</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Goal: {userGoals.calorieTarget} kcal</span>
            <span className={`font-semibold ${stats.avgCalories <= userGoals.calorieTarget ? 'text-emerald-400' : 'text-amber-400'}`}>
              ({stats.avgCalories <= userGoals.calorieTarget ? 'On Target' : 'Surplus'})
            </span>
          </div>
        </div>

        {/* Average Protein */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Protein</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-emerald-400">{stats.totalProtein}</span>
            <span className="text-xs text-slate-400 ml-1 font-bold">g / day</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Target: {userGoals.proteinTargetG}g ({Math.round((stats.totalProtein / userGoals.proteinTargetG) * 100)}%)
          </span>
        </div>

        {/* Average Carbs & Fats */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Carbs & Fats</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <div>
              <span className="text-2xl font-black text-cyan-400">{stats.totalCarbs}</span>
              <span className="text-[10px] text-slate-400 ml-0.5">g C</span>
            </div>
            <span className="text-slate-600">/</span>
            <div>
              <span className="text-2xl font-black text-amber-400">{stats.totalFat}</span>
              <span className="text-[10px] text-slate-400 ml-0.5">g F</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Avg daily macronutrients
          </span>
        </div>

        {/* Quality Health Score */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Diet Quality Index</span>
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-white">{stats.avgHealthScore}</span>
            <span className="text-xs text-slate-400 ml-1 font-bold">/ 100</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">
            {stats.avgHealthScore >= 80 ? 'Outstanding Whole Foods' : 'Balanced Intake'}
          </span>
        </div>

      </div>

      {/* Daily Calorie Intake Trajectory Chart */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Daily Intake vs Calorie Target ({userGoals.calorieTarget} kcal)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Target Baseline: <strong className="text-emerald-400">{userGoals.calorieTarget} kcal</strong>
          </span>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-6 pb-2">
          <div className="relative h-44 flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-800 px-1 sm:px-2 overflow-x-auto no-scrollbar">
            
            {/* Target Goal Dotted Line */}
            <div 
              className="absolute inset-x-0 border-t-2 border-dashed border-emerald-500/40 pointer-events-none z-10 flex items-center justify-end pr-2"
              style={{ bottom: `${Math.min(90, Math.round((userGoals.calorieTarget / 3000) * 100))}%` }}
            >
              <span className="text-[10px] text-emerald-400 font-bold bg-slate-900 px-1 rounded -translate-y-1/2">
                Target: {userGoals.calorieTarget} kcal
              </span>
            </div>

            {dailyChartData.map((day, i) => {
              const heightPercent = Math.min(100, Math.round((day.calories / 3000) * 100));
              const isOver = day.calories > userGoals.calorieTarget;
              const hasData = day.calories > 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Calorie value tooltip */}
                  <span className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded shadow mb-1">
                    {day.calories} kcal
                  </span>

                  {/* Bar */}
                  <div 
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 relative ${
                      !hasData
                        ? 'bg-slate-800/40 h-1.5'
                        : isOver
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300'
                        : 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                    }`}
                    style={{ height: hasData ? `${Math.max(6, heightPercent)}%` : '6px' }}
                  />

                  {/* Day Label */}
                  <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logged Meals List Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        
        {/* Section Header & Sub-Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Logged Meals History ({filteredMeals.length})
            </h3>
          </div>

          {/* Meal Type Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealTypeFilter(type)}
                className={`capitalize px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedMealTypeFilter === type
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Meals List */}
        {filteredMeals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">No meals logged for this selected timeframe.</p>
            <p>Snap a meal with the AI Scanner or log a manual entry to track your intake!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredMeals.map((meal) => (
              <div 
                key={meal.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-xl transition group"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                    {meal.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={meal.imageUrl} 
                        alt={meal.mealName}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                        Photo
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {meal.mealType}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                        {new Date(meal.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                      {meal.mealName}
                    </h4>

                    {meal.userContextPrompt && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">
                        &ldquo;{meal.userContextPrompt}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Nutrition Badge & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black text-white">
                      {meal.macros.calories} <span className="text-xs text-slate-400 font-normal">kcal</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-semibold">{meal.macros.protein}g P</span> &bull;{' '}
                      <span className="text-cyan-400 font-semibold">{meal.macros.carbs}g C</span> &bull;{' '}
                      <span className="text-amber-400 font-semibold">{meal.macros.fat}g F</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMealForModal(meal)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="View Full Breakdown"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteMeal(meal.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Clear History Button */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Total logged meals in database: {history.length}</span>
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to clear your meal intake history?")) {
                  onClearHistory();
                }
              }}
              className="text-rose-400 hover:text-rose-300 font-semibold transition"
            >
              Clear Entire Log
            </button>
          </div>
        )}

      </div>

      {/* Meal Detail Modal */}
      {selectedMealForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-400">
                  {selectedMealForModal.mealType} &bull; {new Date(selectedMealForModal.timestamp).toLocaleString()}
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedMealForModal.mealName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMealForModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedMealForModal.imageUrl && (
              <div className="h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedMealForModal.imageUrl} 
                  alt={selectedMealForModal.mealName}
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* Macros summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Calories</span>
                <span className="text-lg font-black text-white">{selectedMealForModal.macros.calories}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Protein</span>
                <span className="text-lg font-black text-emerald-400">{selectedMealForModal.macros.protein}g</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Carbs</span>
                <span className="text-lg font-black text-cyan-400">{selectedMealForModal.macros.carbs}g</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Fat</span>
                <span className="text-lg font-black text-amber-400">{selectedMealForModal.macros.fat}g</span>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">
                Ingredients Recognized
              </h4>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                {selectedMealForModal.ingredients.map((ing, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{ing.name}</span>
                      <span className="text-slate-400 text-[11px] block">{ing.portion}</span>
                    </div>
                    <span className="font-bold text-emerald-400">{ing.calories} kcal</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dietitian Advice */}
            {selectedMealForModal.dietitianAdvice && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200">
                <strong className="text-emerald-400 block mb-1">Dietitian Tip:</strong>
                {selectedMealForModal.dietitianAdvice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Meal Add Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Quick Log Manual Meal</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManualAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Protein shake with banana & peanut butter"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meal Type</label>
                <select
                  value={manualMealType}
                  onChange={(e) => setManualMealType(e.target.value as MealType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 capitalize"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition"
                >
                  Save to Intake History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
