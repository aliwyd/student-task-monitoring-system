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
