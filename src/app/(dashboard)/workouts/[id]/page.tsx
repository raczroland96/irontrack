import { exerciseLabel } from "@/lib/exercise-labels";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Circle, Clock, Dumbbell, Trophy } from "lucide-react";

import { auth } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function WorkoutHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const workout = await prisma.workout.findFirst({
    where: { id, userId: session.user.id, finishedAt: { not: null } },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
      },
    },
  });
  if (!workout || !workout.finishedAt) notFound();

  const { locale, t } = await getI18n();
  const language = locale === "hu" ? "hu-HU" : "en-GB";
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
  const dateTime = new Intl.DateTimeFormat(language, { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Budapest" });
  const minutes = Math.max(1, Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000));
  const sets = workout.exercises.flatMap((exercise) => exercise.sets);
  const completed = sets.filter((set) => set.completed);
  const volume = completed.reduce((sum, set) => sum + Number(set.weightKg) * set.reps, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/workouts" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft size={16} /> {t("Back to workout history", "Vissza az edzéstörténethez")}
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-lime-400">{t("Completed workout", "Befejezett edzés")}</p>
        <h1 className="mt-2 break-words text-3xl font-bold text-white">{workout.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {dateTime.format(workout.startedAt)} · {t("Finished", "Befejezve")}: {dateTime.format(workout.finishedAt)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("Exercises", "Gyakorlatok"), value: number.format(workout.exercises.length), icon: Dumbbell },
          { label: t("Duration", "Időtartam"), value: `${number.format(minutes)} ${t("min", "perc")}`, icon: Clock },
          { label: t("Completed sets", "Teljesített szettek"), value: `${completed.length}/${sets.length}`, icon: Check },
          { label: t("Volume", "Összsúly"), value: `${number.format(volume)} kg`, icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
            <Icon className="text-lime-400" size={18} />
            <p className="mt-3 text-xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-400">{t("Volume includes completed sets only. This is a saved record of your session.", "Az összsúly csak a teljesített szetteket tartalmazza. Ez az edzésed mentett naplója.")}</p>

      {workout.exercises.map((entry) => (
        <section key={entry.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113]">
          <div className="border-b border-zinc-800 p-5">
            <h2 className="font-semibold text-white">{entry.exercise.name}</h2>
            <p className="mt-1 text-xs text-zinc-400">{[entry.exercise.muscleGroup, entry.exercise.machine].filter(Boolean).map((value) => exerciseLabel(value ?? "", locale)).join(" · ")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-xs text-zinc-400">
                <tr>
                  <th className="p-4">{t("Set", "Szett")}</th>
                  <th className="p-4">{t("Weight (kg)", "Súly (kg)")}</th>
                  <th className="p-4">{t("Reps", "Ismétlés")}</th>
                  <th className="p-4">{t("Status", "Állapot")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {entry.sets.map((set, index) => (
                  <tr key={set.id}>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{number.format(Number(set.weightKg))}</td>
                    <td className="p-4">{number.format(set.reps)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 ${set.completed ? "text-lime-400" : "text-zinc-500"}`}>
                        {set.completed ? <Check size={16} /> : <Circle size={14} />}
                        {set.completed ? t("Completed", "Teljesítve") : t("Not completed", "Nem teljesítve")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entry.sets.length === 0 && <p className="p-5 text-sm text-zinc-500">{t("No sets recorded.", "Nincs rögzített szett.")}</p>}
          </div>
        </section>
      ))}
      {workout.exercises.length === 0 && <p className="text-sm text-zinc-400">{t("No exercises recorded.", "Nincs rögzített gyakorlat.")}</p>}
    </div>
  );
}
