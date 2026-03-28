// Authenticated data proxy — session required, RLS enforced by NCB

function extractAuthCookies(cookieHeader) {
  if (!cookieHeader) return "";
  return cookieHeader
    .split(";")
    .map(c => c.trim())
    .filter(c =>
      c.startsWith("better-auth.session_token=") ||
      c.startsWith("better-auth.session_data=")
    )
    .join("; ");
}

async function getSessionUser(cookieHeader, env) {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${env.NCB_AUTH_API_URL}/get-session?Instance=${env.NCB_INSTANCE}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": env.NCB_INSTANCE,
      "Cookie": authCookies,
    },
  });

  if (res.ok) {
    const data = await res.json();
    return data.user || null;
  }
  return null;
}

function unauthorized(msg = "Unauthorized") {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

async function proxyToNCB(request, env, path, body) {
  const origin = request.headers.get("Origin") || new URL(request.url).origin;
  const authCookies = extractAuthCookies(request.headers.get("Cookie") || "");

  const url = new URL(request.url);
  const params = new URLSearchParams();
  params.set("Instance", env.NCB_INSTANCE);
  url.searchParams.forEach((val, key) => {
    if (key !== "Instance") params.append(key, val);
  });

  const ncbUrl = `${env.NCB_DATA_API_URL}/${path}?${params.toString()}`;

  const res = await fetch(ncbUrl, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": env.NCB_INSTANCE,
      "Cookie": authCookies,
      "Origin": origin,
    },
    body: body || undefined,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const user = await getSessionUser(request.headers.get("Cookie") || "", env);
  if (!user) return unauthorized();
  return proxyToNCB(request, env, params.path.join("/"));
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const path = params.path.join("/");
  const body = await request.text();
  const user = await getSessionUser(request.headers.get("Cookie") || "", env);
  if (!user) return unauthorized();

  // Inject user_id on create, strip client-sent user_id
  if (path.startsWith("create/") && body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      parsed.user_id = user.id;
      return proxyToNCB(request, env, path, JSON.stringify(parsed));
    } catch {}
  }

  return proxyToNCB(request, env, path, body);
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const path = params.path.join("/");
  const body = await request.text();
  const user = await getSessionUser(request.headers.get("Cookie") || "", env);
  if (!user) return unauthorized();

  // Strip user_id from updates
  if (body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      return proxyToNCB(request, env, path, JSON.stringify(parsed));
    } catch {}
  }

  return proxyToNCB(request, env, path, body);
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const user = await getSessionUser(request.headers.get("Cookie") || "", env);
  if (!user) return unauthorized();
  return proxyToNCB(request, env, params.path.join("/"));
}
