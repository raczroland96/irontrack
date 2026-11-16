"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n-server";
import type { Prisma } from "@/generated/prisma/client";

type Translate = (english: string, hungarian: string) => string;

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    const { t } = await getI18n();
    throw new Error(t("You must be signed in to manage workouts.", "Az edzések kezeléséhez jelentkezz be."));
  }
  return session.user.id;
}

// Serialize edits and finishing on the same workout. A completed workout is immutable,
// including when another browser tab finishes while a request is in flight.
async function editWorkout<T>(
  workoutId: string,
  action: (tx: Prisma.TransactionClient, t: Translate) => Promise<T>,
) {
  const userId = await requireUserId();
  const { t } = await getI18n();
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Workout"
      WHERE "id" = ${workoutId} AND "userId" = ${userId} AND "finishedAt" IS NULL
      FOR UPDATE
    `;
    if (!rows.length) {
      throw new Error(t("Workout not found or it has already been completed.", "Az edzés nem található, vagy már befejezted."));
    }
    return action(tx, t);
  });
}

function validateSet(weightKg: number, reps: number, t: Translate) {
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 10000) {
    throw new Error(t("Enter a valid weight between 0 and 10,000 kg.", "Adj meg érvényes súlyt 0 és 10 000 kg között."));
  }
  if (!Number.isInteger(reps) || reps < 0 || reps > 10000) {
    throw new Error(t("Enter a whole number of reps between 0 and 10,000.", "Az ismétlésszám 0 és 10 000 közötti egész szám legyen."));
  }
}

export async function updateWorkoutName(workoutId: string, name: string) {
  return editWorkout(workoutId, async (tx, t) => {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      throw new Error(t("Workout name must be between 1 and 80 characters.", "Az edzés neve 1–80 karakter hosszú legyen."));
    }
    await tx.workout.update({ where: { id: workoutId }, data: { name: name.trim() } });
  });
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  return editWorkout(workoutId, async (tx, t) => {
    const exercise = await tx.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new Error(t("Exercise not found.", "A gyakorlat nem található."));
    const existing = await tx.workoutExercise.findFirst({ where: { workoutId, exerciseId } });
    if (existing) throw new Error(t("This exercise is already in the workout.", "Ez a gyakorlat már szerepel az edzésben."));
    const last = await tx.workoutExercise.aggregate({ where: { workoutId }, _max: { order: true } });
    const created = await tx.workoutExercise.create({
      data: { workoutId, exerciseId, order: (last._max.order ?? -1) + 1,
        sets: { create: { setNumber: 1, weightKg: 0, reps: 0 } } },
      include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
    });
    return { ...created, sets: created.sets.map((set) => ({ ...set, weightKg: Number(set.weightKg) })) };
  });
}

export async function updateWorkoutSet(workoutId: string, setId: string, weightKg: number, reps: number) {
  return editWorkout(workoutId, async (tx, t) => {
    validateSet(weightKg, reps, t);
    const result = await tx.workoutSet.updateMany({
      where: { id: setId, workoutExercise: { workoutId } }, data: { weightKg, reps },
    });
    if (result.count !== 1) throw new Error(t("Set not found.", "A szett nem található."));
  });
}

// Weight/reps and completion are saved atomically to avoid a completed indicator
// for values that were never persisted.
export async function toggleWorkoutSet(workoutId: string, setId: string, completed: boolean, weightKg?: number, reps?: number) {
  return editWorkout(workoutId, async (tx, t) => {
    if (typeof completed !== "boolean") throw new Error(t("Invalid completion status.", "Érvénytelen teljesítési állapot."));
    if (weightKg !== undefined || reps !== undefined) validateSet(weightKg as number, reps as number, t);
    const result = await tx.workoutSet.updateMany({
      where: { id: setId, workoutExercise: { workoutId } },
      data: { completed, ...(weightKg !== undefined && reps !== undefined ? { weightKg, reps } : {}) },
    });
    if (result.count !== 1) throw new Error(t("Set not found.", "A szett nem található."));
  });
}

export async function addSetToExercise(workoutId: string, workoutExerciseId: string) {
  return editWorkout(workoutId, async (tx, t) => {
    const exercise = await tx.workoutExercise.findFirst({
      where: { id: workoutExerciseId, workoutId },
      include: { sets: { orderBy: { setNumber: "desc" }, take: 1 } },
    });
    if (!exercise) throw new Error(t("Workout exercise not found.", "A gyakorlat nem található az edzésben."));
    const lastSet = exercise.sets[0];
    const created = await tx.workoutSet.create({ data: {
      workoutExerciseId, setNumber: (lastSet?.setNumber ?? 0) + 1,
      weightKg: lastSet?.weightKg ?? 0, reps: lastSet?.reps ?? 0,
    } });
    return { ...created, weightKg: Number(created.weightKg) };
  });
}

export async function removeWorkoutSet(workoutId: string, setId: string) {
  return editWorkout(workoutId, async (tx, t) => {
    const result = await tx.workoutSet.deleteMany({ where: { id: setId, workoutExercise: { workoutId } } });
    if (result.count !== 1) throw new Error(t("Set not found.", "A szett nem található."));
  });
}

export async function removeExerciseFromWorkout(workoutId: string, workoutExerciseId: string) {
  return editWorkout(workoutId, async (tx, t) => {
    const result = await tx.workoutExercise.deleteMany({ where: { id: workoutExerciseId, workoutId } });
    if (result.count !== 1) throw new Error(t("Exercise not found in this workout.", "A gyakorlat nem található az edzésben."));
  });
}

export async function startWorkout() {
  const userId = await requireUserId();
  const { t } = await getI18n();
  const existing = await prisma.workout.findFirst({ where: { userId, finishedAt: null }, select: { id: true } });
  if (!existing) {
    try {
      await prisma.workout.create({ data: { userId, name: t("Today's workout", "Mai edzés") } });
    } catch (error) {
      // The partial unique index handles simultaneous starts in separate tabs.
      const active = await prisma.workout.findFirst({ where: { userId, finishedAt: null }, select: { id: true } });
      if (!active) throw error;
    }
  }
  redirect("/workouts/new");
}

export async function finishWorkout(workoutId: string) {
  await editWorkout(workoutId, async (tx, t) => {
    const completedSets = await tx.workoutSet.count({
      where: { completed: true, workoutExercise: { workoutId } },
    });
    if (!completedSets) {
      throw new Error(t("Complete at least one set before finishing your workout.", "Az edzés befejezéséhez teljesíts legalább egy szettet."));
    }
    await tx.workout.update({ where: { id: workoutId }, data: { finishedAt: new Date() } });
  });
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  redirect(`/workouts/${workoutId}`);
}
