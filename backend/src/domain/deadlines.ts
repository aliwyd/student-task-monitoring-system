export function isOverdue(task: { status: string; dueDate: Date }, now: Date): boolean {
  if (task.status === "COMPLETED" || task.status === "SUBMITTED") return false;
  return task.dueDate.getTime() < now.getTime();
}
export function daysUntilDue(due: Date, now: Date): number {
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / 86400000);
}
export function deadlineState(task: { status: string; dueDate: Date }, now: Date): "DONE" | "OVERDUE" | "DUE_SOON" | "UPCOMING" {
  if (task.status === "COMPLETED" || task.status === "SUBMITTED") return "DONE";
  if (isOverdue(task, now)) return "OVERDUE";
  return daysUntilDue(task.dueDate, now) <= 3 ? "DUE_SOON" : "UPCOMING";
}
