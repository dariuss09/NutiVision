export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface IngredientBreakdown {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  category: 'Protein' | 'Carb' | 'Complex Carb' | 'Vegetable' | 'Fruit' | 'Healthy Fat' | 'Dairy' | 'Sauce/Condiment' | 'Other';
  confidence?: number;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  netCarbs: number;
}

export interface MicroNutrients {
  sodiumMg: number;
  potassiumMg: number;
  calciumMg: number;
  ironMg: number;
  vitaminCMg: number;
  vitaminDIU: number;
  cholesterolMg: number;
}

export interface GlycemicIndexInfo {
  rating: 'Low' | 'Medium' | 'High';
  score?: number;
  explanation: string;
}

export interface NutritionAnalysisResult {
  id: string;
  timestamp: string;
  mealName: string;
  mealType: MealType;
  servingWeight: string;
  healthScore: number; // 1-100
  confidenceLevel: 'Very High' | 'High' | 'Moderate';
  confidenceRationale?: string;
  glycemicIndex: GlycemicIndexInfo;
  macros: MacroNutrients;
  micros: MicroNutrients;
  ingredients: IngredientBreakdown[];
  dietaryTags: string[];
  allergens: string[];
  healthPros: string[];
  healthWatchouts: string[];
  dietitianAdvice: string;
  imageUrl?: string;
  userContextPrompt?: string;
  aiModelUsed?: string;
}

export interface UserGoals {
  calorieTarget: number;
  proteinTargetG: number;
  carbTargetG: number;
  fatTargetG: number;
  waterTargetMl: number;
  currentWaterMl: number;
  lastWaterDate?: string;
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  goalType: 'weight_loss' | 'maintenance' | 'muscle_gain' | 'keto' | 'athletic';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
}

export interface NotificationSettings {
  enabled: boolean;
  browserPermission: 'default' | 'granted' | 'denied';
  breakfastTime: string;
  breakfastEnabled: boolean;
  lunchTime: string;
  lunchEnabled: boolean;
  dinnerTime: string;
  dinnerEnabled: boolean;
  dailyReviewTime: string;
  dailyReviewEnabled: boolean;
  hydrationIntervalHours: number;
  hydrationEnabled: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'reminder' | 'milestone' | 'health_tip' | 'hydration';
  read: boolean;
}
