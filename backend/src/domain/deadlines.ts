const MS_PER_DAY = 86_400_000;
export const DUE_SOON_DAYS = 3;
export type DeadlineState = "DONE" | "OVERDUE" | "DUE_SOON" | "UPCOMING";
type DatedTask = { status: string; dueDate: Date };

export const isClosed = (status: string) => status === "COMPLETED" || status === "SUBMITTED";
const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/** An open task is overdue once its due instant has passed. All dates are UTC instants. */
export function isOverdue(task: DatedTask, now: Date): boolean {
  return !isClosed(task.status) && task.dueDate.getTime() < now.getTime();
}
/** Whole UTC calendar days from now to the due date (negative if past). */
export function daysUntilDue(due: Date, now: Date): number {
  return Math.round((utcDay(due) - utcDay(now)) / MS_PER_DAY);
}
export function deadlineState(task: DatedTask, now: Date): DeadlineState {
  if (isClosed(task.status)) return "DONE";
  if (isOverdue(task, now)) return "OVERDUE";
  return daysUntilDue(task.dueDate, now) <= DUE_SOON_DAYS ? "DUE_SOON" : "UPCOMING";
}
