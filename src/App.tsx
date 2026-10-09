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
  auth,
  loginWithGoogle,
  logoutFirebase,
  saveCustomPuzzleToFirebase,
  savePuzzleCompletionScore,
  loadCloudPuzzles,
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

  // Auth state listener & Cloud puzzles sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Load any shared/cloud puzzles from Firestore
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

  const handleStartPuzzle = (image: PuzzleImage, settings: PuzzleSettings) => {
    setActiveImage(image);
    setActiveSettings(settings);
    setCurrentView('playing');
    setShowCreateModal(false);
    setShowGoogleSearchModal(false);

    // Save custom puzzle to Firestore if user created it
    if (image.isCustom) {
      saveCustomPuzzleToFirebase({
        id: image.id,
        title: image.title,
        src: image.src,
        category: image.category,
        pieceCount: settings.pieceCount,
      });
    }
  };

  const handleCustomizePuzzle = (image: PuzzleImage) => {
    setCustomizingImage(image);
    setShowCreateModal(true);
  };

  const handleSelectGoogleImage = (image: PuzzleImage) => {
    setImages((prev) => [image, ...prev]);
    setShowGoogleSearchModal(false);
    // Open create puzzle modal with the chosen image
    setCustomizingImage(image);
    setShowCreateModal(true);
  };

  const handleUseDrawing = (dataUrl: string, title: string) => {
    const newImage: PuzzleImage = {
      id: `drawing-${Date.now()}`,
      title,
      titleEn: 'Kid Artwork',
      category: 'custom',
      src: dataUrl,
      isCustom: true,
    };
    setImages((prev) => [newImage, ...prev]);

    // Save to Firestore
    saveCustomPuzzleToFirebase({
      id: newImage.id,
      title: newImage.title,
      src: newImage.src,
      category: 'custom',
      pieceCount: 2,
    });

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
        onLogin={loginWithGoogle}
        onLogout={logoutFirebase}
      />

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
          onStartPuzzle={handleStartPuzzle}
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
