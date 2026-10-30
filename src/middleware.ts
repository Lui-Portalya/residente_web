import { NextResponse, type NextRequest } from "next/server";

// Cheap gate only; real session checks happen in layouts and server actions.
export function middleware(req: NextRequest) {
  if (!req.cookies.has("residente_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!login|_next/|favicon.ico).*)"] };
