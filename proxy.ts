import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Optimistic check only — a fast redirect for logged-out visitors hitting
// /dashboard/*. The real authorization check still happens in each page via
// `auth()`, since Proxy must never be the sole gate on protected data.
export async function proxy(request: NextRequest) {
  const session = await auth();

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
