const safeRequestId = /^[A-Za-z0-9._:-]{8,128}$/;

export function requestIdFromHeaders(headers: Headers) {
  const supplied =
    headers.get("x-request-id") ?? headers.get("x-correlation-id");
  return supplied && safeRequestId.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

export function responseHeaders(requestId: string) {
  return {
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
  };
}
