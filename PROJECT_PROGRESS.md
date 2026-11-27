# Project Progress — updated 2026-11-27 (ChatGPT continuation)

## Preserved from the uploaded Claude ZIP

- Domain rules and Express API: auth/profile/password, subjects/tasks, submissions, notifications, reports/CSV and dashboard.
- Historical TDD logs and commit history for RED → GREEN → REFACTOR backend cycles.
- Supplied `evidence/integration-tests/sandbox-memory-all-tests.log`: **111 tests / 10 files passed** on in-memory repositories in the earlier environment, with the originally reported coverage. This is historic evidence; it was **not re-run** as part of the continuation.
- Prisma/SQLite repository, schema, Windows verification script and backends tests. Real SQLite testing still requires executing `scripts/verify-on-windows.ps1` on the target machine.

## Added in the continuation

- `frontend/` React + TypeScript + Vite UI containing 10 pages/routes (login, register, overview, tasks, subjects, calendar, submissions, notifications, reports, settings).
- Responsive navigation, cards/charts, subject/task forms, submission recording/editing, notifications, reports/CSV, profile/password and local dark mode.
- `frontend/e2e/student-workflows.spec.ts` Playwright Chromium browser scenarios and isolated test DB script `scripts/prepare-e2e.mjs`.
- `postman/` complete local API collection/environment (28 requests including negative cases).
- `README.md`, `docs/USER_MANUAL.md`, `docs/TECHNICAL_DOCUMENTATION.md`, `docs/TEST_PLAN.md` and `docs/FINAL_AUDIT.md`.
- Extended Windows verification script `scripts/verify-full-on-windows.ps1` (SQLite backend, frontend build, E2E) with separate logs.

## Tested in this continuation

- Source ZIP contents and backend implementation were inspected.
- All frontend TypeScript/TSX files were syntactically parsed with TypeScript; **0 syntax diagnostics**.
- Both Postman JSON files parsed successfully; request grouping/count checked.

## NOT yet tested / remaining acceptance steps

- **Install/build/test on user's Windows machine**: this environment cannot resolve the npm registry and has no locally usable dependency installation. No new backend/Prisma/frontend/Playwright/Newman result is claimed green.
- Windows: run `powershell -ExecutionPolicy Bypass -File scripts\verify-full-on-windows.ps1` after backing up existing files. Send output/logs, including new logs `07`–`11`. Run Postman/Newman separately.
- Manual browser walkthrough and real screenshots are outstanding.
- Final audit of production hardening is in `docs/FINAL_AUDIT.md`; GitHub publishing remains user-controlled and was not attempted.

## Important caveats

- The distributed project ZIP intentionally excludes `.git`, `.env`, local SQLite databases and `node_modules` to protect the user's existing working tree and local secrets. The original Git history can be kept from the user's local repository or from the separate optional Git bundle.
- Old `backend/prisma/migrations` on the user's machine are not deleted by the ZIP. The verification script generates new migrations as required.
- Notifications are calculated when fetched, not scheduled; concurrency can duplicate notifications.
- Task submission uses two nontransactional writes (submission record, task status).
- JWT bearer tokens already copied externally are not revoked by browser logout.
