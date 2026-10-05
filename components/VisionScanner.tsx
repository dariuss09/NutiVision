'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  X,
  FlipHorizontal,
  Flame,
  AlertCircle,
  Plus
} from 'lucide-react';
import { MealType, NutritionAnalysisResult } from '@/types/nutrition';
import { DEFAULT_FOOD_PRESETS, SampleFoodPreset } from '@/lib/sampleFoods';

interface VisionScannerProps {
  onAnalysisComplete: (result: NutritionAnalysisResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  selectedMealType: MealType;
  setSelectedMealType: (type: MealType) => void;
}

const COMMON_HINT_CHIPS = [
  "Cooked with olive oil",
  "Homemade portion",
  "No sugar added",
  "High protein extra serving",
  "Gluten-free alternative",
  "Dressing on the side",
  "Restaurant style butter",
  "Whole grain base",
];

const SCAN_STEPS = [
  "Initializing Gemini 3.1 Pro vision engine...",
  "Detecting ingredients & volumetric food boundaries...",
  "Cross-referencing USDA FoodData Central nutritional matrices...",
  "Calculating macronutrients, glycemic load, & micronutrients...",
  "Compiling evidence-based dietitian insights...",
];

export function VisionScanner({
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing,
  selectedMealType,
  setSelectedMealType,
}: VisionScannerProps) {
  const [samples, setSamples] = useState<SampleFoodPreset[]>(DEFAULT_FOOD_PRESETS);

  const [showAddSample, setShowAddSample] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('nutrivision_samples_v1');
    if (saved) {
      try {
        setSamples(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);
  const [newSampleName, setNewSampleName] = useState('');
  const [newSampleUrl, setNewSampleUrl] = useState('');
  const [newSampleCalories, setNewSampleCalories] = useState('');
  const [newSampleProtein, setNewSampleProtein] = useState('');
  const [newSampleCarbs, setNewSampleCarbs] = useState('');
  const [newSampleFat, setNewSampleFat] = useState('');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Cycling scan step messages for rich computer vision UX
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Clean up camera stream when component unmounts or camera closes
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg(null);
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera unavailable. Please upload a photo instead.");
      setIsCameraActive(false);
    }
  };

  const toggleFacingMode = async () => {
    stopCameraStream();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCameraStream();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const selectPreset = (preset: SampleFoodPreset) => {
    setSelectedImage(preset.imageUrl);
    setContextSentence(preset.defaultHint);
    setSelectedMealType(preset.mealType);
    setErrorMsg(null);
  };

  const addHintChip = (chip: string) => {
    if (!contextSentence.includes(chip)) {
      setContextSentence((prev) => (prev ? `${prev.trim()}, ${chip}` : chip));
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setErrorMsg(null);
    stopCameraStream();
  };

  const addSample = (newSample: SampleFoodPreset) => {
    const updated = [...samples, newSample];
    setSamples(updated);
    localStorage.setItem('nutrivision_samples_v1', JSON.stringify(updated));
    setShowAddSample(false);
  };

  // Convert remote preset image to base64 if needed before sending to API
  const ensureBase64 = async (imageSrc: string): Promise<string> => {
    if (imageSrc.startsWith('data:')) {
      return imageSrc;
    }
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // Return original if proxy fails
      return imageSrc;
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) {
      setErrorMsg("Please take a photo or select an image first.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const base64Data = await ensureBase64(selectedImage);

      const res = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          contextSentence: contextSentence.trim(),
          mealType: selectedMealType,
        }),
      });

      if (res.status === 429) {
        setIsCooldown(true);
        setErrorMsg("API rate limit exceeded. Please wait a minute before trying again.");
        setTimeout(() => {
          setIsCooldown(false);
          setErrorMsg(null);
        }, 60000); // 1 minute cooldown
        setIsAnalyzing(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed. Please try a clearer picture.");
      }

      onAnalysisComplete(data);
    } catch (err: unknown) {
      console.error("Analysis request failed:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze image. Please try again.";
      setErrorMsg(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Scanner Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        
        {/* Top Header & Meal Type Pill Selector */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>AI Food Vision & Calorie Scanner</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by Gemini 3.1 Pro Machine Learning Food Vision
            </p>
          </div>

          {/* Meal Type Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`capitalize text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  selectedMealType === type
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Image Input Area */}
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* Live Camera Viewport */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[16/10] flex items-center justify-center border-2 border-emerald-500/50 shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Camera Crosshair Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white/40 border-dashed rounded-2xl relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Center Plate
                  </div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur-sm border border-slate-700 transition"
                  title="Switch Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition"
                >
                  <Camera className="w-5 h-5" />
                  <span>Snap Photo</span>
                </button>

                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="p-3 rounded-full bg-rose-900/80 text-white hover:bg-rose-800 backdrop-blur-sm border border-rose-700 transition"
                  title="Cancel Camera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : selectedImage ? (
            
            /* Selected / Uploaded Image Preview */
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video sm:aspect-[16/10] border border-slate-800 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Selected meal for analysis"
                className="w-full h-full object-cover"
              />

              {/* Scanning Active Overlay Animation */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                  
                  {/* Cyber Scan line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                  
                  {/* Radar Pulse Circle */}
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping" />
                    <div className="w-full h-full rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
                    </div>
                  </div>

                  <span className="text-emerald-400 font-bold text-sm tracking-wide uppercase mb-1">
                    Computer Vision Analysis In Progress
                  </span>
                  <p className="text-white text-base font-semibold max-w-md h-12 flex items-center justify-center">
                    {SCAN_STEPS[scanStepIndex]}
                  </p>
                </div>
              )}

              {/* Clear / Retake button */}
              {!isAnalyzing && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700 transition"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photo ready for vision scanning</span>
              </div>
            </div>

          ) : (
            
            /* Upload / Dropzone or Camera Launch */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-inner">
                <ImageIcon className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Upload a photo of your meal
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Drag & drop your food picture here, snap a fresh plate photo with your camera, or choose from realistic sample dishes below.
                </p>
              </div>

              {cameraError && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Use Live Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Browse Photo</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Context Sentence Input (CRITICAL REQUIREMENT) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Meal Context Hint</span>
                <span className="text-[11px] font-normal text-emerald-400">
                  (Boosts Vision Accuracy)
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                Optional sentence
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={contextSentence}
                onChange={(e) => setContextSentence(e.target.value)}
                placeholder="Write a sentence to help AI (e.g., 'Cooked in 1 tbsp olive oil, dressing was light balsamic, whole wheat bun')..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              {contextSentence && (
                <button
                  type="button"
                  onClick={() => setContextSentence('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">
                Quick Tags:
              </span>
              {COMMON_HINT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => addHintChip(chip)}
                  className="text-[11px] text-slate-300 hover:text-emerald-300 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 px-2.5 py-1 rounded-lg whitespace-nowrap transition"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Analyze CTA */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!selectedImage || isAnalyzing || isCooldown}
              onClick={runAnalysis}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                !selectedImage || isAnalyzing || isCooldown
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing Food with Gemini 3.8 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>Analyze Nutrition & Calories Instantly</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Sample Food Presets Section */}
        <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Or Try with Curated Sample Meals</span>
            </div>
            <span className="text-[11px] text-slate-500">1-Click Instant Test</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {samples.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset)}
                className={`group text-left p-2 rounded-xl border transition flex flex-col gap-1.5 ${
                  selectedImage === preset.imageUrl
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.imageUrl}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-1 right-1 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded">
                    ~{preset.approxCalories} kcal
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition">
                    {preset.name}
                  </p>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {preset.mealType}
                  </span>
                </div>
              </button>
            ))}
            
            {/* Add Sample Trigger */}
            {isMounted && (
              <button
                type="button"
                onClick={() => setShowAddSample(true)}
                className="group text-left p-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800 hover:border-slate-600 transition flex flex-col items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6 text-slate-500 group-hover:text-emerald-400" />
                <span className="text-[10px] text-slate-400 group-hover:text-white font-bold">Add Meal</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Sample Modal */}
        {showAddSample && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase">Add New Sample Meal</h3>
              <input
                type="text"
                placeholder="Meal Name"
                value={newSampleName}
                onChange={(e) => setNewSampleName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newSampleUrl}
                onChange={(e) => setNewSampleUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <input
                type="number"
                placeholder="Calories"
                value={newSampleCalories}
                onChange={(e) => setNewSampleCalories(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <input
                type="number"
                placeholder="Protein (g)"
                value={newSampleProtein || ''}
                onChange={(e) => setNewSampleProtein(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={newSampleCarbs || ''}
                onChange={(e) => setNewSampleCarbs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <input
                type="number"
                placeholder="Fat (g)"
                value={newSampleFat || ''}
                onChange={(e) => setNewSampleFat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddSample(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newSampleName && newSampleUrl && newSampleCalories) {
                      addSample({
                        id: newSampleName.toLowerCase().replace(/\s+/g, '-'),
                        name: newSampleName,
                        category: 'Custom',
                        imageUrl: newSampleUrl,
                        defaultHint: 'User defined meal',
                        mealType: 'lunch',
                        approxCalories: parseInt(newSampleCalories, 10),
                        protein: parseInt(newSampleProtein, 10),
                        carbs: parseInt(newSampleCarbs, 10),
                        fat: parseInt(newSampleFat, 10),
                      });
                      setNewSampleName('');
                      setNewSampleUrl('');
                      setNewSampleCalories('');
                      setNewSampleProtein('');
                      setNewSampleCarbs('');
                      setNewSampleFat('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
