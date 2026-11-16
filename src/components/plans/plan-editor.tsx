"use client";

import { exerciseLabel } from "@/lib/exercise-labels";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { savePlan } from "./actions";
import type { ExerciseChoice, PlanDraft } from "./types";

const fieldClass = "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-lime-400";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-lime-400 disabled:opacity-40";

export default function PlanEditor({ planId, initial, exercises }: {
  planId: string | null;
  initial: PlanDraft;
  exercises: ExerciseChoice[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [choice, setChoice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const available = exercises.filter((exercise) => !draft.exercises.some((item) => item.exerciseId === exercise.id));

  function updateSet(exerciseIndex: number, setIndex: number, field: "weight" | "reps", value: number) {
    setDraft((current) => ({ ...current, exercises: current.exercises.map((exercise, index) => index === exerciseIndex ? {
      ...exercise, sets: exercise.sets.map((set, i) => i === setIndex ? { ...set, [field]: value } : set),
    } : exercise) }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/plans" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} />{t("Back to plans", "Vissza az edzéstervekhez")}</Link>
      <div>
        <h1 className="text-2xl font-bold text-white">{planId ? t("Edit workout plan", "Edzésterv szerkesztése") : t("Create workout plan", "Edzésterv létrehozása")}</h1>
        <p className="mt-2 text-sm text-zinc-400">{t("Prepare your exercises, weights and reps. Each start creates a fresh workout with unchecked sets.", "Állítsd össze a gyakorlatokat, súlyokat és ismétléseket. Minden indítás új edzést hoz létre, üres szettjelölőkkel.")}</p>
      </div>
      <form onSubmit={(event) => {
        event.preventDefault();
        setError("");
        startTransition(async () => {
          try {
            await savePlan(planId, draft);
            router.push("/plans");
            router.refresh();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("Unable to save plan.", "Az edzésterv mentése sikertelen."));
          }
        });
      }} className="space-y-5">
        <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
          <label className="block space-y-2 text-sm text-zinc-300">
            <span>{t("Plan name", "Edzésterv neve")}</span>
            <input required maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t("e.g. Upper body A", "Pl. Felsőtest A")} className={fieldClass} />
          </label>
          {draft.exercises.map((item, exerciseIndex) => {
            const exercise = exercises.find((exercise) => exercise.id === item.exerciseId);
            return (
              <section key={item.exerciseId} className="space-y-4 rounded-2xl border border-zinc-800 bg-[#111113] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="font-semibold text-white">{exercise?.name}</h2><p className="text-xs text-zinc-500">{exerciseLabel(exercise?.muscleGroup ?? "", locale)}</p></div>
                  <button type="button" aria-label={t("Remove exercise", "Gyakorlat eltávolítása")} onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, i) => i !== exerciseIndex) })} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={18} /></button>
                </div>
                <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 text-xs text-zinc-400">
                  <span>{t("Set", "Szett")}</span><span>{t("Weight (kg)", "Súly (kg)")}</span><span>{t("Reps", "Ismétlés")}</span><span />
                  {item.sets.map((set, setIndex) => (
                    <SetInputs key={setIndex} number={setIndex + 1} weight={set.weight} reps={set.reps}
                      onChange={(field, value) => updateSet(exerciseIndex, setIndex, field, value)}
                      onRemove={() => setDraft({ ...draft, exercises: draft.exercises.map((exercise, i) => i === exerciseIndex ? { ...exercise, sets: exercise.sets.filter((_, j) => j !== setIndex) } : exercise) })}
                      canRemove={item.sets.length > 1} />
                  ))}
                </div>
                <button type="button" className={buttonClass} disabled={item.sets.length >= 30} onClick={() => setDraft({ ...draft, exercises: draft.exercises.map((exercise, index) => index === exerciseIndex ? { ...exercise, sets: [...exercise.sets, { ...exercise.sets[exercise.sets.length - 1] }] } : exercise) })}><Plus size={15} />{t("Add set", "Szett hozzáadása")}</button>
              </section>
            );
          })}
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-zinc-700 p-4 sm:flex-row">
            <select aria-label={t("Choose exercise", "Gyakorlat kiválasztása")} value={choice} onChange={(event) => setChoice(event.target.value)} className={fieldClass}>
              <option value="">{t("Choose an exercise…", "Válassz gyakorlatot…")}</option>
              {available.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}{exercise.muscleGroup ? ` · ${exerciseLabel(exercise.muscleGroup, locale)}` : ""}</option>)}
            </select>
            <button type="button" disabled={!choice || draft.exercises.length >= 50} className={`${buttonClass} shrink-0`} onClick={() => {
              if (!available.some((exercise) => exercise.id === choice)) return;
              setDraft({ ...draft, exercises: [...draft.exercises, { exerciseId: choice, sets: [{ weight: 0, reps: 10 }] }] });
              setChoice("");
            }}><Plus size={15} />{t("Add exercise", "Gyakorlat hozzáadása")}</button>
          </div>
          {exercises.length === 0 && <p className="text-sm text-zinc-400">{t("Add an exercise to the library first.", "Először adj hozzá gyakorlatot a gyakorlattárhoz.")} <Link href="/settings/exercises" className="text-lime-400">{t("Exercise library", "Gyakorlattár")}</Link></p>}
          {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={draft.exercises.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black hover:bg-lime-300 disabled:opacity-40"><Save size={17} />{pending ? t("Saving…", "Mentés…") : t("Save plan", "Edzésterv mentése")}</button>
        </fieldset>
      </form>
    </div>
  );
}

function SetInputs({ number, weight, reps, onChange, onRemove, canRemove }: {
  number: number; weight: number; reps: number;
  onChange: (field: "weight" | "reps", value: number) => void;
  onRemove: () => void; canRemove: boolean;
}) {
  const { t } = useI18n();
  return <>
    <span>{number}</span>
    <input required aria-label={`${t("Weight for set", "Szett súlya")} ${number}`} type="number" min={0} max={10000} step="0.01" value={Number.isNaN(weight) ? "" : weight} onChange={(event) => onChange("weight", event.target.valueAsNumber)} className={fieldClass} />
    <input required aria-label={`${t("Reps for set", "Szett ismétlésszáma")} ${number}`} type="number" min={1} max={10000} step={1} value={Number.isNaN(reps) ? "" : reps} onChange={(event) => onChange("reps", event.target.valueAsNumber)} className={fieldClass} />
    <button type="button" disabled={!canRemove} onClick={onRemove} aria-label={`${t("Remove set", "Szett eltávolítása")} ${number}`} className="p-1 text-zinc-400 hover:text-red-400 disabled:opacity-20"><Trash2 size={15} /></button>
  </>;
}
