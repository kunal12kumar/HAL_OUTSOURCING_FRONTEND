// Same-origin proxy to the Django API.
//
// The browser never sees a token: login stores the JWTs in httpOnly cookies, and this
// handler adds the right one to each request. Staff and vendor logins use different
// cookies, so a vendor session can never be replayed against a staff endpoint here.
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const SECURE = process.env.COOKIE_SECURE === "true";

const PORTALS = {
  internal: { access: "hal_staff_at", refresh: "hal_staff_rt" },
  vendor: { access: "hal_vendor_at", refresh: "hal_vendor_rt" },
};

const ACCESS_MAX_AGE = 60 * 30;
const REFRESH_MAX_AGE = 60 * 60 * 12;

function cookieOptions(maxAge) {
  return { httpOnly: true, sameSite: "strict", secure: SECURE, path: "/", maxAge };
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

const UNREACHABLE = "Cannot reach the backend API. Check that it is running and that BACKEND_URL on this server is correct.";
const HOST_REFUSED =
  "The backend refused this request (HTTP 400). Add the host name used in BACKEND_URL to DJANGO_ALLOWED_HOSTS on the backend.";

function problem(detail, status) {
  return NextResponse.json({ detail }, { status });
}

async function handle(request, { params }) {
  const { path } = await params;
  const portal = PORTALS[path[0]];
  if (!portal) return NextResponse.json({ detail: "Not found." }, { status: 404 });

  const method = request.method;
  if (method !== "GET" && method !== "HEAD" && !sameOrigin(request)) {
    return NextResponse.json({ detail: "Cross-site request refused." }, { status: 403 });
  }

  const rest = path.slice(1).join("/");
  if (rest === "auth/logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(portal.access, "", cookieOptions(0));
    res.cookies.set(portal.refresh, "", cookieOptions(0));
    return res;
  }

  const search = new URL(request.url).search;
  const url = `${BACKEND}/api/${path[0]}/${rest}/${search}`;
  const isLogin = rest === "auth/login";
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;
  const contentType = request.headers.get("content-type");

  const call = (token) => {
    const headers = { Accept: "application/json", "X-Forwarded-Proto": request.nextUrl.protocol.replace(":", "") };
    if (contentType) headers["Content-Type"] = contentType;
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { method, headers, body, cache: "no-store", redirect: "manual" });
  };

  const access = request.cookies.get(portal.access)?.value;
  const refresh = request.cookies.get(portal.refresh)?.value;
  let upstream;
  try {
    upstream = await call(isLogin ? undefined : access);
  } catch {
    return problem(UNREACHABLE, 502);
  }
  let newAccess = null;

  if (upstream.status === 401 && !isLogin && refresh) {
    const r = await fetch(`${BACKEND}/api/${path[0]}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    }).catch(() => null);
    if (r?.ok) {
      newAccess = (await r.json()).access;
      try {
        upstream = await call(newAccess);
      } catch {
        return problem(UNREACHABLE, 502);
      }
    }
  }

  if (upstream.status === 400 && (upstream.headers.get("content-type") || "").includes("text/html")) {
    return problem(HOST_REFUSED, 502);
  }

  if (isLogin) {
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
    const res = NextResponse.json({ user: data.user });
    res.cookies.set(portal.access, data.access, cookieOptions(ACCESS_MAX_AGE));
    res.cookies.set(portal.refresh, data.refresh, cookieOptions(REFRESH_MAX_AGE));
    return res;
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "no-store");
  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers });
  if (newAccess) res.cookies.set(portal.access, newAccess, cookieOptions(ACCESS_MAX_AGE));
  if (upstream.status === 401 && !newAccess) {
    res.cookies.set(portal.access, "", cookieOptions(0));
  }
  return res;
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
