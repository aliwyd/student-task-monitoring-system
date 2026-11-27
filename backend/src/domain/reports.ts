import { isClosed, isOverdue } from "./deadlines";
import { evaluateSubmission } from "./submission";

const MS_PER_DAY = 86_400_000;
export const NO_SUBJECT_NAME = "No subject";
export const NO_SUBJECT_COLOR = "#9CA3AF";
const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export function computeSubmissionStats(tasks: { dueDate: Date; submittedAt?: Date | null }[]) {
  let onTime = 0, late = 0, notSubmitted = 0;
  for (const t of tasks) {
    if (!t.submittedAt) { notSubmitted++; continue; }
    if (evaluateSubmission(t.dueDate, t.submittedAt).timing === "ON_TIME") onTime++; else late++;
  }
  return { submitted: onTime + late, onTime, late, notSubmitted };
}

export function computeSubjectProgress(tasks: { subjectId?: number | null; status: string; dueDate: Date }[], subjects: { id: number; name: string; color: string }[], now: Date) {
  const row = (subjectId: number | null, name: string, color: string) => {
    const mine = tasks.filter((t) => (t.subjectId ?? null) === subjectId);
    const completed = mine.filter((t) => isClosed(t.status)).length;
    const overdue = mine.filter((t) => isOverdue(t, now)).length;
    return { subjectId, name, color, total: mine.length, completed, overdue, completionPercentage: percent(completed, mine.length) };
  };
  const rows = subjects.map((s) => row(s.id, s.name, s.color));
  const none = row(null, NO_SUBJECT_NAME, NO_SUBJECT_COLOR);
  return none.total ? [...rows, none] : rows;
}

export function computeWeeklyProgress(tasks: { createdAt: Date; completedAt?: Date | null }[], now: Date, weeks = 8) {
  const dow = (now.getUTCDay() + 6) % 7;
  const thisWeek = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - dow * MS_PER_DAY;
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = thisWeek - i * 7 * MS_PER_DAY, end = start + 7 * MS_PER_DAY;
    const inWeek = (d?: Date | null) => !!d && d.getTime() >= start && d.getTime() < end;
    out.push({ weekStart: new Date(start).toISOString().slice(0, 10), created: tasks.filter((t) => inWeek(t.createdAt)).length, completed: tasks.filter((t) => inWeek(t.completedAt)).length });
  }
  return out;
}

export function recentActivity(tasks: { id: number; title: string; createdAt: Date; completedAt?: Date | null; submittedAt?: Date | null }[], limit = 10) {
  const events: { type: "CREATED" | "COMPLETED" | "SUBMITTED"; taskId: number; title: string; at: Date }[] = [];
  for (const t of tasks) {
    events.push({ type: "CREATED", taskId: t.id, title: t.title, at: t.createdAt });
    if (t.completedAt) events.push({ type: "COMPLETED", taskId: t.id, title: t.title, at: t.completedAt });
    if (t.submittedAt) events.push({ type: "SUBMITTED", taskId: t.id, title: t.title, at: t.submittedAt });
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
