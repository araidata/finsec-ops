import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
}

export function hasDatabaseUrl() {
  return Boolean(connectionString());
}

export function getPrisma() {
  const url = connectionString();

  if (!url) {
    throw new Error(
      "DATABASE_URL or POSTGRES_PRISMA_URL is required for database-backed workflows."
    );
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: url }),
    });
  }

  return globalForPrisma.prisma;
}
