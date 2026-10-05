'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Zap, Save, CheckCircle2, Bookmark } from 'lucide-react';
import { MealType, NutritionAnalysisResult } from '@/types/nutrition';

interface ManualRecipeBuilderProps {
  onAnalysisComplete: (result: NutritionAnalysisResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  selectedMealType: MealType;
  setSelectedMealType: (type: MealType) => void;
}

interface IngredientEntry {
  name: string;
  weight: string;
  showPackageInfo?: boolean;
  pkgKcal?: string;
  pkgProtein?: string;
  pkgCarbs?: string;
  pkgFats?: string;
}

interface ManualPreset {
  id: string;
  name: string;
  mealType: MealType;
  ingredients: IngredientEntry[];
}

export function ManualRecipeBuilder({
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing,
  selectedMealType,
  setSelectedMealType
}: ManualRecipeBuilderProps) {
  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([{ name: '', weight: '' }]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [presets, setPresets] = useState<ManualPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nutrivision_manual_presets_v1');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  const savePreset = () => {
    if (!mealName.trim()) {
      setErrorMsg("Please enter a name before saving as preset.");
      return;
    }
    const validIngredients = ingredients.filter(i => i.name.trim());
    if (validIngredients.length === 0) {
      setErrorMsg("Please add ingredients before saving.");
      return;
    }

    const newPreset: ManualPreset = {
      id: `preset-${Date.now()}`,
      name: mealName,
      mealType: selectedMealType,
      ingredients: validIngredients
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    localStorage.setItem('nutrivision_manual_presets_v1', JSON.stringify(updated));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const loadPreset = (preset: ManualPreset) => {
    setMealName(preset.name);
    setSelectedMealType(preset.mealType);
    setIngredients([...preset.ingredients]);
    setShowPresets(false);
  };

  const deletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('nutrivision_manual_presets_v1', JSON.stringify(updated));
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', weight: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof IngredientEntry, value: any) => {
    const newIngredients = [...ingredients];
    (newIngredients[index] as any)[field] = value;
    setIngredients(newIngredients);
    setSavedSuccess(false);
  };

  const handleAnalyze = async () => {
    if (!mealName.trim()) {
      setErrorMsg("Please enter a name for this meal/recipe.");
      return;
    }

    const validIngredients = ingredients.filter(i => i.name.trim());
    if (validIngredients.length === 0) {
      setErrorMsg("Please add at least one ingredient.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const ingredientText = validIngredients.map(i => `- ${i.weight} of ${i.name}`).join('\n');
      const contextSentence = `This is a manual recipe named "${mealName}". Here are the exact ingredients and weights:\n${ingredientText}\nPlease sum them up and provide the full nutritional profile for this exact combination.`;

      const res = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextSentence,
          mealType: selectedMealType,
          imageBase64: null // Explicitly text-only
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to analyze recipe.');
      }

      const data: NutritionAnalysisResult = await res.json();
      
      // Override the AI's meal name with the user's custom name
      data.mealName = mealName;
      
      onAnalysisComplete(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fadeIn">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Plus className="text-emerald-400 w-5 h-5" />
            Manual Recipe Builder
          </h2>
          <p className="text-sm text-slate-400">
            Add your ingredients and their exact weights below. NutriVision AI will calculate the total macros and full profile automatically.
          </p>
        </div>
        {presets.length > 0 && (
          <button 
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
          >
            <Bookmark className="w-4 h-4" />
            Saved Presets ({presets.length})
          </button>
        )}
      </div>

      {showPresets && presets.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Saved Recipes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map(p => (
              <div 
                key={p.id} 
                onClick={() => loadPreset(p)}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition group"
              >
                <div>
                  <div className="text-sm font-bold text-white">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.ingredients.length} ingredients</div>
                </div>
                <button 
                  onClick={(e) => deletePreset(e, p.id)}
                  className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meal Name</label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => { setMealName(e.target.value); setSavedSuccess(false); }}
            placeholder="e.g. Morning Protein Smoothie"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Meal Type</span>
          </label>
          <select 
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value as MealType)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition appearance-none"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ingredients</label>
        
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl relative group">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                placeholder="e.g. Oats"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm"
              />
              <input
                type="text"
                value={ing.weight}
                onChange={(e) => handleIngredientChange(idx, 'weight', e.target.value)}
                placeholder="e.g. 50g"
                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm text-center"
              />
              <button
                onClick={() => handleRemoveIngredient(idx)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => handleIngredientChange(idx, 'showPackageInfo', !ing.showPackageInfo)}
              className="text-[10px] text-slate-400 hover:text-emerald-400 self-start uppercase tracking-wider font-bold transition flex items-center gap-1 mt-1"
            >
              <Plus className={`w-3 h-3 transition-transform ${ing.showPackageInfo ? 'rotate-45' : ''}`} />
              {ing.showPackageInfo ? 'Hide Label Info' : 'Add Package Label Info (Per 100g)'}
            </button>
            
            {ing.showPackageInfo && (
              <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Kcal</label>
                  <input
                    type="number"
                    value={ing.pkgKcal || ''}
                    onChange={(e) => handleIngredientChange(idx, 'pkgKcal', e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white placeholder-slate-700 text-xs text-center focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-emerald-500/70 uppercase font-bold mb-1">Prot</label>
                  <input
                    type="number"
                    value={ing.pkgProtein || ''}
                    onChange={(e) => handleIngredientChange(idx, 'pkgProtein', e.target.value)}
                    placeholder="0g"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white placeholder-slate-700 text-xs text-center focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-blue-500/70 uppercase font-bold mb-1">Carb</label>
                  <input
                    type="number"
                    value={ing.pkgCarbs || ''}
                    onChange={(e) => handleIngredientChange(idx, 'pkgCarbs', e.target.value)}
                    placeholder="0g"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white placeholder-slate-700 text-xs text-center focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-amber-500/70 uppercase font-bold mb-1">Fat</label>
                  <input
                    type="number"
                    value={ing.pkgFats || ''}
                    onChange={(e) => handleIngredientChange(idx, 'pkgFats', e.target.value)}
                    placeholder="0g"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white placeholder-slate-700 text-xs text-center focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={handleAddIngredient}
          className="w-full py-3 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Ingredient
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={savePreset}
          className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition border ${
            savedSuccess 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Preset
            </>
          )}
        </button>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition"
        >
          {isAnalyzing ? (
            <>
              <Zap className="w-5 h-5 animate-pulse" />
              Calculating...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Calculate Macros
            </>
          )}
        </button>
      </div>
    </div>
  );
}
