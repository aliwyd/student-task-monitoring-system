# TDD Evidence
Every feature below was developed with a real Red -> Green -> Refactor cycle. Each stage was executed with `scripts/tdd-step.sh`, which runs the test file, saves the **raw output** to `evidence/tdd/<feature>-<stage>.log`, then commits. Nothing here was written after the fact; hashes come from `git log`.

Scope: this covers the pure domain logic (`backend/src/domain`). TDD for API/database features is **not yet done** (see `PROJECT_PROGRESS.md`).

Notes on honesty: the first RED log (`task-creation-red.log`) contains terminal color codes because I added `NO_COLOR` to the helper script afterwards; that script tweak is included in the `task-creation` GREEN commit. The implementation in each GREEN step was deliberately minimal, and the refactor steps were written after seeing green.

## Task creation

- Functions: `validateCreateTask`
- Test file: `backend/tests/unit/taskCreation.test.ts`
- Implementation: `backend/src/domain/taskCreation.ts`

**RED** - tests written first, module did not exist. Result: 0 tests ran, suite failed. Reason: `Error: Cannot find module '../../src/domain/taskCreation'`. Log: `evidence/tdd/task-creation-red.log`

**GREEN** - minimal implementation. Result: 8 passed (8). Log: `evidence/tdd/task-creation-green.log`

**REFACTOR** - Replaced `any` with typed `TaskData`/`ValidationResult`; extracted `TITLE_MAX_LENGTH`, `isPriority`, `optionalString`; shared enums moved to `types.ts`. Result: 8 passed (8). Log: `evidence/tdd/task-creation-refactor.log`

Commits:
- `13c0a69 tdd(task-creation): red - failing tests for task creation validation (module not implemented)`
- `4f4f259 tdd(task-creation): green - minimal validateCreateTask implementation`
- `7571001 tdd(task-creation): refactor - typed domain model, extracted constants/helpers; behavior unchanged`

## Task status updates

- Functions: `applyStatusChange`
- Test file: `backend/tests/unit/statusUpdate.test.ts`
- Implementation: `backend/src/domain/statusUpdate.ts`

**RED** - tests written first, module did not exist. Result: 0 tests ran, suite failed. Reason: `Error: Cannot find module '../../src/domain/statusUpdate'`. Log: `evidence/tdd/status-update-red.log`

**GREEN** - minimal implementation. Result: 9 passed (9). Log: `evidence/tdd/status-update-green.log`

**REFACTOR** - Replaced if-chain with a table-driven `TRANSITIONS` map; single code path for transition checks. Result: 9 passed (9). Log: `evidence/tdd/status-update-refactor.log`

Commits:
- `60ae1f0 tdd(status-update): red - failing tests for status transitions (module not implemented)`
- `1cd08a5 tdd(status-update): green - minimal transition logic`
- `07daf8d tdd(status-update): refactor - table-driven transitions; behavior unchanged`

## Deadline / overdue calculations

- Functions: `isOverdue, daysUntilDue, deadlineState`
- Test file: `backend/tests/unit/deadlines.test.ts`
- Implementation: `backend/src/domain/deadlines.ts`

**RED** - tests written first, module did not exist. Result: 0 tests ran, suite failed. Reason: `Error: Cannot find module '../../src/domain/deadlines'`. Log: `evidence/tdd/deadlines-red.log`

**GREEN** - minimal implementation. Result: 12 passed (12). Log: `evidence/tdd/deadlines-green.log`

**REFACTOR** - Extracted `isClosed`, `utcDay`, `MS_PER_DAY`, `DUE_SOON_DAYS`; added `DeadlineState` type. Result: 12 passed (12). Log: `evidence/tdd/deadlines-refactor.log`

Commits:
- `d40754d tdd(deadlines): red - failing tests for overdue/deadline calculations (module not implemented)`
- `109ffc2 tdd(deadlines): green - minimal deadline functions`
- `b89ea45 tdd(deadlines): refactor - extracted constants/helpers, typed result; behavior unchanged`

