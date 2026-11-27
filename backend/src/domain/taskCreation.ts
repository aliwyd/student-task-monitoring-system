import { PRIORITIES, Priority, TaskData, ValidationResult } from "./types";

export const TITLE_MAX_LENGTH = 200;

const isPriority = (v: unknown): v is Priority => PRIORITIES.includes(v as Priority);
const optionalString = (v: unknown) => (typeof v === "string" ? v : undefined);

export function validateCreateTask(input: Record<string, unknown> | null | undefined): ValidationResult<TaskData> {
  const raw = input ?? {};
  const errors: Record<string, string> = {};

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) errors.title = "Title is required";
  else if (title.length > TITLE_MAX_LENGTH) errors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters`;

  const priority = raw.priority ?? "MEDIUM";
  if (!isPriority(priority)) errors.priority = "Invalid priority";

  const dueDate = raw.dueDate ? new Date(raw.dueDate as string) : null;
  if (!dueDate || isNaN(dueDate.getTime())) errors.dueDate = "A valid due date is required";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      title,
      priority: priority as Priority,
      status: "PENDING",
      dueDate: dueDate as Date,
      description: optionalString(raw.description),
      notes: optionalString(raw.notes),
      subjectId: typeof raw.subjectId === "number" ? raw.subjectId : undefined,
    },
  };
}
