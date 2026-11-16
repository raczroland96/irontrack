import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlanEditor from "@/components/plans/plan-editor";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  const [plan, exercises] = await Promise.all([
    id === "new" ? Promise.resolve(null) : prisma.workoutPlan.findFirst({
      where: { id, userId: session.user.id },
      include: { exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { setNumber: "asc" } } } } },
    }),
    prisma.exercise.findMany({ orderBy: [{ muscleGroup: "asc" }, { name: "asc" }], select: { id: true, name: true, muscleGroup: true } }),
  ]);
  if (id !== "new" && !plan) notFound();
  return <PlanEditor planId={plan?.id ?? null} initial={plan ? { name: plan.name, exercises: plan.exercises.map((exercise) => ({ exerciseId: exercise.exerciseId, sets: exercise.sets.map((set) => ({ weight: Number(set.weightKg), reps: set.reps })) })) } : { name: "", exercises: [] }} exercises={exercises} />;
}
