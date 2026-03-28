// Fetch enabled auth providers from NCB
export async function onRequestGet(context) {
  const { env } = context;
  const url = `${env.NCB_AUTH_API_URL}/providers?Instance=${env.NCB_INSTANCE}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ providers: { email: true } }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
