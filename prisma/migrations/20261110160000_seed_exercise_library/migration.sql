-- Seed a starter exercise library.
-- The NOT EXISTS checks make this safe to
-- re-run and avoid changing user-created records.

INSERT INTO "Exercise" (
    "id",
    "name",
    "machine",
    "muscleGroup",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    seed."name",
    seed."machine",
    seed."muscleGroup",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    VALUES
    (
        'Bench Press',
        'Barbell',
        'Chest'
    ),
    (
        'Chest Press',
        'Machine',
        'Chest'
    ),
    (
        'Incline Dumbbell Press',
        'Dumbbells',
        'Chest'
    ),
    (
        'Chest Fly',
        'Machine',
        'Chest'
    ),
    (
        'Bent-Over Row',
        'Free Weights',
        'Back'
    ),
    (
        'Lat Pulldown',
        'Machine',
        'Back'
    ),
    (
        'Wide-Grip Seated Row',
        'Machine',
        'Back'
    ),
    (
        'Close-Grip Seated Row',
        'Machine',
        'Back'
    ),
    (
        'Lateral Raise',
        'Machine',
        'Shoulders'
    ),
    (
        'Shoulder Press',
        'Machine',
        'Shoulders'
    ),
    (
        'Bicep Curl',
        'Dumbbells',
        'Arms'
    ),
    (
        'Tricep Extension',
        'Dumbbells',
        'Arms'
    ),
    (
        'Leg Press',
        'Machine',
        'Legs'
    ),
    (
        'Squat',
        'Machine',
        'Legs'
    ),
    (
        'Leg Extension',
        'Machine',
        'Legs'
    ),
    (
        'Leg Curl',
        'Machine',
        'Legs'
    ),
    (
        'Deadlift',
        'Barbell',
        'Legs'
    ),
    (
        'Calf Raise',
        'Machine',
        'Calves'
    )
) AS seed(
    "name",
    "machine",
    "muscleGroup"
)
WHERE NOT EXISTS (
    SELECT 1
    FROM "Exercise" existing
    WHERE LOWER(existing."name") = LOWER(seed."name")
);