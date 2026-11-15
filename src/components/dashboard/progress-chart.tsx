
"use client";

import { useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Exercise {
  id: string;
  name: string;
}

interface ProgressPoint {
  exerciseId: string;
  date: string;
  weight: number;
  reps: number;
}

export default function ProgressChart({
  exercises = [],
  data = [],
}: {
  exercises?: Exercise[];
  data?: ProgressPoint[];
}) {
  const [selectedExercise, setSelectedExercise] =
    useState<string | null>(exercises[0]?.id ?? null);

  const exerciseData = useMemo(() => {
    return data
      .filter(
        (point) => point.exerciseId === selectedExercise
      )
      .map((point) => ({
        ...point,
        timestamp: new Date(point.date).getTime(),
      }))
      .filter((point) => Number.isFinite(point.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, selectedExercise]);

  const selectedName = exercises.find(
    (exercise) => exercise.id === selectedExercise
  )?.name;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-semibold text-white">
          Strength progression
        </h3>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">

        {/* Exercise selector */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Exercises
          </h4>

          <div className="max-h-[120px] space-y-1 overflow-y-auto pr-2">
            {exercises.map((exercise) => {
              const active =
                selectedExercise === exercise.id;

              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() =>
                    setSelectedExercise(exercise.id)
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-lime-400/10 text-lime-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  {exercise.name}
                </button>
              );
            })}

            {exercises.length === 0 && (
              <p className="text-sm text-zinc-500">
                No exercises found.
              </p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="min-w-0">
          <div className="mb-5">
            <h4 className="font-medium text-white">
              {selectedName ?? "Select an exercise"}
            </h4>

            <p className="mt-1 text-xs text-zinc-500">
              {exerciseData.length} recorded sets
            </p>
          </div>

          {selectedExercise === null ? (
            <div className="flex h-64 items-center justify-center rounded-xl bg-zinc-900/50 px-6 text-center text-sm text-zinc-500">
              Select an exercise to see your progress.
            </div>
          ) : exerciseData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl bg-zinc-900/50 px-6 text-center text-sm text-zinc-500">
              No completed sets recorded for this exercise.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={exerciseData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="#27272a"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(
                        "en",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )
                    }
                    stroke="#71717a"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke="#71717a"
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => `${value} kg`}
                  />

                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(Number(value)).toLocaleString(
                        "en",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      )
                    }
                    formatter={(value, name) => {
                      if (name === "weight") {
                        return [`${value} kg`, "Weight"];
                      }

                      return [value, "Reps"];
                    }}
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    labelStyle={{
                      color: "#a1a1aa",
                      marginBottom: "6px",
                    }}
                  />

                  <Line
                    type="linear"
                    dataKey="weight"
                    name="weight"
                    stroke="#a3e635"
                    strokeWidth={2}
                    dot={{
                      fill: "#a3e635",
                      strokeWidth: 0,
                      r: 4,
                    }}
                    activeDot={{ r: 7 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
