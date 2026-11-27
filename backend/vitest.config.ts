import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"], coverage: { provider: "v8", include: ["src/**"], exclude: ["src/server.ts","src/repositories/prisma.ts"], reporter: ["text","html"] } } });
