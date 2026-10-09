import React from 'react';
import { Sparkles, Volume2, VolumeX, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { audioManager } from '../utils/audio';

interface HeaderProps {
  currentTab: 'gallery' | 'create' | 'draw' | 'guide' | 'search';
  onSelectTab: (tab: 'gallery' | 'create' | 'draw' | 'guide' | 'search') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  user,
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

          {user ? (
            <div className="flex items-center gap-2 bg-amber-50 py-1 px-2 rounded-2xl border border-amber-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 hidden sm:inline truncate max-w-[100px]">
                {user.displayName?.split(' ')[0] || 'Tài khoản'}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 hover:text-red-600 text-slate-400 transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onLogin && (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                title="Đăng nhập Google để lưu tranh trên mây"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng nhập</span>
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
