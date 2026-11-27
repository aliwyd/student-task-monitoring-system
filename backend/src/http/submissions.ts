import { Router } from "express";
import type { Ctx } from "./common";
import { fail, idParam, makeTaskDto, me, ok, wrap } from "./common";
import type { SubmissionRecord, Task } from "../repositories/types";
import { applyStatusChange } from "../domain/statusUpdate";
import { evaluateSubmission } from "../domain/submission";
import { computeSubmissionStats } from "../domain/reports";

const protocolOf = (s: string) => { try { return new URL(s).protocol; } catch { return ""; } };

function parseDetails(b: any) {
  const errors: Record<string, string> = {}; const d: { link?: string | null; remarks?: string | null } = {};
  if ("link" in b) {
    if (b.link === null || b.link === "") d.link = null;
    else if (typeof b.link === "string" && b.link.length <= 500 && ["http:", "https:"].includes(protocolOf(b.link))) d.link = b.link;
    else errors.link = "Link must be a valid http(s) URL (max 500 characters)";
  }
  if ("remarks" in b) {
    if (b.remarks === null || b.remarks === "") d.remarks = null;
    else if (typeof b.remarks === "string" && b.remarks.length <= 1000) d.remarks = b.remarks;
    else errors.remarks = "Remarks must be at most 1000 characters";
  }
  return { errors, d };
}
const toDto = (s: SubmissionRecord, task: Task) => ({
  id: s.id, taskId: s.taskId, taskTitle: task.title, dueDate: task.dueDate, submittedAt: s.submittedAt, link: s.link, remarks: s.remarks,
  ...evaluateSubmission(task.dueDate, s.submittedAt),
});

export function submissionsRouter({ repos, now, authenticate }: Ctx) {
  const r = Router(); r.use(authenticate);
  const taskDto = makeTaskDto(now);

  r.get("/", wrap(async (req, res) => {
    const userId = me(req).id;
    const [tasks, subjects, records] = await Promise.all([repos.tasks.list(userId, { sort: "dueDate" }), repos.subjects.list(userId), repos.submissions.list(userId)]);
    const items = tasks.map((t) => {
      const rec = records.find((x) => x.taskId === t.id);
      const subject = subjects.find((s) => s.id === t.subjectId);
      return { task: taskDto(t), subjectName: subject?.name ?? null, subjectColor: subject?.color ?? null, submission: rec ? toDto(rec, t) : null };
    });
    ok(res, { items, summary: computeSubmissionStats(tasks) });
  }));

  r.post("/", wrap(async (req, res) => {
    const userId = me(req).id; const body = req.body ?? {};
    const { errors, d } = parseDetails(body);
    if (!Number.isInteger(body.taskId) || body.taskId < 1) errors.taskId = "taskId is required";
    if (Object.keys(errors).length) throw fail(400, "Validation failed", errors);
    const task = await repos.tasks.get(userId, body.taskId);
    if (!task) throw fail(404, "Task not found");
    if (await repos.submissions.getByTask(userId, task.id)) throw fail(409, "This task has already been submitted");
    const change = applyStatusChange(task, "SUBMITTED", now());
    if (!change.ok) throw fail(409, change.error);
    const submittedAt = now();
    const rec = await repos.submissions.create(userId, { taskId: task.id, submittedAt, ...d });
    const updated = await repos.tasks.update(userId, task.id, { status: "SUBMITTED", submittedAt });
    ok(res, { submission: toDto(rec, updated ?? task), task: taskDto(updated ?? task) }, 201);
  }));

  r.put("/:id", wrap(async (req, res) => {
    const userId = me(req).id; const id = idParam(req);
    const { errors, d } = parseDetails(req.body ?? {});
    const rec = await repos.submissions.get(userId, id);
    if (!rec) throw fail(404, "Submission not found");
    if (Object.keys(errors).length) throw fail(400, "Validation failed", errors);
    const updated = await repos.submissions.update(userId, id, d);
    const task = await repos.tasks.get(userId, rec.taskId);
    if (!updated || !task) throw fail(404, "Submission not found");
    ok(res, { submission: toDto(updated, task) });
  }));
  return r;
}
