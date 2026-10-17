export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const target = 'https://xuanji-member.syb-808410.workers.dev';
  // 去掉 /api 前缀，因为 Vercel API 路由在 /api 下，但 Worker 接口在根路径
  const pathname = url.pathname.replace(/^\/api/, '');
  const targetUrl = target + pathname + url.search;

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // 只转发必要的请求头，避免 host/content-length 等头导致问题
    const forwardHeaders = new Headers();
    const passHeaders = ['content-type', 'authorization', 'accept', 'user-agent'];
    for (const [key, value] of request.headers.entries()) {
      if (passHeaders.includes(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    });

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '代理错误', message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
