
"use server";

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in to add exercises.",
    };
  }

  const cleanName = name.trim();
  const cleanMachine = machine.trim();
  const cleanMuscleGroup = muscleGroup.trim();

  if (!cleanName || cleanName.length > 80) {
    return {
      success: false,
      error: "Exercise name must be between 1 and 80 characters.",
    };
  }

  if (!EQUIPMENT_OPTIONS.includes(cleanMachine)) {
    return {
      success: false,
      error: "Please select valid equipment.",
    };
  }

  if (!MUSCLE_GROUP_OPTIONS.includes(cleanMuscleGroup)) {
    return {
      success: false,
      error: "Please select a valid muscle group.",
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
        error: "An exercise with this name already exists.",
      };
    }

    console.error("Failed to create exercise:", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
