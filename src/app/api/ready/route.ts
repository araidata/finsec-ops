import { timingSafeEqual } from "node:crypto";

import { validateRuntimeEnvironment } from "@/lib/server/environment";
import { logger } from "@/lib/server/logger";
import { getPrisma } from "@/lib/server/prisma";
import {
  requestIdFromHeaders,
  responseHeaders,
} from "@/lib/server/request-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request, environment: string) {
  if (environment !== "production") return true;
  const token = process.env.READINESS_TOKEN;
  const supplied = request.headers.get("authorization");
  if (!token || !supplied) return false;
  const expectedBytes = Buffer.from(`Bearer ${token}`);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

async function databaseReady() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getPrisma().$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Readiness timeout")), 2_000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const runtimeState = validateRuntimeEnvironment();
  const headers = responseHeaders(requestId);

  if (!authorized(request, runtimeState.environment)) {
    return Response.json({ status: "unauthorized" }, { status: 401, headers });
  }
  if (!runtimeState.valid || !runtimeState.databaseConfigured) {
    return Response.json({ status: "not-ready" }, { status: 503, headers });
  }

  try {
    await databaseReady();
    return Response.json(
      {
        status: "ready",
        environment: runtimeState.environment,
        revision: runtimeState.revision,
      },
      { headers }
    );
  } catch (error) {
    logger.error("readiness.failed", { requestId, error });
    return Response.json({ status: "not-ready" }, { status: 503, headers });
  }
}
