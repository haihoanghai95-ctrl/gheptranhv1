import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  X,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  ExternalLink,
  Play
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
  'Xe cứu hỏa',
  'Khủng long',
  'Doraemon',
  'Máy bay',
  'Gấu trúc Panda',
  'Công chúa Elsa',
  'Trái cây hoạt hình',
  'Tàu hỏa xe lửa',
  'Chú thỏ trắng',
];

const VI_TO_EN_KEYWORDS: Record<string, string> = {
  'mèo': 'cute cartoon cat',
  'mèo con': 'cute kitten cartoon',
  'chó': 'cute cartoon puppy dog',
  'chó con': 'cute cartoon puppy',
  'cún': 'cute puppy cartoon',
  'cún con': 'cute puppy cartoon',
  'xe cảnh sát': 'cartoon police car',
  'xe cứu hỏa': 'cartoon fire truck',
  'khủng long': 'cute cartoon dinosaur',
  'doraemon': 'doraemon',
  'máy bay': 'cartoon airplane',
  'gấu trúc': 'cute cartoon panda',
  'gấu': 'cute cartoon bear',
  'công chúa': 'cute princess cartoon',
  'elsa': 'frozen elsa princess cartoon',
  'trái cây': 'cute cartoon fruit',
  'hoa quả': 'cute cartoon fruits',
  'tàu hỏa': 'cartoon train',
  'xe lửa': 'cartoon train',
  'xe buýt': 'cartoon school bus',
  'ô tô': 'cartoon car',
  'xe hơi': 'cartoon car',
  'thỏ': 'cute cartoon bunny rabbit',
  'voi': 'cute cartoon baby elephant',
  'hổ': 'cute cartoon tiger',
  'ngựa': 'cute cartoon pony horse',
  'cá': 'cute cartoon fish',
  'siêu nhân': 'cartoon superhero',
};

function getSearchTerms(rawQuery: string): string[] {
  const qLower = rawQuery.trim().toLowerCase();
  const terms: string[] = [rawQuery.trim()];

  // Check dictionary matches
  for (const [vi, en] of Object.entries(VI_TO_EN_KEYWORDS)) {
    if (qLower.includes(vi)) {
      terms.push(en);
      break;
    }
  }

  return terms;
}

