import type { TaskData, TaskStatus } from "./types";

export function applyStatusChange(task: TaskData, next: TaskStatus, now: Date):
  { ok: true; task: TaskData } | { ok: false; error: string } {
  const cur = task.status;
  if (!["PENDING", "IN_PROGRESS", "COMPLETED", "SUBMITTED"].includes(next)) return { ok: false, error: "Unknown status" };
  if (cur === next) return { ok: false, error: "Task already has this status" };
  if (cur === "SUBMITTED") return { ok: false, error: "Submitted tasks cannot change status" };
  if (next === "SUBMITTED" && cur !== "COMPLETED") return { ok: false, error: "Only completed tasks can be submitted" };
  const updated: TaskData = { ...task, status: next };
  if (next === "COMPLETED") updated.completedAt = now;
  if (next === "SUBMITTED") updated.submittedAt = now;
  if (cur === "COMPLETED" && next !== "SUBMITTED") updated.completedAt = null;
  return { ok: true, task: updated };
}
