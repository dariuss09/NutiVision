'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Plus, Trash2, CheckCircle2, Circle, Flame, Activity, History, X } from 'lucide-react';
import { WorkoutSession, WorkoutExercise, WorkoutSet } from '@/types/workout';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

import Model from 'react-body-highlighter';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';


export const getLiftRank = (name: string, weightKg: number, muscleGroup?: string) => {
  const lowerName = name.toLowerCase();
  const group = muscleGroup?.toLowerCase() || '';
  const isDb = lowerName.includes('dumb') || lowerName.includes('db');

  let olympianTarget = 100; // Default generic target

  // Define Olympian targets (kg) for various exercises
  if (lowerName.includes('squat')) {
    olympianTarget = isDb ? 60 : 220; // DB squat per hand vs Barbell
  } else if (lowerName.includes('deadlift') || lowerName.includes('rdl')) {
    olympianTarget = isDb ? 70 : 250;
  } else if (lowerName.includes('leg press')) {
    olympianTarget = 450;
  } else if (lowerName.includes('bench') || lowerName.includes('chest press')) {
    if (lowerName.includes('incline')) {
      olympianTarget = isDb ? 55 : 140;
    } else {
      olympianTarget = isDb ? 65 : 160;
    }
  } else if (lowerName.includes('lateral raise') || lowerName.includes('side raise')) {
    olympianTarget = 30; // Very strict standard
  } else if (lowerName.includes('overhead press') || lowerName.includes('shoulder press') || lowerName.includes('military press')) {
    olympianTarget = isDb ? 45 : 110;
  } else if (lowerName.includes('row')) {
    if (lowerName.includes('barbell')) olympianTarget = 150;
    else if (isDb) olympianTarget = 65;
    else olympianTarget = 120; // Cable/machine
  } else if (lowerName.includes('pulldown') || lowerName.includes('pull down') || lowerName.includes('pull-up') || lowerName.includes('pullup')) {
    olympianTarget = 130;
  } else if (lowerName.includes('curl')) {
    if (lowerName.includes('leg')) olympianTarget = 100; // Leg curl
    else olympianTarget = isDb ? 30 : 70; // Bicep curl
  } else if (lowerName.includes('extension')) {
    if (lowerName.includes('leg')) olympianTarget = 140;
    else olympianTarget = isDb ? 25 : 60; // Tricep
  } else if (lowerName.includes('pushdown') || lowerName.includes('push down')) {
    olympianTarget = 60;
  } else if (lowerName.includes('fly')) {
    olympianTarget = isDb ? 35 : 100; // Pec deck / cable fly
  } else if (lowerName.includes('shrug')) {
    olympianTarget = isDb ? 70 : 200;
  } else {
    // Fallbacks based on muscle group
    if (group === 'legs') olympianTarget = isDb ? 50 : 160;
    else if (group === 'chest' || group === 'back') olympianTarget = isDb ? 45 : 120;
    else if (group === 'shoulders') olympianTarget = isDb ? 25 : 70;
    else olympianTarget = isDb ? 25 : 60; // Arms/Other
  }

  const ranks = [
    { label: 'Olympian', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', hex: '#2dd4bf', value: 9, pct: 1.0 },
    { label: 'Titan', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', hex: '#fb7185', value: 8, pct: 0.85 },
    { label: 'Champion', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', hex: '#c084fc', value: 7, pct: 0.75 },
    { label: 'Diamond', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', hex: '#60a5fa', value: 6, pct: 0.65 },
    { label: 'Platinum', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', hex: '#34d399', value: 5, pct: 0.55 },
    { label: 'Gold', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', hex: '#fbbf24', value: 4, pct: 0.45 },
    { label: 'Silver', color: 'text-slate-300 bg-slate-400/10 border-slate-400/30', hex: '#cbd5e1', value: 3, pct: 0.35 },
    { label: 'Bronze', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', hex: '#fb923c', value: 2, pct: 0.25 },
    { label: 'Wood', color: 'text-stone-500 bg-stone-500/10 border-stone-500/30', hex: '#78716c', value: 1, pct: 0.0 }
  ];

  for (const r of ranks) {
    if (weightKg >= olympianTarget * r.pct) {
      return r;
    }
  }
  return ranks[ranks.length - 1]; // Wood
};

export function WorkoutTracker() {
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<{name: string, rankObj: any, bestExercise: string} | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Convex Database Hooks
  const convexWorkouts = useQuery(api.workouts.getWorkouts, user ? { userId: user.id } : "skip");
  const saveWorkoutMutation = useMutation(api.workouts.saveWorkout);

  const sessions: WorkoutSession[] = (convexWorkouts || []).map(w => ({
    id: w._id,
    date: w.date,
    completed: w.completed,
    exercises: w.exercises as WorkoutExercise[]
  }));

  // New Workout State
  const [newExercises, setNewExercises] = useState<WorkoutExercise[]>([]);

useEffect(() => {
    setIsMounted(true);
  }, []);

  // One-time sync of local workouts to Convex
  useEffect(() => {
    if (user && convexWorkouts !== undefined && convexWorkouts.length === 0) {
      const local = localStorage.getItem('nutrivision_workouts_v1');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          parsed.forEach((session: any) => {
            saveWorkoutMutation({
              userId: user.id,
              date: session.date,
              completed: session.completed,
              exercises: session.exercises
            });
          });
        } catch(e) {}
      }
    }
  }, [user, convexWorkouts]);

  useEffect(() => {
    if (isMounted && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [isMounted, sessions.length]);

// Helper to get local YYYY-MM-DD
  const getLocalDateString = (d: Date) => {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };


  const handleAddExercise = () => {
    setNewExercises([
      ...newExercises,
      {
        id: `ex-${Date.now()}`,
        name: '',
        muscleGroup: 'Chest',
        sets: [
          { weight: 0, reps: 0 },
          { weight: 0, reps: 0 }
        ]
      }
    ]);
  };

  const handleUpdateExercise = (index: number, field: string, value: string | number, setIndex?: number) => {
    const updated = [...newExercises];
    if (setIndex !== undefined) {
      updated[index].sets[setIndex] = {
        ...updated[index].sets[setIndex],
        [field]: Number(value) || 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      } as any;
    }
    setNewExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...newExercises];
    updated.splice(index, 1);
    setNewExercises(updated);
  };

  const handleToggleDate = async () => {
    if (!user) return;
    const targetDate = selectedDate || today;
    const targetSession = sessions.find(s => s.date === targetDate);
    
    if (targetSession) {
      if (targetSession.completed) {
        if (targetSession.exercises.length > 0) {
          if (!confirm(`Are you sure you want to unmark ${targetDate}? This won't delete logged exercises, but it marks the day incomplete.`)) return;
        }
        await saveWorkoutMutation({
          userId: user.id,
          date: targetDate,
          completed: false,
          exercises: targetSession.exercises
        });
      } else {
        await saveWorkoutMutation({
          userId: user.id,
          date: targetDate,
          completed: true,
          exercises: targetSession.exercises
        });
      }
    } else {
      await saveWorkoutMutation({
        userId: user.id,
        date: targetDate,
        completed: true,
        exercises: []
      });
    }
  };

  const handleLogWorkout = async () => {
    if (!user) return;
    
    const validExercises = newExercises.filter(ex => ex.name.trim() !== '');
    if (validExercises.length === 0) {
      alert("Please enter at least one exercise.");
      return;
    }

    const targetDate = selectedDate || today;
    const targetSession = sessions.find(s => s.date === targetDate);
    const existingExercises = targetSession?.exercises || [];
    const updatedExercises = [...existingExercises, ...validExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup || 'Chest',
        sets: ex.sets.map((s: any) => ({ weight: Number(s.weight), reps: Number(s.reps) })) as any
      }))];

    await saveWorkoutMutation({
      userId: user.id,
      date: targetDate,
      completed: true,
      exercises: updatedExercises
    });

    setNewExercises([
      {
        id: `ex-${Date.now()}`,
        name: '',
        muscleGroup: 'Chest',
        sets: [
          { weight: 0, reps: 0 },
          { weight: 0, reps: 0 }
        ]
      } as any
    ]);
  };

const handleRemoveSavedExercise = async (date: string, exerciseId: string) => {
    if (!user) return;
    const targetSession = sessions.find(s => s.date === date);
    if (!targetSession) return;
    
    const updatedExercises = targetSession.exercises.filter(ex => ex.id !== exerciseId);
    
    await saveWorkoutMutation({
      userId: user.id,
      date: date,
      completed: targetSession.completed,
      exercises: updatedExercises
    });
  };

  const today = getLocalDateString(new Date());

  const getWeekDates = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(getLocalDateString(nextDay));
    }
    return week;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const chartData = [...sessions]
    .filter(s => s.exercises.length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(s => {
      let totalVol = 0;
      s.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          totalVol += (set.weight * set.reps);
        });
      });
      return {
        date: s.date.slice(5),
        volume: totalVol
      };
    });

