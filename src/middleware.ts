export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/portal/dashboard/:path*", "/driver/:path*"],
}
