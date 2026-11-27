# Project Progress

Last updated: 2026-11-27 (sandbox session 2)

## Done and verified (real runs; logs in `evidence/`)
- Domain logic via genuine TDD (5 required features): 43 unit tests
- REST API: auth (register/login/logout/me), tasks CRUD + filters/search/sort + status transitions, subjects CRUD, dashboard summary, user data isolation: 19 integration tests
- Total 62 tests passing in the sandbox, **using in-memory repositories** (`evidence/integration-tests/sandbox-memory-all-tests.log`)
- `tsc --noEmit` clean (note: Prisma types are stubs until `prisma generate`, so this does not check `prisma.ts`)

## Written but NOT verified
- `backend/prisma/schema.prisma`, `src/repositories/prisma.ts`, `src/server.ts`
- `scripts/verify-on-windows.ps1` (could not run PowerShell here)
- The same 19 API tests against real SQLite: pending, runs via the script above (`RUN_PRISMA=1`)

## Not started
- Submissions API (`/api/submissions`) and `SubmissionRecord` usage, notifications API, reports API + CSV export
- Profile/password change endpoints
- React frontend (10 pages), Playwright e2e
- Postman collection/environment (+ Newman run)
- README, USER_MANUAL, TECHNICAL_DOCUMENTATION, ERD, screenshots
- Final audit table, GitHub publishing (needs your approval)

## Commands
```
cd backend && npm install && npm test          # works today, no database needed
powershell -ExecutionPolicy Bypass -File scripts\verify-on-windows.ps1   # from project root: DB + Prisma test run
```

## Caveats
- Git author on existing commits is "Claude (AI-assisted)". Set your own name/email for new commits; never rewrite history.
- Reminders/notifications will be computed when the app is used (no background scheduler), as the spec allows.
