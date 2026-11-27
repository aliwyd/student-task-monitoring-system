import { PRIORITIES, Priority, STATUSES, TaskStatus } from "./types";
import { TITLE_MAX_LENGTH } from "./taskCreation";

export interface TaskUpdateFields {
  title?: string; description?: string | null; notes?: string | null; subjectId?: number | null;
  priority?: Priority; dueDate?: Date; status?: TaskStatus;
}

/** Validates a partial update; only fields that are present are checked. */
export function validateUpdateTask(raw: Record<string, unknown> | null | undefined):
  { ok: true; data: TaskUpdateFields } | { ok: false; errors: Record<string, string> } {
  const r = raw ?? {}; const errors: Record<string, string> = {}; const d: TaskUpdateFields = {};
  if ("title" in r) {
    const t = typeof r.title === "string" ? r.title.trim() : "";
    if (!t) errors.title = "Title is required"; else if (t.length > TITLE_MAX_LENGTH) errors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters`; else d.title = t;
  }
  if ("priority" in r) { if (PRIORITIES.includes(r.priority as Priority)) d.priority = r.priority as Priority; else errors.priority = "Invalid priority"; }
  if ("status" in r) { if (STATUSES.includes(r.status as TaskStatus)) d.status = r.status as TaskStatus; else errors.status = "Invalid status"; }
  if ("dueDate" in r) { const x = new Date(r.dueDate as string); if (!r.dueDate || isNaN(x.getTime())) errors.dueDate = "A valid due date is required"; else d.dueDate = x; }
  for (const k of ["description", "notes"] as const) {
    if (k in r) { if (r[k] === null || typeof r[k] === "string") d[k] = r[k] as string | null; else errors[k] = `${k} must be text`; }
  }
  if ("subjectId" in r) { if (r.subjectId === null || (Number.isInteger(r.subjectId) && (r.subjectId as number) > 0)) d.subjectId = r.subjectId as number | null; else errors.subjectId = "Invalid subject"; }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: d };
}
