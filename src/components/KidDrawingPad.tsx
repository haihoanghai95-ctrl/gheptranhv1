import React, { useRef, useState, useEffect } from 'react';
import { Palette, RotateCcw, Check, Sparkles, Eraser, Smile } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface KidDrawingPadProps {
  onUseDrawing: (dataUrl: string, title: string) => void;
  onCancel: () => void;
}

const CRAYON_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
  '#0f172a', // Dark
];

const STICKERS = ['⭐', '💖', '🐶', '🚗', '🌸', '☀️', '🦕', '🍎', '🌈', '🍦'];

export const KidDrawingPad: React.FC<KidDrawingPadProps> = ({ onUseDrawing, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [lineWidth, setLineWidth] = useState<number>(18); // Thick crayon for toddlers
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a subtle friendly greeting on canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);

    if (selectedSticker) {
      // Stamp sticker!
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedSticker, x, y);
      setHasDrawn(true);
      audioManager.playPop();
      return;
    }

    setIsDrawing(true);
    setHasDrawn(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    audioManager.playPop();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedSticker) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    audioManager.playPop();
  };

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    audioManager.playFanfare();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onUseDrawing(dataUrl, 'Bức Tranh Của Bé 🎨');
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-4 border-amber-200 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-7 h-7 text-amber-500" />
          <h2 className="text-xl sm:text-2xl font-black text-amber-900">
            Bé Tự Vẽ Tranh Ghép
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-transform active:scale-95"
            title="Xóa vẽ lại"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Vẽ lại</span>
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-transform active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Drawing Board */}
      <div className="relative border-4 border-amber-300 rounded-2xl overflow-hidden bg-white shadow-inner mx-auto touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full aspect-[4/3] block cursor-crosshair"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 font-bold text-lg sm:text-2xl select-none">
            🎨 Bé vẽ một bức tranh ở đây nhé!
          </div>
        )}
      </div>

      {/* Toddler Controls */}
      <div className="mt-4 space-y-3">
        {/* Colors */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-1">
          {CRAYON_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedColor(c);
                setSelectedSticker(null);
                audioManager.playPop();
              }}
              style={{ backgroundColor: c }}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all shadow-md active:scale-90 ${
                selectedColor === c && !selectedSticker
                  ? 'ring-4 ring-offset-2 ring-amber-500 scale-110'
                  : 'hover:scale-105'
              }`}
              aria-label={`Color ${c}`}
            />
          ))}
          <button
            onClick={() => {
              setSelectedColor('#ffffff');
              setSelectedSticker(null);
              audioManager.playPop();
            }}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center text-slate-600 transition-all shadow-md ${
              selectedColor === '#ffffff' && !selectedSticker
                ? 'ring-4 ring-offset-2 ring-amber-500 scale-110'
                : 'hover:scale-105'
            }`}
            title="Tẩy trắng"
          >
            <Eraser className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Fun Stickers */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-amber-50/80 p-2 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-1 text-xs font-bold text-amber-800 mr-1">
            <Smile className="w-4 h-4" />
            <span>Hình dán:</span>
          </div>
          {STICKERS.map((stk) => (
            <button
              key={stk}
              onClick={() => {
                setSelectedSticker(selectedSticker === stk ? null : stk);
                audioManager.playPop();
              }}
              className={`text-2xl sm:text-3xl p-1.5 rounded-xl transition-all active:scale-90 ${
                selectedSticker === stk
                  ? 'bg-amber-300 ring-2 ring-amber-500 scale-125'
                  : 'hover:bg-amber-100 hover:scale-110'
              }`}
            >
              {stk}
            </button>
          ))}
        </div>

        {/* Brush Thickness & Done button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Nét vẽ:</span>
            {[10, 18, 30].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setLineWidth(size);
                  setSelectedSticker(null);
                  audioManager.playPop();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  lineWidth === size && !selectedSticker
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {size === 10 ? 'Nhỏ' : size === 18 ? 'Vừa' : 'To'}
              </button>
            ))}
          </div>

          <button
            onClick={handleFinish}
            disabled={!hasDrawn}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-base shadow-lg transition-all ${
              hasDrawn
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:brightness-105 active:scale-95 cursor-pointer ring-4 ring-emerald-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Tạo Tranh Ghép Ngay!</span>
            <Check className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
