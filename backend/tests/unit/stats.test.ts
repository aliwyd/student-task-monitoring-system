import { describe, it, expect } from "vitest";
import { computeTaskStats } from "../../src/domain/stats";

const now = new Date("2026-12-10T12:00:00.000Z");
const t = (status: any, due = "2026-12-20T00:00:00.000Z") => ({ status, dueDate: new Date(due) });

describe("computeTaskStats", () => {
  it("returns zeros and 0% for no tasks (no divide-by-zero)", () => {
    expect(computeTaskStats([], now)).toEqual({
      total: 0, completed: 0, pending: 0, overdue: 0, completionPercentage: 0,
      byStatus: { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, SUBMITTED: 0 },
    });
  });
  it("counts completed as COMPLETED + SUBMITTED", () => {
    const s = computeTaskStats([t("COMPLETED"), t("SUBMITTED"), t("PENDING")], now);
    expect(s.total).toBe(3); expect(s.completed).toBe(2);
  });
  it("splits open tasks into overdue and pending", () => {
    const s = computeTaskStats([t("PENDING"), t("IN_PROGRESS"), t("PENDING", "2026-12-01T00:00:00.000Z")], now);
    expect(s.overdue).toBe(1); expect(s.pending).toBe(2);
  });
  it("completed tasks past due are not overdue", () => {
    const s = computeTaskStats([t("COMPLETED", "2026-01-01T00:00:00.000Z")], now);
    expect(s.overdue).toBe(0);
  });
  it("rounds the completion percentage to a whole number", () => {
    expect(computeTaskStats([t("COMPLETED"), t("PENDING"), t("PENDING")], now).completionPercentage).toBe(33);
    expect(computeTaskStats([t("COMPLETED"), t("COMPLETED"), t("PENDING")], now).completionPercentage).toBe(67);
  });
  it("is 100% when everything is done", () => {
    expect(computeTaskStats([t("SUBMITTED"), t("COMPLETED")], now).completionPercentage).toBe(100);
  });
  it("reports counts per status; pending + overdue + completed = total", () => {
    const s = computeTaskStats([t("PENDING"), t("IN_PROGRESS"), t("COMPLETED"), t("SUBMITTED"), t("PENDING", "2026-12-01T00:00:00.000Z")], now);
    expect(s.byStatus).toEqual({ PENDING: 2, IN_PROGRESS: 1, COMPLETED: 1, SUBMITTED: 1 });
    expect(s.pending + s.overdue + s.completed).toBe(s.total);
  });
});
