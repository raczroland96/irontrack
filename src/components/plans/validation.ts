import type { PlanDraft } from "./types";

type Translate = (en: string, hu: string) => string;

export function validatePlan(input: unknown, t: Translate): PlanDraft {
  if (!input || typeof input !== "object") {
    throw new Error(t("Invalid plan.", "Érvénytelen edzésterv."));
  }
  const draft = input as Partial<PlanDraft>;
  if (typeof draft.name !== "string" || !draft.name.trim() || draft.name.trim().length > 80) {
    throw new Error(t("Enter a plan name (1–80 characters).", "Adj nevet az edzéstervnek (1–80 karakter)."));
  }
  if (!Array.isArray(draft.exercises) || draft.exercises.length === 0 || draft.exercises.length > 50) {
    throw new Error(t("Choose 1–50 exercises.", "Válassz 1–50 gyakorlatot."));
  }
  const ids = new Set<string>();
  const exercises = draft.exercises.map((exercise) => {
    if (!exercise || typeof exercise.exerciseId !== "string" || !exercise.exerciseId || ids.has(exercise.exerciseId)) {
      throw new Error(t("Each exercise can appear only once.", "Minden gyakorlat csak egyszer szerepelhet."));
    }
    ids.add(exercise.exerciseId);
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0 || exercise.sets.length > 30) {
      throw new Error(t("Each exercise needs 1–30 sets.", "Gyakorlatonként 1–30 szett szükséges."));
    }
    const sets = exercise.sets.map((set) => {
      if (!set || typeof set.weight !== "number" || !Number.isFinite(set.weight) || set.weight < 0 || set.weight > 10000 || !Number.isInteger(set.reps) || set.reps < 1 || set.reps > 10000) {
        throw new Error(t("Enter a valid weight (0–10000 kg) and reps (1–10000).", "Adj meg érvényes súlyt (0–10000 kg) és ismétlésszámot (1–10000)."));
      }
      return { weight: Math.round(set.weight * 100) / 100, reps: set.reps };
    });
    return { exerciseId: exercise.exerciseId, sets };
  });
  return { name: draft.name.trim(), exercises };
}
