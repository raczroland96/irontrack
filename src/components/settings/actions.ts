
"use server";

import { getI18n } from "@/lib/i18n-server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbells",
  "Machine",
  "Free Weights",
  "Bodyweight",
  "Cable",
  "Kettlebell",
  "Resistance Bands",
  "Other",
];

const MUSCLE_GROUP_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Calves",
  "Abs",
  "Full Body",
];

export async function addGlobalExercise(
  name: string,
  machine: string,
  muscleGroup: string
) {
  const { t } = await getI18n();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      error: t("You must be signed in to add exercises.", "Gyakorlat hozzáadásához jelentkezz be."),
    };
  }

  const cleanName = name.trim();
  const cleanMachine = machine.trim();
  const cleanMuscleGroup = muscleGroup.trim();

  if (!cleanName || cleanName.length > 80) {
    return {
      success: false,
      error: t("Exercise name must be between 1 and 80 characters.", "A gyakorlat neve 1–80 karakter hosszú lehet."),
    };
  }

  if (!EQUIPMENT_OPTIONS.includes(cleanMachine)) {
    return {
      success: false,
      error: t("Please select valid equipment.", "Válassz érvényes eszközt."),
    };
  }

  if (!MUSCLE_GROUP_OPTIONS.includes(cleanMuscleGroup)) {
    return {
      success: false,
      error: t("Please select a valid muscle group.", "Válassz érvényes izomcsoportot."),
    };
  }

  try {
    const exercise = await prisma.exercise.create({
      data: {
        name: cleanName,
        machine: cleanMachine,
        muscleGroup: cleanMuscleGroup,
      },
      select: {
        id: true,
        name: true,
        machine: true,
        muscleGroup: true,
      },
    });

    revalidatePath("/settings/exercises");

    return {
      success: true,
      exercise,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: t("An exercise with this name already exists.", "Már létezik ilyen nevű gyakorlat."),
      };
    }

    console.error("Failed to create exercise:", error);

    return {
      success: false,
      error: t("Something went wrong. Please try again.", "Hiba történt. Próbáld újra."),
    };
  }
}
