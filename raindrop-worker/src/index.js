export default {
  async fetch(request, env, ctx) {
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

      // 简单缓存（Cloudflare Workers 缓存 API）
      const cacheKey = new Request(request.url, { method: 'GET' });
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      try {
        const raindropRes = await fetch('https://api.raindrop.io/rest/v1/raindrops/0', {
          headers: {
            'Authorization': `Bearer ${env.RAINDROP_TOKEN}`,
            'Accept': 'application/json',
          },
        });

        const body = await raindropRes.text();

        const res = new Response(body, {
          status: raindropRes.status,
          headers: {
            'Content-Type': 'application/json',
            // 缓存策略示例：浏览器缓存 60s，CDN/边缘缓存 300s
            'Cache-Control': 'max-age=60, s-maxage=300',
            'Access-Control-Allow-Origin': '*',
          },
        });

        // 异步写入边缘缓存
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
      } catch (err) {
        return new Response(JSON.stringify({ error: 'fetch_failed', detail: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
