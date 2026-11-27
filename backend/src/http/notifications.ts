import { Router } from "express";
import type { Ctx } from "./common";
import { fail, idParam, me, ok, wrap } from "./common";
import { candidateNotifications } from "../domain/notifications";

const key = (taskId: number | null, type: string) => `${taskId}:${type}`;

export function notificationsRouter({ repos, now, authenticate }: Ctx) {
  const r = Router(); r.use(authenticate);

  // Notifications are calculated from task data when the list is requested (no background scheduler).
  r.get("/", wrap(async (req, res) => {
    const userId = me(req).id;
    const candidates = candidateNotifications(await repos.tasks.list(userId), now());
    const existing = await repos.notifications.list(userId);
    const known = new Set(existing.map((n) => key(n.taskId, n.type)));
    for (const c of candidates) if (!known.has(key(c.taskId, c.type))) await repos.notifications.create(userId, { ...c, createdAt: now() });
    const relevant = new Set(candidates.map((c) => key(c.taskId, c.type)));
    const list = (await repos.notifications.list(userId))
      .filter((n) => relevant.has(key(n.taskId, n.type)))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)
      .map((n) => ({ id: n.id, taskId: n.taskId, type: n.type, message: n.message, read: n.read, createdAt: n.createdAt }));
    ok(res, { notifications: list, unreadCount: list.filter((n) => !n.read).length });
  }));

  r.patch("/:id/read", wrap(async (req, res) => {
    const n = await repos.notifications.markRead(me(req).id, idParam(req));
    if (!n) throw fail(404, "Notification not found");
    ok(res, { notification: { id: n.id, taskId: n.taskId, type: n.type, message: n.message, read: n.read, createdAt: n.createdAt } });
  }));
  return r;
}
