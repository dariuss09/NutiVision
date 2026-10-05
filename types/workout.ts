export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup?: 'Chest' | 'Back' | 'Triceps' | 'Biceps' | 'Legs' | 'Abs' | string;
  sets: [WorkoutSet, WorkoutSet]; // Exactly 2 working sets as requested
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  exercises: WorkoutExercise[];
}