export const GoogleImageSearchModal: React.FC<GoogleImageSearchModalProps> = ({
  onSelectImage,
  onClose,
}) => {
  const [query, setQuery] = useState('chú cún con');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Direct URL paste
  const [directUrl, setDirectUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedResult(null);

    const terms = getSearchTerms(searchQuery);

    try {
      // 1. First attempt full-stack server endpoint safely (if running)
      try {
        const response = await fetch(`/api/search-images?q=${encodeURIComponent(searchQuery)}`);
        const cType = response.headers.get('content-type') || '';
        if (response.ok && cType.includes('application/json')) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            setResults(data.results);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback directly to client-side fetch (100% works on Vercel/mobile static hosts)
      }

      // 2. Client-side multi-source search (Wikimedia Commons + Openverse)
      const primaryTerm = terms[terms.length - 1] || searchQuery;
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        primaryTerm
      )}&gsrnamespace=6&gsrlimit=28&prop=imageinfo&iiprop=url|mime|thumburl&iiurlwidth=600&format=json&origin=*`;

      const wikiRes = await fetch(wikiUrl);
      const wikiData = await wikiRes.json();
      const pages = Object.values(wikiData.query?.pages || {});

      const wikiResults: SearchResult[] = pages
        .filter((p: any) => p.imageinfo && p.imageinfo[0]?.url)
        .map((p: any, idx: number) => {
          const info = p.imageinfo[0];
          const cleanTitle = (p.title || searchQuery).replace(/^File:/i, '').replace(/\.[^/.]+$/, '');
          // Use high-resolution direct thumburl or full url (upload.wikimedia.org has CORS enabled)
          const targetUrl = info.thumburl || info.url;
          return {
            id: `wiki-${idx}-${Date.now()}`,
            title: cleanTitle,
            url: targetUrl,
            thumbUrl: targetUrl,
            source: 'Wikimedia / Web',
          };
        });

      if (wikiResults.length > 0) {
        setResults(wikiResults);
      } else {
        // Try fallback to Openverse if Wikimedia had no hits
        try {
          const ovUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
            primaryTerm
          )}&page_size=20`;
          const ovRes = await fetch(ovUrl);
          if (ovRes.ok) {
            const ovData = await ovRes.json();
            if (ovData.results && ovData.results.length > 0) {
              const ovResults: SearchResult[] = ovData.results.map((item: any, idx: number) => ({
                id: `ov-${idx}-${Date.now()}`,
                title: item.title || searchQuery,
                url: item.url,
                thumbUrl: item.thumbnail || item.url,
                source: 'Openverse',
              }));
              setResults(ovResults);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Openverse fallback
        }

        setError('Không tìm thấy hình ảnh phù hợp. Bé hoặc mẹ thử gõ từ khóa khác nhé!');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Không thể kết nối tìm ảnh. Bé thử chọn các từ khóa gợi ý phía dưới nhé!');
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

  const handleQuickPlay = (item: SearchResult) => {
    audioManager.playFanfare();
    const newPuzzleImage: PuzzleImage = {
      id: `web-${Date.now()}`,
      title: item.title || 'Tranh Tìm Kiếm Web',
      titleEn: item.title,
      category: 'custom',
      src: item.url,
      isCustom: true,
    };
    onSelectImage(newPuzzleImage);
  };

  const handleConfirmSelection = () => {
    if (!selectedResult) return;
    handleQuickPlay(selectedResult);
  };

  const handleConfirmDirectUrl = () => {
    if (!directUrl.trim()) return;
    audioManager.playFanfare();

    const newPuzzleImage: PuzzleImage = {
      id: `direct-${Date.now()}`,
      title: 'Ảnh Dán Từ Google',
      titleEn: 'Google Image Link',
      category: 'custom',
      src: directUrl.trim(),
      isCustom: true,
    };

    onSelectImage(newPuzzleImage);
  };

  // Upload photo directly from phone library or camera
  const handlePhoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const customImg: PuzzleImage = {
        id: `phone-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, '') || 'Ảnh Từ Điện Thoại',
        titleEn: 'Phone Photo',
        category: 'custom',
        src,
        isCustom: true,
      };
      audioManager.playFanfare();
      onSelectImage(customImg);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm sm:p-4">
      {/* Container: Full screen on mobile, comfortable modal on desktop */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl sm:border-4 sm:border-amber-300 sm:shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-amber-100 bg-amber-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center font-black text-lg sm:text-xl shadow-inner">
              🔍
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-800 flex items-center gap-1.5">
                <span>Tìm Ảnh Ghép Trực Tuyến</span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Google & Web
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                Dành cho điện thoại & máy tính · Hàng triệu ảnh đẹp cho bé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Mobile Controls */}
        <div className="p-3 sm:p-4 space-y-2.5 border-b border-amber-100 shrink-0 bg-white">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Gõ từ khóa: mèo con, siêu nhân, khủng long..."
                className="w-full pl-9 sm:pl-10 pr-8 py-2.5 sm:py-3 bg-amber-50/60 focus:bg-white rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tìm</span>
            </button>
          </form>

          {/* Quick Suggestions Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] sm:text-xs">
            <span className="font-bold text-amber-900 shrink-0">Bé thích:</span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  audioManager.playPop();
                  performSearch(item);
                }}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  query === item
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Action Row: Google Link Helper + Mobile Upload */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Hidden file input for phone gallery */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhoneFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📱 Tải ảnh từ thư viện điện thoại</span>
            </button>

            <a
              href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query || 'cartoon for kids')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition-colors"
            >
              <span>Xem trên Google</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Direct URL Paste toggle */}
          <details className="bg-slate-50 rounded-xl p-2 text-xs border border-slate-200">
            <summary className="font-bold text-slate-700 cursor-pointer flex items-center gap-1 select-none text-[11px]">
              <LinkIcon className="w-3 h-3 text-slate-500" />
              <span>Dán trực tiếp link ảnh (URL) từ Google Hình Ảnh</span>
            </summary>
            <div className="mt-2 flex gap-1.5">
              <input
                type="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="Dán link ảnh https://... tại đây"
                className="flex-1 px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 text-xs text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmDirectUrl}
                disabled={!directUrl.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs disabled:opacity-40"
              >
                Ghép Link
              </button>
            </div>
          </details>
        </div>

        {/* Results Grid - Responsive for mobile touch */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 bg-slate-50 min-h-0">
          {loading ? (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-amber-800 gap-2 sm:gap-3">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-amber-500" />
              <p className="font-bold text-xs sm:text-sm">Đang tìm các bức tranh thật đẹp cho bé...</p>
            </div>
          ) : error ? (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
              <p className="font-bold text-xs sm:text-sm text-slate-700">{error}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                📸 Chọn ảnh có sẵn trong máy
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Search className="w-8 h-8 sm:w-10 sm:h-10" />
              <p className="font-semibold text-xs sm:text-sm">Nhập từ khóa để tìm tranh ghép cho bé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 pb-16 sm:pb-2">
              {results.map((res) => {
                const isSelected = selectedResult?.id === res.id;
                return (
                  <div
                    key={res.id}
                    onClick={() => handleSelect(res)}
                    className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-white cursor-pointer transition-all touch-manipulation group ${
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
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Gradient title bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 sm:p-2 pt-4">
                      <p className="text-[10px] sm:text-[11px] font-bold text-white truncate drop-shadow-sm">
                        {res.title}
                      </p>
                    </div>

                    {/* Quick play overlay button on mobile / hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickPlay(res);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg transition-transform active:scale-90 flex items-center gap-1 text-[10px] font-black z-20"
                      title="Ghép ngay bức này"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span className="hidden sm:inline">Ghép ngay</span>
                    </button>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer sticky actions */}
        <div className="p-3 sm:p-4 border-t border-amber-100 bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate max-w-[200px] sm:max-w-md">
            {selectedResult ? (
              <span className="text-amber-800 font-bold">
                ✓ Đã chọn: <span className="underline">{selectedResult.title}</span>
              </span>
            ) : (
              <span>Chạm ảnh để chọn hoặc bấm nút Tam giác để chơi ngay</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-xs sm:text-sm"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!selectedResult}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ghép Tranh Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
