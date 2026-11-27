# Taskwell — Student Task Monitoring System

A responsive, full-stack student workspace for organizing coursework, tracking deadlines, documenting submissions, and reviewing progress.

**Status:** application source, 10 React pages, Postman API collection, and Playwright E2E scenarios are included. The original 111-test in-memory backend evidence is preserved. **The newly added frontend and SQLite/E2E suite still require an actual install and run on the target machine; see [FINAL_AUDIT.md](docs/FINAL_AUDIT.md).** Do not interpret the presence of test files as proof they passed.

## Features

- **Account:** register, sign in, sign out, edit name/email, change password.
- **Dashboard:** completion metrics, upcoming deadlines, weekly chart and recent task activity.
- **Tasks:** create, view, search, filter, sort, update, delete, assign a subject, manage priorities and workflow status.
- **Subjects:** create/edit/delete subjects, choose colors, show course progress.
- **Calendar:** monthly deadline view and day-level task details.
- **Submissions:** only completed tasks may be submitted, with optional HTTPS/HTTP link and remarks; records on-time/late and hours late.
- **Notifications:** upcoming/overdue/recently-completed alerts and mark-as-read, computed when fetched (not push notifications).
- **Reports:** status, per-subject and submission stats; eight weeks of progress; CSV export with spreadsheet formula injection protection.
- **Appearance:** responsive desktop/mobile navigation and a locally saved light/dark theme.

## Requirements

- Node.js 22 or newer, npm 10 or newer (Node.js 20 LTS should also work if dependencies support it).
- Windows PowerShell, macOS terminal, or Linux shell.
- A browser (Chrome, Edge, or Firefox). Playwright's E2E suite is configured for Chromium.
- Internet access **for the first npm installation**.
- SQLite is included through Prisma and needs no separate database server.

## Quick start (Windows PowerShell)

Extract the project to a folder, for example `D:\PROG TOOLS\student-task-monitoring-system`. In PowerShell, `cd` into the directory containing **both** `backend` and `frontend` (use quotes around paths with spaces).

**First-time backend setup** (at the project root):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-on-windows.ps1
```

This installs the backend, creates `backend\.env` if missing, generates Prisma, creates migration files and databases, and runs backend tests. **Confirm every summary step has exit code `0`**. Save `evidence\integration-tests\*.log` for submission. It uses a separate `test.db` for integration tests.

**Install frontend** (once):

```powershell
cd frontend
npm install
cd ..
```

**Start backend in Terminal 1**:

```powershell
cd backend
npm run dev
```

**Start frontend in Terminal 2** (start from the project root in the second terminal):

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173**, create an account and sign in. The API runs at **http://localhost:4000**. Vite proxies `/api` to the backend, so the browser normally calls the same origin as the UI.

If `backend\.env` was not created by the verification script, copy `.env.example` to `backend\.env` and **replace `JWT_SECRET` with a private random secret of at least 16 characters**. Example values in `.env.example` are not secure production secrets.

### macOS / Linux alternative

```bash
cd backend
npm install
cp ../.env.example .env
# edit .env: use a strong JWT_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm test
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### All-in-one Windows verification

After extracting the updated project, you can also run the extended verifier, which performs the original SQLite verification, installs and builds the frontend, prepares a separate E2E database and runs Playwright Chromium tests:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-full-on-windows.ps1
```

It writes additional logs numbered `07`–`11` to `evidence\integration-tests`. **Do not run it while your dev servers are already using ports 4000/5173.** Postman/Newman remains a separate run with a live backend.

## Verification commands

Run the backend on your development machine:

```powershell
cd backend
npm run typecheck
npm run test:coverage
```

To re-run **memory + real Prisma/SQLite tests** on Windows, use `scripts\verify-on-windows.ps1` from the root. The script stores logs in `evidence\integration-tests` and does not intentionally delete the development database.

Prepare an **isolated** E2E SQLite database (first run or whenever migrations change):

```powershell
# project root, after backend and frontend npm install and the Windows verification script
node scripts\prepare-e2e.mjs
cd frontend
npx playwright install chromium
npm run test:e2e
```

**Close any running dev server on ports 4000/5173 before E2E tests.** Playwright starts its own backend using `backend/prisma/e2e.db`, then starts Vite. Reports are written under `frontend/playwright-report`; screenshots/traces from failures are retained under `frontend/test-results`. The E2E test accounts are created in this isolated database; to reset them, delete `backend/prisma/e2e.db` and run the preparation script again.

### Postman / Newman API tests

Import `postman/Taskwell.postman_collection.json` and `postman/Taskwell.local.postman_environment.json`. Start the backend, select the **Taskwell Local** environment, and **Run the entire collection in folder order**. It creates a unique test user, manages subjects/tasks and submissions, exports CSV, changes the user's password and cleans up the created task and subject. The test account remains in the database. Run against a test database when possible.

For Newman, after installing Newman (globally or through `npx`) with Internet access:

```powershell
npx newman run postman\Taskwell.postman_collection.json -e postman\Taskwell.local.postman_environment.json
```

> Postman saves a bearer token in collection variables during the run. Do not publish an exported collection with real tokens or secrets.

## Project structure

```text
backend/
  prisma/schema.prisma         SQLite data model
  src/app.ts                  Express API entry point / routes
  src/http/                  submissions, notifications, reports
  src/domain/                validation and calculations
  src/repositories/          memory and Prisma implementations
  tests/                     unit and Supertest integration tests
frontend/
  src/                       React, TypeScript, routes, styles
  e2e/                       Playwright browser workflows
  playwright.config.ts       isolated E2E server setup
postman/                     Postman collection and local environment
scripts/                     Windows verification, E2E DB preparation
 docs/                       User Manual, Technical Documentation, testing and audit
 evidence/                   Claude's original historical test logs
```

## Business rules / limits

- A task starts as `PENDING`, can move to `IN_PROGRESS` or `COMPLETED`; completed tasks can be reopened or submitted via the dedicated submissions endpoint; `SUBMITTED` is terminal. Tasks cannot be submitted without reaching `COMPLETED` first.
- The app tracks submission metadata only; it does **not** upload work to an LMS, send messages, or verify that an external link is accessible.
- Deadline alerts are generated when notifications are fetched. **There is no scheduler, email delivery, or browser push notification service.**
- Completing a task counts toward completion percentage but not submission totals until the task is submitted.
- A browser theme choice is stored locally. SQLite files and `.env` should not be committed to a public repository.
- The backend issues a 7-day JWT in an HTTP-only cookie and also returns a bearer token to API clients. Logout clears the cookie, **not an already-copied bearer token**.
- Intended for local/student-project use. The final audit lists improvements needed before public production deployment.

See [User Manual](docs/USER_MANUAL.md), [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md), [Testing Guide](docs/TEST_PLAN.md), and [Final Audit](docs/FINAL_AUDIT.md).
