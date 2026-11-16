import test from "node:test";
import assert from "node:assert/strict";
import { validatePlan } from "../src/components/plans/validation.ts";

const t = (en) => en;
const example = () => ({ name: "  Upper body A  ", exercises: [{ exerciseId: "bench", sets: [{ weight: 22.555, reps: 10 }] }] });

test("plan validation trims names, normalizes decimals and keeps exercise/set order", () => {
  const value = example();
  value.exercises.push({ exerciseId: "row", sets: [{ weight: 0, reps: 12 }, { weight: 30, reps: 8 }] });
  const parsed = validatePlan(value, t);
  assert.equal(parsed.name, "Upper body A");
  assert.deepEqual(parsed.exercises.map((exercise) => exercise.exerciseId), ["bench", "row"]);
  assert.equal(parsed.exercises[0].sets[0].weight, 22.56);
  assert.deepEqual(parsed.exercises[1].sets.map((set) => set.reps), [12, 8]);
});

test("plans reject malformed names, empty exercises and duplicate exercises", () => {
  for (const value of [null, {}, { ...example(), name: " " }, { ...example(), name: "x".repeat(81) }, { ...example(), exercises: [] }]) {
    assert.throws(() => validatePlan(value, t));
  }
  const value = example();
  value.exercises.push(value.exercises[0]);
  assert.throws(() => validatePlan(value, t), /only once/);
});

test("plans reject malformed sets and out-of-range or non-finite numbers", () => {
  for (const set of [null, {}, { weight: -1, reps: 10 }, { weight: Infinity, reps: 10 }, { weight: NaN, reps: 10 }, { weight: "20", reps: 10 }, { weight: 10001, reps: 10 }, { weight: 20, reps: 0 }, { weight: 20, reps: 1.5 }, { weight: 20, reps: 10001 }]) {
    const value = example();
    value.exercises[0].sets = [set];
    assert.throws(() => validatePlan(value, t));
  }
  const value = example();
  value.exercises[0].sets = [];
  assert.throws(() => validatePlan(value, t), /1–30/);
});

test("plan limits cap payload size and errors respect the selected language", () => {
  const value = example();
  value.exercises = Array.from({ length: 51 }, (_, index) => ({ exerciseId: `e-${index}`, sets: [{ weight: 0, reps: 1 }] }));
  assert.throws(() => validatePlan(value, t), /1–50/);
  const excessiveSets = example();
  excessiveSets.exercises[0].sets = Array.from({ length: 31 }, () => ({ weight: 0, reps: 1 }));
  assert.throws(() => validatePlan(excessiveSets, t), /1–30/);
  assert.throws(() => validatePlan(null, (_, hu) => hu), /Érvénytelen/);
});
