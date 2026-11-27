import { describe, it, expect } from "vitest";
import { isOverdue, daysUntilDue, deadlineState } from "../../src/domain/deadlines";

const now = new Date("2026-12-10T12:00:00.000Z");
const task = (status: any, due: string) => ({ status, dueDate: new Date(due) });

describe("isOverdue", () => {
  it("open task past its due instant is overdue", () => {
    expect(isOverdue(task("PENDING", "2026-12-09T00:00:00.000Z"), now)).toBe(true);
    expect(isOverdue(task("IN_PROGRESS", "2026-12-10T11:59:59.000Z"), now)).toBe(true);
  });
  it("open task due in the future is not overdue", () => {
    expect(isOverdue(task("PENDING", "2026-12-10T12:00:01.000Z"), now)).toBe(false);
  });
  it("a task due exactly now is not yet overdue", () => {
    expect(isOverdue(task("PENDING", now.toISOString()), now)).toBe(false);
  });
  it("completed or submitted tasks are never overdue", () => {
    expect(isOverdue(task("COMPLETED", "2026-01-01T00:00:00.000Z"), now)).toBe(false);
    expect(isOverdue(task("SUBMITTED", "2026-01-01T00:00:00.000Z"), now)).toBe(false);
  });
});
describe("daysUntilDue (UTC calendar days)", () => {
  it("same UTC day is 0", () => expect(daysUntilDue(new Date("2026-12-10T23:59:00.000Z"), now)).toBe(0));
  it("counts calendar days ahead", () => expect(daysUntilDue(new Date("2026-12-15T00:00:00.000Z"), now)).toBe(5));
  it("is negative for past dates", () => expect(daysUntilDue(new Date("2026-12-08T20:00:00.000Z"), now)).toBe(-2));
  it("handles month/year boundaries", () => {
    expect(daysUntilDue(new Date("2027-01-02T00:00:00.000Z"), now)).toBe(23);
  });
});
describe("deadlineState", () => {
  it("DONE for completed/submitted", () => expect(deadlineState(task("COMPLETED", "2026-12-01T00:00:00.000Z"), now)).toBe("DONE"));
  it("OVERDUE for late open tasks", () => expect(deadlineState(task("PENDING", "2026-12-09T00:00:00.000Z"), now)).toBe("OVERDUE"));
  it("DUE_SOON within 3 days", () => expect(deadlineState(task("PENDING", "2026-12-13T00:00:00.000Z"), now)).toBe("DUE_SOON"));
  it("UPCOMING beyond 3 days", () => expect(deadlineState(task("PENDING", "2026-12-14T00:00:00.000Z"), now)).toBe("UPCOMING"));
});
