import { isOverdue } from "./deadlines";
export function computeTaskStats(tasks: { status: string; dueDate: Date }[], now: Date) {
  const byStatus: any = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, SUBMITTED: 0 };
  let completed = 0, overdue = 0, pending = 0;
  for (const t of tasks) {
    byStatus[t.status]++;
    if (t.status === "COMPLETED" || t.status === "SUBMITTED") completed++;
    else if (isOverdue(t, now)) overdue++;
    else pending++;
  }
  const total = tasks.length;
  return { total, completed, pending, overdue, completionPercentage: total ? Math.round((completed / total) * 100) : 0, byStatus };
}
