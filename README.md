# IronTrack

Next.js workout tracker with PostgreSQL, Prisma and Better Auth.

## Development

Use Node.js 24 and npm. Install dependencies with `npm ci`, then create an ignored `.env`:

```dotenv
DATABASE_URL="postgresql://irontrack:local_dev_password@localhost:5432/irontrack"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-random-local-secret-of-at-least-32-characters"
```

Generate your own auth secret; never commit `.env`. The Docker database password above is for local development only.

```bash
docker compose up -d --wait postgres
npm run db:generate
npm run db:migrate
npm run dev
```

Prisma uses `prisma7.config.ts`, including for generation and migrations. Its native engine download requires HTTPS access to `binaries.prisma.sh`; keep checksum and TLS verification enabled. Apply migrations before starting the updated app, including `20261116190000_locale_and_workout_plans`.

## Training workflow

- **Settings → Language** switches between English and Hungarian. Signed-in preferences are stored on the account and apply across devices. Before sign-in, a cookie stores the selected language; new accounts inherit it. Existing accounts default to English.
- **Workout plans** lets you create, edit and delete private routines containing exercises, target weights, reps and sets. Starting a plan copies it into a new session with every set unchecked. Finish the active workout before starting another one.
- **Workouts** resumes the active session and lists completed sessions. Set values and completion are saved to the account. Complete at least one set to finish a session.
- Open a completed workout to review its exercises, recorded and completed sets, duration and volume. Volume counts completed sets only. Completed sessions are read-only; editing or deleting a plan leaves their records unchanged.
- Exercise names remain as entered. Shared exercise classifications and application controls have Hungarian labels.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Run the build separately from the development server because both write `.next`.

The browser integration test uses an already-running app and the development database configured by `.env`. It creates two randomly named accounts and deletes only those accounts and their related records afterward. It checks registration language, cross-device preferences, plan creation/edit/delete/reuse, set persistence, completed-history protection and isolation between accounts.

```bash
npx playwright install chromium
# Start the app in another terminal, then:
npm run test:e2e
# To use an installed Chromium instead:
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Set `TEST_BASE_URL` if the app runs on a different address. Its origin must match the Better Auth URL and trusted origins. Use a local development database for these checks.