const WEEKS = 52;
  const contributionGrid = Array.from({ length: 7 * WEEKS }).map((_, i) => {
    const d = new Date();
    // Get current day of week (0-6) where 0=Mon, 6=Sun
    let currentDayIndex = d.getDay() - 1;
    if (currentDayIndex === -1) currentDayIndex = 6;
    
    // The grid ends on the Sunday of the current week
    const sunday = new Date(d);
    sunday.setDate(d.getDate() + (6 - currentDayIndex));
    
    const temp = new Date(sunday);
    temp.setDate(temp.getDate() - (7 * WEEKS - i - 1));
    const dateStr = getLocalDateString(temp);
    
    const isFuture = temp > new Date(); // roughly
    const hasWorkout = sessions.some(s => s.date === dateStr && s.completed);
    const volume = hasWorkout ? sessions.find(s => s.date === dateStr)?.exercises.length || 1 : 0;
    
    let colorClass = 'bg-slate-800';
    if (isFuture) {
      colorClass = 'bg-slate-900/50 opacity-30';
    } else if (hasWorkout) {
      if (volume > 4) colorClass = 'bg-emerald-400';
      else if (volume > 2) colorClass = 'bg-emerald-500';
      else colorClass = 'bg-emerald-600';
    }

    return { date: dateStr, colorClass, isFuture };
  });

  const targetDate = selectedDate || today;
  const isTargetDateDone = sessions.some(s => s.date === targetDate && s.completed);


  let finalChartData = [...chartData];
  if (finalChartData.length === 1) {
    finalChartData = [
      { date: 'Previous', volume: 0 },
      finalChartData[0]
    ];
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">

      
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
          <span>Yearly Activity</span>
          <span className="text-emerald-500">{sessions.filter(s => s.completed).length} Total Workouts</span>
        </h3>
        <div className="flex gap-2">
          {/* Day Labels */}
          <div className="flex flex-col justify-between py-1 text-[10px] text-slate-500 font-medium shrink-0">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
          
          {/* Scrollable Grid */}
          <div ref={scrollContainerRef} className="overflow-x-auto pb-4 w-full custom-scrollbar flex-1">
            <div className="flex gap-1.5 w-max pr-2">
              {Array.from({ length: WEEKS }).map((_, col) => (
                <div key={col} className="flex flex-col gap-1.5">
                  {Array.from({ length: 7 }).map((_, row) => {
                    const cell = contributionGrid[col * 7 + row];
                    if (!cell) return null;
                    const isSelected = selectedDate === cell.date;
                    return (
                      <div 
                        key={row} 
                        onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                        className={`w-4 h-4 rounded-sm cursor-pointer transition-all ${cell.colorClass} ${isSelected ? 'ring-2 ring-white scale-125 z-10' : 'hover:ring-1 hover:ring-emerald-400/50 hover:scale-110'}`} 
                        title={cell.date}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Muscle Group Mastery Widget */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 text-center z-10">Muscle Group Mastery</h3>
          <div className="grid grid-cols-2 gap-3 z-10">
            {(() => {
              const groups = ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps', 'Legs', 'Abs'];
              
              const bestRanks = groups.map(g => {
                let maxVal = 0;
                let bestRankObj = { label: 'Unranked', color: 'text-slate-600 bg-slate-950 border-slate-800', hex: '#334155', value: 0 };
                
                let bestExName = '';
                sessions.forEach(s => {
                  s.exercises.forEach(ex => {
                    if (ex.muscleGroup === g) {
                      const maxW = Math.max(ex.sets[0].weight || 0, ex.sets[1].weight || 0);
                      const r = getLiftRank(ex.name, maxW, ex.muscleGroup);
                      if (r.value > maxVal) {
                        maxVal = r.value;
                        bestRankObj = r;
                        bestExName = `${ex.name} (${maxW}kg)`;
                      }
                    }
                  });
                });
                return { group: g, rank: bestRankObj, bestExName };
              });

              // Construct data for react-body-highlighter
              const getRank = (gName: string) => bestRanks.find(r => r.group === gName)?.rank.value || 0;
              
              const bodyData: any[] = [];
              const addM = (rankVal: number, m: string[]) => {
                 if (rankVal > 0) bodyData.push({ name: 'Rank', muscles: m, frequency: rankVal });
              };
              
              addM(getRank('Chest'), ['chest']);
              addM(getRank('Back'), ['upper-back', 'lower-back', 'trapezius']);
              addM(getRank('Shoulders'), ['front-deltoids', 'back-deltoids']);
              addM(getRank('Biceps'), ['biceps', 'forearm']);
              addM(getRank('Triceps'), ['triceps']);
              addM(getRank('Abs'), ['abs', 'obliques']);
              addM(getRank('Legs'), ['quadriceps', 'hamstring', 'calves', 'gluteal', 'adductor', 'abductors']);

              const muscleToGroupMap: Record<string, string> = {
                chest: 'Chest',
                'upper-back': 'Back',
                'lower-back': 'Back',
                trapezius: 'Back',
                'front-deltoids': 'Shoulders',
                'back-deltoids': 'Shoulders',
                biceps: 'Biceps',
                triceps: 'Triceps',
                forearm: 'Biceps',
                abs: 'Abs',
                obliques: 'Abs',
                quadriceps: 'Legs',
                hamstring: 'Legs',
                calves: 'Legs',
                gluteal: 'Legs',
                adductor: 'Legs',
                abductors: 'Legs'
              };

              const handleMuscleClick = (data: { muscle: string }) => {
                const gName = muscleToGroupMap[data.muscle];
                if (gName) {
                  const rInfo = bestRanks.find(r => r.group === gName);
                  if (rInfo) {
                    setSelectedMuscleGroup({ name: gName, rankObj: rInfo.rank, bestExercise: rInfo.bestExName });
                  }
                }
              };

              const highlightedColors = [
                '#78716c', // Wood (1)
                '#fb923c', // Bronze (2)
                '#cbd5e1', // Silver (3)
                '#fbbf24', // Gold (4)
                '#34d399', // Platinum (5)
                '#60a5fa', // Diamond (6)
                '#c084fc', // Champion (7)
                '#fb7185', // Titan (8)
                '#2dd4bf'  // Olympian (9)
              ];

              const legendRanks = [
                { label: 'Olympian', hex: '#2dd4bf', val: 9 },
                { label: 'Titan', hex: '#fb7185', val: 8 },
                { label: 'Champion', hex: '#c084fc', val: 7 },
                { label: 'Diamond', hex: '#60a5fa', val: 6 },
                { label: 'Platinum', hex: '#34d399', val: 5 },
                { label: 'Gold', hex: '#fbbf24', val: 4 },
                { label: 'Silver', hex: '#cbd5e1', val: 3 },
                { label: 'Bronze', hex: '#fb923c', val: 2 },
                { label: 'Wood', hex: '#78716c', val: 1 }
              ];

              return (
                <div className="col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 w-full relative">
                  {/* Legend */}
                  <div className="flex flex-col gap-1.5 z-10 w-full md:w-1/3">
                    {legendRanks.map(r => {
                      // Check if user has this rank in any muscle
                      const achieved = bestRanks.some(br => br.rank.value === r.val);
                      return (
                        <div key={r.label} className={`flex items-center justify-between p-2 rounded border transition-all ${achieved ? 'bg-slate-900 border-slate-700' : 'opacity-40 grayscale border-transparent'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.hex }} />
                            <span className="text-xs font-bold" style={{ color: r.hex }}>{r.label}</span>
                          </div>
                          {achieved && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Model Diagram */}
                  <div className="flex items-center justify-center gap-4 w-full md:w-2/3">
                    <Model 
                      type="anterior" 
                      data={bodyData} 
                      highlightedColors={highlightedColors}
                      bodyColor="#1e293b"
                      style={{ width: '140px', cursor: 'pointer' }}
                      onClick={handleMuscleClick}
                    />
                    <Model 
                      type="posterior" 
                      data={bodyData} 
                      highlightedColors={highlightedColors}
                      bodyColor="#1e293b"
                      style={{ width: '140px', cursor: 'pointer' }}
                      onClick={handleMuscleClick}
                    />
                  </div>
                  {/* Overlay Frame */}
                  {selectedMuscleGroup && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm rounded-2xl" onClick={() => setSelectedMuscleGroup(null)}>
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-3 right-3 text-slate-400 hover:text-white" onClick={() => setSelectedMuscleGroup(null)}><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{selectedMuscleGroup.name}</h3>
                        <div className={`inline-block px-4 py-2 rounded-full border ${selectedMuscleGroup.rankObj.color} font-bold text-lg mb-4`}>
                          {selectedMuscleGroup.rankObj.label} Rank
                        </div>
                        {selectedMuscleGroup.bestExercise ? (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Best Lift</p>
                            <p className="text-sm font-semibold text-slate-300">{selectedMuscleGroup.bestExercise}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No exercises logged yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Workouts This Week */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 text-center">Workouts This Week</h3>
          <div className="flex justify-between items-center px-4">
            {weekDates.map((dateStr, i) => {
              const isTodayDate = dateStr === today;
              const hasWorkout = sessions.some(s => s.date === dateStr && s.completed);
              
              return (
                <div key={dateStr} className="flex flex-col items-center gap-2">
                  <span className={`text-[11px] font-bold ${isTodayDate ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {dayNames[i]}
                  </span>
                  {hasWorkout ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-emerald-500/10 rounded-full" />
                  ) : (
                    <Circle className={`w-6 h-6 ${isTodayDate ? 'text-slate-500' : 'text-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={handleToggleDate}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition border ${
                isTargetDateDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
              }`}
            >
              {isTargetDateDone ? `${targetDate} Marked Done` : `Mark ${targetDate} as Done`}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume (kg)</h3>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="w-full h-32">
            {finalChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finalChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="date" hide={true} />
                  <YAxis hide={true} domain={['dataMin - 100', 'dataMax + 100']} />
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" dot={{ r: 4, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Log exercises with weights to see volume
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="text-emerald-400 w-5 h-5" />
              Log Exercises {selectedDate ? `for ${selectedDate}` : ''}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Record exactly 2 working series (Weight & Reps) per exercise.</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {newExercises.map((ex, exIndex) => (
            <div key={ex.id} className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                <input
                  type="text"
                  placeholder="Exercise Name (e.g. Bench Press)"
                  value={ex.name}
                  onChange={(e) => handleUpdateExercise(exIndex, 'name', e.target.value)}
                  className="bg-transparent text-white font-bold placeholder-slate-600 focus:outline-none border-b border-slate-800 focus:border-emerald-500 w-full transition text-sm sm:mr-4 py-1"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                  <select
                    value={ex.muscleGroup || 'Chest'}
                    onChange={(e) => handleUpdateExercise(exIndex, 'muscleGroup', e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Triceps">Triceps</option>
                    <option value="Biceps">Biceps</option>
                    <option value="Legs">Legs</option>
                    <option value="Abs">Abs</option>
                    <option value="Shoulders">Shoulders</option>
                  </select>
                  <button onClick={() => handleRemoveExercise(exIndex)} className="text-slate-600 hover:text-rose-400 p-1 bg-slate-900 rounded-md border border-slate-800 hover:border-rose-900 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Set 1</span>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={ex.sets[0].weight || ''}
                        onChange={(e) => handleUpdateExercise(exIndex, 'weight', e.target.value, 0)}
                        placeholder="kg" 
                        className="w-full bg-slate-950 text-white rounded p-2 text-xs text-center border border-slate-700 focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={ex.sets[0].reps || ''}
                        onChange={(e) => handleUpdateExercise(exIndex, 'reps', e.target.value, 0)}
                        placeholder="reps" 
                        className="w-full bg-slate-950 text-white rounded p-2 text-xs text-center border border-slate-700 focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-3 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Set 2</span>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={ex.sets[1].weight || ''}
                        onChange={(e) => handleUpdateExercise(exIndex, 'weight', e.target.value, 1)}
                        placeholder="kg" 
                        className="w-full bg-slate-950 text-white rounded p-2 text-xs text-center border border-slate-700 focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        value={ex.sets[1].reps || ''}
                        onChange={(e) => handleUpdateExercise(exIndex, 'reps', e.target.value, 1)}
                        placeholder="reps" 
                        className="w-full bg-slate-950 text-white rounded p-2 text-xs text-center border border-slate-700 focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddExercise}
            className="w-full py-3 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>

        {newExercises.length > 0 && (
          <button
            onClick={handleLogWorkout}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Save Today's Exercises
          </button>
        )}
      </div>

      {/* Workout History */}
      {selectedDate && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="text-emerald-400 w-5 h-5" />
              History: {selectedDate}
            </h3>
            <button 
              onClick={() => setSelectedDate(null)}
              className="text-xs font-bold text-slate-500 hover:text-white transition px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
          
          {(() => {
            const daySession = sessions.find(s => s.date === selectedDate);
            if (!daySession || daySession.exercises.length === 0) {
              return <div className="text-sm text-slate-500 text-center py-6 bg-slate-950/50 rounded-xl border border-slate-800/50 border-dashed">No exercises logged on this date.</div>;
            }
            
            return (
              <div className="space-y-4">
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                  <div className="space-y-3">
                    {daySession.exercises.map((ex, i) => {
                      const maxW = Math.max(ex.sets[0].weight || 0, ex.sets[1].weight || 0);
                      const rank = getLiftRank(ex.name, maxW, ex.muscleGroup);
                      return (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800/80 hover:border-emerald-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-200">{ex.name || 'Unnamed Exercise'}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${rank.color}`}>
                              {rank.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {ex.muscleGroup && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {ex.muscleGroup}
                              </span>
                            )}
                            <div className="text-xs text-slate-400 font-medium font-mono bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800">
                              <span className="text-slate-500">S1:</span> {ex.sets[0].weight || 0}kg × {ex.sets[0].reps || 0} <span className="text-slate-600 mx-1">|</span> <span className="text-slate-500">S2:</span> {ex.sets[1].weight || 0}kg × {ex.sets[1].reps || 0}
                            </div>
                            <button 
                              onClick={() => handleRemoveSavedExercise(selectedDate, ex.id)}
                              className="p-2 sm:p-1.5 text-slate-500 hover:text-rose-400 bg-slate-950 rounded-md border border-slate-800 hover:border-rose-900 transition flex items-center justify-center min-w-[36px] min-h-[36px]"
                              title="Delete Exercise"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Overlay Frame */}
                {selectedMuscleGroup && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm rounded-2xl" onClick={() => setSelectedMuscleGroup(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
                      <button className="absolute top-3 right-3 text-slate-400 hover:text-white" onClick={() => setSelectedMuscleGroup(null)}><X className="w-5 h-5" /></button>
                      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{selectedMuscleGroup.name}</h3>
                      <div className={`inline-block px-4 py-2 rounded-full border ${selectedMuscleGroup.rankObj.color} font-bold text-lg mb-4`}>
                        {selectedMuscleGroup.rankObj.label} Rank
                      </div>
                      {selectedMuscleGroup.bestExercise ? (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Best Lift</p>
                          <p className="text-sm font-semibold text-slate-300">{selectedMuscleGroup.bestExercise}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No exercises logged yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
