type EnvironmentSource = Record<string, string | undefined>;

export function requireDisposableTestDatabase(
  env: EnvironmentSource = process.env
) {
  if (env.APP_ENV === "production" || env.VERCEL_ENV === "production") {
    throw new Error(
      "Database integration and browser tests are prohibited in production."
    );
  }

  const testDatabaseUrl = env.TEST_DATABASE_URL;
  const explicitlyDisposable = env.TEST_DATABASE_DISPOSABLE === "true";
  const markedDatabaseUrl = env.DATABASE_URL ?? env.POSTGRES_PRISMA_URL;
  const databaseUrl =
    testDatabaseUrl ?? (explicitlyDisposable ? markedDatabaseUrl : undefined);

  if (!databaseUrl) {
    throw new Error(
      "Refusing database tests: set TEST_DATABASE_URL or set TEST_DATABASE_DISPOSABLE=true with an isolated database URL."
    );
  }
  if (
    env.PRODUCTION_DATABASE_URL &&
    databaseUrl === env.PRODUCTION_DATABASE_URL
  ) {
    throw new Error("Refusing database tests against the production database.");
  }

  return databaseUrl;
}
