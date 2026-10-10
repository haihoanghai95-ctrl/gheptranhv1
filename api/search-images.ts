import type { IncomingMessage, ServerResponse } from 'http';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
}

export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const q = (urlObj.searchParams.get('q') || '').trim();

  if (!q) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Missing search query q' }));
  }

  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      q
    )}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=600&format=json&origin=*`;

    const response = await fetch(wikiUrl);
    if (!response.ok) {
      throw new Error(`Wiki API returned ${response.status}`);
    }

    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});

    const results: SearchResult[] = pages
      .filter((p: any) => p.imageinfo && p.imageinfo[0]?.url)
      .map((p: any, idx: number) => {
        const info = p.imageinfo[0];
        const cleanTitle = (p.title || q).replace(/^File:/i, '').replace(/\.[^/.]+$/, '');
        return {
          id: `api-wiki-${idx}-${Date.now()}`,
          title: cleanTitle,
          url: info.thumburl || info.url,
          thumbUrl: info.thumburl || info.url,
          source: 'Wikimedia Commons',
        };
      });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.end(JSON.stringify({ results }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Internal error' }));
  }
}
