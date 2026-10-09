import React, { useState } from 'react';
import {
  Palette,
  Upload,
  Play,
  Settings2,
  Sparkles,
  HelpCircle,
  Search
} from 'lucide-react';
import { Category, PieceCount, PuzzleImage, PuzzleSettings } from '../types';
import { audioManager } from '../utils/audio';

interface PuzzleGalleryProps {
  images: PuzzleImage[];
  onPlayPuzzle: (image: PuzzleImage, settings: PuzzleSettings) => void;
  onCustomizePuzzle: (image: PuzzleImage) => void;
  onOpenDrawingPad: () => void;
  onOpenUploadModal: () => void;
  onOpenGoogleSearch?: () => void;
}

export const PuzzleGallery: React.FC<PuzzleGalleryProps> = ({
  images,
  onPlayPuzzle,
  onCustomizePuzzle,
  onOpenDrawingPad,
  onOpenUploadModal,
  onOpenGoogleSearch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedQuickPieces, setSelectedQuickPieces] = useState<PieceCount>(2);

  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả', icon: '🎨' },
    { id: 'animals', label: 'Động Vật', icon: '🐶' },
    { id: 'vehicles', label: 'Xe Cộ', icon: '🚗' },
    { id: 'dino', label: 'Khủng Long', icon: '🦕' },
    { id: 'fruits', label: 'Trái Cây', icon: '🍎' },
    { id: 'custom', label: 'Tranh Bé Tự Tạo', icon: '🖼️' },
  ];

  const filteredImages = images.filter((img) => {
    if (selectedCategory === 'all') return true;
    return img.category === selectedCategory;
  });

  const handleQuickStart = (image: PuzzleImage, count: PieceCount) => {
    audioManager.playSnap();
    onPlayPuzzle(image, {
      pieceCount: count,
      cutStyle: count === 2 ? 'classic' : 'classic',
      allowRotation: false,
      ghostOpacity: 0.5,
      smartAssist: true,
      soundEnabled: audioManager.isSoundEnabled(),
      splitOrientation: 'horizontal',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero Welcome Banner for Preschoolers & Parents */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-300 rounded-3xl p-6 sm:p-8 text-amber-950 shadow-md border-2 border-amber-200 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black text-amber-900 border border-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Phần Mềm Ghép Hình Cho Bé Mầm Non · Từ 2 Mảnh Ghép</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-amber-950 leading-tight">
            Bé Chạm & Kéo Thả Ghép Tranh Vui Nhộn
          </h1>
          <p className="text-sm sm:text-base font-semibold text-amber-900/90">
            Dành riêng cho các bé 2 - 6 tuổi: bắt đầu từ 2 mảnh cực kỳ dễ ghép, bé có thể chạm nhẹ một lần hoặc kéo thả tự nhiên để ghép tranh.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                audioManager.playPop();
                handleQuickStart(images[0], 2);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-amber-900 hover:bg-black text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Chơi Ngay Tranh 2 Mảnh Cún Con</span>
            </button>
            <button
              onClick={() => {
                audioManager.playPop();
                onOpenDrawingPad();
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-amber-50 text-amber-950 font-black rounded-2xl shadow-md border border-amber-200 transition-transform active:scale-95 text-sm cursor-pointer"
            >
              <Palette className="w-4 h-4 text-pink-500" />
              <span>Bé Tự Vẽ Bức Tranh Mới</span>
            </button>
          </div>
        </div>

        {/* Decorative Floating Puzzle Stamp */}
        <div className="hidden sm:block absolute right-8 top-1/2 -translate-y-1/2 opacity-90 select-none pointer-events-none text-8xl">
          🧩
        </div>
      </div>

      {/* Quick Settings & Category Filter */}
      <div className="space-y-4">
        {/* Quick Piece Count Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-slate-800">
              Chọn nhanh số mảnh ghép:
            </span>
            <div className="flex items-center gap-1.5">
              {([2, 3, 4, 6, 8, 9] as PieceCount[]).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setSelectedQuickPieces(num);
                    audioManager.playPop();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedQuickPieces === num
                      ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {num} mảnh
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGoogleSearch && (
              <button
                onClick={() => {
                  audioManager.playPop();
                  onOpenGoogleSearch();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Search className="w-3.5 h-3.5 text-amber-600" />
                <span>Tìm Ảnh Google</span>
              </button>
            )}
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải Ảnh Của Bé</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                audioManager.playPop();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-amber-200/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className="group bg-white rounded-3xl p-3 border-2 border-amber-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between"
          >
            {/* Image Preview Box */}
            <div
              onClick={() => handleQuickStart(image, selectedQuickPieces)}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-inner bg-slate-100"
            >
              <img
                src={image.src}
                alt={image.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Play Badge Overlay */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-white ml-1" />
                </div>
              </div>

              {/* Piece count pill */}
              <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                {selectedQuickPieces} Mảnh Ghép
              </div>
            </div>

            {/* Title & Actions */}
            <div className="pt-3 pb-1">
              <h3 className="font-black text-slate-800 text-base line-clamp-1 mb-1">
                {image.title}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mb-3">
                {image.category === 'animals'
                  ? 'Động vật dễ thương'
                  : image.category === 'vehicles'
                  ? 'Xe cộ bé yêu'
                  : image.category === 'dino'
                  ? 'Thế giới khủng long'
                  : image.category === 'fruits'
                  ? 'Hoa quả ngọt ngào'
                  : 'Tranh tự tạo'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickStart(image, selectedQuickPieces)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Ghép {selectedQuickPieces} Mảnh</span>
                </button>

                <button
                  onClick={() => {
                    audioManager.playPop();
                    onCustomizePuzzle(image);
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Tùy chọn số mảnh và kiểu cắt"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guide Section for Toddlers and Parents */}
      <div className="bg-amber-50/80 rounded-3xl p-6 border-2 border-amber-200/90 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-amber-700" />
          <h2 className="text-lg sm:text-xl font-black text-amber-950">
            Hướng Dẫn Bé Mầm Non Ghép Tranh
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-2xl mb-2">1️⃣</div>
            <h3 className="font-black text-slate-800 text-sm mb-1">
              Bắt đầu với 2 mảnh ghép
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Đối với bé 2 - 3 tuổi, chọn chế độ 2 mảnh (nửa trái - nửa phải) giúp bé dễ dàng quan sát và nhận biết hình dạng mà không bị nản lòng.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-2xl mb-2">2️⃣</div>
            <h3 className="font-black text-slate-800 text-sm mb-1">
              Chạm hoặc Kéo thả linh hoạt
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Bé chỉ cần chạm nhẹ vào mảnh ghép rồi chạm vào ô trên bảng để ghép, hoặc dùng ngón tay kéo thả vào vị trí có từ tính tự hút.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-2xl mb-2">3️⃣</div>
            <h3 className="font-black text-slate-800 text-sm mb-1">
              Tự vẽ và Tải ảnh của bé
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Bé có thể vẽ tranh với bút màu sáp, chụp ảnh thú cưng hay ảnh gia đình và phần mềm sẽ tự động cắt thành các mảnh ghép thông minh!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
