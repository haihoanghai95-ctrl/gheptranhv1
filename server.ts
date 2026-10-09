import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImageResult {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
}

// Search web images via DuckDuckGo
async function searchDuckDuckGo(query: string): Promise<ImageResult[]> {
  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const text = await res.text();
    const vqdMatch = text.match(/vqd=([0-9-]+)/);
    if (!vqdMatch) return [];

    const vqd = vqdMatch[1];
    const imgApiUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`;
    const imgRes = await fetch(imgApiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://duckduckgo.com/',
      },
    });

    if (!imgRes.ok) return [];
    const data = (await imgRes.json()) as { results?: Array<{ title?: string; image?: string; thumbnail?: string }> };
    if (!data.results) return [];

    return data.results
      .filter((item) => item.image && item.image.startsWith('http'))
      .slice(0, 24)
      .map((item, idx) => ({
        id: `ddg-${idx}-${Date.now()}`,
        title: item.title || query,
        url: item.image!,
        thumbUrl: item.thumbnail || item.image!,
        source: 'Google / Web',
      }));
  } catch (err) {
    console.error('Error searching DDG:', err);
    return [];
  }
}

// Fallback search via Wikimedia Commons
async function searchWikimedia(query: string): Promise<ImageResult[]> {
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=600&format=json&origin=*`;
    const res = await fetch(wikiUrl);
    if (!res.ok) return [];
    const data = (await res.json()) as { query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ url: string; thumburl: string }> }> } };
    const pages = Object.values(data.query?.pages || {});

    return pages
      .filter((p) => p.imageinfo && p.imageinfo[0]?.url)
      .map((p, idx) => {
        const info = p.imageinfo![0];
        const cleanTitle = (p.title || query).replace(/^File:/i, '').replace(/\.[^/.]+$/, '');
        return {
          id: `wiki-${idx}-${Date.now()}`,
          title: cleanTitle,
          url: info.thumburl || info.url,
          thumbUrl: info.thumburl || info.url,
          source: 'Wikimedia',
        };
      });
  } catch (err) {
    console.error('Error searching Wikimedia:', err);
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Search images endpoint
  app.get('/api/search-images', async (req, res) => {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Missing search query q' });
    }

    try {
      // Try web search first
      let results = await searchDuckDuckGo(q);

      // If empty or few results, also add Wikimedia results
      if (results.length < 8) {
        const wikiResults = await searchWikimedia(q);
        results = [...results, ...wikiResults];
      }

      return res.json({ results });
    } catch (error) {
      console.error('Search endpoint error:', error);
      return res.status(500).json({ error: 'Failed to search images' });
    }
  });

  // Image proxy endpoint to bypass CORS / hotlink protection
  app.get('/api/proxy-image', async (req, res) => {
    const targetUrl = (req.query.url as string) || '';
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).send('Invalid url');
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
        return res.status(response.status).send('Failed to fetch image');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('Proxy error:', err);
      return res.status(500).send('Proxy error');
    }
  });

  // In development, use Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
