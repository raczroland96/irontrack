
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import ProgressChart from "@/components/dashboard/progress-chart";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function ProgressPage() {
  // Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch exercises and completed workout sets
  const [exercises, history] = await Promise.all([
    prisma.exercise.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: {
          workout: {
            userId,
            finishedAt: {
              not: null,
            },
          },
        },
      },
      orderBy: {
        workoutExercise: {
          workout: {
            startedAt: "asc",
          },
        },
      },
      select: {
        id: true,
        weightKg: true,
        reps: true,
        workoutExercise: {
          select: {
            exerciseId: true,
            workout: {
              select: {
                startedAt: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Transform database records into chart data
  const progressData = history
    .filter((set) => {
      return (
        set.workoutExercise?.exerciseId &&
        set.workoutExercise?.workout?.startedAt
      );
    })
    .map((set) => ({
      exerciseId: set.workoutExercise.exerciseId,
      date: set.workoutExercise.workout.startedAt.toISOString(),
      weight: Number(set.weightKg),
      reps: set.reps,
    }))
    .filter((point) => Number.isFinite(point.weight));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Progress chart */}
      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-4">
          <ProgressChart
            exercises={exercises}
            data={progressData}
          />
        </div>
      </div>

    </div>
  );
}
