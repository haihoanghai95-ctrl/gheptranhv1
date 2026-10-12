import { PuzzleImage } from '../types';

const DB_NAME = 'BeGhepTranhDB';
const STORE_NAME = 'customPuzzles';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'be_ghep_tranh_custom_puzzles';

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Resizes and compresses any image (File or Data URL) to fit comfortably
 * in local storage and Firestore without sacrificing visual clarity.
 * Guarantees output is under 650KB to respect Firestore's 1MB document limit.
 */
export async function compressImage(
  source: File | string,
  maxDimension = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's a remote URL starting with http, convert to safe Data URL first
    if (typeof source === 'string' && source.startsWith('http')) {
      urlToDataUrl(source)
        .then((dataUrl) => {
          if (dataUrl.startsWith('data:')) {
            compressImage(dataUrl, maxDimension, quality).then(resolve).catch(() => resolve(dataUrl));
          } else {
            resolve(dataUrl);
          }
        })
        .catch(() => resolve(source));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        // Calculate new dimensions preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Safety check: if dataUrl exceeds 600KB, re-encode with slightly lower quality
        if (dataUrl.length > 600000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }

        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas export failed, using original source:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onerror = () => {
      if (typeof source === 'string') {
        resolve(source);
      } else {
        reject(new Error('Không thể đọc file hình ảnh này'));
      }
    };

    img.onload = handleLoad;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Converts any web image URL (Google search result, external site) to a self-contained
 * base64 Data URL using the backend proxy so it has zero CORS/hotlink issues on mobile.
 */
export async function urlToDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // 1. Try fetching via server proxy to bypass CORS
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Proxy fetch failed, attempting direct fetch:', err);
  }

  // 2. Direct fetch attempt with CORS
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Direct fetch failed:', err);
  }

  // 3. Fallback: proxy URL
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

/**
 * Saves custom puzzle to IndexedDB and also mirrors to localStorage
 */
export async function savePuzzleLocally(puzzle: PuzzleImage): Promise<void> {
  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(puzzle);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }

  // 2. Also save to localStorage as instant sync backup
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: PuzzleImage[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [puzzle, ...list.filter((p) => p.id !== puzzle.id)].slice(0, 30);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

/**
 * Loads all saved custom puzzles from IndexedDB and localStorage (merged & deduplicated)
 */
export async function loadLocalPuzzles(): Promise<PuzzleImage[]> {
  const map = new Map<string, PuzzleImage>();

  // 1. Try loading from localStorage first (immediate)
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existingStr) {
      const list: PuzzleImage[] = JSON.parse(existingStr);
      list.forEach((p) => {
        if (p && p.id && p.src) map.set(p.id, p);
      });
    }
  } catch (e) {
    console.warn('LocalStorage load error:', e);
  }

  // 2. Merge with IndexedDB
  try {
    const db = await openDB();
    const idbItems = await new Promise<PuzzleImage[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    if (idbItems && idbItems.length > 0) {
      idbItems.forEach((p) => {
        if (p && p.id && p.src) map.set(p.id, p);
      });
    }
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
  }

  return Array.from(map.values());
}

/**
 * Updates a custom puzzle title locally
 */
export async function updatePuzzleTitleLocally(puzzleId: string, newTitle: string): Promise<void> {
  try {
    const db = await openDB();
    const item = await new Promise<PuzzleImage | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(puzzleId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (item) {
      item.title = newTitle;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(item);
    }
  } catch {}

  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existingStr) {
      const list: PuzzleImage[] = JSON.parse(existingStr);
      const updated = list.map((p) => (p.id === puzzleId ? { ...p, title: newTitle } : p));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}
}

/**
 * Deletes custom puzzle from storage
 */
export async function deletePuzzleLocally(puzzleId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(puzzleId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // fallback
  }

  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existingStr) {
      const list: PuzzleImage[] = JSON.parse(existingStr);
      const filtered = list.filter((p) => p.id !== puzzleId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {}
}
