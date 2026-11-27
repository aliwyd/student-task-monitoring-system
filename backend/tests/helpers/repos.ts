import type { Repos } from "../../src/repositories/types";
import { createMemoryRepos } from "../../src/repositories/memory";

export interface Backend { name: string; make: () => Promise<{ repos: Repos; close: () => Promise<void> }> }

export const backends: Backend[] = [
  { name: "memory", make: async () => ({ repos: createMemoryRepos(), close: async () => {} }) },
];

// The same tests also run against a real SQLite database through Prisma when RUN_PRISMA=1
// (set by scripts/verify-on-windows.ps1 with DATABASE_URL pointing at a separate test database).
if (process.env.RUN_PRISMA === "1") {
  backends.push({
    name: "prisma",
    make: async () => {
      const { PrismaClient } = await import("@prisma/client");
      const { createPrismaRepos } = await import("../../src/repositories/prisma");
      const prisma = new PrismaClient();
      await prisma.notification.deleteMany();
      await prisma.submissionRecord.deleteMany();
      await prisma.task.deleteMany();
      await prisma.subject.deleteMany();
      await prisma.user.deleteMany();
      return { repos: createPrismaRepos(prisma), close: () => prisma.$disconnect() };
    },
  });
}
