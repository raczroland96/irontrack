"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Dumbbell,
  Flag,
  Trophy,
} from "lucide-react";

import ExerciseCard, {
  WorkoutExercise,
} from "@/components/workouts/exercise-card";

import ExerciseSelector, {
  ExerciseOption,
} from "@/components/workouts/exercise-selector";

import {
  addExerciseToWorkout,
  addSetToExercise,
  finishWorkout,
  removeExerciseFromWorkout,
  removeWorkoutSet,
  toggleWorkoutSet,
  updateWorkoutName,
  updateWorkoutSet,
} from "@/components/workouts/actions";

interface WorkoutEditorProps {
  workout: {
    id: string;
    name: string;
    startedAt: string;
    finishedAt: string | null;
    exercises: WorkoutExercise[];
  };

  availableExercises: ExerciseOption[];
}

export default function WorkoutEditor({
  workout,
  availableExercises,
}: WorkoutEditorProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const queue = useRef<Promise<void>>(Promise.resolve());

  const [exercises, setExercises] = useState(
    workout.exercises
  );

  const [name, setName] = useState(workout.name);

  const [seconds, setSeconds] = useState(() =>
    Math.max(
      0,
      Math.floor(
        (Date.now() -
          new Date(workout.startedAt).getTime()) /
          1000
      )
    )
  );

  const [error, setError] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(
        Math.max(
          0,
          Math.floor(
            (Date.now() -
              new Date(workout.startedAt).getTime()) /
              1000
          )
        )
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [workout.startedAt]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const remainingSeconds = totalSeconds % 60;

    return [
      hours,
      minutes,
      remainingSeconds,
    ]
      .map((part) =>
        part.toString().padStart(2, "0")
      )
      .join(":");
  };

  const completedSets = exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.filter(
        (set) => set.completed
      ).length,
    0
  );

  const totalSets = exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.length,
    0
  );

  const totalVolume = exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets
        .filter((set) => set.completed)
        .reduce(
          (sum, set) =>
            sum + set.weight * set.reps,
          0
        ),
    0
  );

  const completion =
    totalSets === 0
      ? 0
      : Math.round(
          (completedSets / totalSets) * 100
        );

  // Blur saves and button actions share a queue so finishing cannot overtake
  // an in-flight save. Background saves leave buttons usable after an input blur.
  const runAction = (
    action: () => Promise<unknown>,
    refresh = true,
    blocking = true,
  ) => {
    setError("");
    const execute = async () => {
      try {
        await action();
        if (refresh) router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("Something went wrong. Please try again.", "Hiba történt. Próbáld újra."));
      }
    };
    const request = queue.current.then(execute, execute);
    queue.current = request;
    if (blocking) startTransition(async () => { await request; });
  };

  const updateSetLocally = (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: number
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? {
                      ...set,
                      [field]: Number.isFinite(value)
                        ? value
                        : 0,
                    }
                  : set
              ),
            }
          : exercise
      )
    );
  };

  const persistExerciseSets = async (
    exercise: WorkoutExercise
  ) => {
    await Promise.all(
      exercise.sets.map((set) =>
        updateWorkoutSet(
          workout.id,
          set.id,
          set.weight,
          set.reps
        )
      )
    );
  };

  const saveSet = (
    exerciseId: string,
    setId: string,
    weight: number,
    reps: number
  ) => {
    const exercise = exercises.find(
      (item) => item.id === exerciseId
    );

    const set = exercise?.sets.find(
      (item) => item.id === setId
    );

    if (!set) return;

    runAction(() =>
      updateWorkoutSet(
        workout.id,
        setId,
        weight,
        reps
      ), false, false
    );
  };

  const addExercise = (
    exercise: ExerciseOption
  ) => {
    runAction(async () => {
      const created = await addExerciseToWorkout(
        workout.id,
        exercise.id
      );

      setExercises((current) => [
        ...current,
        {
          id: created.id,
          exerciseId: created.exerciseId,
          name: created.exercise.name,
          muscleGroup:
            created.exercise.muscleGroup ?? "",
          machine: created.exercise.machine ?? "",
          previous: exercise.previous,
          sets: created.sets.map((set) => ({
            id: set.id,
            weight: Number(set.weightKg),
            reps: set.reps,
            completed: set.completed,
          })),
        },
      ]);
    });
  };

  const addSet = (exerciseId: string) => {
    runAction(async () => {
      const exercise = exercises.find(
        (item) => item.id === exerciseId
      );

      if (!exercise) return;

      await persistExerciseSets(exercise);

      const created = await addSetToExercise(
        workout.id,
        exerciseId
      );

      setExercises((current) =>
        current.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: [
                  ...exercise.sets,
                  {
                    id: created.id,
                    weight: Number(created.weightKg),
                    reps: created.reps,
                    completed: created.completed,
                  },
                ],
              }
            : exercise
        )
      );
    });
  };

  const removeSet = (
    exerciseId: string,
    setId: string
  ) => {
    runAction(async () => {
      const exercise = exercises.find(
        (item) => item.id === exerciseId
      );

      const set = exercise?.sets.find(
        (item) => item.id === setId
      );

      if (set) {
        await updateWorkoutSet(
          workout.id,
          setId,
          set.weight,
          set.reps
        );
      }

      await removeWorkoutSet(
        workout.id,
        setId
      );

      setExercises((current) =>
        current.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.filter(
                  (set) => set.id !== setId
                ),
              }
            : exercise
        )
      );
    });
  };

  const removeExercise = (
    exerciseId: string
  ) => {
    runAction(async () => {
      await removeExerciseFromWorkout(
        workout.id,
        exerciseId
      );

      setExercises((current) =>
        current.filter(
          (exercise) => exercise.id !== exerciseId
        )
      );
    });
  };

  const toggleSet = (
    exerciseId: string,
    setId: string
  ) => {
    const currentSet = exercises
      .find(
        (exercise) => exercise.id === exerciseId
      )
      ?.sets.find(
        (set) => set.id === setId
      );

    if (!currentSet) return;

    const completed = !currentSet.completed;

    runAction(async () => {
      await toggleWorkoutSet(workout.id, setId, completed, currentSet.weight, currentSet.reps);
      setExercises((current) => current.map((exercise) => exercise.id === exerciseId
        ? { ...exercise, sets: exercise.sets.map((set) => set.id === setId ? { ...set, completed } : set) }
        : exercise));
    });
  };

  const saveName = () => {
    if (
      name.trim() &&
      name.trim() !== workout.name
    ) {
      runAction(() =>
        updateWorkoutName(workout.id, name), false, false
      );
    }
  };

  const handleFinish = () => {
    runAction(async () => {
      await Promise.all(
        exercises.map((exercise) =>
          persistExerciseSets(exercise)
        )
      );

      if (name.trim()) {
        await updateWorkoutName(
          workout.id,
          name
        );
      }

      await finishWorkout(workout.id);

    },
    false
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/workouts"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
      >
        <ArrowLeft size={16} />
        {t("Back to workouts", "Vissza az edzésekhez")}
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lime-400">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            {t("Workout in progress", "Folyamatban lévő edzés")}
          </div>

          <input
            disabled={isPending}
            aria-label={t("Workout name", "Edzés neve")}
            value={name}
            maxLength={80}
            onChange={(event) =>
              setName(event.target.value)
            }
            onBlur={saveName}
            className="mt-2 w-full max-w-xl border-b border-transparent bg-transparent text-2xl font-bold text-white outline-none focus:border-lime-400 sm:text-3xl"
          />

          <p className="mt-1 text-sm text-zinc-500">
            {t("Record your sets and track your progress.", "Rögzítsd a szetteket, és kövesd a fejlődésed.")} · {formatTime(seconds)}
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-3 sm:p-4">
          <Dumbbell
            size={18}
            className="text-lime-400"
          />

          <p className="mt-3 text-xl font-bold text-white">
            {exercises.length}
          </p>

          <p className="text-xs text-zinc-500">
            {t("Exercises", "Gyakorlatok")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-3 sm:p-4">
          <Flag
            size={18}
            className="text-lime-400"
          />

          <p className="mt-3 text-xl font-bold text-white">
            {completedSets}/{totalSets}
          </p>

          <p className="text-xs text-zinc-500">
            {t("Completed sets", "Teljesített szettek")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-3 sm:p-4">
          <Trophy
            size={18}
            className="text-lime-400"
          />

          <p className="mt-3 text-xl font-bold text-white">
            {totalVolume.toLocaleString(locale)}
          </p>

          <p className="text-xs text-zinc-500">
            {t("Volume (kg)", "Megmozgatott súly (kg)")}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
        <div className="mb-3 flex justify-between text-xs">
          <span className="text-zinc-400">
            {t("Workout completion", "Edzés teljesítése")}
          </span>

          <span className="text-lime-400">
            {completion}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-lime-400 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="space-y-5">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            disabled={isPending}
            onUpdateSet={updateSetLocally}
            onSaveSet={saveSet}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onToggleSet={toggleSet}
            onRemoveExercise={removeExercise}
          />
        ))}
      </div>

      <ExerciseSelector
        exercises={availableExercises}
        existingIds={exercises.map(
          (exercise) => exercise.exerciseId
        )}
        onSelect={addExercise}
        disabled={isPending}
      />

      <div className="bottom-20 z-20 rounded-2xl border border-zinc-800 bg-[#111113]/95 p-4 backdrop-blur sm:bottom-4">
        <button
          type="button"
          onClick={handleFinish}
          disabled={
            completedSets === 0 || isPending
          }
          className="w-full rounded-xl bg-lime-400 py-4 text-sm font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? t("Saving...", "Mentés...")
            : t("Finish workout", "Edzés befejezése")}
        </button>

        <p className="mt-2 text-center text-xs text-zinc-500">
          {t("Complete at least one set to finish your workout.", "Az edzés befejezéséhez teljesíts legalább egy szettet.")}
        </p>
      </div>
    </div>
  );
}