## Submission status tracking

- Functions: `evaluateSubmission, submissionStatus`
- Test file: `backend/tests/unit/submission.test.ts`
- Implementation: `backend/src/domain/submission.ts`

**RED** - tests written first, module did not exist. Result: 0 tests ran, suite failed. Reason: `Error: Cannot find module '../../src/domain/submission'`. Log: `evidence/tdd/submission-red.log`

**GREEN** - minimal implementation. Result: 7 passed (7). Log: `evidence/tdd/submission-green.log`

**REFACTOR** - Extracted constants and a `STATUS_BY_TIMING` lookup; added doc comments and explicit types. Result: 7 passed (7). Log: `evidence/tdd/submission-refactor.log`

Commits:
- `e44e77b tdd(submission): red - failing tests for submission tracking (module not implemented)`
- `fa5ba65 tdd(submission): green - minimal submission evaluation`
- `8093890 tdd(submission): refactor - named constants, lookup table, doc comments; behavior unchanged`

## Task completion statistics

- Functions: `computeTaskStats`
- Test file: `backend/tests/unit/stats.test.ts`
- Implementation: `backend/src/domain/stats.ts`

**RED** - tests written first, module did not exist. Result: 0 tests ran, suite failed. Reason: `Error: Cannot find module '../../src/domain/stats'`. Log: `evidence/tdd/stats-red.log`

**GREEN** - minimal implementation. Result: 7 passed (7). Log: `evidence/tdd/stats-green.log`

**REFACTOR** - Typed `TaskStats`; reused `isClosed`; built `byStatus` from the `STATUSES` list. Result: 7 passed (7). Log: `evidence/tdd/stats-refactor.log`

Commits:
- `aa62068 tdd(stats): red - failing tests for completion statistics (module not implemented)`
- `13b67ca tdd(stats): green - minimal computeTaskStats`
- `9559434 tdd(stats): refactor - typed TaskStats, reuse isClosed, derived status map; behavior unchanged`

## API: auth, tasks, subjects, user isolation, dashboard

- Test file: `backend/tests/integration/api.test.ts` (19 tests; Supertest against the Express app)
- Implementation: `backend/src/app.ts`, `backend/src/repositories/`, `backend/src/domain/taskUpdate.ts`

**RED** - tests written first; `src/app` did not exist, so the suite failed to load. Log: `evidence/tdd/api-auth-tasks-red.log`

**GREEN** - implementation added; 19 passed (19) on the first run. Log: `evidence/tdd/api-auth-tasks-green.log`

**REFACTOR** - removed a leftover placeholder function; fixed a type mismatch (`null` vs `undefined`) that `tsc --noEmit` reported. 19 passed (19). Log: `evidence/tdd/api-auth-tasks-refactor.log`

Caveats, stated plainly:
- These tests ran against the **in-memory repositories**, not a real database. The same test file runs against Prisma/SQLite only when `RUN_PRISMA=1`, which `scripts/verify-on-windows.ps1` sets. That run has **not happened yet**.
- The refactor commit also contains the Prisma schema, `prisma.ts` repositories and `server.ts`. Those are untested and were added without TDD cycles of their own.
- The 19 tests passed on the first GREEN run; I did not intentionally break them to show a second failure.

Commits:

- `c9ce23a tdd(api-auth-tasks): red - failing integration tests for auth, tasks, subjects, isolation, dashboard (app not implemented)`
- `5fab58b tdd(api-auth-tasks): green - implement repositories, validation, auth, tasks, subjects, dashboard routes`
- `12433a4 tdd(api-auth-tasks): refactor - remove dead code; fix TaskData null types found by tsc; behavior unchanged`


## Notification candidates (domain)

- Functions: `candidateNotifications`
- Test file: `backend/tests/unit/notificationsDomain.test.ts`
- Implementation: `backend/src/domain/notifications.ts`

**RED** - tests first, module missing. 0 tests ran. Reason: `Error: Cannot find module '../../src/domain/notifications'`. Log: `evidence/tdd/notifications-domain-red.log`

