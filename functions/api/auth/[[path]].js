// Auth proxy — forwards requests to NCB Auth API with cookie handling

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

function transformSetCookie(cookie) {
  const parts = cookie.split(";");
  let nameValue = parts[0].trim();

  // Strip __Secure- / __Host- prefix (browsers reject on localhost)
  if (nameValue.startsWith("__Secure-")) nameValue = nameValue.replace("__Secure-", "");
  else if (nameValue.startsWith("__Host-")) nameValue = nameValue.replace("__Host-", "");

  const attrs = parts.slice(1)
    .map(a => a.trim())
    .filter(a => {
      const l = a.toLowerCase();
      return !l.startsWith("domain=") && !l.startsWith("secure") && !l.startsWith("samesite=");
    });

  attrs.push("SameSite=Lax");
  return [nameValue, ...attrs].join("; ");
}

async function handleSignOut(request, env) {
  const origin = request.headers.get("Origin") || new URL(request.url).origin;
  const authCookies = extractAuthCookies(request.headers.get("Cookie") || "");

  const headers = new Headers({ "Content-Type": "application/json" });

  try {
    const url = `${env.NCB_AUTH_API_URL}/sign-out?Instance=${env.NCB_INSTANCE}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": env.NCB_INSTANCE,
        "Cookie": authCookies,
        "Origin": origin,
      },
      body: "{}",
    });

    const cookies = res.headers.getSetCookie?.() || [];
    for (const c of cookies) {
      headers.append("Set-Cookie", transformSetCookie(c));
    }
  } catch {}

  // Always clear cookies
  for (const name of ["better-auth.session_token", "better-auth.session_data"]) {
    headers.append("Set-Cookie", `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

async function proxy(request, env, path, body) {
  const origin = request.headers.get("Origin") || new URL(request.url).origin;
  const authCookies = extractAuthCookies(request.headers.get("Cookie") || "");
  const url = `${env.NCB_AUTH_API_URL}/${path}?Instance=${env.NCB_INSTANCE}`;

  const res = await fetch(url, {
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
  const headers = new Headers({ "Content-Type": "application/json" });

  const cookies = res.headers.getSetCookie?.() || [];
  for (const c of cookies) {
    headers.append("Set-Cookie", transformSetCookie(c));
  }

  return new Response(data, { status: res.status, headers });
}

export async function onRequestGet(context) {
  const path = context.params.path.join("/");
  return proxy(context.request, context.env, path);
}

export async function onRequestPost(context) {
  const path = context.params.path.join("/");
  if (path === "sign-out") return handleSignOut(context.request, context.env);
  const body = await context.request.text();
  return proxy(context.request, context.env, path, body);
}
