import React from 'react';
import { Plus, Download, Cloud, LogOut, User, CheckCircle2, BookOpen, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NiagaNovaLogo } from './NiagaNovaLogo';

interface HeaderProps {
  onOpenAddModal: () => void;
  onPrintReport: () => void;
  onOpenGuide: () => void;
  onOpenDownloadModal: () => void;
  onOpenAuthModal: () => void;
  isSyncingCloud?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onPrintReport,
  onOpenGuide,
  onOpenDownloadModal,
  onOpenAuthModal,
  isSyncingCloud = false,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand & Subtitle with NiagaNova bespoke logo */}
          <NiagaNovaLogo size="md" showText={true} />

          {/* Nav / Quick Tools */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-mono font-medium text-slate-300">
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Panduan Kas</span>
            </button>
            <button
              onClick={onPrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak Nota</span>
            </button>
            <button
              onClick={onOpenDownloadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-200 transition-colors cursor-pointer font-semibold shadow-xs"
              title="Cadangkan data ke file atau pulihkan dari server"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Cadangan & Ekspor</span>
            </button>
          </nav>

          {/* Cloud Auth & Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 py-1 px-3 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-5 h-5 rounded-full ring-1 ring-emerald-500"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                      {(user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline-block max-w-[130px] md:max-w-[180px] truncate text-[11px] text-slate-200">
                    {user.email || user.displayName || 'Akun Cloud'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isSyncingCloud
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                    title={isSyncingCloud ? 'Sedang sinkronisasi data ke Cloud Firestore...' : 'Tersinkronisasi ke Google Cloud Firestore'}
                  >
                    {isSyncingCloud ? (
                      'Sinkron...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Cloud Firestore</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  title="Keluar dari akun online"
                  className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                title="Masuk dengan email agar data tersimpan otomatis di server online"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </button>
            )}

            {/* Quick Add Trigger Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-mono text-xs font-semibold border border-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Dialog Tambah</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
