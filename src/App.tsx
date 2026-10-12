import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Header } from './components/Header';
import { PuzzleGallery } from './components/PuzzleGallery';
import { PuzzleBoard } from './components/PuzzleBoard';
import { CreatePuzzleModal } from './components/CreatePuzzleModal';
import { GoogleImageSearchModal } from './components/GoogleImageSearchModal';
import { KidDrawingPad } from './components/KidDrawingPad';
import { PRESET_IMAGES } from './data/presetImages';
import { PieceCount, PuzzleImage, PuzzleSettings } from './types';
import { audioManager } from './utils/audio';
import {
  savePuzzleLocally,
  loadLocalPuzzles,
  deletePuzzleLocally,
  updatePuzzleTitleLocally,
} from './utils/puzzleStorage';
import {
  auth,
  loginWithGoogle,
  logoutFirebase,
  saveCustomPuzzleToFirebase,
  savePuzzleCompletionScore,
  loadCloudPuzzles,
  deleteCustomPuzzleFromFirebase,
  updateCustomPuzzleTitleInFirebase,
} from './firebase';

export default function App() {
  const [images, setImages] = useState<PuzzleImage[]>(PRESET_IMAGES);
  const [currentView, setCurrentView] = useState<'gallery' | 'playing' | 'drawing' | 'guide'>('gallery');
  const [activeImage, setActiveImage] = useState<PuzzleImage>(PRESET_IMAGES[0]);
  const [activeSettings, setActiveSettings] = useState<PuzzleSettings>({
    pieceCount: 2,
    cutStyle: 'classic',
    allowRotation: false,
    ghostOpacity: 0.5,
    smartAssist: true,
    soundEnabled: true,
    splitOrientation: 'horizontal',
  });

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showGoogleSearchModal, setShowGoogleSearchModal] = useState<boolean>(false);
  const [customizingImage, setCustomizingImage] = useState<PuzzleImage | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authBanner, setAuthBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    actionLabel?: string;
    action?: () => void;
  } | null>(null);

  // Sync local custom puzzles to Firebase for signed-in user
  const syncLocalToCloud = async () => {
    try {
      const localPuzzles = await loadLocalPuzzles();
      if (localPuzzles && localPuzzles.length > 0) {
        for (const p of localPuzzles) {
          if (p.isCustom) {
            await saveCustomPuzzleToFirebase({
              id: p.id,
              title: p.title,
              src: p.src,
              category: p.category,
              pieceCount: 2,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Sync local to cloud failed:', e);
    }
  };

  // Auth state listener & Auto-load both Local and Cloud custom puzzles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        syncLocalToCloud();
      } else {
        setUser(null);
      }
    });

    // 1. Load locally stored custom puzzles (Guarantees permanence even without internet or login)
    loadLocalPuzzles().then((localPuzzles) => {
      if (localPuzzles && localPuzzles.length > 0) {
        setImages((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newOnes = localPuzzles.filter((p) => !existingIds.has(p.id));
          return [...newOnes, ...prev];
        });
      }
    });

    // 2. Load any shared/cloud puzzles from Firestore
    loadCloudPuzzles().then((cloudPuzzles) => {
      if (cloudPuzzles && cloudPuzzles.length > 0) {
        const mapped: PuzzleImage[] = cloudPuzzles.map((cp) => ({
          id: cp.id,
          title: cp.title || 'Tranh của bé',
          titleEn: cp.title || 'Custom Puzzle',
          category: 'custom',
          src: cp.src,
          isCustom: true,
        }));
        setImages((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newOnes = mapped.filter((p) => !existingIds.has(p.id));
          return [...newOnes, ...prev];
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.setSoundEnabled(next);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthBanner(null);
    audioManager.playPop();

    const res = await loginWithGoogle();
    setIsLoggingIn(false);

    if (res.success && res.user) {
      audioManager.playFanfare();
      const name = res.user.displayName || res.user.email?.split('@')[0] || 'Phụ huynh';
      setAuthBanner({
        type: 'success',
        message: `Đăng nhập Gmail thành công! Xin chào ${name} 🎉 Tranh của bé đã được kết nối lưu trữ đám mây.`,
      });
      setTimeout(() => setAuthBanner(null), 6000);

      // Reload cloud puzzles for user
      loadCloudPuzzles().then((cloudPuzzles) => {
        if (cloudPuzzles && cloudPuzzles.length > 0) {
          const mapped: PuzzleImage[] = cloudPuzzles.map((cp) => ({
            id: cp.id,
            title: cp.title || 'Tranh của bé',
            titleEn: cp.title || 'Custom Puzzle',
            category: 'custom',
            src: cp.src,
            isCustom: true,
          }));
          setImages((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = mapped.filter((p) => !existingIds.has(p.id));
            return [...newOnes, ...prev];
          });
        }
      });
    } else {
      audioManager.playWrong();
      const isPopupBlocked = res.errorCode === 'auth/popup-blocked';
      setAuthBanner({
        type: 'error',
        message: res.error || 'Đăng nhập Gmail không thành công. Vui lòng thử lại!',
        actionLabel: isPopupBlocked ? 'Mở lại đăng nhập Google' : 'Thử lại ngay',
        action: () => handleLogin(),
      });
    }
  };

  const handleLogout = async () => {
    audioManager.playPop();
    await logoutFirebase();
    setUser(null);
    setAuthBanner({
      type: 'info',
      message: 'Đã đăng xuất tài khoản Gmail. Tranh của bé vẫn được lưu an toàn trên máy!',
    });
    setTimeout(() => setAuthBanner(null), 5000);
  };

  // Helper to permanently save custom puzzles locally and to Firebase
  const persistCustomPuzzle = async (image: PuzzleImage, pieceCount: number = 2) => {
    if (!image.isCustom) return;

    // Save to browser IndexedDB + LocalStorage
    await savePuzzleLocally(image);

    // Save to Firebase Firestore
    saveCustomPuzzleToFirebase({
      id: image.id,
      title: image.title,
      src: image.src,
      category: image.category,
      pieceCount,
    });

    setImages((prev) => [image, ...prev.filter((p) => p.id !== image.id)]);
  };

  const handleStartPuzzle = (image: PuzzleImage, settings: PuzzleSettings) => {
    setActiveImage(image);
    setActiveSettings(settings);
    setCurrentView('playing');
    setShowCreateModal(false);
    setShowGoogleSearchModal(false);

    if (image.isCustom) {
      persistCustomPuzzle(image, settings.pieceCount);
    }
  };

  const handleCustomizePuzzle = (image: PuzzleImage) => {
    setCustomizingImage(image);
    setShowCreateModal(true);
  };

  const handleSelectGoogleImage = async (image: PuzzleImage) => {
    await persistCustomPuzzle(image, 2);
    setShowGoogleSearchModal(false);
    setCustomizingImage(image);
    setShowCreateModal(true);
  };

  const handleUseDrawing = async (dataUrl: string, title: string) => {
    const newImage: PuzzleImage = {
      id: `drawing-${Date.now()}`,
      title,
      titleEn: 'Kid Artwork',
      category: 'custom',
      src: dataUrl,
      isCustom: true,
    };

    await persistCustomPuzzle(newImage, 2);

    // Automatically start puzzle with this drawing
    handleStartPuzzle(newImage, {
      pieceCount: 2,
      cutStyle: 'classic',
      allowRotation: false,
      ghostOpacity: 0.5,
      smartAssist: true,
      soundEnabled,
      splitOrientation: 'horizontal',
    });
  };

  const handleDeleteCustomPuzzle = async (puzzleId: string) => {
    await deletePuzzleLocally(puzzleId);
    deleteCustomPuzzleFromFirebase(puzzleId);
    setImages((prev) => prev.filter((p) => p.id !== puzzleId));
  };

  const handleUpdatePuzzleTitle = async (puzzleId: string, newTitle: string) => {
    await updatePuzzleTitleLocally(puzzleId, newTitle);
    await updateCustomPuzzleTitleInFirebase(puzzleId, newTitle);
    setImages((prev) =>
      prev.map((img) => (img.id === puzzleId ? { ...img, title: newTitle } : img))
    );
  };

  const handleNextDifficulty = () => {
    const progression: PieceCount[] = [2, 4, 6, 9, 12, 16];
    const currentIndex = progression.indexOf(activeSettings.pieceCount);
    if (currentIndex >= 0 && currentIndex < progression.length - 1) {
      const nextCount = progression[currentIndex + 1];
      setActiveSettings((prev) => ({
        ...prev,
        pieceCount: nextCount,
      }));
    }
  };

  const handlePuzzleCompleted = (timeSec: number) => {
    // Record achievement to Firebase
    savePuzzleCompletionScore({
      puzzleId: activeImage.id,
      pieceCount: activeSettings.pieceCount,
      completionTime: timeSec,
      stars: 3,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30 text-slate-800">
      {/* Top Bar Header with Firebase User Sign-in */}
      <Header
        currentTab={
          showGoogleSearchModal
            ? 'search'
            : currentView === 'drawing'
            ? 'draw'
            : currentView === 'guide'
            ? 'guide'
            : 'gallery'
        }
        onSelectTab={(tab) => {
          if (tab === 'search') {
            setShowGoogleSearchModal(true);
          } else if (tab === 'create') {
            setCustomizingImage(undefined);
            setShowCreateModal(true);
          } else if (tab === 'draw') {
            setCurrentView('drawing');
          } else {
            setCurrentView(tab);
          }
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Auth Notification Banner */}
      {authBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 w-full">
          <div
            className={`rounded-2xl p-3 sm:p-4 border shadow-xs flex items-center justify-between gap-3 transition-all ${
              authBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : authBanner.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold flex-1">
              <span className="text-base sm:text-lg shrink-0">
                {authBanner.type === 'success' ? '🎉' : authBanner.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{authBanner.message}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {authBanner.action && authBanner.actionLabel && (
                <button
                  onClick={authBanner.action}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {authBanner.actionLabel}
                </button>
              )}
              <button
                onClick={() => setAuthBanner(null)}
                className="p-1 hover:opacity-70 text-slate-500 cursor-pointer font-bold text-xs"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 py-4">
        {currentView === 'gallery' && (
          <PuzzleGallery
            images={images}
            onPlayPuzzle={handleStartPuzzle}
            onCustomizePuzzle={handleCustomizePuzzle}
            onOpenDrawingPad={() => setCurrentView('drawing')}
            onOpenUploadModal={() => {
              setCustomizingImage(undefined);
              setShowCreateModal(true);
            }}
            onOpenGoogleSearch={() => setShowGoogleSearchModal(true)}
            onDeletePuzzle={handleDeleteCustomPuzzle}
            onSaveCustomImage={persistCustomPuzzle}
            onUpdatePuzzleTitle={handleUpdatePuzzleTitle}
            user={user}
            onLogin={handleLogin}
            isLoggingIn={isLoggingIn}
          />
        )}

        {currentView === 'guide' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧩</span>
                <div>
                  <h1 className="text-2xl font-black text-slate-800">
                    Hướng Dẫn Bé Ghép Tranh & Phụ Huynh
                  </h1>
                  <p className="text-sm font-semibold text-slate-500">
                    Trò chơi rèn luyện sự khéo léo, tư duy hình học và khả năng tập trung cho trẻ mầm non
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <h2 className="font-black text-amber-950 mb-1 text-base">
                    1. Vì sao có từ 2 mảnh ghép?
                  </h2>
                  <p>
                    Đối với trẻ mầm non từ 2 đến 3 tuổi, việc ghép 2 nửa bức tranh (nửa trái - nửa phải) là bước phát triển vàng để bé học cách so khớp màu sắc, đường nét và cảm nhận thành công đầu tiên. Khi bé tự tin, bạn có thể tăng dần lên 4 mảnh, 6 mảnh và 9 mảnh!
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <h2 className="font-black text-amber-950 mb-1 text-base">
                    2. Bé có 2 cách ghép linh hoạt:
                  </h2>
                  <ul className="list-disc list-inside space-y-1 mt-1 font-medium">
                    <li>
                      <strong>Cách 1 - Chạm 1 chạm (Tap-to-place):</strong> Bé chạm vào mảnh ghép ở khay bên phải, ô trống cần ghép trên bảng sẽ phát sáng có ngôi sao chỉ dẫn. Bé chỉ cần chạm vào ô đó là mảnh ghép tự bay vào vị trí!
                    </li>
                    <li>
                      <strong>Cách 2 - Kéo thả (Drag & Drop):</strong> Bé đặt ngón tay lên mảnh ghép và kéo rê vào bảng, khi đến gần vị trí đúng thì mảnh ghép sẽ tự động hút vào kèm tiếng chuông reo vui tai.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <h2 className="font-black text-amber-950 mb-1 text-base">
                    3. Đám mây Firebase & Lưu trữ an toàn:
                  </h2>
                  <p>
                    Ứng dụng đã được kết nối với cơ sở dữ liệu Firebase. Phụ huynh có thể đăng nhập bằng tài khoản Google để lưu lại các bức vẽ đáng yêu của bé và thành tích hoàn thành tranh ghép trên mọi thiết bị!
                  </p>
                </div>
              </div>

              <div className="pt-4 text-center">
                <button
                  onClick={() => setCurrentView('gallery')}
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer text-base"
                >
                  Bắt Đầu Chơi Ngay Nào!
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'drawing' && (
          <div className="px-3 sm:px-6">
            <KidDrawingPad
              onUseDrawing={handleUseDrawing}
              onCancel={() => setCurrentView('gallery')}
            />
          </div>
        )}

        {currentView === 'playing' && (
          <PuzzleBoard
            image={activeImage}
            settings={activeSettings}
            onBackToGallery={() => setCurrentView('gallery')}
            onNextDifficulty={handleNextDifficulty}
            onPuzzleCompleted={handlePuzzleCompleted}
          />
        )}
      </main>

      {/* Google Image Search Modal */}
      {showGoogleSearchModal && (
        <GoogleImageSearchModal
          onSelectImage={handleSelectGoogleImage}
          onClose={() => setShowGoogleSearchModal(false)}
        />
      )}

      {/* Create / Customize Puzzle Modal */}
      {showCreateModal && (
        <CreatePuzzleModal
          initialImage={customizingImage}
          allCustomImages={images.filter((img) => img.isCustom)}
          onStartPuzzle={handleStartPuzzle}
          onSaveCustomImage={persistCustomPuzzle}
          onOpenDrawingPad={() => {
            setShowCreateModal(false);
            setCurrentView('drawing');
          }}
          onOpenGoogleSearch={() => {
            setShowCreateModal(false);
            setShowGoogleSearchModal(true);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
