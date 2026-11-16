import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n-server";
import PlanControls from "@/components/plans/plan-controls";

export default async function PlansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");
  const { t } = await getI18n();
  const [plans, active] = await Promise.all([
    prisma.workoutPlan.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, include: { exercises: { orderBy: { order: "asc" }, include: { exercise: { select: { name: true } }, _count: { select: { sets: true } } } } } }),
    prisma.workout.findFirst({ where: { userId: session.user.id, finishedAt: null }, select: { id: true } }),
  ]);
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="flex items-center gap-3 text-2xl font-bold text-white"><CalendarDays className="text-lime-400" />{t("Workout plans", "Edzéstervek")}</h1><p className="mt-2 text-sm text-zinc-400">{t("Save workouts ahead of time and reuse them whenever you train.", "Mentsd el előre az edzéseidet, és indítsd el őket, amikor edzel.")}</p></div>
      <Link href="/plans/new" className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-3 text-sm font-semibold text-black hover:bg-lime-300"><Plus size={18} />{t("Create plan", "Új edzésterv")}</Link>
    </div>
    {active && <p className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4 text-sm text-zinc-300">{t("You have an active workout. Finish it before starting a plan.", "Van folyamatban lévő edzésed. Fejezd be, mielőtt tervet indítasz.")} <Link href="/workouts/new" className="font-semibold text-lime-400">{t("Continue workout", "Edzés folytatása")}</Link></p>}
    {plans.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-10 text-center"><h2 className="font-semibold text-white">{t("No saved plans yet", "Még nincs mentett edzésterved")}</h2><p className="mt-2 text-sm text-zinc-400">{t("Create a routine with exercises, target weights and reps. Completed sets are tracked separately each time you start it.", "Állíts össze gyakorlatokat, célsúlyokat és ismétléseket. Az elvégzett szetteket minden indításkor külön követheted.")}</p></div> : <div className="grid gap-4 md:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="space-y-4 rounded-2xl border border-zinc-800 bg-[#111113] p-5">
      <div><h2 className="text-lg font-semibold text-white">{plan.name}</h2><p className="mt-1 text-xs text-zinc-500">{plan.exercises.length} {t("exercises", "gyakorlat")} · {plan.exercises.reduce((sum, exercise) => sum + exercise._count.sets, 0)} {t("sets", "szett")}</p></div>
      <ul className="space-y-1 text-sm text-zinc-400">{plan.exercises.map((exercise) => <li key={exercise.id}>{exercise.exercise.name} <span className="text-zinc-500">· {exercise._count.sets} {t("sets", "szett")}</span></li>)}</ul>
      <PlanControls planId={plan.id} active={Boolean(active)} />
    </article>)}</div>}
  </div>;
}
