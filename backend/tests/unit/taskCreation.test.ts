import { describe, it, expect } from "vitest";
import { validateCreateTask } from "../../src/domain/taskCreation";

describe("validateCreateTask", () => {
  const due = "2026-12-15T10:00:00.000Z";

  it("accepts a minimal valid task and applies defaults", () => {
    const r = validateCreateTask({ title: "Essay", dueDate: due });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.title).toBe("Essay");
      expect(r.data.priority).toBe("MEDIUM");
      expect(r.data.status).toBe("PENDING");
      expect(r.data.dueDate).toEqual(new Date(due));
    }
  });
  it("trims the title", () => {
    const r = validateCreateTask({ title: "  Lab report  ", dueDate: due });
    expect(r.ok && r.data.title).toBe("Lab report");
  });
  it("rejects an empty or whitespace title", () => {
    for (const title of ["", "   "]) {
      const r = validateCreateTask({ title, dueDate: due });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.title).toBeDefined();
    }
  });
  it("rejects a title longer than 200 characters", () => {
    const r = validateCreateTask({ title: "a".repeat(201), dueDate: due });
    expect(r.ok).toBe(false);
  });
  it("rejects a missing or invalid due date", () => {
    expect(validateCreateTask({ title: "x" }).ok).toBe(false);
    const r = validateCreateTask({ title: "x", dueDate: "not-a-date" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.dueDate).toBeDefined();
  });
  it("rejects an unknown priority", () => {
    const r = validateCreateTask({ title: "x", dueDate: due, priority: "URGENT" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.priority).toBeDefined();
  });
  it("accepts an explicit priority and optional fields", () => {
    const r = validateCreateTask({ title: "x", dueDate: due, priority: "HIGH", description: "d", notes: "n", subjectId: 3 });
    expect(r.ok && r.data.priority).toBe("HIGH");
    expect(r.ok && r.data.subjectId).toBe(3);
  });
  it("collects several errors at once", () => {
    const r = validateCreateTask({ title: "", priority: "NOPE" });
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["dueDate", "priority", "title"]);
  });
});
