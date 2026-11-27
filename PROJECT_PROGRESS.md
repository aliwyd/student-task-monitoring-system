# Project Progress

Last updated: 2026-11-27 (sandbox session 1)

## Done and verified (real runs, logs in `evidence/`)
- Git repo, `.gitignore`, backend tooling (TypeScript, Vitest + v8 coverage)
- Domain logic built with genuine TDD: task creation, status transitions, deadline/overdue, submission status, completion stats
- 43 unit tests passing across 5 files; coverage 100% statements/lines/functions, 96.42% branches (`evidence/unit-tests/unit-coverage.log`)
- `docs/testing/TDD_EVIDENCE.md` (generated from real logs and commits)

## Not started
- Prisma schema/migrations (blocker: sandbox cannot reach binaries.prisma.sh; must be verified on your Windows machine)
- Express API, auth, services, integration tests (need Prisma + a test DB)
- React frontend (all 10 pages), Playwright e2e
- Postman collection/environment, Newman run
- README, USER_MANUAL, TECHNICAL_DOCUMENTATION, ERD, screenshots
- `scripts/verify-on-windows.ps1` (run migrations + integration + API tests and write evidence)
- Final audit table, GitHub publishing (needs your approval and credentials)

## Commands
```
cd backend
npm install
npm test                 # unit tests
npm run test:coverage    # unit tests + coverage
```

## Blockers / caveats
- Prisma engines cannot be downloaded in the build sandbox, so anything touching the database is unverified until run locally.
- Git author is "Claude (AI-assisted)"; set your own `git config user.name/email` before committing further. Do not rewrite existing history.