**GREEN** - minimal implementation. 8 passed (8). Log: `evidence/tdd/notifications-domain-green.log`

**REFACTOR** - Typed `NotificationCandidate`; reused `DUE_SOON_DAYS`; extracted `recentlyCompleted` and a date helper. 8 passed (8). Log: `evidence/tdd/notifications-domain-refactor.log`

Commits:

- `298452f tdd(notifications-domain): red - failing tests for notification candidates (module not implemented)`
- `8f25b88 tdd(notifications-domain): green - minimal candidateNotifications`
- `c6c9865 tdd(notifications-domain): refactor - typed candidates, reuse DUE_SOON_DAYS, extracted helpers; behavior unchanged`

## Report calculations (domain)

- Functions: `computeSubmissionStats, computeSubjectProgress, computeWeeklyProgress, recentActivity`
- Test file: `backend/tests/unit/reports.test.ts`
- Implementation: `backend/src/domain/reports.ts`

**RED** - tests first, module missing. 0 tests ran. Reason: `Error: Cannot find module '../../src/domain/reports'`. Log: `evidence/tdd/reports-red.log`

**GREEN** - minimal implementation. 12 passed (12). Log: `evidence/tdd/reports-green.log`

**REFACTOR** - Named constants (`MS_PER_DAY`, no-subject label/colour); shared `percent` and `isClosed` helpers. 12 passed (12). Log: `evidence/tdd/reports-refactor.log`

Commits:

- `04c6445 tdd(reports): red - failing tests for report calculations (module not implemented)`
- `7abd6a8 tdd(reports): green - minimal report calculations`
- `781a76e tdd(reports): refactor - named constants, shared percent/isClosed helpers; behavior unchanged`

## CSV export (domain)

- Functions: `toCsv`
- Test file: `backend/tests/unit/csv.test.ts`
- Implementation: `backend/src/domain/csv.ts`

**RED** - tests first, module missing. 0 tests ran. Reason: `Error: Cannot find module '../../src/domain/csv'`. Log: `evidence/tdd/csv-export-red.log`

**GREEN** - minimal implementation. 7 passed (7). Log: `evidence/tdd/csv-export-green.log`

**REFACTOR** - Typed `CsvCell`; named regex constants; split out `formatCell`. 7 passed (7). Log: `evidence/tdd/csv-export-refactor.log`

Commits:

- `b62c09e tdd(csv-export): red - failing tests for CSV serialisation (module not implemented)`
- `c8ecdde tdd(csv-export): green - minimal toCsv`
- `5c3d7ad tdd(csv-export): refactor - typed cells, named regex constants, split formatCell; behavior unchanged`

## API part 2: submissions, notifications, reports/CSV, profile/password, dashboard extras

- Test file: `backend/tests/integration/api2.test.ts`
- Implementation: `backend/src/http/*.ts`, `backend/src/app.ts`, `backend/src/repositories/`

**RED** - tests first. This RED ran the whole suite against an app without these routes, so it failed on real assertions: 22 failed (22). Log: `evidence/tdd/api-part2-red.log`

**GREEN** - 22 passed (22). Log: `evidence/tdd/api-part2-green.log`

**REFACTOR** - removed helper functions duplicated between `app.ts` and `http/common.ts`. 22 passed (22). Log: `evidence/tdd/api-part2-refactor.log`

Caveat: these runs used the in-memory repositories. The Prisma/SQLite run happens through `scripts/verify-on-windows.ps1` and its results are not part of this evidence yet.

Commits:

- `a2d2a3d tdd(api-part2): red - failing integration tests for submissions, notifications, reports, profile, dashboard extras (routes not implemented)`
- `6d80baf tdd(api-part2): green - implement submissions, notifications, reports/CSV, profile/password, dashboard extras`
- `be5f85d tdd(api-part2): refactor - app.ts reuses http/common helpers (removed duplicates); behavior unchanged`
