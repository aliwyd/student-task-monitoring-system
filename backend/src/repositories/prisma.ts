import type { PrismaClient } from "@prisma/client";
import type { Repos, Subject, Task } from "./types";

// NOTE: written without being able to run Prisma in the build sandbox.
// It is verified by scripts/verify-on-windows.ps1, which runs the same API tests against SQLite.
const toTask = (t: any): Task => t as Task;
const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export function createPrismaRepos(prisma: PrismaClient): Repos {
  return {
    users: {
      create: (d) => prisma.user.create({ data: d }),
      findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
      findById: (id) => prisma.user.findUnique({ where: { id } }),
    },
    subjects: {
      create: (userId, d) => prisma.subject.create({ data: { ...d, userId } }) as Promise<Subject>,
      list: (userId) => prisma.subject.findMany({ where: { userId }, orderBy: { id: "asc" } }),
      get: (userId, id) => prisma.subject.findFirst({ where: { id, userId } }),
      findByName: (userId, name) => prisma.subject.findFirst({ where: { userId, name } }),
      async update(userId, id, d) {
        const r = await prisma.subject.updateMany({ where: { id, userId }, data: clean(d) });
        return r.count ? prisma.subject.findFirst({ where: { id, userId } }) : null;
      },
      async delete(userId, id) { return (await prisma.subject.deleteMany({ where: { id, userId } })).count > 0; },
    },
    tasks: {
      async create(userId, d) { return toTask(await prisma.task.create({ data: { ...d, userId } })); },
      async list(userId, f = {}) {
        const where: any = { userId };
        if (f.status) where.status = f.status;
        if (f.priority) where.priority = f.priority;
        if (f.subjectId !== undefined) where.subjectId = f.subjectId;
        if (f.search) where.OR = [{ title: { contains: f.search } }, { description: { contains: f.search } }];
        const dir = f.sort === "-dueDate" ? "desc" : "asc";
        return (await prisma.task.findMany({ where, orderBy: [{ dueDate: dir }, { id: "asc" }] })).map(toTask);
      },
      async get(userId, id) { const t = await prisma.task.findFirst({ where: { id, userId } }); return t ? toTask(t) : null; },
      async update(userId, id, p) {
        const r = await prisma.task.updateMany({ where: { id, userId }, data: clean(p) });
        if (!r.count) return null;
        return toTask(await prisma.task.findFirst({ where: { id, userId } }));
      },
      async delete(userId, id) { return (await prisma.task.deleteMany({ where: { id, userId } })).count > 0; },
    },
  };
}
