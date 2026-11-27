// Prepare an isolated Prisma/SQLite database for browser E2E tests.
// Run: node scripts/prepare-e2e.mjs from the project root, after backend npm install.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = path.join(root, 'backend');
const env = { ...process.env, DATABASE_URL: 'file:./e2e.db' };
for (const args of [['prisma','generate'], ['prisma','migrate','deploy']]) {
  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { cwd, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) { console.error(result.error || `npx ${args.join(' ')} failed`); process.exit(result.status || 1); }
}
console.log('E2E database prepared at backend/prisma/e2e.db (development database untouched).');
