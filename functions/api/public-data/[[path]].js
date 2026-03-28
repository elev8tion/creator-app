// Public data proxy — no session required, policy-gated by NCB

async function proxyToNCBPublic(request, env, path, body) {
  const origin = request.headers.get("Origin") || new URL(request.url).origin;

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
      "Origin": origin,
      // No cookies — anonymous request
    },
    body: body || undefined,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  return proxyToNCBPublic(request, env, params.path.join("/"));
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const path = params.path.join("/");

  if (!path.startsWith("create/")) {
    return json({ error: "Public route only allows create operations" }, 403);
  }

  const body = await request.text();

  // Strip user_id from public creates
  if (body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      return proxyToNCBPublic(request, env, path, JSON.stringify(parsed));
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
  }

  return proxyToNCBPublic(request, env, path, body);
}
