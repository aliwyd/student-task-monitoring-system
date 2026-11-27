import { DUE_SOON_DAYS, daysUntilDue, isClosed, isOverdue } from "./deadlines";

export type NotificationType = "DEADLINE_SOON" | "OVERDUE" | "RECENTLY_COMPLETED";
export interface NotificationCandidate { taskId: number; type: NotificationType; message: string }
export const RECENT_COMPLETION_HOURS = 48;
const MS_PER_HOUR = 3_600_000;

interface NotifiableTask { id: number; title: string; status: string; dueDate: Date; completedAt?: Date | null }
const day = (d: Date) => d.toISOString().slice(0, 10);

function recentlyCompleted(t: NotifiableTask, now: Date) {
  return isClosed(t.status) && !!t.completedAt && now.getTime() - t.completedAt.getTime() <= RECENT_COMPLETION_HOURS * MS_PER_HOUR;
}

/** Notifications that currently apply, derived purely from task data (no background scheduler). */
export function candidateNotifications(tasks: NotifiableTask[], now: Date): NotificationCandidate[] {
  const out: NotificationCandidate[] = [];
  for (const t of tasks) {
    if (isOverdue(t, now)) out.push({ taskId: t.id, type: "OVERDUE", message: `"${t.title}" was due on ${day(t.dueDate)} and is now overdue.` });
    else if (!isClosed(t.status) && daysUntilDue(t.dueDate, now) <= DUE_SOON_DAYS) out.push({ taskId: t.id, type: "DEADLINE_SOON", message: `"${t.title}" is due on ${day(t.dueDate)}.` });
    else if (recentlyCompleted(t, now)) out.push({ taskId: t.id, type: "RECENTLY_COMPLETED", message: `"${t.title}" was completed.` });
  }
  return out;
}
