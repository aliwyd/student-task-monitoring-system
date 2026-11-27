# Final Audit — 27 November 2026

## Source provenance

This audit covers the **ZIP submitted in this conversation** plus the added React UI, tests and documentation. The earlier backend TDD logs were supplied inside the original ZIP; they have **not** been re-executed in this environment. The uploaded snapshot had no README, React frontend, Postman collection or Playwright tests.

## Implementation inventory

| Area | In final source | Verification state |
|---|---|---|
| Auth, profile, password endpoints | Existing backend code | Historic Supertest memory logs; fresh run required |
| Tasks, subjects and dashboard endpoints | Existing backend code | Historic Supertest memory logs; fresh SQLite run required |
| Submission, notification and report/CSV endpoints | Existing backend code | Historic Supertest memory logs; fresh SQLite run required |
| React pages: login, register, overview, tasks, subjects, calendar, submissions, notifications, reports, settings | **Added** | Source written; browser/build run required |
| Responsive sidebar, mobile navigation, light/dark theme | **Added** | Source written; browser check required |
| Postman collection and environment | **Added** | JSON validated; live Newman run required |
| Playwright E2E suite / isolated E2E preparation | **Added** | Scenarios written; browser run required |
| README, User Manual, Technical Documentation, ERD, Test Plan | **Added** | Checked against source; target-machine walkthrough required |
| Preserved original TDD evidence | Included from source ZIP | Historical evidence, not newly generated results |
| GitHub publication | **Not done** | Requires user access and explicit approval |

## Executability note

The build environment used to produce this archive cannot resolve `registry.npmjs.org` (DNS resolution failed). Accordingly, dependency installation, frontend compilation, end-to-end execution and Prisma/SQLite tests **cannot be honestly recorded as passing here**. Inspect `README.md` and run the documented commands on the user's Windows system. The original 111 passing tests are attested by the supplied historic in-memory log, not by a new execution in this session.

## Known technical risks / remaining hardening work

1. **Submission atomicity:** creation and status change happen separately. A database transaction is advisable.
2. **Notification concurrency:** two simultaneous reads may create duplicate rows without a unique constraint.
3. **Security for public deployment:** no rate limiting, email verification, token revocation or password-reset procedure; CSRF posture and public hosting need separate review.
4. **Test coverage scope:** existing backend tests cover API behavior; browser E2E and Postman tests were added but must be run and their results attached.
5. **Application scale:** task filtering runs client-side without paging; suited to typical personal coursework, not multi-tenant campus-scale workloads.
6. **Asset portability:** Google fonts in CSS fall back to system fonts if offline; app functionality should not depend on font downloads.

## Acceptance criteria

Consider the project **implementation-complete for local student-project scope** only after the Windows script, frontend build, Postman run and Playwright run all pass on the actual computer, and any real failures are fixed. For a public production rollout, address the risks above first. Avoid reporting "100% tested" without those results.
