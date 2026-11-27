# Verification Plan and Reproducible Evidence

For a complete Windows run, execute `powershell -ExecutionPolicy Bypass -File scripts\verify-full-on-windows.ps1` from the project root.

## Layers

| Layer | Coverage | Command | Where the evidence goes |
|---|---|---|---|
| Domain unit | Task validation/transitions, deadline logic, stats, notifications, reports, CSV | `cd backend && npm test` | Terminal output; historic logs in `evidence/tdd/` |
| API integration (memory) | Auth, subjects, tasks, submissions, notifications, reports, isolation | `cd backend && npm test` | Terminal output |
| API integration (SQLite/Prisma) | Same Supertest integration suites against real SQLite | Run Windows verification script from project root | `evidence/integration-tests/05-integration-prisma.log` |
| Coverage | Entire backend test suite | Windows verification script | `evidence/integration-tests/06-all-tests-coverage.log` |
| Static check | Backend TypeScript | `cd backend && npm run typecheck` | Terminal output |
| Frontend build | React/TypeScript compilation and Vite bundle | `cd frontend && npm run build` | Terminal output |
| Postman | 28 HTTP requests covering main routes | Import collection/run or `npx newman run ...` | Newman CLI report (save as needed) |
| Playwright E2E | Guest guards, registration, task workflow/submission/export, calendar/settings, mobile layout | `node scripts/prepare-e2e.mjs` then `cd frontend && npm run test:e2e` | `frontend/playwright-report/`, `frontend/test-results/` |

## Verification checklist

- [ ] **Windows SQLite script:** all six steps exit `0`, including Prisma generate/migrate and the last two test steps.
- [ ] **Backend coverage:** inspect actual test counts and no failures; attach logs.
- [ ] **Frontend `npm run build`:** TypeScript and Vite complete with no errors.
- [ ] **Manual walkthrough:** register, add subject, add task, complete and submit it, read dashboard/reports, download CSV.
- [ ] **Auth edge cases:** wrong password, duplicate email, another user's task ID rejected, invalid or absent cookie.
- [ ] **Deadline edge cases:** due in past and near future, exactly due, late submission.
- [ ] **UI mobile:** navigation, tables and modal interactions at ~390px viewport.
- [ ] **Browser E2E:** all four Playwright tests green using `e2e.db`.
- [ ] **Postman/Newman:** collection run green, negative assertions included where expected.
- [ ] **Security checks:** `.env`, `*.db`, tokens, `node_modules` and generated evidence excluded from public release when appropriate.
- [ ] **Documentation review:** compare commands, route paths and screenshots with a running target installation.

## Notes on TDD and truthfulness

Claude's original RED/GREEN/REFACTOR logs and commits support specific **historic backend development steps**, not newly written frontend source or browser tests. The newly added Playwright and Postman files are **test scenarios to execute**, not evidence of results. Before presenting a final academic report, paste or include the real logs and exit codes from your Windows machine.

## Test isolation

- Unit/API-memory tests use in-memory repositories.
- Prisma integration tests use `backend/prisma/test.db`, which the Windows script deletes and recreates during verification.
- Playwright tests use `backend/prisma/e2e.db`; keep ports 4000/5173 free so the suite can launch isolated web servers.
- Manual API use defaults to `backend/prisma/dev.db`. Avoid running Postman tests against real student records.
