import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [isRecoverySessionReady, setIsRecoverySessionReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Supabase may return recovery credentials in the URL hash or a PKCE code in the query.
    const url = new URL(window.location.href);
    const hasRecoveryMarker =
      url.hash.includes('type=recovery') ||
      url.searchParams.get('type') === 'recovery' ||
      url.searchParams.has('code');

    let active = true;
    if (hasRecoveryMarker) {
      setIsResetMode(true);
      setIsRecoveryFlow(true);
      setIsRegisterMode(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      // The PASSWORD_RECOVERY event is the authoritative signal from Supabase.
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true);
        setIsRecoveryFlow(true);
        setIsRegisterMode(false);
        setIsRecoverySessionReady(Boolean(session));
        setErrorMsg(null);
        return;
      }

      if (hasRecoveryMarker && session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setIsResetMode(true);
        setIsRecoveryFlow(true);
        setIsRegisterMode(false);
        setIsRecoverySessionReady(true);
        setErrorMsg(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return;
      if (hasRecoveryMarker && session) {
        setIsResetMode(true);
        setIsRecoveryFlow(true);
        setIsRegisterMode(false);
        setIsRecoverySessionReady(true);
      } else if (hasRecoveryMarker && error) {
        setErrorMsg('Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman login.');
      } else if (hasRecoveryMarker && !session) {
        setErrorMsg('Sesi pemulihan belum terbentuk. Tautan mungkin kedaluwarsa atau URL redirect belum diizinkan di Supabase. Minta tautan baru.');
      }
    }).catch(() => {
      if (active && hasRecoveryMarker) {
        setErrorMsg('Tidak dapat memverifikasi tautan pemulihan. Minta tautan baru dari halaman login.');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDomainUnauthorized, setIsDomainUnauthorized] = useState(false);
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const [isProviderDisabled, setIsProviderDisabled] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);

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
    setIsProviderDisabled(false);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login dengan Google';
      if (
        msg.includes('Unsupported provider') ||
        msg.includes('provider is not enabled') ||
        msg.includes('validation_failed')
      ) {
        setIsProviderDisabled(true);
        setErrorMsg('Provider Google belum diaktifkan di Dashboard Supabase.');
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      if (isRecoveryFlow) {
        if (!isRecoverySessionReady) {
          setErrorMsg('Tautan pemulihan sedang diverifikasi. Tunggu sebentar atau minta tautan baru jika halaman ini terus muncul.');
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Kata sandi baru minimal 6 karakter.');
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setErrorMsg('Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru.');
        setIsRecoveryFlow(false);
        setIsResetMode(false);
        setPassword('');
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        if (!email.trim()) {
          setErrorMsg('Masukkan alamat email akun Anda terlebih dahulu.');
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setErrorMsg('Jika email terdaftar, tautan pemulihan kata sandi telah dikirim. Periksa Kotak Masuk dan folder Spam.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setErrorMsg('Tidak dapat memproses pemulihan kata sandi: ' + msg);
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
    setIsProviderDisabled(false);
    setIsRateLimited(false);
    setIsEmailNotConfirmed(false);

    try {
      if (isRegisterMode) {
        const res = await signUpWithEmail(email, password);
        if (res.needsEmailConfirmation) {
          setErrorMsg('Pendaftaran di Supabase berhasil! Tautan verifikasi telah dikirim ke email Anda.');
          setIsEmailNotConfirmed(true);
          return;
        }
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      if (
        msg.includes('rate limit') ||
        msg.includes('over_email_send_rate_limit') ||
        msg.includes('rate_limit')
      ) {
        setIsRateLimited(true);
        setErrorMsg('Batas pengiriman email Supabase tercapai (Email rate limit exceeded).');
      } else if (msg.includes('Email not confirmed')) {
        setIsEmailNotConfirmed(true);
        setErrorMsg('Akun sudah terdaftar, tetapi email belum dikonfirmasi di Supabase.');
      } else if (
        msg.includes('email_provider_disabled') ||
        msg.includes('Email signups are disabled') ||
        msg.includes('provider is not enabled')
      ) {
        setIsProviderDisabled(true);
        setErrorMsg('Provider Email belum diaktifkan di Dashboard Supabase.');
      } else if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
        setErrorMsg('Email atau kata sandi tidak cocok.');
      } else if (msg.includes('already registered') || msg.includes('User already registered')) {
        setErrorMsg('Email ini sudah terdaftar di Supabase. Silakan pilih "Masuk".');
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
            {isResetMode ? (isRecoveryFlow ? 'Buat Kata Sandi Baru' : 'Lupa Kata Sandi') : (isRegisterMode ? 'Daftar Akun Supabase' : 'Masuk Akun Supabase')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto font-mono">
            {isResetMode ? 'Pulihkan akses akun menggunakan email terdaftar.' : 'Tersambung langsung ke cloud database Supabase Anda.'}
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

          {/* Supabase Provider Not Enabled Box */}
          {isProviderDisabled && (
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-xl text-slate-200 space-y-3 font-mono animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Provider Belum Diaktifkan di Supabase Dashboard
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Di proyek Supabase Anda (<span className="text-amber-200 underline">gduhmtbpjuahvbfwmuop</span>), opsi login belum diaktifkan (toggle OFF).
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/30 p-3 rounded-lg text-xs space-y-2">
                <div className="font-semibold text-white text-[11px]">Cara Mengaktifkan (Hanya 10 Detik):</div>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1">
                  <li>Buka menu <strong className="text-amber-300">Authentication &gt; Providers</strong> di dashboard Supabase.</li>
                  <li>Klik provider <strong className="text-emerald-400">Email</strong> &gt; aktifkan toggle <strong className="text-white">Enable Email provider</strong>.</li>
                  <li>(Disarankan) Matikan/uncheck opsi <strong className="text-white">Confirm email</strong> agar pendaftaran langsung aktif tanpa perlu buka inbox email.</li>
                  <li>Klik tombol <strong className="text-emerald-400">Save</strong>.</li>
                </ol>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <a
                    href="https://supabase.com/dashboard/project/gduhmtbpjuahvbfwmuop/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Supabase Providers ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsProviderDisabled(false)}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rate Limit & Email Confirmation Instruction Box */}
          {(isRateLimited || isEmailNotConfirmed) && (
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-xl text-slate-200 space-y-3 font-mono animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {isRateLimited ? 'Batas Kirim Email Supabase Tercapai' : 'Email Belum Dikonfirmasi'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Supabase membatasi pengiriman email verifikasi gratis (3 email/jam). <strong>Solusi permanen:</strong> Matikan verifikasi email di Supabase agar pendaftaran langsung aktif otomatis tanpa perlu kirim email!
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/30 p-3 rounded-lg text-xs space-y-2">
                <div className="font-semibold text-white text-[11px]">Cara Mengatasi Dalam 10 Detik:</div>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1">
                  <li>
                    Buka menu <strong className="text-amber-300">Authentication &gt; Providers &gt; Email</strong> di Supabase.
                  </li>
                  <li>
                    Matikan / uncheck toggle <strong className="text-rose-400">Confirm email</strong>.
                  </li>
                  <li>
                    Klik <strong className="text-emerald-400">Save</strong>.
                  </li>
                  <li>
                    Buka menu <strong className="text-amber-300">Users</strong> &gt; klik titik tiga di samping email Anda &gt; pilih <strong className="text-emerald-400">Confirm User</strong>.
                  </li>
                </ol>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                  <a
                    href="https://supabase.com/dashboard/project/gduhmtbpjuahvbfwmuop/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Matikan Confirm Email ↗</span>
                  </a>
                  <a
                    href="https://supabase.com/dashboard/project/gduhmtbpjuahvbfwmuop/auth/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs border border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Menu Users ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRateLimited(false);
                      setIsEmailNotConfirmed(false);
                    }}
                    className="ml-auto text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Standard error banner if not domain related and not provider disabled */}
          {errorMsg && !isDomainUnauthorized && !isProviderDisabled && !isRateLimited && !isEmailNotConfirmed && (
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
                <span className="font-semibold text-white block">Pencadangan Cloud Supabase Otomatis</span>
                Setiap kali Anda menambah barang atau mencatat penjualan, data otomatis dicadangkan ke database Supabase Anda.
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={isResetMode ? handlePasswordReset : handleEmailAuth} className="space-y-3 font-mono">
            {!isRecoveryFlow && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required={!isRecoveryFlow}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            )}

            {!isResetMode || isRecoveryFlow ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isResetMode ? 'Kata Sandi Baru' : 'Kata Sandi'}</label>
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
            ) : null}

            <button
              type="submit"
              disabled={isLoading || (isRecoveryFlow && !isRecoverySessionReady)}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses ke Supabase...</span>
                </>
              ) : isResetMode ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>{isRecoveryFlow ? (isRecoverySessionReady ? 'Simpan Kata Sandi Baru' : 'Memverifikasi Tautan...') : 'Kirim Tautan Pemulihan'}</span>
                </>
              ) : isRegisterMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Daftar Akun Supabase Baru</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Masuk ke Akun Supabase</span>
                </>
              )}
            </button>
          </form>

          {!isRegisterMode && !isResetMode && (
            <div className="text-right">
              <button type="button" onClick={() => { setIsResetMode(true); setErrorMsg(null); }} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer">
                Lupa kata sandi?
              </button>
            </div>
          )}

          {isResetMode && !isRecoveryFlow && (
            <div className="text-center">
              <button type="button" onClick={() => { setIsResetMode(false); setErrorMsg(null); }} className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer">
                Kembali ke halaman masuk
              </button>
            </div>
          )}

          {/* Toggle Register / Login */}
          {!isResetMode && <div className="pt-3 border-t border-slate-800 text-center">
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
                : 'Belum punya akun? Klik untuk Buat Akun Supabase Baru'}
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
}
