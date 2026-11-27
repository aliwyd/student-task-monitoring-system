import type { Request, RequestHandler, Response, NextFunction } from "express";
import type { Repos, Task, User } from "../repositories/types";
import { deadlineState, daysUntilDue } from "../domain/deadlines";
import { submissionStatus } from "../domain/submission";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) { super(message); }
}
export const fail = (status: number, message: string, details?: Record<string, string>) => new HttpError(status, message, details);
export const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
export const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };
export const me = (req: Request) => (req as any).user as User;
export function idParam(req: Request) {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n < 1) throw fail(400, "Invalid id");
  return n;
}
export const makeTaskDto = (now: () => Date) => (t: Task) => ({ ...t, deadlineState: deadlineState(t, now()), daysUntilDue: daysUntilDue(t.dueDate, now()), submissionStatus: submissionStatus(t) });

export interface Ctx { repos: Repos; now: () => Date; authenticate: RequestHandler }
