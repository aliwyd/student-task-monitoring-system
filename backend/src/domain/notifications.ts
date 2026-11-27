import { isOverdue, daysUntilDue, isClosed } from "./deadlines";

export function candidateNotifications(
  tasks: { id: number; title: string; status: string; dueDate: Date; completedAt?: Date | null }[], now: Date) {
  const out: { taskId: number; type: string; message: string }[] = [];
  for (const t of tasks) {
    const date = t.dueDate.toISOString().slice(0, 10);
    if (isOverdue(t, now)) out.push({ taskId: t.id, type: "OVERDUE", message: `"${t.title}" was due on ${date} and is now overdue.` });
    else if (!isClosed(t.status) && daysUntilDue(t.dueDate, now) <= 3) out.push({ taskId: t.id, type: "DEADLINE_SOON", message: `"${t.title}" is due on ${date}.` });
    else if (isClosed(t.status) && t.completedAt && now.getTime() - t.completedAt.getTime() <= 48 * 3600000)
      out.push({ taskId: t.id, type: "RECENTLY_COMPLETED", message: `"${t.title}" was completed.` });
  }
  return out;
}
