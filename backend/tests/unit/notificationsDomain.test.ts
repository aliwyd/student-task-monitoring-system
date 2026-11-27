import { describe, it, expect } from "vitest";
import { candidateNotifications } from "../../src/domain/notifications";

const now = new Date("2026-12-10T12:00:00.000Z");
const t = (id: number, status: string, due: string, completedAt: string | null = null, title = `Task ${id}`) =>
  ({ id, title, status, dueDate: new Date(due), completedAt: completedAt ? new Date(completedAt) : null });

describe("candidateNotifications", () => {
  it("flags overdue open tasks", () => {
    const r = candidateNotifications([t(1, "PENDING", "2026-12-01T00:00:00.000Z")], now);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ taskId: 1, type: "OVERDUE" });
    expect(r[0].message).toContain("Task 1");
  });
  it("flags tasks due within 3 days as DEADLINE_SOON", () => {
    const r = candidateNotifications([t(1, "IN_PROGRESS", "2026-12-13T00:00:00.000Z")], now);
    expect(r.map((x) => x.type)).toEqual(["DEADLINE_SOON"]);
  });
  it("ignores open tasks due later than 3 days", () => {
    expect(candidateNotifications([t(1, "PENDING", "2026-12-14T00:00:00.000Z")], now)).toEqual([]);
  });
  it("flags tasks completed within the last 48 hours", () => {
    const r = candidateNotifications([t(1, "COMPLETED", "2026-12-30T00:00:00.000Z", "2026-12-08T12:00:00.000Z")], now);
    expect(r.map((x) => x.type)).toEqual(["RECENTLY_COMPLETED"]);
  });
  it("does not flag tasks completed more than 48 hours ago", () => {
    expect(candidateNotifications([t(1, "COMPLETED", "2026-12-30T00:00:00.000Z", "2026-12-08T11:59:59.000Z")], now)).toEqual([]);
  });
  it("a completed task past its due date is never overdue", () => {
    const r = candidateNotifications([t(1, "SUBMITTED", "2026-12-01T00:00:00.000Z", "2026-12-10T10:00:00.000Z")], now);
    expect(r.map((x) => x.type)).toEqual(["RECENTLY_COMPLETED"]);
  });
  it("handles a completed task without a completion date", () => {
    expect(candidateNotifications([t(1, "COMPLETED", "2026-12-01T00:00:00.000Z", null)], now)).toEqual([]);
  });
  it("returns one entry per qualifying task", () => {
    const r = candidateNotifications([t(1, "PENDING", "2026-12-01T00:00:00.000Z"), t(2, "PENDING", "2026-12-11T00:00:00.000Z"), t(3, "PENDING", "2027-02-01T00:00:00.000Z")], now);
    expect(r.map((x) => [x.taskId, x.type])).toEqual([[1, "OVERDUE"], [2, "DEADLINE_SOON"]]);
  });
});
