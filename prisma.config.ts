import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ path: ".env", override: false, quiet: true });

const databaseUrl =
  process.env["POSTGRES_URL_NON_POOLING"] ||
  process.env["DATABASE_URL_UNPOOLED"] ||
  process.env["DATABASE_URL"] ||
  process.env["POSTGRES_PRISMA_URL"];
const prismaGeneratePlaceholderUrl =
  "postgresql://prisma-generate:prisma-generate@localhost:5432/prisma_generate";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: databaseUrl || prismaGeneratePlaceholderUrl,
  },
});
