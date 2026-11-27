import { describe, it, expect } from "vitest";
import { evaluateSubmission, submissionStatus } from "../../src/domain/submission";

const due = new Date("2026-12-10T12:00:00.000Z");
describe("evaluateSubmission", () => {
  it("before the deadline is ON_TIME", () => {
    const r = evaluateSubmission(due, new Date("2026-12-09T12:00:00.000Z"));
    expect(r.timing).toBe("ON_TIME");
    expect(r.lateByHours).toBe(0);
  });
  it("exactly at the deadline is ON_TIME", () => expect(evaluateSubmission(due, due).timing).toBe("ON_TIME"));
  it("after the deadline is LATE with hours rounded up", () => {
    const r = evaluateSubmission(due, new Date("2026-12-10T13:30:00.000Z"));
    expect(r.timing).toBe("LATE");
    expect(r.lateByHours).toBe(2);
  });
  it("one second late is LATE (1 hour)", () => {
    const r = evaluateSubmission(due, new Date("2026-12-10T12:00:01.000Z"));
    expect(r.timing).toBe("LATE"); expect(r.lateByHours).toBe(1);
  });
});
describe("submissionStatus", () => {
  it("NOT_SUBMITTED without a submission date", () => {
    expect(submissionStatus({ dueDate: due, submittedAt: null })).toBe("NOT_SUBMITTED");
    expect(submissionStatus({ dueDate: due })).toBe("NOT_SUBMITTED");
  });
  it("SUBMITTED_ON_TIME / SUBMITTED_LATE from timestamps", () => {
    expect(submissionStatus({ dueDate: due, submittedAt: new Date("2026-12-10T00:00:00.000Z") })).toBe("SUBMITTED_ON_TIME");
    expect(submissionStatus({ dueDate: due, submittedAt: new Date("2026-12-11T00:00:00.000Z") })).toBe("SUBMITTED_LATE");
  });
  it("a completed-but-unsubmitted task is still NOT_SUBMITTED", () => {
    expect(submissionStatus({ dueDate: due, submittedAt: null })).toBe("NOT_SUBMITTED");
  });
});
