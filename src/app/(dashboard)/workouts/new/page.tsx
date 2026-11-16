import { headers } from "next/headers";
import { redirect } from "next/navigation";

import WorkoutEditor from "@/components/workouts/workout-editor";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n-server";

export const instant = false

export default async function NewWorkoutPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { t, locale } = await getI18n();

  // Reuse an unfinished workout so refreshing or returning
  // to this route does not create duplicate draft sessions.
  const workout = await prisma.workout.findFirst({
    where: {
      userId,
      finishedAt: null,
    },
    orderBy: {
      startedAt: "desc",
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          sets: {
            orderBy: { setNumber: "asc" },
          },
        },
      },
    },
  });

  if (!workout) {
    redirect("/workouts");
  }

  const exerciseLibrary = await prisma.exercise.findMany({
    orderBy: [
      { muscleGroup: "asc" },
      { name: "asc" },
    ],
  });

  const previousEntries = await prisma.workoutExercise.findMany({
    where: {
      workout: {
        userId,
        finishedAt: { not: null },
      },
      sets: {
        some: { completed: true },
      },
    },
    orderBy: {
      workout: { startedAt: "desc" },
    },
    include: {
      exercise: {
        select: { id: true },
      },
      sets: {
        where: { completed: true },
        orderBy: { weightKg: "desc" },
        take: 1,
      },
    },
  });

  const previousByExercise = new Map<string, string>();

  for (const entry of previousEntries) {
    if (previousByExercise.has(entry.exercise.id)) {
      continue;
    }

    const bestSet = entry.sets[0];

    if (bestSet) {
      previousByExercise.set(
        entry.exercise.id,
        `${Number(bestSet.weightKg).toLocaleString(locale)} kg × ${bestSet.reps} ${t("reps", "ismétlés")}`
      );
    }
  }

  const exercises = exerciseLibrary.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup ?? "",
    machine: exercise.machine ?? "",
    previous:
      previousByExercise.get(exercise.id) ??
      t("No previous performance", "Még nincs korábbi teljesítmény"),
  }));

  return (
    <WorkoutEditor
      workout={{
        id: workout.id,
        name: workout.name,
        startedAt: workout.startedAt.toISOString(),
	finishedAt: workout.finishedAt?.toISOString() ?? null,
        exercises: workout.exercises.map((item) => ({
          id: item.id,
          exerciseId: item.exerciseId,
          name: item.exercise.name,
          muscleGroup: item.exercise.muscleGroup ?? "",
          machine: item.exercise.machine ?? "",
          previous:
            previousByExercise.get(item.exerciseId) ??
            t("No previous performance", "Még nincs korábbi teljesítmény"),
          sets: item.sets.map((set) => ({
            id: set.id,
            weight: Number(set.weightKg),
            reps: set.reps,
            completed: set.completed,
          })),
        })),
      }}
      availableExercises={exercises}
    />
  );
}
