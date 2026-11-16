
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ExerciseLibrary from "@/components/settings/exercise-library";

export default async function ExercisesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) return null;

  const exercises = await prisma.exercise.findMany({
    orderBy: [
      { muscleGroup: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      machine: true,
      muscleGroup: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Exercise Library
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Browse all available exercises or contribute a new exercise
          to the shared library.
        </p>
      </div>

      <ExerciseLibrary exercises={exercises} />
    </div>
  );
}
