import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  RefreshCw,
  Lightbulb,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Maximize2
} from 'lucide-react';
import { PieceData, PuzzleImage, PuzzleSettings } from '../types';
import {
  getGridDimensions,
  generateGridEdges,
  generatePiecePath,
} from '../utils/puzzleCutter';
import { audioManager } from '../utils/audio';

interface PuzzleBoardProps {
  image: PuzzleImage;
  settings: PuzzleSettings;
  onBackToGallery: () => void;
  onNextDifficulty?: () => void;
  onPuzzleCompleted?: (timeSec: number) => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  image,
  settings,
  onBackToGallery,
  onNextDifficulty,
  onPuzzleCompleted,
}) => {
  // Board dimensions
  const BOARD_WIDTH = 640;
  const BOARD_HEIGHT = 480;

  const [ghostOpacity, setGhostOpacity] = useState<number>(settings.ghostOpacity);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [isWobbling, setIsWobbling] = useState<boolean>(false);
  const [poppedBalloons, setPoppedBalloons] = useState<number[]>([]);

  const handleBoardTouchOnComplete = () => {
    if (!isCompleted) return;
    setIsWobbling(true);
    audioManager.playPop();
    setTimeout(() => setIsWobbling(false), 600);
  };

  const handlePopBalloon = (id: number) => {
    setPoppedBalloons((prev) => [...prev, id]);
    audioManager.playPop();
  };

  // References for dragging
  const boardRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Grid dimensions
  const grid = useMemo(() => {
    return getGridDimensions(settings.pieceCount, settings.splitOrientation);
  }, [settings.pieceCount, settings.splitOrientation]);

  const cellWidth = BOARD_WIDTH / grid.cols;
  const cellHeight = BOARD_HEIGHT / grid.rows;

  // Pieces state
  const [pieces, setPieces] = useState<PieceData[]>([]);

  // Initialize and slice puzzle pieces
  const initPuzzle = useCallback(() => {
    const edgesGrid = generateGridEdges(grid.rows, grid.cols);
    const newPieces: PieceData[] = [];

    let idx = 0;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        newPieces.push({
          id: `p-${idx}`,
          index: idx,
          row: r,
          col: c,
          edges: edgesGrid[r][c],
          targetX: c * cellWidth,
          targetY: r * cellHeight,
          width: cellWidth,
          height: cellHeight,
          isPlaced: false,
          currentX: 0,
          currentY: 0,
          rotation: 0,
        });
        idx++;
      }
    }

    // Shuffle order of unplaced pieces in tray
    const shuffled = [...newPieces].sort(() => Math.random() - 0.5);
    setPieces(shuffled);
    setIsCompleted(false);
    setSelectedPieceId(null);
  }, [grid.rows, grid.cols, cellWidth, cellHeight]);

  useEffect(() => {
    initPuzzle();
  }, [initPuzzle]);

  // Check victory condition
  useEffect(() => {
    if (pieces.length > 0 && pieces.every((p) => p.isPlaced) && !isCompleted) {
      setIsCompleted(true);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setCompletionTime(elapsed);
      audioManager.playFanfare();
      audioManager.playApplause();

      if (onPuzzleCompleted) {
        onPuzzleCompleted(elapsed);
      }

      // Launch joyful colorful confetti
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#fbbf24'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.7 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.7 },
        });
      }, 300);
    }
  }, [pieces, isCompleted, startTime]);

  // Handle piece placement
  const placePiece = useCallback((pieceId: string) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, isPlaced: true } : p))
    );
    setSelectedPieceId(null);
    audioManager.playSnap();
  }, []);

  // Handle Tap-to-Place (Super friendly for toddlers)
  const handlePieceClick = (piece: PieceData) => {
    if (piece.isPlaced) return;

    if (selectedPieceId === piece.id) {
      // Tapping the already selected piece again: in toddler mode, auto-fly to its slot!
      placePiece(piece.id);
    } else {
      setSelectedPieceId(piece.id);
      audioManager.playPop();
    }
  };

  const handleBoardSlotClick = (slotRow: number, slotCol: number) => {
    if (!selectedPieceId) return;

    const piece = pieces.find((p) => p.id === selectedPieceId);
    if (!piece) return;

    // Check if slot matches selected piece
    if (piece.row === slotRow && piece.col === slotCol) {
      placePiece(piece.id);
    } else {
      // Gentle feedback
      audioManager.playWrong();
    }
  };

  // Drag and drop state
  const [dragState, setDragState] = useState<{
    pieceId: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handlePointerDownPiece = (e: React.PointerEvent, piece: PieceData) => {
    if (piece.isPlaced) return;
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setSelectedPieceId(piece.id);
    audioManager.playPop();

    setDragState({
      pieceId: piece.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handlePointerMovePiece = (e: React.PointerEvent) => {
    if (!dragState) return;
    setDragState((prev) =>
      prev
        ? {
            ...prev,
            offsetX: e.clientX - prev.startX,
            offsetY: e.clientY - prev.startY,
          }
        : null
    );
  };

  const handlePointerUpPiece = (e: React.PointerEvent) => {
    if (!dragState) return;

    const piece = pieces.find((p) => p.id === dragState.pieceId);
    if (!piece) {
      setDragState(null);
      return;
    }

    // Check if dropped near target slot on board
    const boardEl = boardRef.current;
    if (boardEl) {
      const boardRect = boardEl.getBoundingClientRect();
      const dropX = e.clientX - boardRect.left;
      const dropY = e.clientY - boardRect.top;

      // Scale to board virtual coordinates
      const scaleX = BOARD_WIDTH / boardRect.width;
      const scaleY = BOARD_HEIGHT / boardRect.height;

      const boardCoordX = dropX * scaleX;
      const boardCoordY = dropY * scaleY;

      const targetCenterX = piece.targetX + piece.width / 2;
      const targetCenterY = piece.targetY + piece.height / 2;

      // Generous snap radius for toddlers (e.g. 110px)
      const snapRadius = Math.max(piece.width, piece.height) * 0.75;
      const dist = Math.hypot(boardCoordX - targetCenterX, boardCoordY - targetCenterY);

      if (dist < snapRadius) {
        placePiece(piece.id);
      } else {
        audioManager.playWrong();
      }
    }

    setDragState(null);
  };

  // Auto-hint one piece for toddlers
  const handleGiveHint = () => {
    const unplaced = pieces.filter((p) => !p.isPlaced);
    if (unplaced.length === 0) return;

    const first = unplaced[0];
    placePiece(first.id);
  };

  // Toggle audio
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.setSoundEnabled(next);
  };

  const placedCount = pieces.filter((p) => p.isPlaced).length;
  const totalCount = pieces.length;

  return (
    <div
      ref={containerRef}
      className="min-h-[85vh] flex flex-col justify-between max-w-6xl mx-auto px-2 sm:px-4 py-3 select-none"
    >
      {/* Top Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-2 border-amber-200 shadow-sm mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToGallery}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Chọn Tranh Khác</span>
            <span className="sm:hidden">Lại</span>
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-1.5">
              <span>{image.title}</span>
            </h1>
            <p className="text-[11px] text-amber-700 font-bold">
              {settings.pieceCount} mảnh · {placedCount}/{totalCount} đã ghép
            </p>
          </div>
        </div>

        {/* Toddler Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Hint button */}
          <button
            onClick={handleGiveHint}
            disabled={placedCount === totalCount}
            className="flex items-center gap-1 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-2xl text-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            title="Gợi ý 1 mảnh"
          >
            <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span className="hidden sm:inline">Giúp Bé 1 Mảnh</span>
          </button>

          {/* Ghost image opacity toggle */}
          <button
            onClick={() => {
              const next =
                ghostOpacity === 0 ? 0.3 : ghostOpacity === 0.3 ? 0.6 : 0;
              setGhostOpacity(next);
              audioManager.playPop();
            }}
            className="flex items-center gap-1 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-2xl text-xs border border-sky-200 transition-all active:scale-95 cursor-pointer"
            title="Đổi độ mờ hình mẫu dưới bảng"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Hình mờ:</span>
            <span>{Math.round(ghostOpacity * 100)}%</span>
          </button>

          {/* Scramble unplaced pieces */}
          <button
            onClick={initPuzzle}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 cursor-pointer"
            title="Xáo trộn lại mảnh ghép"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 cursor-pointer"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Play Area: Puzzle Board + Tray */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1">
        {/* Left/Center: The Puzzle Board (Target Area) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            ref={boardRef}
            onClick={handleBoardTouchOnComplete}
            className={`relative w-full max-w-[640px] aspect-[4/3] rounded-3xl overflow-hidden bg-amber-100/60 shadow-xl border-4 sm:border-8 transition-all duration-500 ${
              isCompleted
                ? `border-amber-400 ring-8 ring-amber-300/60 cursor-pointer animate-puzzle-alive ${
                    isWobbling ? 'animate-wobble-touch' : ''
                  }`
                : 'border-amber-300 ring-4 ring-amber-200/50'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Ghost background image (helpful guide for toddlers) */}
            <img
              src={image.src}
              alt={image.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none select-none"
              style={{ opacity: isCompleted ? 0 : ghostOpacity }}
            />

            {/* When completed: full seamless animated image reveal with light shimmer */}
            {isCompleted && (
              <div className="absolute inset-0 z-20 pointer-events-none select-none">
                <img
                  src={image.src}
                  alt={image.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover animate-in fade-in duration-700"
                />

                {/* Radiant light beam sweeping across picture */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-sweep" />
                </div>

                {/* Dancing celebration stars & emojis on corners */}
                <div className="absolute top-3 left-3 text-2xl sm:text-3xl animate-bounce drop-shadow">⭐</div>
                <div className="absolute top-3 right-3 text-2xl sm:text-3xl animate-bounce drop-shadow" style={{ animationDelay: '0.2s' }}>🌟</div>
                <div className="absolute bottom-3 left-3 text-2xl sm:text-3xl animate-bounce drop-shadow" style={{ animationDelay: '0.4s' }}>✨</div>
                <div className="absolute bottom-3 right-3 text-2xl sm:text-3xl animate-bounce drop-shadow" style={{ animationDelay: '0.6s' }}>🎉</div>
              </div>
            )}

            {/* Grid Slot outlines & Placed Pieces */}
            <svg
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                {pieces.map((p) => {
                  const pathD = generatePiecePath(
                    p.width,
                    p.height,
                    p.edges,
                    settings.cutStyle
                  );
                  return (
                    <clipPath
                      key={`clip-board-${p.id}`}
                      id={`clip-board-${p.id}`}
                    >
                      <path d={pathD} />
                    </clipPath>
                  );
                })}
              </defs>

              {/* Board Slot Guidance Outlines & Click Handlers for Tap-To-Place */}
              {pieces.map((p) => {
                const pathD = generatePiecePath(
                  p.width,
                  p.height,
                  p.edges,
                  settings.cutStyle
                );
                const isTargetOfSelected = selectedPieceId === p.id && !p.isPlaced;

                return (
                  <g
                    key={`slot-${p.id}`}
                    transform={`translate(${p.targetX}, ${p.targetY})`}
                    onClick={() => handleBoardSlotClick(p.row, p.col)}
                    className="cursor-pointer"
                  >
                    {/* Empty slot silhouette stroke */}
                    {!p.isPlaced && (
                      <path
                        d={pathD}
                        fill={isTargetOfSelected ? 'rgba(250, 204, 21, 0.35)' : 'rgba(255, 255, 255, 0.15)'}
                        stroke={isTargetOfSelected ? '#f59e0b' : 'rgba(180, 83, 9, 0.25)'}
                        strokeWidth={isTargetOfSelected ? '3.5' : '1.5'}
                        strokeDasharray={isTargetOfSelected ? '6 4' : undefined}
                        className={isTargetOfSelected ? 'animate-pulse' : ''}
                      />
                    )}

                    {/* Placed Piece Content */}
                    {p.isPlaced && (
                      <g clipPath={`url(#clip-board-${p.id})`}>
                        <image
                          href={image.src}
                          x={-p.targetX}
                          y={-p.targetY}
                          width={BOARD_WIDTH}
                          height={BOARD_HEIGHT}
                          preserveAspectRatio="none"
                        />
                        {/* Tactile border and subtle bevel */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.5)"
                          strokeWidth="2"
                        />
                        <path
                          d={pathD}
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.15)"
                          strokeWidth="1"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Smart assist indicator overlay when piece is selected */}
            {settings.smartAssist && selectedPieceId && (
              (() => {
                const sel = pieces.find((p) => p.id === selectedPieceId);
                if (!sel || sel.isPlaced) return null;
                const leftPercent = (sel.targetX / BOARD_WIDTH) * 100;
                const topPercent = (sel.targetY / BOARD_HEIGHT) * 100;
                const widthPercent = (sel.width / BOARD_WIDTH) * 100;
                const heightPercent = (sel.height / BOARD_HEIGHT) * 100;

                return (
                  <div
                    onClick={() => placePiece(sel.id)}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                    className="absolute flex items-center justify-center cursor-pointer pointer-events-auto"
                  >
                    <div className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-1 rounded-full shadow-lg border-2 border-white animate-bounce flex items-center gap-1">
                      <span>⭐ Chạm vào đây nè bé!</span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Friendly Guidance Bar for Toddler / Parent */}
          <div className="mt-3 text-center">
            <p className="text-xs sm:text-sm font-bold text-amber-950 bg-amber-100/70 py-1.5 px-4 rounded-full inline-flex items-center gap-1.5 border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                {isCompleted
                  ? '🎉 Bức tranh đã sống động! Bé chạm vào tranh để xem nhún nhảy và chạm nổ bóng bay nhé!'
                  : 'Bé chạm hoặc kéo thả các mảnh ghép phía bên để hoàn thành tranh nhé!'}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Piece Tray (Khay đựng mảnh ghép) */}
        <div className="lg:col-span-4 bg-white/95 rounded-3xl p-3 sm:p-4 border-2 border-amber-200 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100">
            <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <span>Khay Mảnh Ghép</span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {totalCount - placedCount} mảnh còn lại
              </span>
            </span>

            {/* Tiny thumbnail preview button */}
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Xem Mẫu</span>
            </button>
          </div>

          {/* Piece Tray Grid / Scatter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 min-h-[220px] max-h-[460px] overflow-y-auto p-2 bg-amber-50/40 rounded-2xl border border-amber-100">
            {pieces.filter((p) => !p.isPlaced).length === 0 ? (
              <div className="col-span-full py-8 text-center text-emerald-600 font-black">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 animate-bounce" />
                <p className="text-base">Bé đã ghép xong tất cả!</p>
              </div>
            ) : (
              pieces
                .filter((p) => !p.isPlaced)
                .map((p) => {
                  const isSelected = selectedPieceId === p.id;
                  const isDraggingThis = dragState?.pieceId === p.id;
                  const pathD = generatePiecePath(
                    p.width,
                    p.height,
                    p.edges,
                    settings.cutStyle
                  );

                  // Expand viewBox slightly so interlocking tabs aren't clipped
                  const pad = Math.max(p.width, p.height) * 0.25;
                  const vbX = -pad;
                  const vbY = -pad;
                  const vbW = p.width + pad * 2;
                  const vbH = p.height + pad * 2;

                  return (
                    <div
                      key={`tray-${p.id}`}
                      onClick={() => handlePieceClick(p)}
                      onPointerDown={(e) => handlePointerDownPiece(e, p)}
                      onPointerMove={handlePointerMovePiece}
                      onPointerUp={handlePointerUpPiece}
                      onPointerCancel={handlePointerUpPiece}
                      style={{
                        transform: isDraggingThis
                          ? `translate(${dragState.offsetX}px, ${dragState.offsetY}px) scale(1.15)`
                          : isSelected
                          ? 'scale(1.08)'
                          : 'scale(1)',
                        zIndex: isDraggingThis ? 99 : isSelected ? 30 : 10,
                      }}
                      className={`relative aspect-[4/3] rounded-2xl bg-white p-1 cursor-grab active:cursor-grabbing transition-transform duration-75 flex items-center justify-center shadow-md touch-none ${
                        isSelected
                          ? 'ring-4 ring-amber-500 shadow-xl bg-amber-50/80'
                          : 'hover:shadow-lg hover:scale-102 border border-slate-200'
                      }`}
                    >
                      <svg
                        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                        className="w-full h-full pointer-events-none drop-shadow-md"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          <clipPath id={`clip-tray-${p.id}`}>
                            <path d={pathD} />
                          </clipPath>
                        </defs>
                        <g clipPath={`url(#clip-tray-${p.id})`}>
                          <image
                            href={image.src}
                            x={-p.targetX}
                            y={-p.targetY}
                            width={BOARD_WIDTH}
                            height={BOARD_HEIGHT}
                            preserveAspectRatio="none"
                          />
                        </g>
                        {/* Tactile piece border */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.8)'}
                          strokeWidth={isSelected ? '3.5' : '2'}
                        />
                        <path
                          d={pathD}
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.2)"
                          strokeWidth="1"
                        />
                      </svg>

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>

          {/* Quick instructions for little kids */}
          <div className="mt-3 p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[11px] text-amber-900 font-bold">
              👉 Mẹo: Chạm vào mảnh ghép rồi chạm vào ô trên bảng để ghép nhanh!
            </span>
          </div>
        </div>
      </div>

      {/* Preview Modal (When clicking "Xem Mẫu") */}
      {showPreviewModal && (
        <div
          onClick={() => setShowPreviewModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 sm:p-6 rounded-3xl max-w-lg w-full border-4 border-amber-300 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">
                Hình Mẫu: {image.title}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Đóng
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border-2 border-amber-200 aspect-[4/3]">
              <img
                src={image.src}
                alt={image.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center border-4 border-amber-400 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Confetti graphic */}
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="flex justify-center gap-1.5 text-2xl text-amber-400 mb-2">
              <span>⭐</span>
              <span className="scale-125">⭐</span>
              <span>⭐</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-amber-900 mb-1">
              Bé Giỏi Quá! Hoan Hô! 🎉
            </h2>
            <p className="text-sm font-bold text-slate-600 mb-4">
              Bé đã hoàn thành tranh ghép{' '}
              <span className="text-amber-600 font-black">{image.title}</span> trong{' '}
              <span className="text-slate-800 font-black">{completionTime} giây</span>!
            </p>

            <div className="rounded-2xl overflow-hidden aspect-[4/3] max-w-[260px] mx-auto mb-6 shadow-xl border-4 border-amber-300 ring-4 ring-amber-200/60 animate-puzzle-alive relative">
              <img
                src={image.src}
                alt={image.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep" />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {onNextDifficulty && settings.pieceCount < 16 && (
                <button
                  onClick={() => {
                    audioManager.playPop();
                    onNextDifficulty();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 text-base cursor-pointer"
                >
                  🚀 Thử Thách Tiếp Theo (Nhiều Mảnh Hơn)
                </button>
              )}

              <button
                onClick={() => {
                  audioManager.playPop();
                  initPuzzle();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-md transition-transform active:scale-95 text-sm cursor-pointer"
              >
                🔄 Ghép Lại Bức Tranh Này
              </button>

              <button
                onClick={() => {
                  audioManager.playPop();
                  onBackToGallery();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
              >
                🎨 Chọn Tranh Mới Khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Interactive Celebration Balloons */}
      {isCompleted && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          {[
            { id: 1, left: '8%', delay: '0s', label: '🎈' },
            { id: 2, left: '26%', delay: '0.7s', label: '🎈' },
            { id: 3, left: '48%', delay: '1.4s', label: '🎈' },
            { id: 4, left: '68%', delay: '0.4s', label: '🎈' },
            { id: 5, left: '88%', delay: '1.0s', label: '🎈' },
          ].map(
            (b) =>
              !poppedBalloons.includes(b.id) && (
                <div
                  key={b.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePopBalloon(b.id);
                  }}
                  style={{
                    left: b.left,
                    animation: `balloonRise 5s cubic-bezier(0.2, 0.8, 0.4, 1) infinite`,
                    animationDelay: b.delay,
                  }}
                  className="absolute text-5xl sm:text-6xl cursor-pointer pointer-events-auto hover:scale-125 active:scale-75 transition-transform select-none drop-shadow-md"
                  title="Chạm để làm nổ bóng bay!"
                >
                  {b.label}
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};
