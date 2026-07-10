import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env["DATABASE_URL"] || process.env["POSTGRES_PRISMA_URL"];

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or POSTGRES_PRISMA_URL is required for Prisma commands."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: databaseUrl,
  },
});
