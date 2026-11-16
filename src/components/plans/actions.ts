"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n-server";
import { validatePlan } from "./validation";

async function context() {
  const [{ t }, session] = await Promise.all([
    getI18n(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  if (!session?.user?.id) throw new Error(t("Please sign in.", "Jelentkezz be."));
  return { userId: session.user.id, t };
}

export async function savePlan(planId: string | null, input: unknown) {
  const { userId, t } = await context();
  if (planId !== null && (typeof planId !== "string" || !planId)) throw new Error(t("Plan not found.", "Az edzésterv nem található."));
  const draft = validatePlan(input, t);
  const id = await prisma.$transaction(async (tx) => {
    const count = await tx.exercise.count({ where: { id: { in: draft.exercises.map((exercise) => exercise.exerciseId) } } });
    if (count !== draft.exercises.length) throw new Error(t("An exercise is no longer available. Reload the page.", "Egy gyakorlat már nem érhető el. Töltsd újra az oldalt."));
    const exercises = {
      create: draft.exercises.map((exercise, order) => ({
        exerciseId: exercise.exerciseId,
        order,
        sets: { create: exercise.sets.map((set, index) => ({ setNumber: index + 1, weightKg: set.weight, reps: set.reps })) },
      })),
    };
    if (!planId) {
      const plan = await tx.workoutPlan.create({ data: { userId, name: draft.name, exercises }, select: { id: true } });
      return plan.id;
    }
    // Scope the write itself to the current user, not only a previous lookup.
    const result = await tx.workoutPlan.updateMany({ where: { id: planId, userId }, data: { name: draft.name, updatedAt: new Date() } });
    if (result.count !== 1) throw new Error(t("Plan not found.", "Az edzésterv nem található."));
    await tx.planExercise.deleteMany({ where: { planId } });
    await tx.workoutPlan.update({ where: { id: planId, userId }, data: { exercises } });
    return planId;
  });
  revalidatePath("/plans");
  revalidatePath(`/plans/${id}`);
  return { id };
}

export async function deletePlan(planId: string) {
  const { userId, t } = await context();
  if (typeof planId !== "string" || !planId) throw new Error(t("Plan not found.", "Az edzésterv nem található."));
  const result = await prisma.workoutPlan.deleteMany({ where: { id: planId, userId } });
  if (result.count !== 1) throw new Error(t("Plan not found.", "Az edzésterv nem található."));
  revalidatePath("/plans");
}

export async function startPlan(planId: string) {
  const { userId, t } = await context();
  if (typeof planId !== "string" || !planId) throw new Error(t("Plan not found.", "Az edzésterv nem található."));
  try {
    await prisma.$transaction(async (tx) => {
      const plan = await tx.workoutPlan.findFirst({
        where: { id: planId, userId },
        include: { exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { setNumber: "asc" } } } } },
      });
      if (!plan) throw new Error(t("Plan not found.", "Az edzésterv nem található."));
      const active = await tx.workout.findFirst({ where: { userId, finishedAt: null }, select: { id: true } });
      if (active) throw new Error(t("Finish your active workout before starting a plan.", "Fejezd be a folyamatban lévő edzést, mielőtt tervet indítasz."));
      await tx.workout.create({
        data: {
          userId,
          name: plan.name,
          exercises: { create: plan.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            order: exercise.order,
            sets: { create: exercise.sets.map((set) => ({ setNumber: set.setNumber, weightKg: set.weightKg, reps: set.reps, completed: false })) },
          })) },
        },
      });
    });
  } catch (error) {
    // The partial unique index also protects simultaneous starts from two tabs.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new Error(t("Finish your active workout before starting a plan.", "Fejezd be a folyamatban lévő edzést, mielőtt tervet indítasz."));
    }
    throw error;
  }
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { href: "/workouts/new" };
}
