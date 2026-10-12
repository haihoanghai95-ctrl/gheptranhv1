import React, { useState, useRef } from 'react';
import {
  Play,
  Settings2,
  Sparkles,
  Upload,
  Palette,
  Trash2,
  Search,
  HelpCircle,
  Edit2,
  Cloud,
  CheckCircle2,
  Loader2,
  Camera,
  X
} from 'lucide-react';
import { Category, PieceCount, PuzzleImage, PuzzleSettings } from '../types';
import { audioManager } from '../utils/audio';
import { compressImage } from '../utils/puzzleStorage';
import { User } from 'firebase/auth';

interface PuzzleGalleryProps {
  images: PuzzleImage[];
  onPlayPuzzle: (image: PuzzleImage, settings: PuzzleSettings) => void;
  onCustomizePuzzle: (image: PuzzleImage) => void;
  onOpenDrawingPad: () => void;
  onOpenUploadModal: () => void;
  onOpenGoogleSearch?: () => void;
  onDeletePuzzle?: (puzzleId: string) => void;
  onSaveCustomImage?: (image: PuzzleImage) => void;
  onUpdatePuzzleTitle?: (puzzleId: string, newTitle: string) => void;
  user?: User | null;
  onLogin?: () => void;
  isLoggingIn?: boolean;
}

