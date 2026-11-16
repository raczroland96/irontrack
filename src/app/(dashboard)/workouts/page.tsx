import Link from "next/link";
import { getI18n } from "@/lib/i18n-server";

import { startWorkout } from "@/components/workouts/actions";
import { headers } from "next/headers";
import {
  CalendarDays,
  Clock,
  Dumbbell,
  Plus,
  Trophy,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function WorkoutsPage() {
  const { locale, t } = await getI18n();
  const formatDate = (date: Date) => new Intl.DateTimeFormat(locale === "hu" ? "hu-HU" : "en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Budapest" }).format(date);
  const formatDuration = (start: Date, end: Date | null) => end ? `${Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))} ${t("min", "perc")}` : t("In progress", "Folyamatban");
  const formatNumber = (value: number) => value.toLocaleString(locale === "hu" ? "hu-HU" : "en-GB");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);

  const day = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - day);

  const [
    workouts,
    totalWorkouts,
    thisWeek,
    personalRecordSets,
  ] = await Promise.all([
    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        _count: {
          select: { exercises: true },
        },
        exercises: {
          include: {
            sets: { select: { completed: true } },
          },
        },
      },
    }),

    prisma.workout.count({
      where: {
        userId,
        finishedAt: { not: null },
      },
    }),

    prisma.workout.count({
      where: {
        userId,
        finishedAt: { not: null },
        startedAt: { gte: startOfWeek },
      },
    }),

    prisma.workoutSet.count({
      where: {
        completed: true,
        workoutExercise: {
          workout: {
            userId,
            finishedAt: { not: null },
          },
        },
      },
    }),
  ]);

  const activeWorkout = workouts.find(
    (workout) => !workout.finishedAt
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("Workouts", "Edzések")}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {t("Your training history, all in one place.", "Az edzéstörténeted egy helyen.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
        <Link href="/plans" className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white hover:border-lime-400">{t("Saved plans", "Mentett edzéstervek")}</Link>
        <form action={startWorkout}>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-300"
          >
          <Plus size={18} />
            {activeWorkout
            ? t("Continue workout", "Edzés folytatása")
            : t("Start workout", "Edzés indítása")}
          </button>
        </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5">
          <Dumbbell
            className="text-lime-400"
            size={22}
          />

          <p className="mt-4 text-2xl font-bold text-white">
            {formatNumber(totalWorkouts)}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {t("Completed workouts", "Befejezett edzések")}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5">
          <CalendarDays
            className="text-lime-400"
            size={22}
          />

          <p className="mt-4 text-2xl font-bold text-white">
            {formatNumber(thisWeek)}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {t("This week", "Ezen a héten")}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5">
          <Trophy
            className="text-lime-400"
            size={22}
          />

          <p className="mt-4 text-2xl font-bold text-white">
            {formatNumber(personalRecordSets)}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {t("Completed sets recorded", "Rögzített teljesített szettek")}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-[#111113] p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-white">
            {t("Workout history", "Edzéstörténet")}
          </h2>
        </div>

        {workouts.length === 0 ? (
          <div className="rounded-xl bg-zinc-900 px-5 py-12 text-center">
            <Dumbbell
              className="mx-auto text-zinc-600"
              size={28}
            />

            <p className="mt-3 font-medium text-white">
              {t("No workouts yet", "Még nincs edzésed")}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {t("Your completed training sessions will appear here.", "Itt jelennek meg a befejezett edzéseid.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => {
              const setCount = workout.exercises.reduce(
                (sum, item) => sum + item.sets.length,
                0
              );

              const completedCount = workout.exercises.reduce((sum, item) => sum + item.sets.filter((set) => set.completed).length, 0);
              return (
                <Link
                  href={workout.finishedAt ? `/workouts/${workout.id}` : "/workouts/new"}
                  key={workout.id}
                  className="flex items-center gap-3 rounded-xl bg-zinc-900 p-4 transition hover:bg-zinc-800 focus-visible:outline-lime-400 sm:gap-4"
                >
                  <div className="rounded-xl bg-zinc-800 p-3">
                    <Dumbbell
                      size={20}
                      className="text-lime-400"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {workout.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {workout._count.exercises} {t("exercises", "gyakorlat")} ·{" "}
                      {completedCount}/{setCount} {t("sets completed", "teljesített szett")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-zinc-300">
                      {formatDate(workout.startedAt)}
                    </p>

                    <p
                      className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                        workout.finishedAt
                          ? "text-zinc-500"
                          : "text-lime-400"
                      }`}
                    >
                      <Clock size={12} />
                      {formatDuration(
                        workout.startedAt,
                        workout.finishedAt
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
