
"use client";

import {
  Plus,
  Trash2,
  Dumbbell,
  Check,
} from "lucide-react";
import { useState } from "react";

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  machine: string;
  previous: string;
  sets: WorkoutSet[];
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;

  onUpdateSet: (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: number
  ) => void;

  onSaveSet: (
    exerciseId: string,
    setId: string,
    weight: number,
    reps: number
  ) => void;

  onAddSet: (exerciseId: string) => void;

  onRemoveSet: (
    exerciseId: string,
    setId: string
  ) => void;

  onToggleSet: (
    exerciseId: string,
    setId: string
  ) => void;

  onRemoveExercise: (exerciseId: string) => void;
}

export default function ExerciseCard({
  exercise,
  onUpdateSet,
  onSaveSet,
  onAddSet,
  onRemoveSet,
  onToggleSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  // Keep empty input values locally.
  // The actual workout data remains numeric.
  const [emptyFields, setEmptyFields] = useState<
    Record<string, boolean>
  >({});

  const updateEmptyState = (
    setId: string,
    field: "weight" | "reps",
    isEmpty: boolean
  ) => {
    setEmptyFields((previous) => ({
      ...previous,
      [`${setId}-${field}`]: isEmpty,
    }));
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#111113] p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-zinc-800 p-3">
            <Dumbbell
              className="text-lime-400"
              size={22}
            />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {exercise.name}
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              {exercise.machine} · {exercise.muscleGroup}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            onRemoveExercise(exercise.id)
          }
          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          aria-label={`Remove ${exercise.name}`}
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="mb-5 rounded-lg bg-zinc-900 px-3 py-2">
        <p className="text-xs text-zinc-500">
          Previous performance
        </p>

        <p className="mt-1 text-sm text-zinc-300">
          {exercise.previous}
        </p>
      </div>

      <div className="grid grid-cols-[35px_1fr_1fr_40px] items-center gap-2 px-1 pb-3 text-xs font-medium text-zinc-500">
        <span>SET</span>
        <span>WEIGHT (KG)</span>
        <span>REPS</span>
        <span></span>
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set, index) => {
          const weightEmpty =
            emptyFields[`${set.id}-weight`] ??
            set.weight === 0;

          const repsEmpty =
            emptyFields[`${set.id}-reps`] ??
            set.reps === 0;

          return (
            <div
              key={set.id}
              className={`grid grid-cols-[35px_1fr_1fr_40px] items-center gap-2 ${
                set.completed ? "opacity-60" : ""
              }`}
            >
              <span className="text-sm text-zinc-500">
                {index + 1}
              </span>

              {/* Weight input */}
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={weightEmpty ? "" : String(set.weight)}
                onChange={(event) => {
                  const value = event.target.value;

                  if (!/^\d*\.?\d*$/.test(value)) return;

                  updateEmptyState(
                    set.id,
                    "weight",
                    value === ""
                  );

                  if (value !== "" && value !== ".") {
                    onUpdateSet(
                      exercise.id,
                      set.id,
                      "weight",
                      Number(value)
                    );
                  }
                }}
                onBlur={() => {
                  onSaveSet(
                    exercise.id,
                    set.id,
                    set.weight,
                    set.reps
                  );
                }}
                className="w-full min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-400"
              />

              {/* Reps input */}
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={repsEmpty ? "" : String(set.reps)}
                onChange={(event) => {
                  const value = event.target.value;

                  if (!/^\d*$/.test(value)) return;

                  updateEmptyState(
                    set.id,
                    "reps",
                    value === ""
                  );

                  if (value !== "") {
                    onUpdateSet(
                      exercise.id,
                      set.id,
                      "reps",
                      Number(value)
                    );
                  }
                }}
                onBlur={() => {
                  onSaveSet(
                    exercise.id,
                    set.id,
                    set.weight,
                    set.reps
                  );
                }}
                className="w-full min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-400"
              />

              <button
                onClick={() =>
                  onToggleSet(exercise.id, set.id)
                }
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                  set.completed
                    ? "bg-lime-400 text-black"
                    : "border border-zinc-700 text-zinc-400 hover:border-lime-400 hover:text-lime-400"
                }`}
                aria-label={
                  set.completed
                    ? "Mark set incomplete"
                    : "Complete set"
                }
              >
                <Check size={18} />
              </button>

              <button
                onClick={() =>
                  onRemoveSet(exercise.id, set.id)
                }
                className="col-span-4 flex justify-end text-xs text-zinc-600 hover:text-red-400"
              >
                Remove set
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onAddSet(exercise.id)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition hover:border-lime-400 hover:text-lime-400"
      >
        <Plus size={17} />
        Add set
      </button>
    </section>
  );
}
