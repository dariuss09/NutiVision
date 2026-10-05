export interface SampleFoodPreset {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  defaultHint: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  approxCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DEFAULT_FOOD_PRESETS: SampleFoodPreset[] = [
  {
    id: 'salmon-quinoa-bowl',
    name: 'Grilled Salmon & Quinoa Bowl',
    category: 'Balanced Bowl',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    defaultHint: 'Wild caught salmon grilled with olive oil, tricolor quinoa, steamed broccoli florets and cherry tomatoes',
    mealType: 'lunch',
    approxCalories: 560,
    protein: 40,
    carbs: 45,
    fat: 22,
  },
  {
    id: 'avocado-egg-toast',
    name: 'Sourdough Avocado & Poached Eggs',
    category: 'Breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    defaultHint: 'Two poached pasture-raised eggs on toasted artisanal sourdough with sliced Hass avocado, chili flakes, and microgreens',
    mealType: 'breakfast',
    approxCalories: 430,
    protein: 20,
    carbs: 30,
    fat: 25,
  },
  {
    id: 'steak-asparagus',
    name: 'Seared Ribeye Steak & Asparagus',
    category: 'High Protein',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    defaultHint: 'Grass-fed ribeye steak medium rare, roasted asparagus spears with garlic butter',
    mealType: 'dinner',
    approxCalories: 680,
    protein: 50,
    carbs: 10,
    fat: 50,
  },
  {
    id: 'acai-berry-bowl',
    name: 'Antioxidant Berry Acai Bowl',
    category: 'Smoothie / Fruit',
    imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
    defaultHint: 'Unsweetened acai puree with organic granola, chia seeds, sliced banana, and fresh blueberries',
    mealType: 'breakfast',
    approxCalories: 390,
    protein: 10,
    carbs: 60,
    fat: 12,
  },
  {
    id: 'mediterranean-salad',
    name: 'Greek Chicken Mediterranean Salad',
    category: 'Low Carb',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    defaultHint: 'Grilled lemon herb chicken breast, cucumber, Kalamata olives, feta cheese crumbles, and extra virgin olive oil vinaigrette',
    mealType: 'lunch',
    approxCalories: 480,
    protein: 40,
    carbs: 20,
    fat: 28,
  },
  {
    id: 'pepperoni-pizza',
    name: 'Artisan Pepperoni Pizza Slice',
    category: 'Comfort',
    imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    defaultHint: 'Two medium slices thin crust pepperoni pizza with mozzarella and fresh basil',
    mealType: 'dinner',
    approxCalories: 610,
    protein: 25,
    carbs: 60,
    fat: 30,
  },
];
