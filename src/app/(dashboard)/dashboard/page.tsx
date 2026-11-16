import Link from "next/link";
import { getI18n } from "@/lib/i18n-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Dumbbell,
  Trophy,
  CalendarDays,
} from "lucide-react";

import StatCard from "@/components/dashboard/stat-card";
import RecentWorkouts from "@/components/dashboard/recent-workouts";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false

export default async function DashboardPage() {
  const { locale, t } = await getI18n();
  const numberLocale = locale === "hu" ? "hu-HU" : "en-US";
  const formatDuration = (startedAt: Date, finishedAt: Date | null) => {
    if (!finishedAt) return t("In progress", "Folyamatban");
    const minutes = Math.max(1, Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000));
    return `${minutes.toLocaleString(numberLocale)} ${t("min", "perc")}`;
  };
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);

  startOfWeek.setDate(
    startOfWeek.getDate() -
      ((startOfWeek.getDay() + 6) % 7)
  );

  const [
    totalWorkouts,
    thisWeek,
    completedSets,
    recent,
  ] = await Promise.all([
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

    prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: {
          workout: {
            userId,
            finishedAt: { not: null },
          },
        },
      },
      select: {
        weightKg: true,
        reps: true,
        workoutExercise: {
          select: {
            exercise: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),

    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: {
        _count: {
          select: { exercises: true },
        },
      },
    }),

  ]);

  const totalVolume = completedSets.reduce(
    (sum, set) =>
      sum + Number(set.weightKg) * set.reps,
    0
  );

  const recentWorkouts = recent.map((workout) => ({
    id: workout.id,
    name: workout.name,
    exercises: workout._count.exercises,
    duration: formatDuration(
      workout.startedAt,
      workout.finishedAt
    ),
    date: new Intl.DateTimeFormat(numberLocale, {
      month: "short",
      day: "numeric",
    }).format(workout.startedAt),
    inProgress: !workout.finishedAt,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("Dashboard", "Áttekintés")}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {t("Track your progress and keep getting stronger.", "Kövesd a fejlődésed, és légy egyre erősebb.")}
          </p>
        </div>

        <Link
          href="/workouts"
          className="shrink-0 rounded-xl bg-lime-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-300"
        >
          {t("Go to workouts", "Edzések megnyitása")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("Total workouts", "Összes edzés")}
          value={totalWorkouts.toLocaleString(numberLocale)}
          description={t("Completed sessions", "Befejezett edzések")}
          icon={Dumbbell}
        />

        <StatCard
          title={t("This week", "Ezen a héten")}
          value={thisWeek.toLocaleString(numberLocale)}
          description={t("Training sessions", "Edzések száma")}
          icon={CalendarDays}
        />

        <StatCard
          title={t("Completed sets", "Elvégzett szettek")}
          value={completedSets.length.toLocaleString(numberLocale)}
          description={t("Across completed workouts", "A befejezett edzéseken")}
          icon={Dumbbell}
        />

        <StatCard
          title={t("Total volume", "Összes megmozgatott súly")}
          value={`${totalVolume.toLocaleString(numberLocale)} kg`}
          description={t("Weight × repetitions", "Súly × ismétlés")}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentWorkouts workouts={recentWorkouts} />
      </div>
    </div>
  );
}
