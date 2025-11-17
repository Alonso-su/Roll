export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 只处理 /api/raindrops 路径
  if (url.pathname === '/api/raindrops') {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const raindropRes = await fetch('https://api.raindrop.io/rest/v1/raindrops/0', {
        headers: {
          'Authorization': `Bearer ${context.env.RAINDROP_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      const body = await raindropRes.text();

      return new Response(body, {
        status: raindropRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60, s-maxage=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'fetch_failed', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not found', { status: 404 });
}
