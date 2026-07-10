import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env["DATABASE_URL"] || process.env["POSTGRES_PRISMA_URL"];
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