export const PuzzleGallery: React.FC<PuzzleGalleryProps> = ({
  images,
  onPlayPuzzle,
  onCustomizePuzzle,
  onOpenDrawingPad,
  onOpenUploadModal,
  onOpenGoogleSearch,
  onDeletePuzzle,
  onSaveCustomImage,
  onUpdatePuzzleTitle,
  user,
  onLogin,
  isLoggingIn = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedQuickPieces, setSelectedQuickPieces] = useState<PieceCount>(2);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadToast, setUploadToast] = useState<{ message: string; image?: PuzzleImage } | null>(null);

  // Rename modal state
  const [editingImage, setEditingImage] = useState<PuzzleImage | null>(null);
  const [newTitleInput, setNewTitleInput] = useState<string>('');

  // Delete modal state
  const [deletingImage, setDeletingImage] = useState<PuzzleImage | null>(null);

  // Hidden direct file input ref
  const directFileInputRef = useRef<HTMLInputElement | null>(null);

  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả', icon: '🎨' },
    { id: 'custom', label: 'Tranh Của Bé (Đã Lưu)', icon: '🖼️' },
    { id: 'animals', label: 'Động Vật', icon: '🐶' },
    { id: 'vehicles', label: 'Xe Cộ', icon: '🚗' },
    { id: 'dino', label: 'Khủng Long', icon: '🦕' },
    { id: 'fruits', label: 'Trái Cây', icon: '🍎' },
  ];

  const filteredImages = images.filter((img) => {
    if (selectedCategory === 'all') return true;
    return img.category === selectedCategory;
  });

  const handleQuickStart = (image: PuzzleImage, count: PieceCount) => {
    audioManager.playSnap();
    onPlayPuzzle(image, {
      pieceCount: count,
      cutStyle: 'classic',
      allowRotation: false,
      ghostOpacity: 0.5,
      smartAssist: true,
      soundEnabled: audioManager.isSoundEnabled(),
      splitOrientation: 'horizontal',
    });
  };

  // Direct image file upload and instant saving
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    audioManager.playPop();

    try {
      const compressedSrc = await compressImage(file, 800, 0.8);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').trim() || 'Ảnh Của Bé';
      const customImg: PuzzleImage = {
        id: `custom-${Date.now()}`,
        title: cleanTitle,
        titleEn: cleanTitle,
        category: 'custom',
        src: compressedSrc,
        isCustom: true,
      };

      if (onSaveCustomImage) {
        onSaveCustomImage(customImg);
      }

      // Switch to custom category so user sees their new puzzle immediately
      setSelectedCategory('custom');
      audioManager.playFanfare();

      setUploadToast({
        message: `Đã lưu tranh "${cleanTitle}" vào bộ sưu tập! Bé có thể ghép ngay bây giờ.`,
        image: customImg,
      });
      setTimeout(() => setUploadToast(null), 7000);
    } catch (err) {
      console.error('File process error:', err);
      setUploadToast({
        message: 'Không thể xử lý ảnh này. Bé hoặc bố mẹ vui lòng chọn ảnh khác nhé!',
      });
      setTimeout(() => setUploadToast(null), 5000);
    } finally {
      setIsUploading(false);
      if (directFileInputRef.current) {
        directFileInputRef.current.value = '';
      }
    }
  };

  // Handle direct file upload input change
  const handleDirectFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleProcessFile(file);
    }
  };

  // Confirm rename
  const handleSaveRename = () => {
    if (editingImage && newTitleInput.trim() && onUpdatePuzzleTitle) {
      onUpdatePuzzleTitle(editingImage.id, newTitleInput.trim());
      audioManager.playPop();
    }
    setEditingImage(null);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deletingImage && onDeletePuzzle) {
      onDeletePuzzle(deletingImage.id);
      audioManager.playPop();
    }
    setDeletingImage(null);
  };

  const customCount = images.filter((img) => img.isCustom).length;

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8"
    >
      {/* Hidden direct file input */}
      <input
        type="file"
        ref={directFileInputRef}
        accept="image/*"
        onChange={handleDirectFileInputChange}
        className="hidden"
      />

      {/* Floating Upload Success Toast */}
      {uploadToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-11/12 bg-white rounded-2xl p-4 border-2 border-emerald-400 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-black text-slate-800">
                {uploadToast.message}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">
                💾 Đã lưu vĩnh viễn trên máy {user ? 'và đồng bộ Gmail ☁️' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {uploadToast.image && (
              <button
                onClick={() => {
                  if (uploadToast.image) {
                    handleQuickStart(uploadToast.image, selectedQuickPieces);
                    setUploadToast(null);
                  }
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Ghép Ngay!
              </button>
            )}
            <button
              onClick={() => setUploadToast(null)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

            {/* Direct Upload button in Hero */}
            <button
              onClick={() => directFileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-md transition-transform active:scale-95 text-sm cursor-pointer disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isUploading ? 'Đang Lưu Tranh...' : 'Tải Ảnh Mới Của Bé'}</span>
            </button>

            <button
              onClick={() => {
                audioManager.playPop();
                onOpenDrawingPad();
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-amber-50 text-amber-950 font-black rounded-2xl shadow-md border border-amber-200 transition-transform active:scale-95 text-sm cursor-pointer"
            >
              <Palette className="w-4 h-4 text-pink-500" />
              <span>Bé Tự Vẽ Tranh</span>
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
        {/* Quick Piece Count Selector & Direct Upload Actions */}
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Direct Upload Button */}
            <button
              onClick={() => directFileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              title="Chọn ảnh từ máy tính hoặc điện thoại để lưu ngay"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? 'Đang lưu ảnh...' : 'Tải Ảnh Từ Máy'}</span>
            </button>

            {onOpenGoogleSearch && (
              <button
                onClick={() => {
                  audioManager.playPop();
                  onOpenGoogleSearch();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Search className="w-3.5 h-3.5 text-amber-600" />
                <span>Tìm Google</span>
              </button>
            )}

            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Tùy Chỉnh Tranh</span>
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
              {cat.id === 'custom' && customCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    selectedCategory === 'custom'
                      ? 'bg-white text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {customCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Sync Notice for Custom category */}
      {selectedCategory === 'custom' && !user && onLogin && (
        <div className="bg-gradient-to-r from-blue-50 to-amber-50 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☁️</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Đăng nhập Gmail để sao lưu đám mây vĩnh viễn tranh của bé
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Mọi tranh tải từ máy và tự vẽ đang được lưu an toàn trên trình duyệt này. Đăng nhập Gmail sẽ tự động sao lưu lên đám mây để xem trên mọi máy khác!
              </p>
            </div>
          </div>
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập Gmail'}</span>
          </button>
        </div>
      )}

      {/* Puzzle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Direct Upload Card: Always shown when viewing Custom or All categories */}
        {(selectedCategory === 'custom' || selectedCategory === 'all') && (
          <div
            onClick={() => directFileInputRef.current?.click()}
            className="group bg-gradient-to-b from-blue-50/80 to-amber-50/60 rounded-3xl p-5 border-2 border-dashed border-blue-300 hover:border-blue-500 shadow-xs hover:shadow-lg transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer min-h-[280px]"
          >
            <div className="w-16 h-16 rounded-3xl bg-blue-500 group-hover:scale-110 text-white flex items-center justify-center shadow-md transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base mb-1">
                ➕ Tải Tranh Mới Của Bé
              </h3>
              <p className="text-xs text-slate-500 font-medium px-2">
                Bấm vào đây hoặc kéo thả ảnh vào để tự động lưu vĩnh viễn và tạo tranh ghép!
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  directFileInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                📁 Chọn ảnh từ máy
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUploadModal();
                }}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
              >
                📸 Camera
              </button>
            </div>
          </div>
        )}

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
                crossOrigin="anonymous"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/api/proxy-image') && image.src.startsWith('http')) {
                    target.src = `/api/proxy-image?url=${encodeURIComponent(image.src)}`;
                  }
                }}
              />

              {/* Play Badge Overlay */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-white ml-1" />
                </div>
              </div>

              {/* Piece count pill & Saved badge */}
              <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                {selectedQuickPieces} Mảnh Ghép
              </div>

              {image.isCustom && (
                <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1">
                  <span>💾 Đã lưu</span>
                  {user && <span>· ☁️</span>}
                </div>
              )}
            </div>

            {/* Title & Actions */}
            <div className="pt-3 pb-1">
              <div className="flex items-center justify-between gap-1 mb-1">
                <h3 className="font-black text-slate-800 text-base line-clamp-1 flex-1">
                  {image.title}
                </h3>
                {image.isCustom && onUpdatePuzzleTitle && (
                  <button
                    onClick={() => {
                      setEditingImage(image);
                      setNewTitleInput(image.title);
                      audioManager.playPop();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Đổi tên tranh"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 font-semibold mb-3">
                {image.isCustom
                  ? 'Tranh tự tải lên của bé'
                  : image.category === 'animals'
                  ? 'Động vật dễ thương'
                  : image.category === 'vehicles'
                  ? 'Xe cộ bé yêu'
                  : image.category === 'dino'
                  ? 'Thế giới khủng long'
                  : 'Hoa quả ngọt ngào'}
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

                {image.isCustom && onDeletePuzzle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingImage(image);
                      audioManager.playPop();
                    }}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="Xóa bức tranh này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rename Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-amber-300 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-600" />
              <span>Đổi Tên Bức Tranh</span>
            </h3>
            <input
              type="text"
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              placeholder="Nhập tên mới..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingImage(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Lưu Tên Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
      {deletingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-rose-300 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                Xóa Bức Tranh Này?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Bức tranh "{deletingImage.title}" sẽ được xóa khỏi bộ sưu tập của bé.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingImage(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Giữ Lại Tranh
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Section for Toddlers and Parents */}
      <div className="bg-amber-50/80 rounded-3xl p-6 border-2 border-amber-200/90 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-amber-700" />
          <h2 className="text-lg sm:text-xl font-black text-amber-950">
            Hướng Dẫn Bé Mầm Non Ghép Tranh & Lưu Trữ
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
              Tự lưu vĩnh viễn trên máy & đám mây
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Mọi ảnh chụp từ camera, ảnh tải từ điện thoại hoặc do bé tự vẽ đều được tự động lưu vĩnh viễn vào bộ sưu tập này.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-2xl mb-2">3️⃣</div>
            <h3 className="font-black text-slate-800 text-sm mb-1">
              Chạm hoặc Kéo thả linh hoạt
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Bé chỉ cần chạm nhẹ vào mảnh ghép rồi chạm vào ô trên bảng để ghép, hoặc dùng ngón tay kéo thả vào vị trí có từ tính tự hút.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
