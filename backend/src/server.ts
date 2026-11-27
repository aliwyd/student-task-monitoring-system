import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { createPrismaRepos } from "./repositories/prisma";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  console.error("JWT_SECRET is missing or too short (min 16 chars). Copy .env.example to .env and set it.");
  process.exit(1);
}
const prisma = new PrismaClient();
const app = createApp({ repos: createPrismaRepos(prisma), jwtSecret: secret, corsOrigin: process.env.CORS_ORIGIN });
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
