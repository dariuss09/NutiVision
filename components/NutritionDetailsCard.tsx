'use client';

import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { 
  Check, 
  Sparkles, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Scale, 
  Heart, 
  AlertTriangle, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Plus,
  Sliders,
  Layers,
  Info
} from 'lucide-react';
// ... rest of imports
import { NutritionAnalysisResult, MealType } from '@/types/nutrition';

interface NutritionDetailsCardProps {
  analysis: NutritionAnalysisResult;
  onLogMeal: (adjustedResult: NutritionAnalysisResult) => void;
  onReset: () => void;
}

export function NutritionDetailsCard({
  analysis,
  onLogMeal,
  onReset,
}: NutritionDetailsCardProps) {
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [showMicros, setShowMicros] = useState<boolean>(false);
  const [isLogged, setIsLogged] = useState<boolean>(false);

  // Apply portion multiplier to calories and macros
  const scaledCalories = Math.round(analysis.macros.calories * portionMultiplier);
  const scaledProtein = Math.round(analysis.macros.protein * portionMultiplier);
  const scaledCarbs = Math.round(analysis.macros.carbs * portionMultiplier);
  const scaledFat = Math.round(analysis.macros.fat * portionMultiplier);
  const scaledFiber = Math.round(analysis.macros.fiber * portionMultiplier);
  const scaledSugar = Math.round(analysis.macros.sugar * portionMultiplier);
  const scaledSaturatedFat = Math.round(analysis.macros.saturatedFat * portionMultiplier);
  const scaledNetCarbs = Math.max(0, scaledCarbs - scaledFiber);

  // Scaled micros
  const scaledSodium = Math.round(analysis.micros.sodiumMg * portionMultiplier);
  const scaledPotassium = Math.round(analysis.micros.potassiumMg * portionMultiplier);
  const scaledCalcium = Math.round(analysis.micros.calciumMg * portionMultiplier);
  const scaledIron = Number((analysis.micros.ironMg * portionMultiplier).toFixed(1));
  const scaledVitaminC = Math.round(analysis.micros.vitaminCMg * portionMultiplier);
  const scaledVitaminD = Math.round(analysis.micros.vitaminDIU * portionMultiplier);
  const scaledCholesterol = Math.round(analysis.micros.cholesterolMg * portionMultiplier);

  // Calculate energy percentage from macros
  const proteinKcal = scaledProtein * 4;
  const carbKcal = scaledCarbs * 4;
  const fatKcal = scaledFat * 9;
  const totalMacroKcal = proteinKcal + carbKcal + fatKcal || 1;

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbPct = Math.round((carbKcal / totalMacroKcal) * 100);
  const fatPct = Math.round((fatKcal / totalMacroKcal) * 100);

  const pieData = [
    { name: 'Protein', value: proteinPct, color: '#10b981' }, // emerald-500
    { name: 'Carbs', value: carbPct, color: '#06b6d4' },    // cyan-500
    { name: 'Fat', value: fatPct, color: '#f59e0b' },      // amber-500
  ];

  const handleLogClick = () => {
    const updated: NutritionAnalysisResult = {
      ...analysis,
      macros: {
        calories: scaledCalories,
        protein: scaledProtein,
        carbs: scaledCarbs,
        fat: scaledFat,
        fiber: scaledFiber,
        sugar: scaledSugar,
        saturatedFat: scaledSaturatedFat,
        netCarbs: scaledNetCarbs,
      },
      micros: {
        sodiumMg: scaledSodium,
        potassiumMg: scaledPotassium,
        calciumMg: scaledCalcium,
        ironMg: scaledIron,
        vitaminCMg: scaledVitaminC,
        vitaminDIU: scaledVitaminD,
        cholesterolMg: scaledCholesterol,
      },
      ingredients: analysis.ingredients.map((ing) => ({
        ...ing,
        calories: Math.round(ing.calories * portionMultiplier),
        proteinG: Number((ing.proteinG * portionMultiplier).toFixed(1)),
        carbsG: Number((ing.carbsG * portionMultiplier).toFixed(1)),
        fatG: Number((ing.fatG * portionMultiplier).toFixed(1)),
      })),
    };

    onLogMeal(updated);
    setIsLogged(true);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Main Results Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {analysis.imageUrl && (
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-950 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={analysis.imageUrl} 
                  alt={analysis.mealName}
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {analysis.mealType}
                </span>
                <span className="text-xs text-slate-400">
                  Estimated Serving: <strong className="text-white">{analysis.servingWeight}</strong>
                </span>
                {analysis.aiModelUsed && (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Model: {analysis.aiModelUsed}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {analysis.mealName}
              </h2>
              {analysis.userContextPrompt && (
                <p className="text-xs text-slate-400 mt-1 italic flex items-center gap-1">
                  <span className="text-slate-500">Provided hint:</span>
                  &ldquo;{analysis.userContextPrompt}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={onReset}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
            >
              Scan Another
            </button>
            <button
              onClick={handleLogClick}
              disabled={isLogged}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition ${
                isLogged
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isLogged ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Logged to Intake</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Log to History</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Portion Adjustment Slider */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Calibrate Portion:</span>
            <span className="font-bold text-emerald-400">
              {portionMultiplier === 1 ? '1.0x (Standard)' : `${portionMultiplier}x`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((factor) => (
              <button
                key={factor}
                type="button"
                onClick={() => {
                  setPortionMultiplier(factor);
                  setIsLogged(false);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                  portionMultiplier === factor
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {factor}x
              </button>
            ))}
          </div>
        </div>

        {/* Hero KPI Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-800">
          
          {/* Total Calories */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Calories</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="my-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tight">
                {scaledCalories}
              </span>
              <span className="text-xs font-bold text-slate-500">kcal</span>
            </div>
            <span className="text-[11px] text-slate-500 truncate">
              Estimated Energy
            </span>
          </div>

          {/* Health Score */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Health Score</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="my-2 flex items-baseline gap-1">
              <span className={`text-2xl font-black tracking-tight ${
                analysis.healthScore >= 80 ? 'text-emerald-400' :
                analysis.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {analysis.healthScore}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-500 truncate">
              Overall Quality
            </span>
          </div>

          {/* Glycemic Load */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Glycemic Impact</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="my-2">
              <span className={`text-xl font-black tracking-tight ${
                analysis.glycemicIndex?.rating?.toLowerCase() === 'low' ? 'text-emerald-400' :
                analysis.glycemicIndex?.rating?.toLowerCase() === 'medium' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {analysis.glycemicIndex?.rating || 'Unknown'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 truncate" title={analysis.glycemicIndex?.explanation}>
              {analysis.glycemicIndex?.explanation || 'Blood sugar effect'}
            </span>
          </div>

          {/* Vision Confidence */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>AI Confidence</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="my-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tight">
                {analysis.confidenceLevel}
              </span>
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <span className="text-[11px] text-slate-500 truncate" title={analysis.confidenceRationale}>
              {analysis.confidenceRationale}
            </span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Macronutrient Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macronutrient Distribution Card */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Macronutrient Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">
              {proteinPct}% P &bull; {carbPct}% C &bull; {fatPct}% F
            </span>
          </div>

          {/* Proportional Macro Energy Bar */}
          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${proteinPct}%` }} 
              className="h-full bg-emerald-500 transition-all duration-300"
              title={`Protein: ${scaledProtein}g (${proteinPct}%)`}
            />
            <div 
              style={{ width: `${carbPct}%` }} 
              className="h-full bg-cyan-500 transition-all duration-300"
              title={`Carbs: ${scaledCarbs}g (${carbPct}%)`}
            />
            <div 
              style={{ width: `${fatPct}%` }} 
              className="h-full bg-amber-500 transition-all duration-300"
              title={`Fats: ${scaledFat}g (${fatPct}%)`}
            />
          </div>

          {/* Detailed Macro Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            {/* Protein */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Protein
                </span>
                <span className="text-slate-400 font-semibold">{proteinPct}%</span>
              </div>
              <div className="text-2xl font-black text-white">
                {scaledProtein} <span className="text-xs text-slate-400 font-normal">grams</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {proteinKcal} kcal from amino acids
              </span>
            </div>

            {/* Carbs & Fiber */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Total Carbs
                </span>
                <span className="text-slate-400 font-semibold">{carbPct}%</span>
              </div>
              <div className="text-2xl font-black text-white">
                {scaledCarbs} <span className="text-xs text-slate-400 font-normal">grams</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>Net: <strong className="text-white">{scaledNetCarbs}g</strong></span>
                <span>&bull;</span>
                <span>Fiber: <strong className="text-emerald-400">{scaledFiber}g</strong></span>
                <span>&bull;</span>
                <span>Sugar: <strong className="text-amber-400">{scaledSugar}g</strong></span>
              </div>
            </div>

            {/* Fats */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Total Lipids / Fat
                </span>
                <span className="text-slate-400 font-semibold">{fatPct}%</span>
              </div>
              <div className="text-2xl font-black text-white">
                {scaledFat} <span className="text-xs text-slate-400 font-normal">grams</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>Sat. Fat: <strong className="text-slate-300">{scaledSaturatedFat}g</strong></span>
                <span>&bull;</span>
                <span>Healthy Unsaturated: <strong className="text-emerald-400">{Math.max(0, scaledFat - scaledSaturatedFat)}g</strong></span>
              </div>
            </div>

          </div>
        </div>

        {/* Machine Learning Ingredient Breakdown (USER REQUIREMENT) */}
        <div className="p-6 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Machine Learning Ingredient Analysis</span>
            </h3>
            <span className="text-xs text-slate-500">
              {analysis.ingredients.length} items recognized
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Ingredient</th>
                  <th className="py-2.5 px-3">Portion Weight</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Calories</th>
                  <th className="py-2.5 px-3 text-right">Macros (P / C / F)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analysis.ingredients.map((ing, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition">
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {ing.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {ing.portion}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                        {ing.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {Math.round(ing.calories * portionMultiplier)} kcal
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      <span className="text-emerald-400 font-semibold">{Number((ing.proteinG * portionMultiplier).toFixed(1))}g</span> /{' '}
                      <span className="text-cyan-400 font-semibold">{Number((ing.carbsG * portionMultiplier).toFixed(1))}g</span> /{' '}
                      <span className="text-amber-400 font-semibold">{Number((ing.fatG * portionMultiplier).toFixed(1))}g</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dietary Tags & Allergens Detected */}
        <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1.5">
              Dietary Profiles
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.dietaryTags.map((tag, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1.5">
              Potential Allergens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.allergens.length > 0 && !analysis.allergens.includes('None') ? (
                analysis.allergens.map((alg, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{alg}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No common allergens flagged</span>
              )}
            </div>
          </div>
        </div>

        {/* Micronutrients Accordion */}
        <div className="border-b border-slate-800">
          <button
            type="button"
            onClick={() => setShowMicros(!showMicros)}
            className="w-full p-4 px-6 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-900 transition"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Micronutrients, Electrolytes & Vitamins</span>
            </span>
            {showMicros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMicros && (
            <div className="p-6 bg-slate-950/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Sodium</span>
                <span className="text-base font-bold text-white">{scaledSodium} mg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Potassium</span>
                <span className="text-base font-bold text-white">{scaledPotassium} mg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Calcium</span>
                <span className="text-base font-bold text-white">{scaledCalcium} mg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Iron</span>
                <span className="text-base font-bold text-white">{scaledIron} mg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Vitamin C</span>
                <span className="text-base font-bold text-white">{scaledVitaminC} mg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Vitamin D</span>
                <span className="text-base font-bold text-white">{scaledVitaminD} IU</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Cholesterol</span>
                <span className="text-base font-bold text-white">{scaledCholesterol} mg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Dietary Fiber</span>
                <span className="text-base font-bold text-white">{scaledFiber} g</span>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Dietitian Insights */}
        <div className="p-6 space-y-4 bg-slate-950/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Health Pros */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Nutritional Advantages</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysis.healthPros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">&bull;</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Health Watchouts */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Watchouts & Considerations</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysis.healthWatchouts.map((watchout, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">&bull;</span>
                    <span>{watchout}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Actionable Dietitian Advice Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Clinical Dietitian Recommendation
              </h4>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {analysis.dietitianAdvice}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
