import { describe, it, expect } from "vitest";
import { applyStatusChange } from "../../src/domain/statusUpdate";
import type { TaskData } from "../../src/domain/types";

const now = new Date("2026-12-01T08:00:00.000Z");
const base: TaskData = { title: "t", priority: "MEDIUM", status: "PENDING", dueDate: new Date("2026-12-10T00:00:00.000Z") };
const with_ = (status: TaskData["status"], extra: Partial<TaskData> = {}): TaskData => ({ ...base, status, ...extra });

describe("applyStatusChange", () => {
  it("PENDING -> IN_PROGRESS", () => {
    const r = applyStatusChange(base, "IN_PROGRESS", now);
    expect(r.ok && r.task.status).toBe("IN_PROGRESS");
  });
  it("completing a task sets completedAt", () => {
    const r = applyStatusChange(with_("IN_PROGRESS"), "COMPLETED", now);
    expect(r.ok && r.task.completedAt).toEqual(now);
  });
  it("PENDING -> COMPLETED is allowed", () => {
    expect(applyStatusChange(base, "COMPLETED", now).ok).toBe(true);
  });
  it("submitting a completed task sets submittedAt and keeps completedAt", () => {
    const done = with_("COMPLETED", { completedAt: new Date("2026-11-30T00:00:00.000Z") });
    const r = applyStatusChange(done, "SUBMITTED", now);
    expect(r.ok && r.task.submittedAt).toEqual(now);
    expect(r.ok && r.task.completedAt).toEqual(new Date("2026-11-30T00:00:00.000Z"));
  });
  it("cannot submit a task that is not completed (completion != submission)", () => {
    for (const s of ["PENDING", "IN_PROGRESS"] as const) {
      const r = applyStatusChange(with_(s), "SUBMITTED", now);
      expect(r.ok).toBe(false);
    }
  });
  it("reopening a completed task clears completedAt", () => {
    const done = with_("COMPLETED", { completedAt: now });
    const r = applyStatusChange(done, "IN_PROGRESS", now);
    expect(r.ok && r.task.status).toBe("IN_PROGRESS");
    expect(r.ok && r.task.completedAt).toBeNull();
  });
  it("SUBMITTED is terminal", () => {
    const r = applyStatusChange(with_("SUBMITTED", { submittedAt: now }), "PENDING", now);
    expect(r.ok).toBe(false);
  });
  it("rejects a no-op transition and unknown statuses", () => {
    expect(applyStatusChange(base, "PENDING", now).ok).toBe(false);
    expect(applyStatusChange(base, "DONE" as any, now).ok).toBe(false);
  });
  it("does not mutate the input task", () => {
    const input = with_("PENDING");
    applyStatusChange(input, "COMPLETED", now);
    expect(input.status).toBe("PENDING");
    expect(input.completedAt).toBeUndefined();
  });
});
