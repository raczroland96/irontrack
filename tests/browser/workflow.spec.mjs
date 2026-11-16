import "dotenv/config";
import { test, expect } from "@playwright/test";
import pg from "pg";
import { randomUUID } from "node:crypto";

test("account language, reusable plans, persisted sets and private history", async ({ page, browser, baseURL }) => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const email = `irontrack-e2e-${randomUUID()}@example.com`;
  const otherEmail = `irontrack-e2e-${randomUUID()}@example.com`;
  const password = randomUUID();
  const other = await browser.newContext({ baseURL });
  const secondDevice = await browser.newContext({ baseURL });
  try {
    await page.goto("/register");
    await page.getByLabel("Language", { exact: true }).selectOption("hu");
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");
    await page.getByPlaceholder("Kovács János").fill("E2E Edző");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("Legalább 8 karakter").fill(password);
    await page.getByRole("button", { name: "Fiók létrehozása", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");

    const [{ id: userId, locale }] = (await pool.query('SELECT id, locale FROM "User" WHERE email=$1', [email])).rows;
    expect(locale).toBe("hu");
    const exercise = (await pool.query('SELECT id, name FROM "Exercise" ORDER BY name LIMIT 1')).rows[0];
    expect(exercise).toBeTruthy();

    await page.goto("/plans/new");
    await page.getByLabel("Edzésterv neve").fill("E2E Felsőtest");
    await page.getByLabel("Gyakorlat kiválasztása").selectOption(exercise.id);
    await page.getByRole("button", { name: "Gyakorlat hozzáadása", exact: true }).click();
    await page.getByLabel("Szett súlya 1", { exact: true }).fill("20");
    await page.getByLabel("Szett ismétlésszáma 1", { exact: true }).fill("8");
    await page.getByRole("button", { name: "Szett hozzáadása", exact: true }).click();
    const saveRequest = page.waitForRequest((request) => Boolean(request.headers()["next-action"]));
    await page.getByRole("button", { name: "Edzésterv mentése", exact: true }).click();
    const saveAction = (await saveRequest).headers()["next-action"];
    await expect(page).toHaveURL(/\/plans$/);
    const planId = (await pool.query('SELECT id FROM "WorkoutPlan" WHERE "userId"=$1', [userId])).rows[0].id;

    const signup = await other.request.post("/api/auth/sign-up/email", { data: { name: "Other account", email: otherEmail, password } });
    expect(signup.ok()).toBeTruthy();
    const foreignPage = await other.newPage();
    await foreignPage.goto(`/plans/${planId}`);
    await expect(foreignPage.getByRole("textbox")).toHaveCount(0);
    const unauthorizedSave = await other.request.post("/plans/new", {
      headers: { "next-action": saveAction, "content-type": "text/plain;charset=UTF-8", origin: baseURL },
      data: JSON.stringify([planId, { name: "Stolen", exercises: [{ exerciseId: exercise.id, sets: [{ weight: 1, reps: 1 }] }] }]),
    });
    expect(unauthorizedSave.status()).toBeGreaterThanOrEqual(400);
    expect((await pool.query('SELECT name FROM "WorkoutPlan" WHERE id=$1', [planId])).rows[0].name).toBe("E2E Felsőtest");

    const startRequest = page.waitForRequest((request) => Boolean(request.headers()["next-action"]));
    await page.getByRole("button", { name: "Edzés indítása", exact: true }).click();
    const startAction = (await startRequest).headers()["next-action"];
    await expect(page).toHaveURL(/\/workouts\/new$/);
    const workoutId = (await pool.query('SELECT id FROM "Workout" WHERE "userId"=$1 AND "finishedAt" IS NULL', [userId])).rows[0].id;
    await foreignPage.goto(`/workouts/${workoutId}`);
    await expect(foreignPage.getByRole("heading", { name: "E2E Felsőtest" })).toHaveCount(0);
    const unauthorizedStart = await other.request.post("/plans", {
      headers: { "next-action": startAction, "content-type": "text/plain;charset=UTF-8", origin: baseURL },
      data: JSON.stringify([planId]),
    });
    expect(unauthorizedStart.status()).toBeGreaterThanOrEqual(400);

    const duplicateStart = await page.request.post("/plans", {
      headers: { "next-action": startAction, "content-type": "text/plain;charset=UTF-8", origin: baseURL },
      data: JSON.stringify([planId]),
    });
    expect(duplicateStart.status()).toBeGreaterThanOrEqual(400);
    expect((await pool.query('SELECT count(*) FROM "Workout" WHERE "userId"=$1 AND "finishedAt" IS NULL', [userId])).rows[0].count).toBe("1");
    const ownerHistory = await page.context().newPage();
    await ownerHistory.goto(`/workouts/${workoutId}`);
    await expect(ownerHistory.getByRole("heading", { name: "E2E Felsőtest" })).toHaveCount(0);
    await ownerHistory.close();
    await expect(page.getByRole("button", { name: "Szett teljesítése", exact: true })).toHaveCount(2);
    await page.getByLabel("1. szett súlya kilogrammban", { exact: true }).fill("12,5");
    await page.getByLabel("1. szett ismétlésszáma", { exact: true }).fill("9");
    await page.getByRole("button", { name: "Szett teljesítése", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Szett megjelölése nem teljesítettként" })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByLabel("1. szett súlya kilogrammban", { exact: true })).toHaveValue("12,5");
    await expect(page.getByLabel("1. szett ismétlésszáma", { exact: true })).toHaveValue("9");
    await expect(page.getByRole("button", { name: "Szett megjelölése nem teljesítettként" })).toHaveAttribute("aria-pressed", "true");
    // Clearing inputs must save zero, including when no completion toggle follows.
    await page.getByLabel("2. szett súlya kilogrammban", { exact: true }).fill("");
    await page.getByLabel("2. szett ismétlésszáma", { exact: true }).fill("");
    await page.getByRole("heading").first().click();
    await expect.poll(async () => (await pool.query('SELECT s.reps FROM "WorkoutSet" s JOIN "WorkoutExercise" e ON e.id=s."workoutExerciseId" WHERE e."workoutId"=$1 AND s."setNumber"=2', [workoutId])).rows[0].reps).toBe(0);

    // Preserve a real mutation action to verify completed history rejects later edits.
    const toggleRequest = page.waitForRequest((request) => Boolean(request.headers()["next-action"]));
    await page.getByRole("button", { name: "Szett teljesítése", exact: true }).click();
    const toggleAction = (await toggleRequest).headers()["next-action"];
    await expect(page.getByRole("button", { name: "Szett megjelölése nem teljesítettként" })).toHaveCount(2);
    await page.getByRole("button", { name: "Szett megjelölése nem teljesítettként" }).last().click();
    await expect(page.getByRole("button", { name: "Szett teljesítése", exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Edzés befejezése", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/workouts/${workoutId}$`));
    await expect(page.getByRole("cell", { name: "12,5", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Nem teljesítve", exact: true })).toHaveCount(1);
    const setId = (await pool.query('SELECT s.id FROM "WorkoutSet" s JOIN "WorkoutExercise" e ON e.id=s."workoutExerciseId" WHERE e."workoutId"=$1 AND s."setNumber"=1', [workoutId])).rows[0].id;
    const lockedEdit = await page.request.post("/workouts/new", {
      headers: { "next-action": toggleAction, "content-type": "text/plain;charset=UTF-8", origin: baseURL },
      data: JSON.stringify([workoutId, setId, false, 99, 99]),
    });
    expect(lockedEdit.status()).toBeGreaterThanOrEqual(400);
    expect((await pool.query('SELECT completed FROM "WorkoutSet" WHERE id=$1', [setId])).rows[0].completed).toBe(true);

    await foreignPage.goto(`/workouts/${workoutId}`);
    await expect(foreignPage.getByRole("heading", { name: "E2E Felsőtest" })).toHaveCount(0);
    const anonymous = await browser.newPage();
    await anonymous.goto(`/workouts/${workoutId}`);
    await expect(anonymous).toHaveURL(/\/login$/);
    await anonymous.close();

    await page.goto("/plans");
    await page.getByRole("button", { name: "Edzés indítása", exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/new$/);
    await expect(page.getByRole("button", { name: "Szett teljesítése", exact: true })).toHaveCount(2);
    await expect(page.getByLabel("1. szett súlya kilogrammban", { exact: true })).toHaveValue("20");
    await page.goto("/plans");
    await expect(page.getByRole("button", { name: "Edzés indítása", exact: true })).toBeDisabled();

    await page.goto("/settings");
    await page.getByLabel("Nyelv", { exact: true }).selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const signIn = await secondDevice.request.post("/api/auth/sign-in/email", { data: { email, password } });
    expect(signIn.ok()).toBeTruthy();
    const devicePage = await secondDevice.newPage();
    await devicePage.goto("/settings");
    await expect(devicePage.getByLabel("Language", { exact: true })).toHaveValue("en");
    await page.getByLabel("Language", { exact: true }).selectOption("hu");
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");
    await devicePage.reload();
    await expect(devicePage.getByLabel("Nyelv", { exact: true })).toHaveValue("hu");
    await foreignPage.goto("/settings");
    await expect(foreignPage.getByLabel("Language", { exact: true })).toHaveValue("en");

    // Plans can be edited/deleted without changing an earlier workout's values.
    await page.goto(`/plans/${planId}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByLabel("Edzésterv neve").fill("E2E Módosított");
    await page.getByLabel("Szett súlya 1", { exact: true }).fill("40");
    await page.getByRole("button", { name: "Edzésterv mentése", exact: true }).click();
    await expect(page).toHaveURL(/\/plans$/);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Törlés", exact: true }).click();
    await expect(page.getByRole("heading", { name: "E2E Módosított" })).toHaveCount(0);
    expect((await pool.query('SELECT "weightKg" FROM "WorkoutSet" WHERE id=$1', [setId])).rows[0].weightKg).toBe("12.50");
  } finally {
    await pool.query('DELETE FROM "User" WHERE email = ANY($1::text[])', [[email, otherEmail]]);
    await pool.end();
    await other.close();
    await secondDevice.close();
  }
});
