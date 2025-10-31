import { auth } from "@repo/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Require authentication for all admin routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Require ADMIN role only
  if (userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized).*)"],
}
