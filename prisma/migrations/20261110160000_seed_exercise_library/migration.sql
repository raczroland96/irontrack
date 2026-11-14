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
        'Fekvenyomas',
        'Rud',
        'Mell'
    ),
    (
        'Mellnyomas',
        'Gep',
        'Mell'
    ),
    (
        'Incline Dumbbell Press',
        'Dumbbells',
        'Mell'
    ),
    (
        'Mell tarogatas',
        'Gep',
        'Mell'
    ),
    (
        'Huzockodas',
        'Szabad suly',
        'Hat'
    ),
    (
        'Lehuzas',
        'Gep',
        'Hat'
    ),
    (
        'Szeles huzas ulve',
        'Gep',
        'Hat'
    ),
    (
        'Szuk huzas ulve',
        'Gep',
        'Hat'
    ),
    (
        'Oldal emeles',
        'Gep',
        'Vall'
    ),
    (
        'Kitolas',
        'Gep',
        'Vall'
    ),
    (
        'Bicepsz',
        'Kezi suly',
        'Kar'
    ),
    (
        'Tricepsz',
        'Kezi suly',
        'Kar'
    ),
    (
        'Labtolo',
        'Gep',
        'Lab'
    ),
    (
        'Gugolas',
        'Gep',
        'Lab'
    ),
    (
        'Labfeszito',
        'Gep',
        'Lab'
    ),
    (
        'Labhajlito',
        'Gep',
        'Lab'
    ),
    (
        'Felhuzas',
        'Rud',
        'Lab'
    ),
    (
        'Vadli',
        'Gep',
        'Vadli'
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