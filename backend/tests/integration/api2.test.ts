import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app";
import { backends } from "../helpers/repos";

const NOW = new Date("2026-12-10T12:00:00.000Z");
const PW = "Passw0rd!";

describe.each(backends)("API part 2 on $name repositories", ({ make }) => {
  let app: Express;
  let close: () => Promise<void>;
  beforeEach(async () => {
    const b = await make();
    close = b.close;
    app = createApp({ repos: b.repos, jwtSecret: "test-secret", now: () => NOW, bcryptRounds: 4 });
  });
  afterEach(async () => { await close(); });

  const signup = async (email = "a@example.com", name = "Alice") =>
    (await request(app).post("/api/auth/register").send({ name, email, password: PW })).body.data.token as string;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const mkTask = async (t: string, body: object = {}) =>
    (await request(app).post("/api/tasks").set(auth(t)).send({ title: "Essay", dueDate: "2026-12-20T00:00:00.000Z", ...body })).body.data.task;
  const setStatus = (t: string, id: number, status: string) => request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ status });
  const submit = (t: string, body: object) => request(app).post("/api/submissions").set(auth(t)).send(body);

  describe("submissions", () => {
    it("requires authentication", async () => {
      expect((await request(app).get("/api/submissions")).status).toBe(401);
      expect((await request(app).post("/api/submissions").send({})).status).toBe(401);
    });
    it("refuses to submit a task that is not completed", async () => {
      const t = await signup();
      const task = await mkTask(t);
      const r = await submit(t, { taskId: task.id });
      expect(r.status).toBe(409);
      const after = await request(app).get(`/api/tasks/${task.id}`).set(auth(t));
      expect(after.body.data.task.status).toBe("PENDING");
    });
    it("records an on-time submission and marks the task SUBMITTED", async () => {
      const t = await signup();
      const task = await mkTask(t);
      await setStatus(t, task.id, "COMPLETED");
      const r = await submit(t, { taskId: task.id, link: "https://lms.example.com/work/1", remarks: "Uploaded PDF" });
      expect(r.status).toBe(201);
      expect(r.body.data.submission).toMatchObject({ taskId: task.id, taskTitle: "Essay", timing: "ON_TIME", lateByHours: 0, link: "https://lms.example.com/work/1", remarks: "Uploaded PDF", submittedAt: NOW.toISOString() });
      const after = await request(app).get(`/api/tasks/${task.id}`).set(auth(t));
      expect(after.body.data.task).toMatchObject({ status: "SUBMITTED", submissionStatus: "SUBMITTED_ON_TIME" });
    });
    it("flags late submissions with hours late", async () => {
      const t = await signup();
      const task = await mkTask(t, { dueDate: "2026-12-01T00:00:00.000Z" });
      await setStatus(t, task.id, "COMPLETED");
      const r = await submit(t, { taskId: task.id });
      expect(r.body.data.submission).toMatchObject({ timing: "LATE", lateByHours: 228 });
    });
    it("rejects a second submission for the same task", async () => {
      const t = await signup();
      const task = await mkTask(t);
      await setStatus(t, task.id, "COMPLETED");
      expect((await submit(t, { taskId: task.id })).status).toBe(201);
      expect((await submit(t, { taskId: task.id })).status).toBe(409);
    });
    it("validates input and ownership", async () => {
      const a = await signup("a@example.com"); const b = await signup("b@example.com");
      const task = await mkTask(a);
      await setStatus(a, task.id, "COMPLETED");
      expect((await submit(a, {})).status).toBe(400);
      expect((await submit(a, { taskId: task.id, link: "javascript:alert(1)" })).status).toBe(400);
      expect((await submit(a, { taskId: task.id, link: "not a url" })).status).toBe(400);
      expect((await submit(a, { taskId: task.id, remarks: "x".repeat(1001) })).status).toBe(400);
      expect((await submit(a, { taskId: 99999 })).status).toBe(404);
      expect((await submit(b, { taskId: task.id })).status).toBe(404);
    });
    it("lists every task with its submission state and a summary (completed != submitted)", async () => {
      const t = await signup();
      const done = await mkTask(t, { title: "Submitted one" });
      const completedOnly = await mkTask(t, { title: "Completed only" });
      await mkTask(t, { title: "Untouched" });
      await setStatus(t, done.id, "COMPLETED"); await submit(t, { taskId: done.id });
      await setStatus(t, completedOnly.id, "COMPLETED");
      const r = await request(app).get("/api/submissions").set(auth(t));
      expect(r.status).toBe(200);
      expect(r.body.data.summary).toEqual({ submitted: 1, onTime: 1, late: 0, notSubmitted: 2 });
      const by = Object.fromEntries(r.body.data.items.map((i: any) => [i.task.title, i]));
      expect(by["Submitted one"].submission).not.toBeNull();
      expect(by["Completed only"].submission).toBeNull();
      expect(by["Completed only"].task).toMatchObject({ status: "COMPLETED", submissionStatus: "NOT_SUBMITTED" });
    });
    it("edits link and remarks of a submission; others cannot", async () => {
      const a = await signup("a@example.com"); const b = await signup("b@example.com");
      const task = await mkTask(a); await setStatus(a, task.id, "COMPLETED");
      const id = (await submit(a, { taskId: task.id })).body.data.submission.id;
      const r = await request(app).put(`/api/submissions/${id}`).set(auth(a)).send({ link: "https://example.com/new", remarks: "updated" });
      expect(r.status).toBe(200);
      expect(r.body.data.submission).toMatchObject({ link: "https://example.com/new", remarks: "updated" });
      expect((await request(app).put(`/api/submissions/${id}`).set(auth(a)).send({ link: "ftp://x" })).status).toBe(400);
      expect((await request(app).put(`/api/submissions/${id}`).set(auth(b)).send({ remarks: "hijack" })).status).toBe(404);
      expect((await request(app).put("/api/submissions/9999").set(auth(a)).send({})).status).toBe(404);
    });
    it("removes the submission record when its task is deleted", async () => {
      const t = await signup();
      const task = await mkTask(t); await setStatus(t, task.id, "COMPLETED");
      const id = (await submit(t, { taskId: task.id })).body.data.submission.id;
      await request(app).delete(`/api/tasks/${task.id}`).set(auth(t));
      expect((await request(app).get("/api/submissions").set(auth(t))).body.data.items).toHaveLength(0);
      expect((await request(app).put(`/api/submissions/${id}`).set(auth(t)).send({ remarks: "x" })).status).toBe(404);
    });
  });

  describe("notifications", () => {
    it("requires authentication and starts empty", async () => {
      expect((await request(app).get("/api/notifications")).status).toBe(401);
      const t = await signup();
      const r = await request(app).get("/api/notifications").set(auth(t));
      expect(r.body.data).toEqual({ notifications: [], unreadCount: 0 });
    });
    it("generates notifications from task data without duplicating them", async () => {
      const t = await signup();
      await mkTask(t, { title: "late", dueDate: "2026-12-01T00:00:00.000Z" });
      await mkTask(t, { title: "soon", dueDate: "2026-12-12T00:00:00.000Z" });
      await mkTask(t, { title: "far", dueDate: "2026-12-30T00:00:00.000Z" });
      const done = await mkTask(t, { title: "done", dueDate: "2026-12-30T00:00:00.000Z" });
      await setStatus(t, done.id, "COMPLETED");
      const first = await request(app).get("/api/notifications").set(auth(t));
      const types = first.body.data.notifications.map((n: any) => n.type).sort();
      expect(types).toEqual(["DEADLINE_SOON", "OVERDUE", "RECENTLY_COMPLETED"]);
      expect(first.body.data.unreadCount).toBe(3);
      const second = await request(app).get("/api/notifications").set(auth(t));
      expect(second.body.data.notifications).toHaveLength(3);
    });
    it("marks a notification as read and keeps it read", async () => {
      const t = await signup();
      await mkTask(t, { dueDate: "2026-12-01T00:00:00.000Z" });
      const n = (await request(app).get("/api/notifications").set(auth(t))).body.data.notifications[0];
      const r = await request(app).patch(`/api/notifications/${n.id}/read`).set(auth(t));
      expect(r.status).toBe(200);
      expect(r.body.data.notification.read).toBe(true);
      expect((await request(app).patch(`/api/notifications/${n.id}/read`).set(auth(t))).status).toBe(200);
      const list = await request(app).get("/api/notifications").set(auth(t));
      expect(list.body.data.unreadCount).toBe(0);
      expect(list.body.data.notifications[0].read).toBe(true);
    });
    it("rejects bad ids, unknown ids and other users' notifications", async () => {
      const a = await signup("a@example.com"); const b = await signup("b@example.com");
      await mkTask(a, { dueDate: "2026-12-01T00:00:00.000Z" });
      const n = (await request(app).get("/api/notifications").set(auth(a))).body.data.notifications[0];
      expect((await request(app).patch("/api/notifications/abc/read").set(auth(a))).status).toBe(400);
      expect((await request(app).patch("/api/notifications/9999/read").set(auth(a))).status).toBe(404);
      expect((await request(app).patch(`/api/notifications/${n.id}/read`).set(auth(b))).status).toBe(404);
      expect((await request(app).get("/api/notifications").set(auth(b))).body.data.notifications).toHaveLength(0);
    });
    it("drops an overdue notice once the task is completed and announces the completion", async () => {
      const t = await signup();
      const task = await mkTask(t, { dueDate: "2026-12-01T00:00:00.000Z" });
      await request(app).get("/api/notifications").set(auth(t));
      await setStatus(t, task.id, "COMPLETED");
      const types = (await request(app).get("/api/notifications").set(auth(t))).body.data.notifications.map((n: any) => n.type);
      expect(types).toEqual(["RECENTLY_COMPLETED"]);
    });
  });

  describe("reports", () => {
    const seed = async (t: string) => {
      const math = (await request(app).post("/api/subjects").set(auth(t)).send({ name: "Math", color: "#112233" })).body.data.subject;
      const a = await mkTask(t, { title: "A", subjectId: math.id });
      await mkTask(t, { title: "B", subjectId: math.id });
      await mkTask(t, { title: "C", dueDate: "2026-12-01T00:00:00.000Z" });
      await setStatus(t, a.id, "COMPLETED");
      return { math, a };
    };
    it("requires authentication", async () => {
      expect((await request(app).get("/api/reports/summary")).status).toBe(401);
      expect((await request(app).get("/api/reports/export.csv")).status).toBe(401);
    });
    it("summarises tasks, submissions, subjects and weeks from stored data", async () => {
      const t = await signup();
      const { math, a } = await seed(t);
      await submit(t, { taskId: a.id });
      const r = await request(app).get("/api/reports/summary").set(auth(t));
      expect(r.status).toBe(200);
      const d = r.body.data;
      expect(d.stats).toMatchObject({ total: 3, completed: 1, overdue: 1, pending: 1, completionPercentage: 33 });
      expect(d.submissionStats).toEqual({ submitted: 1, onTime: 1, late: 0, notSubmitted: 2 });
      expect(d.bySubject).toEqual([
        { subjectId: math.id, name: "Math", color: "#112233", total: 2, completed: 1, overdue: 0, completionPercentage: 50 },
        { subjectId: null, name: "No subject", color: "#9CA3AF", total: 1, completed: 0, overdue: 1, completionPercentage: 0 },
      ]);
      expect(d.weeklyProgress).toHaveLength(8);
      expect(d.weeklyProgress[7]).toEqual({ weekStart: "2026-12-07", created: 3, completed: 1 });
    });
    it("only reports the current user's data", async () => {
      const a = await signup("a@example.com"); const b = await signup("b@example.com");
      await seed(a);
      const r = await request(app).get("/api/reports/summary").set(auth(b));
      expect(r.body.data.stats.total).toBe(0);
      expect(r.body.data.bySubject).toEqual([]);
    });
    it("exports the user's tasks as CSV with injection protection", async () => {
      const a = await signup("a@example.com"); const b = await signup("b@example.com");
      await mkTask(a, { title: "=HYPERLINK(\"http://evil\")" });
      await mkTask(a, { title: "Normal, with comma" });
      await mkTask(b, { title: "Bob private" });
      const r = await request(app).get("/api/reports/export.csv").set(auth(a));
      expect(r.status).toBe(200);
      expect(r.headers["content-type"]).toMatch(/text\/csv/);
      expect(r.headers["content-disposition"]).toMatch(/attachment; filename=/);
      const lines = r.text.split("\r\n");
      expect(lines[0]).toBe("id,title,subject,priority,status,dueDate,createdAt,completedAt,submittedAt,submissionStatus");
      expect(r.text).toContain("\"'=HYPERLINK(\"\"http://evil\"\")\"");
      expect(r.text).toContain("\"Normal, with comma\"");
      expect(r.text).not.toContain("Bob private");
    });
  });

  describe("dashboard extras", () => {
    it("includes weekly progress and recent activity", async () => {
      const t = await signup();
      const task = await mkTask(t);
      await setStatus(t, task.id, "COMPLETED");
      const r = await request(app).get("/api/dashboard/summary").set(auth(t));
      expect(r.body.data.weeklyProgress).toHaveLength(8);
      expect(r.body.data.recentActivity.map((e: any) => e.type).sort()).toEqual(["COMPLETED", "CREATED"]);
      expect(r.body.data.recentActivity[0]).toMatchObject({ taskId: task.id, title: "Essay" });
    });
  });

  describe("profile and password", () => {
    it("requires authentication", async () => {
      expect((await request(app).put("/api/auth/me").send({ name: "x" })).status).toBe(401);
      expect((await request(app).put("/api/auth/password").send({})).status).toBe(401);
    });
    it("updates name and email, enforcing validity and uniqueness", async () => {
      const t = await signup("a@example.com"); await signup("b@example.com");
      const r = await request(app).put("/api/auth/me").set(auth(t)).send({ name: "Alice Smith", email: "New@Example.com" });
      expect(r.status).toBe(200);
      expect(r.body.data.user).toMatchObject({ name: "Alice Smith", email: "new@example.com" });
      expect(JSON.stringify(r.body)).not.toMatch(/passwordHash/);
      expect((await request(app).put("/api/auth/me").set(auth(t)).send({ name: "" })).status).toBe(400);
      expect((await request(app).put("/api/auth/me").set(auth(t)).send({ email: "bad" })).status).toBe(400);
      expect((await request(app).put("/api/auth/me").set(auth(t)).send({ email: "b@example.com" })).status).toBe(409);
      const me = await request(app).get("/api/auth/me").set(auth(t));
      expect(me.body.data.user.email).toBe("new@example.com");
    });
    it("changes the password only with the correct current password", async () => {
      const t = await signup("a@example.com");
      const wrong = await request(app).put("/api/auth/password").set(auth(t)).send({ currentPassword: "Wrong123!", newPassword: "NewPassw0rd!" });
      expect(wrong.status).toBe(400);
      expect(wrong.body.error.details.currentPassword).toBeDefined();
      const weak = await request(app).put("/api/auth/password").set(auth(t)).send({ currentPassword: PW, newPassword: "short" });
      expect(weak.status).toBe(400);
      expect(weak.body.error.details.newPassword).toBeDefined();
      const ok = await request(app).put("/api/auth/password").set(auth(t)).send({ currentPassword: PW, newPassword: "NewPassw0rd!" });
      expect(ok.status).toBe(200);
      expect((await request(app).post("/api/auth/login").send({ email: "a@example.com", password: PW })).status).toBe(401);
      expect((await request(app).post("/api/auth/login").send({ email: "a@example.com", password: "NewPassw0rd!" })).status).toBe(200);
    });
  });
});
