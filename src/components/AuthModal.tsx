import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  HelpCircle
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDomainUnauthorized, setIsDomainUnauthorized] = useState(false);
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseProjectId = firebaseConfig.projectId || 'aesthetic-marker-tk6n5';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('No clipboard API');
      }
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.warn('Fallback copy error:', err);
      }
    }
    setCopiedDomain(text);
    setTimeout(() => {
      setCopiedDomain(null);
    }, 3000);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsDomainUnauthorized(false);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login dengan Google';
      if (msg.includes('auth/unauthorized-domain')) {
        setIsDomainUnauthorized(true);
        setErrorMsg('Domain belum diotorisasi di Firebase Console.');
      } else if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Jendela login ditutup sebelum selesai.');
      } else if (msg.includes('cancelled-popup-request')) {
        setErrorMsg('Permintaan login dibatalkan.');
      } else {
        setErrorMsg('Gagal masuk dengan Google: ' + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Mohon isi email dan kata sandi');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isRegisterMode) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMsg('Email atau kata sandi tidak cocok.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMsg('Email ini sudah terdaftar. Silakan pilih "Masuk".');
      } else if (msg.includes('invalid-email')) {
        setErrorMsg('Format email tidak valid.');
      } else if (msg.includes('weak-password')) {
        setErrorMsg('Kata sandi terlalu pendek. Gunakan minimal 6 karakter.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header with Dark Emerald gradient */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-5 text-white text-center relative border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl backdrop-blur-md mb-2 shadow-inner">
            <Cloud className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            {isRegisterMode ? 'Daftar Akun Cloud Toko' : 'Masuk ke Akun Online'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto font-mono">
            Data tersinkron otomatis ke database Google Firestore secara real-time.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Domain Authorization Diagnostic Box (Shown if unauthorized-domain or manually toggled) */}
          {(isDomainUnauthorized || showDomainHelp) && (
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-xl text-slate-200 space-y-3 font-mono animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Domain Belum Terdaftar di Firebase Console
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Firebase membatasi login Google hanya untuk domain yang didaftarkan pada project{' '}
                    <strong className="text-amber-200 underline">{firebaseProjectId}</strong>.
                  </p>
                </div>
              </div>

              {/* Current Domain Box & Copy Button */}
              <div className="bg-slate-950/80 border border-amber-500/30 p-2.5 rounded-lg space-y-2">
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                  <span>Domain yang Sedang Aktif:</span>
                  {copiedDomain === currentHostname && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                      <Check className="w-3 h-3" /> Tersalin!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentHostname}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-amber-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentHostname)}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs rounded-md font-semibold shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedDomain === currentHostname ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Salin</span>
                  </button>
                </div>

                {/* If on Cloud Run Dev, also show Shared Preview domain */}
                {currentHostname.includes('ais-dev-') && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between mb-1">
                      <span>Domain Pratinjau Bersama (Shared):</span>
                      {copiedDomain === currentHostname.replace('ais-dev-', 'ais-pre-') && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                          <Check className="w-3 h-3" /> Tersalin!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentHostname.replace('ais-dev-', 'ais-pre-')}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-300 font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentHostname.replace('ais-dev-', 'ais-pre-'))}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-md font-semibold shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedDomain === currentHostname.replace('ais-dev-', 'ais-pre-') ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step by step instructions */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-[11px] space-y-1.5 text-slate-300">
                <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cara Menambahkan Domain (Hanya 1 Menit):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    Klik tombol <strong className="text-amber-300">"Buka Setelan Firebase Console"</strong> di bawah.
                  </li>
                  <li>
                    Pilih tab <strong className="text-slate-100">"Authorized domains"</strong> (Domain yang diotorisasi).
                  </li>
                  <li>
                    Klik <strong className="text-slate-100">"Add domain"</strong> (Tambahkan domain).
                  </li>
                  <li>
                    Tempelkan domain di atas (<code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">{currentHostname}</code>), lalu klik <strong className="text-emerald-400">Save</strong>.
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Setelan Firebase Console</span>
                </a>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full sm:w-auto py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg border border-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Coba Masuk Lagi</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-amber-500/20">
                💡 <span className="text-slate-200">Tips Cepat:</span> Anda juga bisa langsung masuk atau mendaftar menggunakan form <strong className="text-emerald-400">Email & Kata Sandi</strong> di bawah tanpa perlu otorisasi domain!
              </div>
            </div>
          )}

          {/* Standard error banner if not domain related */}
          {errorMsg && !isDomainUnauthorized && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Benefits summary badge */}
          {!isDomainUnauthorized && !showDomainHelp && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Pencadangan Cloud Otomatis</span>
                Setiap kali Anda menambah barang atau mencatat penjualan, data otomatis dicadangkan ke Google Firestore.
              </div>
            </div>
          )}

          {/* 1-Click Google Sign In */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-700 rounded-xl shadow-xs text-xs font-mono font-semibold text-slate-200 bg-slate-950 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Menghubungkan...' : 'Masuk Cepat dengan Akun Google'}</span>
            </button>

            {/* Helper button to open domain guide if user wants */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDomainHelp(!showDomainHelp)}
                className="text-[11px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showDomainHelp ? 'Tutup Panduan Domain' : 'Panduan Otorisasi Domain Firebase'}</span>
              </button>
            </div>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-slate-900 px-2 text-slate-500">atau masuk instan dengan email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3 font-mono">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses ke Google Cloud...</span>
                </>
              ) : isRegisterMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Daftar Akun Cloud Resmi</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Masuk ke Akun Cloud</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg(null);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-medium cursor-pointer underline underline-offset-4 transition-colors"
            >
              {isRegisterMode
                ? 'Sudah punya akun? Masuk di sini'
                : 'Belum punya akun? Klik untuk Buat Akun Cloud Baru'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
