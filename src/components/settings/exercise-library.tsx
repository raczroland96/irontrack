
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  Plus,
  Dumbbell,
  X,
  Check,
  Loader2,
} from "lucide-react";

import { addGlobalExercise } from "@/components/settings/actions";

type Exercise = {
  id: string;
  name: string;
  machine: string | null;
  muscleGroup: string | null;
};

const muscleGroups = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Calves",
  "Abs",
  "Full Body",
];

const equipmentOptions = [
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

const groupOptions = muscleGroups.filter(
  (group) => group !== "All"
);

export default function ExerciseLibrary({
  exercises: initialExercises,
}: {
  exercises: Exercise[];
}) {
  const router = useRouter();

  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [machine, setMachine] = useState("Machine");
  const [muscleGroup, setMuscleGroup] = useState("Chest");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        (exercise.machine ?? "").toLowerCase().includes(query) ||
        (exercise.muscleGroup ?? "").toLowerCase().includes(query);

      const matchesGroup =
        selectedGroup === "All" ||
        exercise.muscleGroup === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [exercises, search, selectedGroup]);

  function handleAddExercise(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setError("");
  setSuccess("");

  startTransition(async () => {
    const result = await addGlobalExercise(name, machine, muscleGroup);

    if (!result.success) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    if (!result.exercise) {
      setError("The exercise was created, but its details could not be loaded.");
      return;
    }

    const newExercise: Exercise = result.exercise;

    setExercises((current) =>
      [...current, newExercise].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    setName("");
    setMachine("Machine");
    setMuscleGroup("Chest");
    setShowForm(false);
    setSearch("");
    setSelectedGroup("All");

    setSuccess(
      `${newExercise.name} was added to the shared exercise library.`
    );

    router.refresh();
  });
}

  return (
    <div className="space-y-6">
      {/* Library header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-white">
              {exercises.length}
            </span>{" "}
            exercises available to everyone
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setSuccess("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-300"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}

          {showForm ? "Cancel" : "Add exercise"}
        </button>
      </div>

      {/* Add exercise form */}
      {showForm && (
        <section className="rounded-2xl border border-lime-400/30 bg-[#111113] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-white">
              Add a new exercise
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your exercise will become available to all users.
            </p>
          </div>

          <form
            onSubmit={handleAddExercise}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="exercise-name"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Exercise name
              </label>

              <input
                id="exercise-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                maxLength={80}
                required
                placeholder="e.g. Incline Chest Press"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-400"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="exercise-equipment"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Equipment
                </label>

                <select
                  id="exercise-equipment"
                  value={machine}
                  onChange={(event) =>
                    setMachine(event.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400"
                >
                  {equipmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="exercise-muscle"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Muscle group
                </label>

                <select
                  id="exercise-muscle"
                  value={muscleGroup}
                  onChange={(event) =>
                    setMuscleGroup(event.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400"
                >
                  {groupOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={17} />
                )}

                {isPending ? "Adding..." : "Add exercise"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-400">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search exercises, equipment or muscle groups..."
          className="w-full rounded-xl border border-zinc-800 bg-[#111113] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-400"
        />
      </div>

      {/* Muscle group filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {muscleGroups.map((group) => {
          const active = selectedGroup === group;

          return (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                active
                  ? "bg-lime-400 text-black"
                  : "border border-zinc-800 bg-[#111113] text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              {group}
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113]">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="font-semibold text-white">
            All exercises
          </h2>

          <span className="text-xs text-zinc-500">
            {filteredExercises.length} results
          </span>
        </div>

        {filteredExercises.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Dumbbell
              size={30}
              className="mx-auto text-zinc-600"
            />

            <p className="mt-3 font-medium text-white">
              No exercises found
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Try another search or add a new exercise.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-900/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                  <Dumbbell
                    size={19}
                    className="text-lime-400"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {exercise.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {exercise.machine ?? "Equipment not specified"}
                    {" · "}
                    {exercise.muscleGroup ?? "Uncategorized"}
                  </p>
                </div>

                <span className="hidden shrink-0 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500 sm:inline-flex">
                  Shared
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-zinc-600">
        Exercises added to this library are shared with all IRONTRACK users.
      </p>
    </div>
  );
}
