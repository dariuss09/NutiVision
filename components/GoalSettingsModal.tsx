'use client';

import React, { useState } from 'react';
import { 
  Target, 
  X, 
  Calculator, 
  Sparkles, 
  Check, 
  Droplet, 
  Flame, 
  Zap,
  Activity
} from 'lucide-react';
import { UserGoals } from '@/types/nutrition';

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGoals: UserGoals;
  onSaveGoals: (updatedGoals: UserGoals) => void;
}

export function GoalSettingsModal({
  isOpen,
  onClose,
  userGoals,
  onSaveGoals,
}: GoalSettingsModalProps) {
  const [goals, setGoals] = useState<UserGoals>(userGoals);
  const [activeTab, setActiveTab] = useState<'custom' | 'calculator'>('custom');

  // Calculator inputs
  const [calcAge, setCalcAge] = useState<number>(userGoals.age || 28);
  const [calcGender, setCalcGender] = useState<'male' | 'female' | 'other'>(userGoals.gender || 'female');
  const [calcWeight, setCalcWeight] = useState<number>(userGoals.weightKg || 70);
  const [calcHeight, setCalcHeight] = useState<number>(userGoals.heightCm || 172);
  const [calcActivity, setCalcActivity] = useState<UserGoals['activityLevel']>(userGoals.activityLevel || 'moderate');
  const [calcGoalType, setCalcGoalType] = useState<UserGoals['goalType']>(userGoals.goalType || 'maintenance');

  if (!isOpen) return null;

  // Mifflin-St Jeor TDEE formula
  const computeTDEE = () => {
    let bmr = 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge;
    if (calcGender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const activityMultipliers: Record<UserGoals['activityLevel'], number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };

    const tdee = Math.round(bmr * (activityMultipliers[calcActivity] || 1.55));
    let targetCals = tdee;

    if (calcGoalType === 'weight_loss') targetCals -= 500;
    if (calcGoalType === 'muscle_gain') targetCals += 350;
    if (calcGoalType === 'athletic') targetCals += 200;

    targetCals = Math.max(1200, targetCals);

    // Compute macro split based on goal type
    let proteinRatio = 0.25;
    let carbRatio = 0.5;
    let fatRatio = 0.25;

    if (calcGoalType === 'weight_loss') {
      proteinRatio = 0.35;
      carbRatio = 0.35;
      fatRatio = 0.3;
    } else if (calcGoalType === 'muscle_gain') {
      proteinRatio = 0.3;
      carbRatio = 0.45;
      fatRatio = 0.25;
    } else if (calcGoalType === 'keto') {
      proteinRatio = 0.25;
      carbRatio = 0.05;
      fatRatio = 0.7;
    }

    const proteinG = Math.round((targetCals * proteinRatio) / 4);
    const carbG = Math.round((targetCals * carbRatio) / 4);
    const fatG = Math.round((targetCals * fatRatio) / 9);
    const waterMl = Math.round(calcWeight * 35); // 35ml per kg baseline

    return {
      calorieTarget: targetCals,
      proteinTargetG: proteinG,
      carbTargetG: carbG,
      fatTargetG: fatG,
      waterTargetMl: Math.max(2000, waterMl),
    };
  };

  const handleApplyCalculated = () => {
    const computed = computeTDEE();
    setGoals((prev) => ({
      ...prev,
      calorieTarget: computed.calorieTarget,
      proteinTargetG: computed.proteinTargetG,
      carbTargetG: computed.carbTargetG,
      fatTargetG: computed.fatTargetG,
      waterTargetMl: computed.waterTargetMl,
      age: calcAge,
      gender: calcGender,
      weightKg: calcWeight,
      heightCm: calcHeight,
      activityLevel: calcActivity,
      goalType: calcGoalType,
    }));
    setActiveTab('custom');
  };

  const handleSave = () => {
    onSaveGoals(goals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Nutrition Goals</h3>
              <p className="text-xs text-slate-400">Calorie and macronutrient targets</p>
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

        {/* Tab switch between Custom Targets and Smart Calculator */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Targets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'calculator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart TDEE Calculator</span>
          </button>
        </div>

        {activeTab === 'custom' ? (
          
          /* Direct Targets Form */
          <div className="space-y-4 text-xs">
            
            {/* Calories */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Daily Calorie Target (kcal)</span>
                </label>
                <span className="text-emerald-400 font-bold text-base">
                  {goals.calorieTarget} kcal
                </span>
              </div>
              <input
                type="range"
                min="1200"
                max="4500"
                step="50"
                value={goals.calorieTarget}
                onChange={(e) => setGoals({ ...goals, calorieTarget: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1,200 kcal</span>
                <span>2,500 kcal</span>
                <span>4,500 kcal</span>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* Protein Target */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">Protein</span>
                <input
                  type="number"
                  min="30"
                  max="400"
                  value={goals.proteinTargetG}
                  onChange={(e) => setGoals({ ...goals, proteinTargetG: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">grams / day</span>
              </div>

              {/* Carbs Target */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Carbs</span>
                <input
                  type="number"
                  min="20"
                  max="600"
                  value={goals.carbTargetG}
                  onChange={(e) => setGoals({ ...goals, carbTargetG: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">grams / day</span>
              </div>

              {/* Fat Target */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">Fat</span>
                <input
                  type="number"
                  min="15"
                  max="250"
                  value={goals.fatTargetG}
                  onChange={(e) => setGoals({ ...goals, fatTargetG: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">grams / day</span>
              </div>

            </div>

            {/* Daily Hydration Target */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-cyan-400" />
                  <span>Daily Water Goal (ml)</span>
                </label>
                <span className="text-cyan-400 font-bold text-base">
                  {goals.waterTargetMl} ml
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="5000"
                step="100"
                value={goals.waterTargetMl}
                onChange={(e) => setGoals({ ...goals, waterTargetMl: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1,000 ml</span>
                <span>2,500 ml (~8 glasses)</span>
                <span>5,000 ml</span>
              </div>
            </div>

          </div>

        ) : (

          /* Smart TDEE & Goal Calculator */
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Age</label>
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={calcAge}
                  onChange={(e) => setCalcAge(parseInt(e.target.value, 10) || 25)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Biological Gender</label>
                <select
                  value={calcGender}
                  onChange={(e) => setCalcGender(e.target.value as 'male' | 'female' | 'other')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Non-binary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Weight (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseInt(e.target.value, 10) || 70)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(parseInt(e.target.value, 10) || 170)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Activity Level</label>
              <select
                value={calcActivity}
                onChange={(e) => setCalcActivity(e.target.value as UserGoals['activityLevel'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="sedentary">Sedentary (Desk job, little/no exercise)</option>
                <option value="light">Lightly Active (1-3 days/week exercise)</option>
                <option value="moderate">Moderately Active (3-5 days/week exercise)</option>
                <option value="very_active">Very Active (6-7 days intense sports/job)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Nutritional Objective</label>
              <select
                value={calcGoalType}
                onChange={(e) => setCalcGoalType(e.target.value as UserGoals['goalType'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="weight_loss">Fat Loss (-500 kcal deficit, high protein)</option>
                <option value="maintenance">Weight Maintenance (Balanced energy)</option>
                <option value="muscle_gain">Lean Muscle Growth (+350 kcal surplus)</option>
                <option value="keto">Ketogenic (70% Fat, 25% Protein, 5% Net Carbs)</option>
                <option value="athletic">Endurance & Athletic Performance</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplyCalculated}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate & Apply Recommended Targets</span>
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            Save Goals
          </button>
        </div>

      </div>
    </div>
  );
}
