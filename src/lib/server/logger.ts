import { validateRuntimeEnvironment } from "@/lib/server/environment";

type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

const sensitiveKey =
  /authorization|cookie|password|secret|token|database.*url|connection|string|email|amount|forecast|document|comment|note/i;
const sensitiveString =
  /(?:postgres(?:ql)?:\/\/|bearer\s+|password=|token=|secret=)/i;

function redact(value: unknown, key = "", depth = 0): unknown {
  if (sensitiveKey.test(key)) return "[REDACTED]";
  if (depth > 5) return "[TRUNCATED]";
  if (value instanceof Error) {
    return {
      errorType: value.name || "Error",
      digest:
        "digest" in value && typeof value.digest === "string"
          ? value.digest
          : undefined,
    };
  }
  if (typeof value === "string") {
    return sensitiveString.test(value) ? "[REDACTED]" : value.slice(0, 500);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redact(item, key, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([childKey, child]) => [childKey, redact(child, childKey, depth + 1)]
      )
    );
  }
  return value;
}

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const runtime = validateRuntimeEnvironment();
  const safeFields = redact(fields);
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "finsec-ops",
    environment: runtime.environment,
    revision: runtime.revision,
    event,
    ...(safeFields && typeof safeFields === "object"
      ? (safeFields as LogFields)
      : {}),
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.info(serialized);
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
