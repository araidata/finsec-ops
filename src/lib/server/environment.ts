export type RuntimeEnvironment =
  "development" | "test" | "preview" | "production";

type EnvironmentSource = Record<string, string | undefined>;

export type RuntimeEnvironmentValidation = {
  environment: RuntimeEnvironment;
  databaseConfigured: boolean;
  revision: string;
  valid: boolean;
  issues: string[];
};

function runtimeEnvironment(env: EnvironmentSource): RuntimeEnvironment {
  const declared = env.APP_ENV ?? env.VERCEL_ENV;
  if (
    declared === "development" ||
    declared === "test" ||
    declared === "preview" ||
    declared === "production"
  ) {
    return declared;
  }
  if (env.NODE_ENV === "production") return "production";
  return env.NODE_ENV === "test" ? "test" : "development";
}

export function validateRuntimeEnvironment(
  env: EnvironmentSource = process.env
): RuntimeEnvironmentValidation {
  const environment = runtimeEnvironment(env);
  const databaseUrl = env.DATABASE_URL ?? env.POSTGRES_PRISMA_URL;
  const issues: string[] = [];

  if (
    (environment === "preview" || environment === "production") &&
    !databaseUrl
  ) {
    issues.push("A runtime database URL is required.");
  }
  if (
    (environment === "preview" || environment === "production") &&
    env.DATABASE_ENVIRONMENT !== environment
  ) {
    issues.push(
      `DATABASE_ENVIRONMENT must be set to ${environment} for this deployment tier.`
    );
  }
  if (environment === "production" && !env.READINESS_TOKEN) {
    issues.push("READINESS_TOKEN is required in production.");
  }
  if (environment === "production" && env.TEST_DATABASE_URL) {
    issues.push("TEST_DATABASE_URL is prohibited in production.");
  }
  if (
    environment !== "production" &&
    databaseUrl &&
    env.PRODUCTION_DATABASE_URL &&
    databaseUrl === env.PRODUCTION_DATABASE_URL
  ) {
    issues.push("A non-production tier cannot use the production database.");
  }

  return {
    environment,
    databaseConfigured: Boolean(databaseUrl),
    revision:
      env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
      env.GIT_COMMIT_SHA?.slice(0, 12) ??
      "unknown",
    valid: issues.length === 0,
    issues,
  };
}

export function assertRuntimeEnvironment(env: EnvironmentSource = process.env) {
  const validation = validateRuntimeEnvironment(env);
  if (!validation.valid) {
    throw new Error(
      `Invalid runtime configuration: ${validation.issues.join(" ")}`
    );
  }
  return validation;
}
