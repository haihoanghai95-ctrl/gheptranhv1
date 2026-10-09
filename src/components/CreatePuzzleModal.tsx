import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Palette,
  Image as ImageIcon,
  Sparkles,
  X,
  Check,
  Layers,
  HelpCircle,
  Search
} from 'lucide-react';
import { CutStyle, PieceCount, PuzzleImage, PuzzleSettings } from '../types';
import { PRESET_IMAGES } from '../data/presetImages';
import { audioManager } from '../utils/audio';

interface CreatePuzzleModalProps {
  onStartPuzzle: (image: PuzzleImage, settings: PuzzleSettings) => void;
  onOpenDrawingPad: () => void;
  onOpenGoogleSearch?: () => void;
  onClose: () => void;
  initialImage?: PuzzleImage;
}

export const CreatePuzzleModal: React.FC<CreatePuzzleModalProps> = ({
  onStartPuzzle,
  onOpenDrawingPad,
  onOpenGoogleSearch,
  onClose,
  initialImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<PuzzleImage>(
    initialImage || PRESET_IMAGES[0]
  );
  const [pieceCount, setPieceCount] = useState<PieceCount>(2);
  const [cutStyle, setCutStyle] = useState<CutStyle>('classic');
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.5);
  const [smartAssist, setSmartAssist] = useState<boolean>(true);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const customImg: PuzzleImage = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        titleEn: 'My Photo',
        category: 'custom',
        src,
        isCustom: true,
      };
      setSelectedImage(customImg);
      audioManager.playPop();
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 800 }, height: { ideal: 600 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
      audioManager.playPop();
    } catch {
      alert('Không thể kết nối camera. Vui lòng cho phép quyền truy cập máy ảnh!');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/jpeg', 0.9);

    const capturedImg: PuzzleImage = {
      id: `camera-${Date.now()}`,
      title: 'Ảnh Chụp Của Bé 📸',
      titleEn: 'Camera Photo',
      category: 'custom',
      src,
      isCustom: true,
    };
    setSelectedImage(capturedImg);
    stopCamera();
    audioManager.playFanfare();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playSnap();
    onStartPuzzle(selectedImage, {
      pieceCount,
      cutStyle,
      allowRotation: false,
      ghostOpacity,
      smartAssist,
      soundEnabled: audioManager.isSoundEnabled(),
      splitOrientation,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl my-auto p-5 sm:p-7 shadow-2xl border-4 border-amber-300 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xl shadow-inner">
              🧩
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                Tạo Tranh Ghép Mới Cho Bé
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Chọn hình ảnh và số mảnh ghép (bắt đầu từ 2 mảnh cực dễ!)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Modal View */}
        {isCameraActive ? (
          <div className="my-5 p-4 bg-slate-900 rounded-3xl text-center text-white space-y-4">
            <div className="relative aspect-[4/3] max-w-md mx-auto bg-black rounded-2xl overflow-hidden border-2 border-amber-400">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>Chụp Ảnh Này</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-5">
            {/* 1. Image Selection Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>1. Chọn bức tranh để ghép:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh lên</span>
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp ảnh</span>
                  </button>
                  {onOpenGoogleSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGoogleSearch();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tìm Google</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDrawingPad();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-xl transition-all"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Bé tự vẽ</span>
                  </button>
                </div>
              </div>

              {/* Thumbnails row */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-h-36 overflow-y-auto p-1 bg-amber-50/50 rounded-2xl border border-amber-200">
                {selectedImage.isCustom && (
                  <div
                    onClick={() => audioManager.playPop()}
                    className="relative rounded-xl overflow-hidden aspect-[4/3] ring-4 ring-amber-500 cursor-pointer shadow-md bg-white"
                  >
                    <img
                      src={selectedImage.src}
                      alt={selectedImage.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white text-center font-bold py-0.5 truncate px-1">
                      Ảnh của bé
                    </div>
                  </div>
                )}
                {PRESET_IMAGES.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => {
                      setSelectedImage(img);
                      audioManager.playPop();
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer transition-transform ${
                      selectedImage.id === img.id
                        ? 'ring-4 ring-amber-500 scale-105 shadow-md'
                        : 'opacity-80 hover:opacity-100 hover:scale-102 border border-slate-200'
                    }`}
                  >
                    <img
                      src={img.src}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[10px] text-white text-center font-bold pt-2 pb-0.5 px-1 truncate">
                      {img.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Piece Count Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>2. Số mảnh ghép (Bé mầm non thích nhất từ 2 đến 6 mảnh):</span>
                </label>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {pieceCount === 2
                    ? '2 Mảnh · Rất Dễ (Bé 2-3 tuổi)'
                    : pieceCount === 3
                    ? '3 Mảnh · Dễ'
                    : pieceCount === 4
                    ? '4 Mảnh (2x2) · Tiêu chuẩn'
                    : pieceCount === 6
                    ? '6 Mảnh (2x3)'
                    : pieceCount === 9
                    ? '9 Mảnh (3x3)'
                    : `${pieceCount} Mảnh`}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {([2, 3, 4, 6, 8, 9, 12, 16] as PieceCount[]).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setPieceCount(num);
                      audioManager.playPop();
                    }}
                    className={`py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center font-black transition-all ${
                      pieceCount === num
                        ? 'bg-amber-500 text-white shadow-lg ring-4 ring-amber-200 scale-105'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-lg leading-none">{num}</span>
                    <span className="text-[10px] uppercase font-bold opacity-80 mt-0.5">mảnh</span>
                  </button>
                ))}
              </div>

              {/* Special orientation toggle for 2 and 3 pieces */}
              {(pieceCount === 2 || pieceCount === 3) && (
                <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-900">
                    Hướng chia {pieceCount} mảnh:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSplitOrientation('horizontal');
                        audioManager.playPop();
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        splitOrientation === 'horizontal'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Trái - Phải (Dọc)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitOrientation('vertical');
                        audioManager.playPop();
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        splitOrientation === 'vertical'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Trên - Dưới (Ngang)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Cut Style (Classic, Wavy, Tiles) */}
            <div>
              <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>3. Kiểu đường cắt ghép hình:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'classic' as CutStyle,
                    name: 'Răng Cưa Cổ Điển',
                    desc: 'Có tai ghép lồi lõm truyền thống',
                    badge: 'Khuyên Dùng',
                  },
                  {
                    id: 'wavy' as CutStyle,
                    name: 'Lượn Sóng Nhẹ',
                    desc: 'Đường cong mềm mại cho mầm non',
                    badge: 'Bé Thích',
                  },
                  {
                    id: 'tiles' as CutStyle,
                    name: 'Mảnh Vuông Thẳng',
                    desc: 'Cực kỳ dễ ghép cho bé mới tập',
                    badge: 'Bé 2 Tuổi',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setCutStyle(s.id);
                      audioManager.playPop();
                    }}
                    className={`p-3 rounded-2xl text-left border-2 transition-all ${
                      cutStyle === s.id
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-slate-800 text-sm">{s.name}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded-md">
                        {s.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Toddler Help Aids (Ghost background, tap-to-place) */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span className="text-xs sm:text-sm font-bold text-amber-950">
                    Hình mẫu mờ bên dưới (Gợi ý cho bé):
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: 'Tắt (0%)', val: 0 },
                    { label: 'Mờ nhẹ (25%)', val: 0.25 },
                    { label: 'Vừa (50%)', val: 0.5 },
                    { label: 'Rõ nét (75%)', val: 0.75 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setGhostOpacity(item.val);
                        audioManager.playPop();
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                        ghostOpacity === item.val
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                <span className="text-xs font-bold text-amber-950">
                  Hỗ trợ bé chạm (Tap) hoặc kéo thả (Drag & Drop):
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smartAssist}
                    onChange={(e) => setSmartAssist(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Bật đèn sáng ô cần ghép</span>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-5 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all text-base cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Bắt Đầu Ghép Tranh!</span>
                <Check className="w-5 h-5 ml-1" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
