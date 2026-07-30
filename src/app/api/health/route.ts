import { validateRuntimeEnvironment } from "@/lib/server/environment";
import {
  requestIdFromHeaders,
  responseHeaders,
} from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const runtime = validateRuntimeEnvironment();
  return Response.json(
    {
      status: "ok",
      environment: runtime.environment,
      revision: runtime.revision,
    },
    { headers: responseHeaders(requestId) }
  );
}
