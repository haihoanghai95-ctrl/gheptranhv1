export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const targetUrl = urlObj.searchParams.get('url') || '';

  if (!targetUrl || !targetUrl.startsWith('http')) {
    res.statusCode = 400;
    return res.end('Invalid url');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      res.statusCode = response.status;
      return res.end('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.end(Buffer.from(buffer));
  } catch (err) {
    res.statusCode = 500;
    return res.end('Proxy error');
  }
}
