import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { isNonProductionAuthBypassEnabled } from "@/lib/auth/config";

export async function proxy(request: NextRequest) {
  if (isNonProductionAuthBypassEnabled()) return NextResponse.next();

  try {
    const session = await auth();
    if (session?.user?.entraSubject && session.user.entraTenantId) {
      return NextResponse.next();
    }
  } catch {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Authentication is unavailable." },
        { status: 503 }
      );
    }
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { message: "Authentication is required." },
      { status: 401 }
    );
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|api/ready|sign-in|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
