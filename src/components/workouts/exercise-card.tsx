"use client";

import { exerciseLabel } from "@/lib/exercise-labels";
import { Plus, Trash2, Dumbbell, Check } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  machine: string;
  previous: string;
  sets: WorkoutSet[];
}
interface ExerciseCardProps {
  exercise: WorkoutExercise;
  disabled?: boolean;
  onUpdateSet: (exerciseId: string, setId: string, field: "weight" | "reps", value: number) => void;
  onSaveSet: (exerciseId: string, setId: string, weight: number, reps: number) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onToggleSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
}

export default function ExerciseCard({ exercise, disabled = false, onUpdateSet, onSaveSet, onAddSet, onRemoveSet, onToggleSet, onRemoveExercise }: ExerciseCardProps) {
  const { t, locale } = useI18n();
  // String drafts allow empty values and trailing decimal separators while typing.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const update = (setId: string, field: "weight" | "reps", value: string) => {
    if (!(field === "weight" ? /^\d*(?:[.,]\d{0,2})?$/ : /^\d*$/).test(value)) return;
    setDrafts((previous) => ({ ...previous, [`${setId}-${field}`]: value }));
    onUpdateSet(exercise.id, setId, field, Number(value.replace(",", ".")) || 0);
  };
  const inputClass = "w-full min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-400 disabled:opacity-50";
  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#111113] p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-zinc-800 p-3"><Dumbbell className="text-lime-400" size={22} /></div>
          <div><h3 className="font-semibold text-white">{exercise.name}</h3><p className="mt-1 text-xs text-zinc-500">{exerciseLabel(exercise.machine, locale)} · {exerciseLabel(exercise.muscleGroup, locale)}</p></div>
        </div>
        <button disabled={disabled} onClick={() => onRemoveExercise(exercise.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50" aria-label={t(`Remove ${exercise.name}`, `${exercise.name} eltávolítása`)}><Trash2 size={17} /></button>
      </div>
      <div className="mb-5 rounded-lg bg-zinc-900 px-3 py-2"><p className="text-xs text-zinc-500">{t("Previous performance", "Előző teljesítmény")}</p><p className="mt-1 text-sm text-zinc-300">{exercise.previous}</p></div>
      <div className="grid grid-cols-[35px_1fr_1fr_40px] items-center gap-2 px-1 pb-3 text-xs font-medium text-zinc-500"><span>{t("SET", "SZETT")}</span><span>{t("WEIGHT (KG)", "SÚLY (KG)")}</span><span>{t("REPS", "ISMÉTLÉS")}</span><span /></div>
      <div className="space-y-3">
        {exercise.sets.map((set, index) => (
          <div key={set.id} className={`grid grid-cols-[35px_1fr_1fr_40px] items-center gap-2 ${set.completed ? "opacity-70" : ""}`}>
            <span className="text-sm text-zinc-500">{index + 1}</span>
            <input type="text" inputMode="decimal" disabled={disabled} placeholder="0" aria-label={t(`Set ${index + 1} weight in kg`, `${index + 1}. szett súlya kilogrammban`)} value={drafts[`${set.id}-weight`] ?? (set.weight ? String(set.weight).replace(".", locale === "hu" ? "," : ".") : "")} onChange={(event) => update(set.id, "weight", event.target.value)} onBlur={() => onSaveSet(exercise.id, set.id, set.weight, set.reps)} className={inputClass} />
            <input type="text" inputMode="numeric" disabled={disabled} placeholder="0" aria-label={t(`Set ${index + 1} reps`, `${index + 1}. szett ismétlésszáma`)} value={drafts[`${set.id}-reps`] ?? (set.reps ? String(set.reps) : "")} onChange={(event) => update(set.id, "reps", event.target.value)} onBlur={() => onSaveSet(exercise.id, set.id, set.weight, set.reps)} className={inputClass} />
            <button disabled={disabled} onClick={() => onToggleSet(exercise.id, set.id)} className={`flex h-10 w-10 items-center justify-center rounded-lg transition disabled:opacity-50 ${set.completed ? "bg-lime-400 text-black" : "border border-zinc-700 text-zinc-400 hover:border-lime-400 hover:text-lime-400"}`} aria-pressed={set.completed} aria-label={set.completed ? t("Mark set incomplete", "Szett megjelölése nem teljesítettként") : t("Complete set", "Szett teljesítése")}><Check size={18} /></button>
            <button disabled={disabled} onClick={() => onRemoveSet(exercise.id, set.id)} className="col-span-4 flex justify-end text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50">{t("Remove set", "Szett törlése")}</button>
          </div>
        ))}
      </div>
      <button disabled={disabled} onClick={() => onAddSet(exercise.id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition hover:border-lime-400 hover:text-lime-400 disabled:opacity-50"><Plus size={17} />{t("Add set", "Szett hozzáadása")}</button>
    </section>
  );
}
