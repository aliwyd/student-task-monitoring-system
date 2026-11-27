# Project Progress

Last updated: 2026-11-27 (sandbox session 3)

## Done and verified in the sandbox (real runs; logs in `evidence/`)
- Domain logic via genuine TDD: task creation, status transitions, deadlines/overdue, submission status, completion stats, notification candidates, report calculations, CSV export
- REST API: auth (register/login/logout/me, profile edit, password change), tasks, subjects, submissions, notifications, reports (+CSV export), dashboard summary (stats, upcoming, weekly progress, recent activity), user data isolation
- 111 tests passing across 10 files, **using in-memory repositories** (`evidence/integration-tests/sandbox-memory-all-tests.log`); `tsc --noEmit` clean

## Written but NOT verified by me
- Prisma schema, `src/repositories/prisma.ts`, `src/server.ts`, `scripts/verify-on-windows.ps1`
- The user reports running the Windows script on the earlier 62-test version and that everything passed, but the logs have not been shared, so it is **not recorded as evidence**. It must be re-run on this newer version (the Prisma repositories gained users/submissions/notifications code).

## Not started
- React frontend (10 pages), Playwright e2e
- Postman collection/environment (+ Newman run)
- README, USER_MANUAL, TECHNICAL_DOCUMENTATION, ERD, screenshots
- Final audit table, GitHub publishing (needs the user's approval)

## Commands
```
cd backend && npm install && npm test          # works today, no database needed
powershell -ExecutionPolicy Bypass -File scripts\verify-on-windows.ps1   # from project root: DB + Prisma test run
```

## Caveats
- Git author on existing commits is "Claude (AI-assisted)". Set your own name/email for new commits; never rewrite history.
- Reminders/notifications are computed when the notification list is requested (no background scheduler), as the spec allows. Two simultaneous requests could create a duplicate notification.
- Submitting a task updates two tables without a database transaction; a crash between the two writes could leave them inconsistent.
- Preferences (e.g. theme) will be stored in the browser, not the database.
