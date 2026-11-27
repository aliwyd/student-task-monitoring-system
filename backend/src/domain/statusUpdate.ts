import { STATUSES, TaskData, TaskStatus } from "./types";

/** Allowed transitions. SUBMITTED is terminal; submitting requires COMPLETED first. */
export const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  PENDING: ["IN_PROGRESS", "COMPLETED"],
  IN_PROGRESS: ["PENDING", "COMPLETED"],
  COMPLETED: ["IN_PROGRESS", "SUBMITTED"],
  SUBMITTED: [],
};

export type StatusChangeResult = { ok: true; task: TaskData } | { ok: false; error: string };

export function applyStatusChange(task: TaskData, next: TaskStatus, now: Date): StatusChangeResult {
  if (!STATUSES.includes(next)) return { ok: false, error: "Unknown status" };
  if (task.status === next) return { ok: false, error: "Task already has this status" };
  if (!TRANSITIONS[task.status].includes(next)) {
    return { ok: false, error: `Cannot change status from ${task.status} to ${next}` };
  }
  const updated: TaskData = { ...task, status: next };
  if (next === "COMPLETED") updated.completedAt = now;
  else if (next === "SUBMITTED") updated.submittedAt = now;
  else if (task.status === "COMPLETED") updated.completedAt = null; // reopened
  return { ok: true, task: updated };
}
