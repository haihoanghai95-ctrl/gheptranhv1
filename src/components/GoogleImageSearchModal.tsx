import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { PuzzleImage } from '../types';
import { audioManager } from '../utils/audio';

interface GoogleImageSearchModalProps {
  onSelectImage: (image: PuzzleImage) => void;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
}

const POPULAR_SEARCHES = [
  'Chú mèo con',
  'Chó cún dễ thương',
  'Xe cảnh sát',
  'Khủng long',
  'Doraemon',
  'Máy bay',
  'Gấu trúc Panda',
  'Công chúa Elsa',
  'Trái cây hoạt hình',
  'Tàu hỏa xe lửa',
];

export const GoogleImageSearchModal: React.FC<GoogleImageSearchModalProps> = ({
  onSelectImage,
  onClose,
}) => {
  const [query, setQuery] = useState('chú cún con hoạt hình');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Direct URL paste
  const [directUrl, setDirectUrl] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedResult(null);

    try {
      // 1. First try our full-stack server endpoint
      const response = await fetch(`/api/search-images?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setResults(data.results);
          setLoading(false);
          return;
        }
      }

      // 2. Client-side fallback to Wikimedia Commons if server query was empty
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        searchQuery
      )}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=600&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      const wikiData = await wikiRes.json();
      const pages = Object.values(wikiData.query?.pages || {});

      const wikiResults: SearchResult[] = pages
        .filter((p: any) => p.imageinfo && p.imageinfo[0]?.url)
        .map((p: any, idx: number) => ({
          id: `client-wiki-${idx}-${Date.now()}`,
          title: (p.title || searchQuery).replace(/^File:/i, '').replace(/\.[^/.]+$/, ''),
          url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
          thumbUrl: p.imageinfo[0].thumburl || p.imageinfo[0].url,
          source: 'Google / Web',
        }));

      if (wikiResults.length > 0) {
        setResults(wikiResults);
      } else {
        setError('Không tìm thấy hình ảnh phù hợp. Bé thử gõ từ khóa khác nhé!');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Đã xảy ra lỗi khi tìm kiếm hình ảnh. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playPop();
    performSearch(query);
  };

  const handleSelect = (item: SearchResult) => {
    setSelectedResult(item);
    audioManager.playPop();
  };

  const handleConfirmSelection = () => {
    if (!selectedResult) return;
    audioManager.playFanfare();

    // Pass proxied URL so canvas/SVG never encounters CORS errors
    const proxiedUrl = selectedResult.url.startsWith('data:')
      ? selectedResult.url
      : `/api/proxy-image?url=${encodeURIComponent(selectedResult.url)}`;

    const newPuzzleImage: PuzzleImage = {
      id: `web-${Date.now()}`,
      title: selectedResult.title || 'Tranh Tìm Kiếm Web',
      titleEn: selectedResult.title,
      category: 'custom',
      src: proxiedUrl,
      isCustom: true,
    };

    onSelectImage(newPuzzleImage);
  };

  const handleConfirmDirectUrl = () => {
    if (!directUrl.trim()) return;
    audioManager.playFanfare();

    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(directUrl.trim())}`;
    const newPuzzleImage: PuzzleImage = {
      id: `direct-${Date.now()}`,
      title: 'Ảnh Dán Từ Google',
      titleEn: 'Google Image Link',
      category: 'custom',
      src: proxiedUrl,
      isCustom: true,
    };

    onSelectImage(newPuzzleImage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl my-auto p-4 sm:p-7 shadow-2xl border-4 border-amber-300 relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xl shadow-inner">
              🔍
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>Tìm Kiếm Hình Ảnh Trực Tuyến</span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Google & Web
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Tìm bất kỳ nhân vật hoạt hình, xe cộ hay con vật bé thích để ghép tranh!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4 shrink-0 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ví dụ: mèo con, siêu nhân, xe cứu hỏa, khủng long..."
                className="w-full pl-11 pr-10 py-3 bg-amber-50/50 focus:bg-white rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-md transition-transform active:scale-95 flex items-center gap-2 text-sm sm:text-base cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>Tìm Ảnh</span>
            </button>
          </form>

          {/* Quick Suggestions for Toddlers */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="font-bold text-amber-900 shrink-0">Gợi ý cho bé:</span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  audioManager.playPop();
                  performSearch(item);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  query === item
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Alternative: Direct Image URL Paste */}
          <details className="bg-slate-50 rounded-2xl p-2.5 text-xs border border-slate-200 group">
            <summary className="font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 select-none">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Hoặc dán trực tiếp link ảnh từ Google Hình Ảnh (URL)</span>
            </summary>
            <div className="mt-2.5 flex gap-2">
              <input
                type="url"
                value={directUrl}
                onChange={(e) => {
                  setDirectUrl(e.target.value);
                  setUrlPreviewValid(null);
                }}
                placeholder="https://example.com/image.jpg..."
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 font-medium outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmDirectUrl}
                disabled={!directUrl.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ghép Link Này
              </button>
            </div>
          </details>
        </div>

        {/* Results Grid */}
        <div className="mt-4 flex-1 overflow-y-auto min-h-[260px] p-2 bg-slate-50/70 rounded-2xl border border-slate-200">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-amber-800 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <p className="font-bold text-sm">Đang tìm các bức tranh thật đẹp cho bé...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="font-bold text-sm text-slate-700">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Search className="w-10 h-10" />
              <p className="font-semibold text-sm">Nhập từ khóa để tìm tranh ghép cho bé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((res) => {
                const isSelected = selectedResult?.id === res.id;
                return (
                  <div
                    key={res.id}
                    onClick={() => handleSelect(res)}
                    className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-white cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-4 ring-amber-500 scale-102 shadow-xl z-10'
                        : 'hover:scale-102 hover:shadow-md border border-slate-200'
                    }`}
                  >
                    <img
                      src={res.thumbUrl}
                      alt={res.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback image container
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Gradient title bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                      <p className="text-[11px] font-bold text-white truncate drop-shadow-sm">
                        {res.title}
                      </p>
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-75">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-semibold">
            {selectedResult ? (
              <span className="text-amber-800 font-bold">
                ✓ Đã chọn: <span className="underline">{selectedResult.title}</span>
              </span>
            ) : (
              <span>Chạm vào một bức ảnh phía trên để chọn</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!selectedResult}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Dùng Bức Ảnh Này Ghép Tranh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
