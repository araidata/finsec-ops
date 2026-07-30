type AuthEnvironment = Record<string, string | undefined>;

const requiredEntraVariables = [
  "AUTH_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
  "AUTH_MICROSOFT_ENTRA_ID_TENANT_ID",
] as const;

export function isEntraAuthConfigured(
  environment: AuthEnvironment = process.env
): boolean {
  return requiredEntraVariables.every((name) =>
    Boolean(environment[name]?.trim())
  );
}

export function configuredEntraTenantId(
  environment: AuthEnvironment = process.env
): string | null {
  return environment.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID?.trim() || null;
}

export function safeCallbackPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }
  return value;
}
