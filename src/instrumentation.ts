import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const [{ assertRuntimeEnvironment }, { logger }] = await Promise.all([
    import("@/lib/server/environment"),
    import("@/lib/server/logger"),
  ]);
  const runtime = assertRuntimeEnvironment();
  logger.info("runtime.started", {
    databaseConfigured: runtime.databaseConfigured,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const [{ logger }, { requestIdFromHeaders }] = await Promise.all([
    import("@/lib/server/logger"),
    import("@/lib/server/request-context"),
  ]);
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) headers.set(name, value[0] ?? "");
    else if (value) headers.set(name, value);
  }
  const errorType = error instanceof Error ? error.name : "Error";
  const digest =
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;
  logger.error("request.failed", {
    requestId: requestIdFromHeaders(headers),
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    digest,
    errorType,
  });
};
