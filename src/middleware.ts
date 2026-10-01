import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mteefiyczqjdvbdypill.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_teuTwvOVxRMpwpqX1nkQw_mxuhpo4C", { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  await supabase.auth.getUser();
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const baseDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN ?? "purpowebbx.com";
  const isSubdomain = host.endsWith(`.${baseDomain}`) && !host.startsWith("www.");
  if (isSubdomain && !request.nextUrl.pathname.startsWith("/_next") && !request.nextUrl.pathname.startsWith("/api") && !request.nextUrl.pathname.startsWith("/store/")) {
    const slug = host.slice(0, -(baseDomain.length + 1));
    const url = request.nextUrl.clone();
    url.pathname = `/store/${slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }
  const isPlatformHost = host === baseDomain || host === `www.${baseDomain}` || host.endsWith(".vercel.app") || host === "localhost" || host === "127.0.0.1";
  if (!isPlatformHost && !request.nextUrl.pathname.startsWith("/_next") && !request.nextUrl.pathname.startsWith("/api") && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/domain/${host}`;
    return NextResponse.rewrite(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
