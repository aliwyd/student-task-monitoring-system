import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app";
import { backends } from "../helpers/repos";

const NOW = new Date("2026-12-10T12:00:00.000Z");
const PW = "Passw0rd!";

describe.each(backends)("API on $name repositories", ({ make }) => {
  let app: Express;
  let close: () => Promise<void>;
  beforeEach(async () => {
    const b = await make();
    close = b.close;
    app = createApp({ repos: b.repos, jwtSecret: "test-secret", now: () => NOW, bcryptRounds: 4 });
  });
  afterEach(async () => { await close(); });

  const signup = async (email = "a@example.com", name = "Alice") => {
    const r = await request(app).post("/api/auth/register").send({ name, email, password: PW });
    return r.body.data.token as string;
  };
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const mkTask = (t: string, body: object = {}) =>
    request(app).post("/api/tasks").set(auth(t)).send({ title: "Essay", dueDate: "2026-12-20T00:00:00.000Z", ...body });

  describe("auth", () => {
    it("registers a user and never returns the password hash", async () => {
      const r = await request(app).post("/api/auth/register").send({ name: "Alice", email: "A@Example.com", password: PW });
      expect(r.status).toBe(201);
      expect(r.body.success).toBe(true);
      expect(r.body.data.user.email).toBe("a@example.com");
      expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|password_hash|\$2[aby]\$/);
      expect(r.body.data.token).toBeTruthy();
    });
    it("rejects duplicate emails with 409", async () => {
      await signup();
      const r = await request(app).post("/api/auth/register").send({ name: "B", email: "a@example.com", password: PW });
      expect(r.status).toBe(409);
      expect(r.body.success).toBe(false);
    });
    it("rejects weak passwords and bad emails with 400", async () => {
      for (const body of [
        { name: "A", email: "a@example.com", password: "short1" },
        { name: "A", email: "a@example.com", password: "onlyletters" },
        { name: "A", email: "not-an-email", password: PW },
        { name: "", email: "a@example.com", password: PW },
      ]) {
        const r = await request(app).post("/api/auth/register").send(body);
        expect(r.status).toBe(400);
        expect(r.body.error.details).toBeDefined();
      }
    });
    it("logs in with correct credentials and rejects wrong ones", async () => {
      await signup();
      const ok = await request(app).post("/api/auth/login").send({ email: "a@example.com", password: PW });
      expect(ok.status).toBe(200);
      expect(ok.body.data.token).toBeTruthy();
      const bad = await request(app).post("/api/auth/login").send({ email: "a@example.com", password: "Wrong123!" });
      expect(bad.status).toBe(401);
      const unknown = await request(app).post("/api/auth/login").send({ email: "zz@example.com", password: PW });
      expect(unknown.status).toBe(401);
      expect(unknown.body.error.message).toBe(bad.body.error.message);
    });
    it("GET /me needs a valid token", async () => {
      const t = await signup();
      expect((await request(app).get("/api/auth/me")).status).toBe(401);
      expect((await request(app).get("/api/auth/me").set(auth("garbage"))).status).toBe(401);
      const r = await request(app).get("/api/auth/me").set(auth(t));
      expect(r.status).toBe(200);
      expect(r.body.data.user.email).toBe("a@example.com");
    });
    it("logout clears the auth cookie", async () => {
      const r = await request(app).post("/api/auth/logout");
      expect(r.status).toBe(200);
      expect(String(r.headers["set-cookie"])).toMatch(/token=;/);
    });
  });

  describe("tasks", () => {
    it("requires authentication", async () => {
      expect((await request(app).get("/api/tasks")).status).toBe(401);
      expect((await request(app).post("/api/tasks").send({})).status).toBe(401);
    });
    it("creates a task with defaults and persists it", async () => {
      const t = await signup();
      const r = await mkTask(t);
      expect(r.status).toBe(201);
      expect(r.body.data.task).toMatchObject({ title: "Essay", priority: "MEDIUM", status: "PENDING", deadlineState: "UPCOMING", submissionStatus: "NOT_SUBMITTED" });
      const list = await request(app).get("/api/tasks").set(auth(t));
      expect(list.body.data.tasks).toHaveLength(1);
      const one = await request(app).get(`/api/tasks/${r.body.data.task.id}`).set(auth(t));
      expect(one.status).toBe(200);
    });
    it("returns 400 with field errors for invalid input", async () => {
      const t = await signup();
      const r = await mkTask(t, { title: "", priority: "URGENT" });
      expect(r.status).toBe(400);
      expect(Object.keys(r.body.error.details)).toEqual(expect.arrayContaining(["title", "priority"]));
    });
    it("returns 404 for a missing task and 400 for a bad id", async () => {
      const t = await signup();
      expect((await request(app).get("/api/tasks/9999").set(auth(t))).status).toBe(404);
      expect((await request(app).get("/api/tasks/abc").set(auth(t))).status).toBe(400);
    });
    it("edits a task", async () => {
      const t = await signup();
      const id = (await mkTask(t)).body.data.task.id;
      const r = await request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ title: "Final essay", priority: "HIGH", notes: "n" });
      expect(r.status).toBe(200);
      expect(r.body.data.task).toMatchObject({ title: "Final essay", priority: "HIGH", notes: "n" });
      const bad = await request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ title: "" });
      expect(bad.status).toBe(400);
    });
    it("status updates set timestamps; invalid transitions return 409", async () => {
      const t = await signup();
      const id = (await mkTask(t)).body.data.task.id;
      const early = await request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ status: "SUBMITTED" });
      expect(early.status).toBe(409);
      const done = await request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ status: "COMPLETED" });
      expect(done.body.data.task.completedAt).toBe(NOW.toISOString());
      expect(done.body.data.task.submissionStatus).toBe("NOT_SUBMITTED");
      const sub = await request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ status: "SUBMITTED" });
      expect(sub.body.data.task).toMatchObject({ status: "SUBMITTED", submittedAt: NOW.toISOString(), submissionStatus: "SUBMITTED_ON_TIME" });
      const after = await request(app).put(`/api/tasks/${id}`).set(auth(t)).send({ status: "PENDING" });
      expect(after.status).toBe(409);
    });
    it("deletes a task", async () => {
      const t = await signup();
      const id = (await mkTask(t)).body.data.task.id;
      expect((await request(app).delete(`/api/tasks/${id}`).set(auth(t))).status).toBe(200);
      expect((await request(app).get(`/api/tasks/${id}`).set(auth(t))).status).toBe(404);
      expect((await request(app).delete(`/api/tasks/${id}`).set(auth(t))).status).toBe(404);
    });
    it("searches, filters and sorts", async () => {
      const t = await signup();
      await mkTask(t, { title: "Math homework", priority: "HIGH", dueDate: "2026-12-25T00:00:00.000Z" });
      await mkTask(t, { title: "History essay", priority: "LOW", dueDate: "2026-12-12T00:00:00.000Z" });
      await mkTask(t, { title: "Math quiz", priority: "LOW", dueDate: "2026-12-18T00:00:00.000Z" });
      const get = async (q: string) => (await request(app).get(`/api/tasks?${q}`).set(auth(t))).body.data.tasks.map((x: any) => x.title);
      expect(await get("search=math")).toEqual(expect.arrayContaining(["Math homework", "Math quiz"]));
      expect(await get("search=math")).toHaveLength(2);
      expect(await get("priority=LOW&sort=dueDate")).toEqual(["History essay", "Math quiz"]);
      expect(await get("sort=-dueDate")).toEqual(["Math homework", "Math quiz", "History essay"]);
      expect(await get("status=COMPLETED")).toEqual([]);
      expect((await request(app).get("/api/tasks?status=NOPE").set(auth(t))).status).toBe(400);
    });
  });

  describe("subjects", () => {
    it("creates, lists, edits and deletes subjects; names are unique per user", async () => {
      const t = await signup();
      const c = await request(app).post("/api/subjects").set(auth(t)).send({ name: "Math", code: "MTH101" });
      expect(c.status).toBe(201);
      expect(c.body.data.subject.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect((await request(app).post("/api/subjects").set(auth(t)).send({ name: "Math" })).status).toBe(409);
      expect((await request(app).post("/api/subjects").set(auth(t)).send({ name: "" })).status).toBe(400);
      const id = c.body.data.subject.id;
      const u = await request(app).put(`/api/subjects/${id}`).set(auth(t)).send({ name: "Calculus", color: "#ff0000" });
      expect(u.body.data.subject).toMatchObject({ name: "Calculus", color: "#ff0000" });
      expect((await request(app).get("/api/subjects").set(auth(t))).body.data.subjects).toHaveLength(1);
      expect((await request(app).delete(`/api/subjects/${id}`).set(auth(t))).status).toBe(200);
      expect((await request(app).get("/api/subjects").set(auth(t))).body.data.subjects).toHaveLength(0);
    });
    it("assigns tasks to subjects, filters by subject, and keeps tasks when a subject is deleted", async () => {
      const t = await signup();
      const sid = (await request(app).post("/api/subjects").set(auth(t)).send({ name: "Math" })).body.data.subject.id;
      const tid = (await mkTask(t, { subjectId: sid })).body.data.task.id;
      await mkTask(t, { title: "Other" });
      const f = await request(app).get(`/api/tasks?subjectId=${sid}`).set(auth(t));
      expect(f.body.data.tasks.map((x: any) => x.id)).toEqual([tid]);
      await request(app).delete(`/api/subjects/${sid}`).set(auth(t));
      const after = await request(app).get(`/api/tasks/${tid}`).set(auth(t));
      expect(after.status).toBe(200);
      expect(after.body.data.task.subjectId).toBeNull();
    });
  });

  describe("user data isolation", () => {
    it("users cannot see, edit, delete or reference each other's data", async () => {
      const a = await signup("a@example.com", "Alice");
      const b = await signup("b@example.com", "Bob");
      const taskId = (await mkTask(a)).body.data.task.id;
      const subjectId = (await request(app).post("/api/subjects").set(auth(a)).send({ name: "Private" })).body.data.subject.id;

      expect((await request(app).get("/api/tasks").set(auth(b))).body.data.tasks).toHaveLength(0);
      expect((await request(app).get(`/api/tasks/${taskId}`).set(auth(b))).status).toBe(404);
      expect((await request(app).put(`/api/tasks/${taskId}`).set(auth(b)).send({ title: "hijack" })).status).toBe(404);
      expect((await request(app).delete(`/api/tasks/${taskId}`).set(auth(b))).status).toBe(404);
      expect((await request(app).get("/api/subjects").set(auth(b))).body.data.subjects).toHaveLength(0);
      expect((await request(app).put(`/api/subjects/${subjectId}`).set(auth(b)).send({ name: "x" })).status).toBe(404);
      expect((await request(app).delete(`/api/subjects/${subjectId}`).set(auth(b))).status).toBe(404);
      const cross = await mkTask(b, { subjectId });
      expect(cross.status).toBe(400);
      const still = await request(app).get(`/api/tasks/${taskId}`).set(auth(a));
      expect(still.body.data.task.title).toBe("Essay");
    });
  });

  describe("dashboard", () => {
    it("computes the summary from stored tasks", async () => {
      const t = await signup();
      const empty = await request(app).get("/api/dashboard/summary").set(auth(t));
      expect(empty.body.data.stats).toMatchObject({ total: 0, completionPercentage: 0 });
      await mkTask(t, { title: "overdue", dueDate: "2026-12-01T00:00:00.000Z" });
      await mkTask(t, { title: "soon", dueDate: "2026-12-12T00:00:00.000Z" });
      const doneId = (await mkTask(t, { title: "done", dueDate: "2026-12-30T00:00:00.000Z" })).body.data.task.id;
      await request(app).put(`/api/tasks/${doneId}`).set(auth(t)).send({ status: "COMPLETED" });
      const r = await request(app).get("/api/dashboard/summary").set(auth(t));
      expect(r.status).toBe(200);
      expect(r.body.data.stats).toMatchObject({ total: 3, completed: 1, overdue: 1, pending: 1, completionPercentage: 33 });
      expect(r.body.data.upcoming.map((x: any) => x.title)).toEqual(["soon"]);
      expect((await request(app).get("/api/dashboard/summary")).status).toBe(401);
    });
    it("only counts the current user's tasks", async () => {
      const a = await signup("a@example.com");
      const b = await signup("b@example.com");
      await mkTask(a);
      const r = await request(app).get("/api/dashboard/summary").set(auth(b));
      expect(r.body.data.stats.total).toBe(0);
    });
  });
});
