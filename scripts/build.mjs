import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
const isVercel = process.env.VERCEL === "1";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "generate"]);

if (isVercel && databaseUrl) {
  run("npx", ["prisma", "migrate", "deploy"]);
}

run("npx", ["next", "build"]);
