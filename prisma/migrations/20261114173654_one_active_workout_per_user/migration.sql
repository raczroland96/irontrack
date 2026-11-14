-- Prevent users from having multiple unfinished workouts.
CREATE UNIQUE INDEX "one_active_workout_per_user"
ON "Workout" ("userId")
WHERE "finishedAt" IS NULL;
