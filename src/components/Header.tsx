import React from 'react';
import { Sparkles, Volume2, VolumeX, LogOut, User as UserIcon, Loader2, Cloud } from 'lucide-react';
import { User } from 'firebase/auth';
import { audioManager } from '../utils/audio';

interface HeaderProps {
  currentTab: 'gallery' | 'create' | 'draw' | 'guide' | 'search';
  onSelectTab: (tab: 'gallery' | 'create' | 'draw' | 'guide' | 'search') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  user?: User | null;
  isLoggingIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  user,
  isLoggingIn = false,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark */}
        <button
          onClick={() => {
            audioManager.playPop();
            onSelectTab('gallery');
          }}
          className="text-xl sm:text-2xl font-black tracking-tight text-amber-900 flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="text-2xl">🧩</span>
          <span>Bé Ghép Tranh</span>
        </button>

        {/* Zone 2: 4-5 single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
          <button
            onClick={() => {
              audioManager.playPop();
              onSelectTab('gallery');
            }}
            className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'gallery' ? 'text-amber-700 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Bộ Sưu Tập
          </button>
          <button
            onClick={() => {
              audioManager.playPop();
              onSelectTab('search');
            }}
            className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'search' ? 'text-amber-700 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Tìm Ảnh Google
          </button>
          <button
            onClick={() => {
              audioManager.playPop();
              onSelectTab('create');
            }}
            className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'create' ? 'text-amber-700 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Tạo Tranh Mới
          </button>
          <button
            onClick={() => {
              audioManager.playPop();
              onSelectTab('draw');
            }}
            className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'draw' ? 'text-amber-700 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Bé Tự Vẽ
          </button>
          <button
            onClick={() => {
              audioManager.playPop();
              onSelectTab('guide');
            }}
            className={`hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'guide' ? 'text-amber-700 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Hướng Dẫn
          </button>
        </nav>

        {/* Zone 3: 1 primary action & auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-amber-100/60 transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-2 bg-amber-50/90 py-1 px-2.5 rounded-2xl border border-amber-200 shadow-xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-amber-300"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-xs font-black text-slate-800 truncate max-w-[110px]" title={user.displayName || ''}>
                  {user.displayName?.split(' ')[0] || 'Phụ huynh'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  <Cloud className="w-2.5 h-2.5" /> Đã kết nối Gmail
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-0.5"
                  title="Đăng xuất tài khoản Gmail"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onLogin && (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer disabled:opacity-60"
                title="Đăng nhập Google / Gmail để lưu tranh vẽ và tranh ghép của bé lên đám mây"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google G Logo */}
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="hidden sm:inline font-bold">Đăng nhập Gmail</span>
                    <span className="sm:hidden font-bold">Gmail</span>
                  </>
                )}
              </button>
            )
          )}

          <button
            onClick={() => {
              audioManager.playPop();
              onSelectTab('create');
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-2xl shadow-md transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo Tranh Ghép</span>
          </button>
        </div>
      </div>
    </header>
  );
};
