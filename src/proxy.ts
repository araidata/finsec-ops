import { NextResponse } from "next/server";

export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|api/ready|sign-in|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
