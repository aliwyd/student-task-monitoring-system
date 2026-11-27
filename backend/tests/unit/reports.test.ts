import { describe, it, expect } from "vitest";
import { computeSubmissionStats, computeSubjectProgress, computeWeeklyProgress, recentActivity } from "../../src/domain/reports";

const now = new Date("2026-12-10T12:00:00.000Z"); // Thursday; its week starts Monday 2026-12-07
const D = (s: string) => new Date(s);

describe("computeSubmissionStats", () => {
  it("is all zeros for no tasks", () => {
    expect(computeSubmissionStats([])).toEqual({ submitted: 0, onTime: 0, late: 0, notSubmitted: 0 });
  });
  it("splits on-time, late and not submitted (exact deadline is on time)", () => {
    const due = D("2026-12-05T00:00:00.000Z");
    const r = computeSubmissionStats([
      { dueDate: due, submittedAt: D("2026-12-04T00:00:00.000Z") },
      { dueDate: due, submittedAt: due },
      { dueDate: due, submittedAt: D("2026-12-06T00:00:00.000Z") },
      { dueDate: due, submittedAt: null },
      { dueDate: due },
    ]);
    expect(r).toEqual({ submitted: 3, onTime: 2, late: 1, notSubmitted: 2 });
  });
});

describe("computeSubjectProgress", () => {
  const subjects = [{ id: 1, name: "Math", color: "#111111" }, { id: 2, name: "Art", color: "#222222" }];
  const open = (subjectId: number | null, status = "PENDING", due = "2026-12-20T00:00:00.000Z") => ({ subjectId, status, dueDate: D(due) });
  it("includes subjects with no tasks at 0%", () => {
    const r = computeSubjectProgress([], subjects, now);
    expect(r).toEqual([
      { subjectId: 1, name: "Math", color: "#111111", total: 0, completed: 0, overdue: 0, completionPercentage: 0 },
      { subjectId: 2, name: "Art", color: "#222222", total: 0, completed: 0, overdue: 0, completionPercentage: 0 },
    ]);
  });
  it("counts completed (incl. submitted) and overdue per subject, rounding the percentage", () => {
    const r = computeSubjectProgress([open(1, "COMPLETED"), open(1, "SUBMITTED"), open(1, "PENDING", "2026-12-01T00:00:00.000Z"), open(2, "COMPLETED", "2026-01-01T00:00:00.000Z")], subjects, now);
    expect(r[0]).toMatchObject({ total: 3, completed: 2, overdue: 1, completionPercentage: 67 });
    expect(r[1]).toMatchObject({ total: 1, completed: 1, overdue: 0, completionPercentage: 100 });
  });
  it("adds a trailing 'No subject' row only when unassigned tasks exist", () => {
    expect(computeSubjectProgress([open(1)], subjects, now).map((x) => x.name)).toEqual(["Math", "Art"]);
    const r = computeSubjectProgress([open(null, "COMPLETED"), open(undefined as any)], subjects, now);
    expect(r[r.length - 1]).toMatchObject({ subjectId: null, name: "No subject", total: 2, completed: 1 });
  });
});

describe("computeWeeklyProgress", () => {
  it("returns zero-filled weeks, oldest first, starting on Mondays (UTC)", () => {
    const r = computeWeeklyProgress([], now, 3);
    expect(r.map((w) => w.weekStart)).toEqual(["2026-11-23", "2026-11-30", "2026-12-07"]);
    expect(r.every((w) => w.created === 0 && w.completed === 0)).toBe(true);
  });
  it("counts created and completed tasks in the right week", () => {
    const r = computeWeeklyProgress([
      { createdAt: D("2026-12-07T00:00:00.000Z"), completedAt: D("2026-12-09T00:00:00.000Z") },
      { createdAt: D("2026-12-06T23:59:59.000Z"), completedAt: null },
      { createdAt: D("2026-11-24T00:00:00.000Z"), completedAt: D("2026-12-01T00:00:00.000Z") },
    ], now, 3);
    expect(r.map((w) => [w.created, w.completed])).toEqual([[1, 0], [1, 1], [1, 1]]);
  });
  it("ignores activity outside the window and treats Sunday as the end of the previous week", () => {
    const r = computeWeeklyProgress([{ createdAt: D("2026-01-01T00:00:00.000Z") }, { createdAt: D("2026-12-13T23:00:00.000Z") }], now, 2);
    expect(r.map((w) => w.created)).toEqual([0, 1]);
  });
  it("defaults to 8 weeks", () => expect(computeWeeklyProgress([], now)).toHaveLength(8));
});

describe("recentActivity", () => {
  const tasks = [
    { id: 1, title: "A", createdAt: D("2026-12-01T00:00:00.000Z"), completedAt: D("2026-12-05T00:00:00.000Z"), submittedAt: D("2026-12-06T00:00:00.000Z") },
    { id: 2, title: "B", createdAt: D("2026-12-03T00:00:00.000Z"), completedAt: null, submittedAt: null },
  ];
  it("lists created/completed/submitted events, newest first", () => {
    expect(recentActivity(tasks).map((e) => [e.taskId, e.type])).toEqual([[1, "SUBMITTED"], [1, "COMPLETED"], [2, "CREATED"], [1, "CREATED"]]);
  });
  it("respects the limit", () => expect(recentActivity(tasks, 2)).toHaveLength(2));
  it("is empty for no tasks", () => expect(recentActivity([])).toEqual([]));
});
