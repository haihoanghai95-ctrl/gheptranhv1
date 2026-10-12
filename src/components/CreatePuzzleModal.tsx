import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Palette,
  Image as ImageIcon,
  Sparkles,
  X,
  Check,
  Layers,
  Search,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CutStyle, PieceCount, PuzzleImage, PuzzleSettings } from '../types';
import { PRESET_IMAGES } from '../data/presetImages';
import { audioManager } from '../utils/audio';
import { compressImage } from '../utils/puzzleStorage';

interface CreatePuzzleModalProps {
  onStartPuzzle: (image: PuzzleImage, settings: PuzzleSettings) => void;
  onOpenDrawingPad: () => void;
  onOpenGoogleSearch?: () => void;
  onSaveCustomImage?: (image: PuzzleImage) => void;
  onClose: () => void;
  initialImage?: PuzzleImage;
  allCustomImages?: PuzzleImage[];
}

export const CreatePuzzleModal: React.FC<CreatePuzzleModalProps> = ({
  onStartPuzzle,
  onOpenDrawingPad,
  onOpenGoogleSearch,
  onSaveCustomImage,
  onClose,
  initialImage,
  allCustomImages = [],
}) => {
  const [selectedImage, setSelectedImage] = useState<PuzzleImage>(
    initialImage || (allCustomImages.length > 0 ? allCustomImages[0] : PRESET_IMAGES[0])
  );
  const [imageTitle, setImageTitle] = useState<string>(
    initialImage?.title || 'Ảnh Của Bé'
  );
  const [pieceCount, setPieceCount] = useState<PieceCount>(2);
  const [cutStyle, setCutStyle] = useState<CutStyle>('classic');
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.5);
  const [smartAssist, setSmartAssist] = useState<boolean>(true);

  // Status feedback
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedImage) {
      setImageTitle(selectedImage.title);
    }
  }, [selectedImage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);
    setSavedSuccessMessage(null);

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

      setSelectedImage(customImg);
      setImageTitle(cleanTitle);

      // Save directly to persistent storage
      if (onSaveCustomImage) {
        onSaveCustomImage(customImg);
      }

      setSavedSuccessMessage(`Đã lưu tranh "${cleanTitle}" vào bộ sưu tập! 💾`);
      audioManager.playFanfare();
    } catch {
      setErrorMessage('Không thể đọc ảnh này. Bé thử chọn ảnh định dạng JPG/PNG khác nhé!');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startCamera = async () => {
    setErrorMessage(null);
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
      setErrorMessage('Không thể mở camera. Vui lòng cho phép quyền truy cập máy ảnh!');
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
    const src = canvas.toDataURL('image/jpeg', 0.85);

    const title = 'Ảnh Chụp Của Bé 📸';
    const capturedImg: PuzzleImage = {
      id: `camera-${Date.now()}`,
      title,
      titleEn: 'Camera Photo',
      category: 'custom',
      src,
      isCustom: true,
    };
    setSelectedImage(capturedImg);
    setImageTitle(title);
    if (onSaveCustomImage) {
      onSaveCustomImage(capturedImg);
    }
    stopCamera();
    setSavedSuccessMessage('Đã chụp và lưu ảnh vào bộ sưu tập của bé! 📸');
    audioManager.playFanfare();
  };

  const handleSaveToCollectionOnly = () => {
    const finalImage = { ...selectedImage, title: imageTitle || selectedImage.title };
    if (onSaveCustomImage) {
      onSaveCustomImage(finalImage);
    }
    audioManager.playFanfare();
    setSavedSuccessMessage(`Đã lưu tranh "${finalImage.title}" vào bộ sưu tập!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playSnap();
    const finalImage = { ...selectedImage, title: imageTitle || selectedImage.title };
    if (finalImage.isCustom && onSaveCustomImage) {
      onSaveCustomImage(finalImage);
    }
    onStartPuzzle(finalImage, {
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
                Tạo & Lưu Tranh Ghép Của Bé
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Tải ảnh gia đình, tranh bé vẽ hoặc chụp ảnh để lưu và tạo tranh ghép
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {savedSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm font-bold animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="flex-1">{savedSuccessMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm font-bold animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

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
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Chụp & Lưu Ảnh Này</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            {/* 1. Image Selection Section */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>1. Chọn tranh hoặc tải ảnh mới:</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
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
                    disabled={isProcessingFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingFile ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Bé tự vẽ</span>
                  </button>
                </div>
              </div>

              {/* Thumbnails row (Shows custom saved images + presets) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-h-36 overflow-y-auto p-1.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                {/* Currently selected custom image if not already in custom list */}
                {selectedImage.isCustom &&
                  !allCustomImages.some((p) => p.id === selectedImage.id) && (
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
                        Ảnh vừa tải
                      </div>
                    </div>
                  )}

                {/* All user-uploaded custom images */}
                {allCustomImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => {
                      setSelectedImage(img);
                      setImageTitle(img.title);
                      audioManager.playPop();
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer transition-transform bg-white ${
                      selectedImage.id === img.id
                        ? 'ring-4 ring-amber-500 scale-105 shadow-md'
                        : 'opacity-85 hover:opacity-100 hover:scale-102 border border-blue-300'
                    }`}
                  >
                    <img
                      src={img.src}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-blue-600 text-[9px] text-white px-1 rounded-sm font-bold">
                      Bé
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-white text-center font-bold py-0.5 truncate px-1">
                      {img.title}
                    </div>
                  </div>
                ))}

                {/* Preset sample images */}
                {PRESET_IMAGES.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => {
                      setSelectedImage(img);
                      setImageTitle(img.title);
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

              {/* Title input for custom image */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Tên tranh:
                </span>
                <input
                  type="text"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  placeholder="Đặt tên cho bức tranh này..."
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white border border-amber-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
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
                    ? '6 Mảnh (3x2) · Rèn luyện'
                    : pieceCount === 8
                    ? '8 Mảnh (4x2)'
                    : pieceCount === 9
                    ? '9 Mảnh (3x3)'
                    : `${pieceCount} Mảnh`}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {([2, 3, 4, 6, 8, 9, 12] as PieceCount[]).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setPieceCount(count);
                      audioManager.playPop();
                    }}
                    className={`py-2 px-3 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      pieceCount === count
                        ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300 scale-102'
                        : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 border border-amber-200'
                    }`}
                  >
                    <span>{count} Mảnh</span>
                    <span className="text-[10px] font-bold opacity-80">
                      {count === 2 ? 'Nửa/Nửa' : count === 4 ? '2x2' : count === 6 ? '3x2' : count === 9 ? '3x3' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Orientation & Options */}
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
              {(pieceCount === 2 || pieceCount === 3) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">Kiểu chia mảnh:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitOrientation('horizontal')}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        splitOrientation === 'horizontal'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-amber-200'
                      }`}
                    >
                      Chia Trái / Phải (Dọc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitOrientation('vertical')}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        splitOrientation === 'vertical'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-amber-200'
                      }`}
                    >
                      Chia Trên / Dưới (Ngang)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">Kiểu cắt mảnh ghép:</span>
                <div className="flex gap-2">
                  {[
                    { id: 'classic', label: 'Ghép mộng (Classic)' },
                    { id: 'wavy', label: 'Lượn sóng mềm' },
                    { id: 'tiles', label: 'Khối vuông (Tiles)' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setCutStyle(style.id as CutStyle)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        cutStyle === style.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-amber-200'
                      }`}
                    >
                      {style.label}
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

            {/* Action Buttons: Save to Collection OR Start Puzzle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-sm"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveToCollectionOnly}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-sm"
                  title="Lưu tranh vào bộ sưu tập để bé chơi sau"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Vào Bộ Sưu Tập</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-md active:scale-95 transition-all text-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt Đầu Ghép Tranh!</span>
                  <Check className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
