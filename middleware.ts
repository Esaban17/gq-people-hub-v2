import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const protectedPaths = [
    "/dashboard",
    "/employees",
    "/time-off",
    "/onboarding",
    "/calendar",
    "/profile",
    "/admin",
  ];

  const isProtected = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
