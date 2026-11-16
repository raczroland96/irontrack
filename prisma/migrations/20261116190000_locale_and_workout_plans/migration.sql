-- Language is persisted on each account. Existing users retain English.
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "User" ADD CONSTRAINT "User_locale_check" CHECK ("locale" IN ('en', 'hu'));

CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanExercise" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "PlanExercise_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanSet" (
    "id" TEXT NOT NULL,
    "planExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weightKg" DECIMAL(7,2) NOT NULL,
    "reps" INTEGER NOT NULL,
    CONSTRAINT "PlanSet_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkoutPlan_userId_updatedAt_idx" ON "WorkoutPlan"("userId", "updatedAt");
CREATE UNIQUE INDEX "PlanExercise_planId_order_key" ON "PlanExercise"("planId", "order");
CREATE INDEX "PlanExercise_exerciseId_idx" ON "PlanExercise"("exerciseId");
CREATE UNIQUE INDEX "PlanSet_planExerciseId_setNumber_key" ON "PlanSet"("planExerciseId", "setNumber");
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanSet" ADD CONSTRAINT "PlanSet_planExerciseId_fkey" FOREIGN KEY ("planExerciseId") REFERENCES "PlanExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
