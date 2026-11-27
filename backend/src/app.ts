import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Repos, Subject, Task, TaskFilters, User } from "./repositories/types";
import { validateCreateTask } from "./domain/taskCreation";
import { validateUpdateTask } from "./domain/taskUpdate";
import { applyStatusChange } from "./domain/statusUpdate";
import { deadlineState, daysUntilDue, isClosed, isOverdue } from "./domain/deadlines";
import { submissionStatus } from "./domain/submission";
import { computeTaskStats } from "./domain/stats";
import { PRIORITIES, Priority, STATUSES, TaskStatus } from "./domain/types";

export interface AppOptions { repos: Repos; jwtSecret: string; now?: () => Date; bcryptRounds?: number; corsOrigin?: string }

class HttpError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) { super(message); }
}
const fail = (status: number, message: string, details?: Record<string, string>) => new HttpError(status, message, details);
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };

const publicUser = (u: User) => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt });
const publicSubject = (s: Subject) => ({ id: s.id, name: s.name, code: s.code, description: s.description, color: s.color, createdAt: s.createdAt });

export function createApp(opts: AppOptions) {
  const { repos, jwtSecret } = opts;
  const now = opts.now ?? (() => new Date());
  const rounds = opts.bcryptRounds ?? 12;
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: opts.corsOrigin ?? "http://localhost:5173", credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  const taskDto = (t: Task) => ({ ...t, deadlineState: deadlineState(t, now()), daysUntilDue: daysUntilDue(t.dueDate, now()), submissionStatus: submissionStatus(t) });
  const idParam = (req: Request) => { const n = Number(req.params.id); if (!Number.isInteger(n) || n < 1) throw fail(400, "Invalid id"); return n; };
  const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 7 * 86400_000 };
  const issue = (res: Response, u: User) => { const token = jwt.sign({ sub: u.id }, jwtSecret, { expiresIn: "7d" }); res.cookie("token", token, cookieOpts); return token; };

  const requireAuth = wrap(async (req, res) => { /* replaced below */ });
  const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const h = req.headers.authorization;
      const token = h?.startsWith("Bearer ") ? h.slice(7) : req.cookies?.token;
      if (!token) throw fail(401, "Authentication required");
      let id: number;
      try { id = Number((jwt.verify(token, jwtSecret) as jwt.JwtPayload).sub); } catch { throw fail(401, "Invalid or expired token"); }
      const user = await repos.users.findById(id);
      if (!user) throw fail(401, "Invalid or expired token");
      (req as any).user = user; next();
    } catch (e) { next(e); }
  };
  void requireAuth;
  const me = (req: Request) => (req as any).user as User;

  // ---------- auth ----------
  const auth = express.Router();
  auth.post("/register", wrap(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    const errors: Record<string, string> = {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) errors.name = "Name is required (max 100 characters)";
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "A valid email is required";
    if (typeof password !== "string" || password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      errors.password = "Password must be 8-72 characters and contain a letter and a number";
    if (Object.keys(errors).length) throw fail(400, "Validation failed", errors);
    const normalized = email.trim().toLowerCase();
    if (await repos.users.findByEmail(normalized)) throw fail(409, "An account with this email already exists");
    const user = await repos.users.create({ email: normalized, name: name.trim(), passwordHash: await bcrypt.hash(password, rounds) });
    ok(res, { user: publicUser(user), token: issue(res, user) }, 201);
  }));
  auth.post("/login", wrap(async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = typeof email === "string" && typeof password === "string" ? await repos.users.findByEmail(email.trim().toLowerCase()) : null;
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) throw fail(401, "Invalid email or password");
    ok(res, { user: publicUser(user), token: issue(res, user) });
  }));
  auth.post("/logout", (_req, res) => { res.clearCookie("token", cookieOpts); ok(res, { message: "Logged out" }); });
  auth.get("/me", authenticate, (req, res) => { ok(res, { user: publicUser(me(req)) }); });
  app.use("/api/auth", auth);

  // ---------- subjects ----------
  const subjects = express.Router();
  subjects.use(authenticate);
  const parseSubject = (b: any, partial: boolean) => {
    const errors: Record<string, string> = {}; const d: any = {};
    if (!partial || "name" in b) { const n = typeof b.name === "string" ? b.name.trim() : ""; if (!n || n.length > 100) errors.name = "Name is required (max 100 characters)"; else d.name = n; }
    if ("code" in b) { if (b.code === null || (typeof b.code === "string" && b.code.length <= 20)) d.code = b.code; else errors.code = "Code must be at most 20 characters"; }
    if ("description" in b) { if (b.description === null || (typeof b.description === "string" && b.description.length <= 500)) d.description = b.description; else errors.description = "Description must be at most 500 characters"; }
    if ("color" in b) { if (typeof b.color === "string" && /^#[0-9a-fA-F]{6}$/.test(b.color)) d.color = b.color; else errors.color = "Color must look like #3B82F6"; }
    else if (!partial) d.color = "#3B82F6";
    if (Object.keys(errors).length) throw fail(400, "Validation failed", errors);
    return d;
  };
  subjects.get("/", wrap(async (req, res) => ok(res, { subjects: (await repos.subjects.list(me(req).id)).map(publicSubject) })));
  subjects.post("/", wrap(async (req, res) => {
    const d = parseSubject(req.body ?? {}, false);
    if (await repos.subjects.findByName(me(req).id, d.name)) throw fail(409, "You already have a subject with this name");
    ok(res, { subject: publicSubject(await repos.subjects.create(me(req).id, d)) }, 201);
  }));
  subjects.put("/:id", wrap(async (req, res) => {
    const id = idParam(req); const d = parseSubject(req.body ?? {}, true);
    const clash = d.name ? await repos.subjects.findByName(me(req).id, d.name) : null;
    if (clash && clash.id !== id) throw fail(409, "You already have a subject with this name");
    const s = await repos.subjects.update(me(req).id, id, d);
    if (!s) throw fail(404, "Subject not found");
    ok(res, { subject: publicSubject(s) });
  }));
  subjects.delete("/:id", wrap(async (req, res) => {
    if (!(await repos.subjects.delete(me(req).id, idParam(req)))) throw fail(404, "Subject not found");
    ok(res, { message: "Subject deleted" });
  }));
  app.use("/api/subjects", subjects);

  // ---------- tasks ----------
  const tasks = express.Router();
  tasks.use(authenticate);
  const assertSubject = async (userId: number, subjectId: number | null | undefined) => {
    if (subjectId == null) return;
    if (!(await repos.subjects.get(userId, subjectId))) throw fail(400, "Validation failed", { subjectId: "Subject not found" });
  };
  tasks.get("/", wrap(async (req, res) => {
    const q = req.query; const f: TaskFilters = {}; const errors: Record<string, string> = {};
    if (q.status !== undefined) { if (STATUSES.includes(q.status as TaskStatus)) f.status = q.status as TaskStatus; else errors.status = "Invalid status"; }
    if (q.priority !== undefined) { if (PRIORITIES.includes(q.priority as Priority)) f.priority = q.priority as Priority; else errors.priority = "Invalid priority"; }
    if (q.subjectId !== undefined) { const n = Number(q.subjectId); if (Number.isInteger(n) && n > 0) f.subjectId = n; else errors.subjectId = "Invalid subject"; }
    if (typeof q.search === "string" && q.search.trim()) f.search = q.search.trim();
    if (q.sort !== undefined) { if (q.sort === "dueDate" || q.sort === "-dueDate") f.sort = q.sort; else errors.sort = "Sort must be dueDate or -dueDate"; }
    if (Object.keys(errors).length) throw fail(400, "Validation failed", errors);
    ok(res, { tasks: (await repos.tasks.list(me(req).id, f)).map(taskDto) });
  }));
  tasks.post("/", wrap(async (req, res) => {
    const v = validateCreateTask(req.body);
    if (!v.ok) throw fail(400, "Validation failed", v.errors);
    await assertSubject(me(req).id, v.data.subjectId);
    ok(res, { task: taskDto(await repos.tasks.create(me(req).id, v.data)) }, 201);
  }));
  tasks.get("/:id", wrap(async (req, res) => {
    const t = await repos.tasks.get(me(req).id, idParam(req));
    if (!t) throw fail(404, "Task not found");
    ok(res, { task: taskDto(t) });
  }));
  tasks.put("/:id", wrap(async (req, res) => {
    const id = idParam(req); const userId = me(req).id;
    const existing = await repos.tasks.get(userId, id);
    if (!existing) throw fail(404, "Task not found");
    const v = validateUpdateTask(req.body);
    if (!v.ok) throw fail(400, "Validation failed", v.errors);
    const { status, ...rest } = v.data;
    await assertSubject(userId, rest.subjectId);
    let patch: Record<string, unknown> = { ...rest };
    if (status && status !== existing.status) {
      const r = applyStatusChange(existing, status, now());
      if (!r.ok) throw fail(409, r.error);
      patch = { ...patch, status: r.task.status, completedAt: r.task.completedAt ?? null, submittedAt: r.task.submittedAt ?? null };
    }
    const updated = await repos.tasks.update(userId, id, patch);
    if (!updated) throw fail(404, "Task not found");
    ok(res, { task: taskDto(updated) });
  }));
  tasks.delete("/:id", wrap(async (req, res) => {
    if (!(await repos.tasks.delete(me(req).id, idParam(req)))) throw fail(404, "Task not found");
    ok(res, { message: "Task deleted" });
  }));
  app.use("/api/tasks", tasks);

  // ---------- dashboard ----------
  app.get("/api/dashboard/summary", authenticate, wrap(async (req, res) => {
    const all = await repos.tasks.list(me(req).id, { sort: "dueDate" });
    const upcoming = all.filter((t) => !isClosed(t.status) && !isOverdue(t, now())).slice(0, 5).map(taskDto);
    ok(res, { stats: computeTaskStats(all, now()), upcoming });
  }));

  // ---------- errors ----------
  app.use("/api", (_req, _res, next) => next(fail(404, "Route not found")));
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ success: false, error: { message: err.message, details: err.details } });
    if (err?.type === "entity.parse.failed") return res.status(400).json({ success: false, error: { message: "Malformed JSON body" } });
    console.error(err);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  });
  return app;
}
