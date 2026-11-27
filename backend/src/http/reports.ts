import { Router } from "express";
import type { Ctx } from "./common";
import { me, ok, wrap } from "./common";
import { computeTaskStats } from "../domain/stats";
import { computeSubjectProgress, computeSubmissionStats, computeWeeklyProgress } from "../domain/reports";
import { submissionStatus } from "../domain/submission";
import { toCsv } from "../domain/csv";

export function reportsRouter({ repos, now, authenticate }: Ctx) {
  const r = Router(); r.use(authenticate);

  r.get("/summary", wrap(async (req, res) => {
    const userId = me(req).id;
    const [tasks, subjects] = await Promise.all([repos.tasks.list(userId), repos.subjects.list(userId)]);
    ok(res, {
      stats: computeTaskStats(tasks, now()),
      submissionStats: computeSubmissionStats(tasks),
      bySubject: computeSubjectProgress(tasks, subjects, now()),
      weeklyProgress: computeWeeklyProgress(tasks, now()),
    });
  }));

  r.get("/export.csv", wrap(async (req, res) => {
    const userId = me(req).id;
    const [tasks, subjects] = await Promise.all([repos.tasks.list(userId, { sort: "dueDate" }), repos.subjects.list(userId)]);
    const name = (id: number | null) => subjects.find((s) => s.id === id)?.name ?? "";
    const csv = toCsv(
      ["id", "title", "subject", "priority", "status", "dueDate", "createdAt", "completedAt", "submittedAt", "submissionStatus"],
      tasks.map((t) => [t.id, t.title, name(t.subjectId), t.priority, t.status, t.dueDate, t.createdAt, t.completedAt, t.submittedAt, submissionStatus(t)]),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="tasks.csv"');
    res.send(csv);
  }));
  return r;
}
