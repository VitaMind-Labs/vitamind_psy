import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE, TOKEN_COOKIE } from "@/lib/api/config";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS, refreshSession } from "@/lib/api/refresh";

/**
 * Keeps the clinician session alive before a page renders. Server Components
 * cannot write cookies, so when the 15-minute access cookie has expired this
 * refreshes once (rotating the refresh token) and hands the new cookies to both
 * the render and the browser. Authorization itself stays on the backend.
 */
export async function proxy(request: NextRequest) {
  if (request.cookies.has(TOKEN_COOKIE)) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return NextResponse.next(); // the dashboard layout redirects to /signin

  const session = await refreshSession(refreshToken);
  if (!session) {
    const response = NextResponse.redirect(new URL("/signin", request.url));
    response.cookies.delete(TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  request.cookies.set(TOKEN_COOKIE, session.accessToken);
  if (session.refreshToken) request.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken);
  const response = NextResponse.next({ request });
  response.cookies.set(TOKEN_COOKIE, session.accessToken, ACCESS_COOKIE_OPTIONS);
  if (session.refreshToken) response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, REFRESH_COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
