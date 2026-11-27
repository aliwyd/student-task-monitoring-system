import { isClosed, isOverdue } from "./deadlines";
import { STATUSES, TaskStatus } from "./types";

export interface TaskStats {
  total: number;
  completed: number; // COMPLETED + SUBMITTED
  pending: number; // open and not yet overdue
  overdue: number; // open and past due
  completionPercentage: number;
  byStatus: Record<TaskStatus, number>;
}

const emptyByStatus = (): Record<TaskStatus, number> =>
  Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>;

export function computeTaskStats(tasks: { status: string; dueDate: Date }[], now: Date): TaskStats {
  const stats: TaskStats = { total: tasks.length, completed: 0, pending: 0, overdue: 0, completionPercentage: 0, byStatus: emptyByStatus() };
  for (const task of tasks) {
    stats.byStatus[task.status as TaskStatus]++;
    if (isClosed(task.status)) stats.completed++;
    else if (isOverdue(task, now)) stats.overdue++;
    else stats.pending++;
  }
  if (stats.total) stats.completionPercentage = Math.round((stats.completed / stats.total) * 100);
  return stats;
}
