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
