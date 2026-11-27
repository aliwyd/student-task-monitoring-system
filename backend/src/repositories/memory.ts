import type { Notification, Repos, Subject, SubmissionRecord, Task, User } from "./types";

/** In-memory repositories: used for fast tests. Behaviour mirrors the Prisma repositories. */
export function createMemoryRepos(): Repos {
  const users: User[] = [], subjects: Subject[] = [], tasks: Task[] = [], records: SubmissionRecord[] = [], notes: Notification[] = [];
  let uid = 1, sid = 1, tid = 1, rid = 1, nid = 1;
  const mine = <T extends { userId: number; id: number }>(arr: T[], userId: number, id: number) =>
    arr.find((x) => x.userId === userId && x.id === id) ?? null;

  return {
    users: {
      async create(d) { const u = { id: uid++, ...d, createdAt: new Date() }; users.push(u); return { ...u }; },
      async findByEmail(email) { const u = users.find((x) => x.email === email); return u ? { ...u } : null; },
      async findById(id) { const u = users.find((x) => x.id === id); return u ? { ...u } : null; },
      async update(id, d) {
        const u = users.find((x) => x.id === id); if (!u) return null;
        Object.assign(u, Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined))); return { ...u };
      },
    },
    subjects: {
      async create(userId, d) {
        const s: Subject = { id: sid++, userId, name: d.name, code: d.code ?? null, description: d.description ?? null, color: d.color, createdAt: new Date() };
        subjects.push(s); return { ...s };
      },
      async list(userId) { return subjects.filter((s) => s.userId === userId).map((s) => ({ ...s })); },
      async get(userId, id) { const s = mine(subjects, userId, id); return s ? { ...s } : null; },
      async findByName(userId, name) { const s = subjects.find((x) => x.userId === userId && x.name === name); return s ? { ...s } : null; },
      async update(userId, id, d) {
        const s = mine(subjects, userId, id); if (!s) return null;
        Object.assign(s, Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined))); return { ...s };
      },
      async delete(userId, id) {
        const s = mine(subjects, userId, id); if (!s) return false;
        subjects.splice(subjects.indexOf(s), 1);
        tasks.forEach((t) => { if (t.subjectId === id) t.subjectId = null; }); // like ON DELETE SET NULL
        return true;
      },
    },
    tasks: {
      async create(userId, d) {
        const now = new Date();
        const t: Task = { id: tid++, userId, subjectId: d.subjectId ?? null, title: d.title, description: d.description ?? null, notes: d.notes ?? null,
          priority: d.priority, status: d.status, dueDate: d.dueDate, completedAt: null, submittedAt: null, createdAt: d.createdAt ?? now, updatedAt: now };
        tasks.push(t); return { ...t };
      },
      async list(userId, f = {}) {
        let r = tasks.filter((t) => t.userId === userId);
        if (f.status) r = r.filter((t) => t.status === f.status);
        if (f.priority) r = r.filter((t) => t.priority === f.priority);
        if (f.subjectId !== undefined) r = r.filter((t) => t.subjectId === f.subjectId);
        if (f.search) { const q = f.search.toLowerCase(); r = r.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)); }
        r = [...r].sort((a, b) => (f.sort === "-dueDate" ? b.dueDate.getTime() - a.dueDate.getTime() : a.dueDate.getTime() - b.dueDate.getTime()) || a.id - b.id);
        return r.map((t) => ({ ...t }));
      },
      async get(userId, id) { const t = mine(tasks, userId, id); return t ? { ...t } : null; },
      async update(userId, id, p) {
        const t = mine(tasks, userId, id); if (!t) return null;
        Object.assign(t, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)), { updatedAt: new Date() }); return { ...t };
      },
      async delete(userId, id) {
        const t = mine(tasks, userId, id); if (!t) return false;
        tasks.splice(tasks.indexOf(t), 1);
        for (const arr of [records, notes] as { taskId: number | null }[][]) { // like ON DELETE CASCADE
          for (let i = arr.length - 1; i >= 0; i--) if (arr[i].taskId === id) arr.splice(i, 1);
        }
        return true;
      },
    },
    submissions: {
      async create(userId, d) {
        const r: SubmissionRecord = { id: rid++, userId, taskId: d.taskId, submittedAt: d.submittedAt, link: d.link ?? null, remarks: d.remarks ?? null, createdAt: new Date() };
        records.push(r); return { ...r };
      },
      async list(userId) { return records.filter((r) => r.userId === userId).map((r) => ({ ...r })); },
      async get(userId, id) { const r = mine(records, userId, id); return r ? { ...r } : null; },
      async getByTask(userId, taskId) { const r = records.find((x) => x.userId === userId && x.taskId === taskId); return r ? { ...r } : null; },
      async update(userId, id, d) {
        const r = mine(records, userId, id); if (!r) return null;
        Object.assign(r, Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined))); return { ...r };
      },
    },
    notifications: {
      async list(userId) { return notes.filter((n) => n.userId === userId).map((n) => ({ ...n })); },
      async create(userId, d) { const n: Notification = { id: nid++, userId, ...d, read: false }; notes.push(n); return { ...n }; },
      async markRead(userId, id) { const n = mine(notes, userId, id); if (!n) return null; n.read = true; return { ...n }; },
    },
  };
}
