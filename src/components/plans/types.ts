export type PlanDraft = {
  name: string;
  exercises: {
    exerciseId: string;
    sets: { weight: number; reps: number }[];
  }[];
};

export type ExerciseChoice = {
  id: string;
  name: string;
  muscleGroup: string | null;
};
