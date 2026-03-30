// Proxy chat requests to the ZeroClaw gateway
// Requires GATEWAY_URL and GATEWAY_TOKEN in Pages env/secrets

export async function onRequestPost(context) {
  const { request, env } = context;

  const gatewayUrl = env.GATEWAY_URL;
  const gatewayToken = env.GATEWAY_TOKEN;

  if (!gatewayUrl || !gatewayToken) {
    return new Response(JSON.stringify({ error: "Gateway not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();

    const res = await fetch(`${gatewayUrl}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        message: body.message,
        agent_id: body.agent_id || "creator-outreach",
        conversation_id: body.conversation_id || undefined,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Gateway request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
