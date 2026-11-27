export function validateCreateTask(input: any):
  | { ok: true; data: any }
  | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  if (!title) errors.title = "Title is required";
  else if (title.length > 200) errors.title = "Title must be at most 200 characters";

  const priority = input?.priority ?? "MEDIUM";
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) errors.priority = "Invalid priority";

  const due = input?.dueDate ? new Date(input.dueDate) : null;
  if (!due || isNaN(due.getTime())) errors.dueDate = "A valid due date is required";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      title, priority, status: "PENDING", dueDate: due,
      description: input.description, notes: input.notes, subjectId: input.subjectId,
    },
  };
}
