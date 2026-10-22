import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from './types/inventory';
import { calculateSummary } from './utils/calculator';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { QuickAddBar } from './components/QuickAddBar';
import { InventoryTable } from './components/InventoryTable';
import { ItemModal } from './components/ItemModal';
import { CashFlowGuideModal } from './components/CashFlowGuideModal';
import { DownloadModal } from './components/DownloadModal';
import { PrintReportView } from './components/PrintReportView';
import { AuthModal } from './components/AuthModal';
import { CosmicInteractiveBackground, BackgroundTheme } from './components/CosmicInteractiveBackground';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { 
  Cloud, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw,
  LogIn,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  requestPersistentStorage, 
  saveToIndexedDB, 
  loadFromIndexedDB, 
  syncToServer, 
  fetchServerBackup 
} from './utils/storageBackup';
import {
  fetchSupabaseItems,
  saveSupabaseItem,
  batchSaveSupabaseItems,
  deleteSupabaseItem,
  clearAllSupabaseItems,
  saveSupabaseModalAwal,
} from './services/supabaseSync';

const ALL_STORAGE_KEYS = [
  'kalkulator_penjualan_rolling_items',
  'kalkulator_penjualan_monthly_items',
  'kalkulator_penjualan_simple_items',
  'kalkulator_dagang_items_v1',
];
const PERCENT_KEY = 'kalkulator_penjualan_monthly_save_pct';
const MODAL_KEY = 'kalkulator_penjualan_modal_awal';

function loadPersistedItems(): InventoryItem[] {
  for (const key of ALL_STORAGE_KEYS) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading key:', key, e);
    }
  }
  return [];
}

export default function App() {
  const { user, loading: isAuthLoading } = useAuth();

  const [modalAwal, setModalAwal] = useState<number>(() => {
    try {
      const storedModal = localStorage.getItem(MODAL_KEY);
      if (storedModal !== null && !isNaN(Number(storedModal))) {
        return Number(storedModal);
      }
    } catch (e) {
      console.error(e);
    }
    return 50000;
  });

  const [items, setItems] = useState<InventoryItem[]>(() => {
    return loadPersistedItems();
  });

  const [globalSavePercentMonthly, setGlobalSavePercentMonthly] = useState<number>(() => {
    try {
      const storedPct = localStorage.getItem(PERCENT_KEY);
      if (storedPct !== null) {
        return Number(storedPct);
      }
    } catch (e) {
      console.error(e);
    }
    return 50;
  });

  // Real-time ticking clock
  const [currentRealTime, setCurrentRealTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRealTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // UI Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Cosmic Interactive Background theme
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(() => {
    try {
      const stored = localStorage.getItem('niaganova_bg_theme');
      if (stored && ['cosmic-nebula', 'aurora-emerald', 'cyber-sapphire', 'light-crystal'].includes(stored)) {
        return stored as BackgroundTheme;
      }
    } catch (e) {
      console.error(e);
    }
    return 'cosmic-nebula';
  });

  const handleThemeChange = (theme: BackgroundTheme) => {
    setBackgroundTheme(theme);
    try {
      localStorage.setItem('niaganova_bg_theme', theme);
    } catch (e) {
      console.error(e);
    }
  };

  // Open the password reset modal for both implicit and PKCE recovery links.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const hasRecoveryMarker =
      url.hash.includes('type=recovery') ||
      url.searchParams.get('type') === 'recovery' ||
      url.searchParams.has('code');

    if (hasRecoveryMarker) setIsAuthModalOpen(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsAuthModalOpen(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cloud Sync Statuses
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudNotification, setCloudNotification] = useState<string | null>(null);

  // Auto-dismiss cloud notifications after 6 seconds
  useEffect(() => {
    if (cloudNotification) {
      const timer = setTimeout(() => {
        setCloudNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [cloudNotification]);

  // Request Persistent Browser Storage on mount
  useEffect(() => {
    requestPersistentStorage();
  }, []);

  // SUPABASE REAL-TIME & CLOUD SYNCHRONIZATION EFFECT
  useEffect(() => {
    if (!user) {
      return;
    }

    const setupUserCloudData = async () => {
      setIsCloudSyncing(true);
      try {
        // 1. Fetch user store settings (modal awal) from Supabase metadata
        if (user.modalAwal) {
          setModalAwal(user.modalAwal);
          localStorage.setItem(MODAL_KEY, String(user.modalAwal));
        } else {
          saveSupabaseModalAwal(modalAwal);
        }

        // 2. Fetch items from Supabase inventory_items table
        const sbItems = await fetchSupabaseItems(user.id);

        if (sbItems.length > 0) {
          setItems(sbItems);
          saveToIndexedDB(sbItems);
          for (const key of ALL_STORAGE_KEYS) {
            localStorage.setItem(key, JSON.stringify(sbItems));
          }
          setCloudNotification(`Data toko berhasil dimuat dari database Supabase (${sbItems.length} barang).`);
        } else if (items.length > 0) {
          for (const it of items) {
            await saveSupabaseItem(user.id, it);
          }
          await saveSupabaseModalAwal(modalAwal);
          setCloudNotification(`Data toko berhasil disinkronkan ke Supabase Cloud (${items.length} barang).`);
        }
      } catch (err: any) {
        console.error('Failed to setup Supabase sync:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    };

    setupUserCloudData();
  }, [user]);

  // Fallback initial load from IndexedDB or server when user is not logged in
  useEffect(() => {
    if (user) return; // Managed by Firestore

    const initOfflineStorage = async () => {
      try {
        const idb = await loadFromIndexedDB();
        if (idb && idb.items && idb.items.length > 0) {
          setItems(idb.items);
          if (idb.modalAwal) {
            setModalAwal(idb.modalAwal);
            localStorage.setItem(MODAL_KEY, String(idb.modalAwal));
          }
          return;
        }

        const serverData = await fetchServerBackup();
        if (serverData && serverData.items && serverData.items.length > 0) {
          setItems(serverData.items);
          if (serverData.modalAwal) {
            setModalAwal(serverData.modalAwal);
            localStorage.setItem(MODAL_KEY, String(serverData.modalAwal));
          }
        }
      } catch (e) {
        console.error('Storage init error:', e);
      }
    };

    if (items.length === 0) {
      initOfflineStorage();
    }
  }, [user]);

  // Local storage persistence
  useEffect(() => {
    for (const key of ALL_STORAGE_KEYS) {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch (e) {
        console.error(`Error saving ${key}:`, e);
      }
    }
    saveToIndexedDB(items, modalAwal);
  }, [items, modalAwal]);

  // Filtered items by selected month
  const filteredMonthlyItems = useMemo(() => {
    if (selectedMonth === 'all') return items;
    return items.filter((item) => {
      const itemMonth = (item.tanggalInput || new Date(item.createdAt).toISOString().slice(0, 7)).slice(0, 7);
      return itemMonth === selectedMonth;
    });
  }, [items, selectedMonth]);

  // Overall financial summary
  const summary = useMemo(() => {
    return calculateSummary(filteredMonthlyItems, modalAwal);
  }, [filteredMonthlyItems, modalAwal]);

  // Handlers for Items
  const handleAddItem = async (newItemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const item: InventoryItem = {
      ...newItemData,
      id: `item_${now}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      persentaseLabaDisimpanBulanan: newItemData.persentaseLabaDisimpanBulanan ?? globalSavePercentMonthly,
    };

    const nextItems = [item, ...items];
    setItems(nextItems);

    if (user) {
      setIsCloudSyncing(true);
      try {
        await saveSupabaseItem(user.id, item);
      } catch (e) {
        console.error('Failed to sync added item to Supabase:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  const handleSaveItem = async (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    const now = Date.now();
    let updatedTargetItem: InventoryItem | null = null;

    if (editId) {
      const nextItems = items.map((i) => {
        if (i.id === editId) {
          const updated = {
            ...i,
            ...itemData,
            updatedAt: now,
          };
          updatedTargetItem = updated;
          return updated;
        }
        return i;
      });
      setItems(nextItems);

      if (user && updatedTargetItem) {
        setIsCloudSyncing(true);
        try {
          await saveSupabaseItem(user.id, updatedTargetItem);
        } catch (e) {
          console.error('Failed to update item in Supabase:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    } else {
      const newItem: InventoryItem = {
        ...itemData,
        id: `item_${now}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
        persentaseLabaDisimpanBulanan: itemData.persentaseLabaDisimpanBulanan ?? globalSavePercentMonthly,
      };
      setItems([newItem, ...items]);

      if (user) {
        setIsCloudSyncing(true);
        try {
          await saveSupabaseItem(user.id, newItem);
        } catch (e) {
          console.error('Failed to add item to Supabase:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    }

    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Hapus barang ini dari pembukuan?')) {
      const nextItems = items.filter((i) => i.id !== id);
      setItems(nextItems);

      if (user) {
        setIsCloudSyncing(true);
        try {
          await deleteSupabaseItem(id);
        } catch (e) {
          console.error('Failed to delete item from Supabase:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    }
  };

  const handleUpdateSoldQty = async (id: string, delta: number) => {
    let updatedItem: InventoryItem | null = null;
    const nextItems = items.map((item) => {
      if (item.id === id) {
        const nextVal = Math.min(
          item.jumlahBarangWadah,
          Math.max(0, item.jumlahBarangDijualSatuan + delta)
        );
        const updated = {
          ...item,
          jumlahBarangDijualSatuan: nextVal,
          updatedAt: Date.now(),
        };
        updatedItem = updated;
        return updated;
      }
      return item;
    });
    setItems(nextItems);

    if (user && updatedItem) {
      try {
        await saveSupabaseItem(user.id, updatedItem);
      } catch (e) {
        console.error('Failed to update sold qty in Supabase:', e);
      }
    }
  };

  const handleSetSoldQty = async (id: string, qty: number) => {
    let updatedItem: InventoryItem | null = null;
    const nextItems = items.map((item) => {
      if (item.id === id) {
        const nextVal = Math.min(item.jumlahBarangWadah, Math.max(0, qty));
        const updated = {
          ...item,
          jumlahBarangDijualSatuan: nextVal,
          updatedAt: Date.now(),
        };
        updatedItem = updated;
        return updated;
      }
      return item;
    });
    setItems(nextItems);

    if (user && updatedItem) {
      try {
        await saveSupabaseItem(user.id, updatedItem);
      } catch (e) {
        console.error('Failed to set sold qty in Supabase:', e);
      }
    }
  };

  const handleUpdateModalAwal = async (newModal: number) => {
    setModalAwal(newModal);
    localStorage.setItem(MODAL_KEY, String(newModal));

    if (user) {
      try {
        await saveSupabaseModalAwal(newModal);
      } catch (e) {
        console.error('Failed to update modalAwal in Supabase:', e);
      }
    }
  };

  const handleClearAll = () => {
    setIsConfirmClearModalOpen(true);
  };

  const handleConfirmClearAll = async () => {
    setIsConfirmClearModalOpen(false);
    setItems([]);
    for (const k of ALL_STORAGE_KEYS) {
      localStorage.removeItem(k);
    }
    saveToIndexedDB([], modalAwal);
    syncToServer([], modalAwal);

    if (user) {
      setIsCloudSyncing(true);
      try {
        await clearAllSupabaseItems(user.id);
        setCloudNotification('Semua data barang berhasil dikosongkan dari tabel dan database Supabase.');
      } catch (e) {
        console.error('Failed to clear Supabase items:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  const handleRestoreData = async (restoredItems: InventoryItem[], restoredModalAwal?: number) => {
    setItems(restoredItems);
    if (restoredModalAwal !== undefined && restoredModalAwal >= 0) {
      setModalAwal(restoredModalAwal);
      localStorage.setItem(MODAL_KEY, String(restoredModalAwal));
    }

    if (user) {
      setIsCloudSyncing(true);
      try {
        await batchSaveSupabaseItems(user.id, restoredItems, restoredModalAwal ?? modalAwal);
        setCloudNotification('Data cadangan berhasil dipulihkan dan disinkronkan ke Supabase Cloud.');
      } catch (e) {
        console.error('Failed to sync restored data to Supabase:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  const handleForceCloudSync = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsCloudSyncing(true);
    try {
      const ok = await batchSaveSupabaseItems(user.id, items, modalAwal);
      if (ok) {
        setCloudNotification(`Sinkronisasi berhasil! ${items.length} barang tersimpan aman di Supabase Cloud.`);
      } else {
        setCloudNotification('Gagal melakukan sinkronisasi ke Supabase. Periksa koneksi internet.');
      }
    } catch (e: any) {
      console.error(e);
      setCloudNotification('Gagal melakukan sinkronisasi Supabase: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen flex flex-col text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 font-sans">
      {/* Dynamic Cursor-Interactive Background (Bintang, Titik, Campuran Gambar Dagang Bergerak Sesuai Kursor) */}
      <CosmicInteractiveBackground
        currentTheme={backgroundTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Foreground Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onOpenAddModal={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
          onPrintReport={handlePrint}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isSyncingCloud={isCloudSyncing}
        />

        {/* Cloud Status / Welcome Banner */}
        {!user && !isAuthLoading && (
          <div className="no-print bg-emerald-950/40 backdrop-blur-md text-emerald-200 px-4 py-2.5 text-xs border-b border-emerald-500/30">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px] sm:text-xs text-slate-300">
                  <strong className="text-emerald-300">Penyimpanan Supabase Cloud:</strong> Masuk dengan akun Supabase agar seluruh data transaksi & modal kasir tersimpan di cloud database Supabase Anda.
                </span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-sm shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk ke Supabase</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Notification Toast */}
        {cloudNotification ? (
          <div className="no-print bg-emerald-950/85 backdrop-blur-md border-b border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-200 animate-in fade-in">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{cloudNotification}</span>
              </div>
              <button
                onClick={() => setCloudNotification(null)}
                className="text-emerald-400 hover:text-emerald-100 font-bold cursor-pointer ml-4 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {/* Title & Quick Actions Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 sm:p-5 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  NIAGANOVA MATRIX
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  Pencatatan Arus Kas & Sisa Modal
                </h1>
                <span className="text-[11px] font-mono text-slate-400 font-medium">
                  · {currentRealTime}
                </span>
                {user && (
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md font-medium">
                    Akun: {user.email || 'Online'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Pencatatan penjualan per wadah dan satuan, perhitungan sisa kas kasir real-time, dan pemantauan perputaran modal usaha.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto font-mono">
              {user ? (
                <button
                  onClick={handleForceCloudSync}
                  disabled={isCloudSyncing}
                  title="Sinkronkan data ke database cloud sekarang"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl cursor-pointer transition-all shadow-sm shadow-emerald-500/20"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Simpan Online</span>
                </button>
              )}

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cadangan</span>
              </button>

              <button
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Panduan</span>
              </button>
            </div>
          </div>

        {/* Rolling Cash Balance & Capital Cards Focusing on Sisa Kas */}
        <SummaryCards
          summary={summary}
          modalAwal={modalAwal}
          onUpdateModalAwal={handleUpdateModalAwal}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          currentRealTime={currentRealTime}
          bulanFilter={selectedMonth}
        />

        {/* Quick Add Bar */}
        <QuickAddBar
          onAdd={handleAddItem}
        />

        {/* Main Table with Numeric Sold Input, Sisa Kas & Real-Time Timestamps */}
        <InventoryTable
          items={items}
          modalAwal={modalAwal}
          onEditItem={(item) => {
            setEditingItem(item);
            setIsItemModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onUpdateSoldQty={handleUpdateSoldQty}
          onSetSoldQty={handleSetSoldQty}
          onClearAll={handleClearAll}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-slate-300 font-semibold tracking-wide">NiagaNova Matrix</span>
            <span className="text-slate-600">·</span>
            <span>Kalkulator Dagang & Arus Kas Real-time</span>
          </div>
          <div className="text-slate-400">
            {user ? (
              <span className="text-emerald-400 font-medium">
                ● Tersambung ke server cloud ({user.email})
              </span>
            ) : (
              <span>Penyimpanan lokal aman. Masuk akun untuk sinkronisasi multi-perangkat.</span>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
      />

      <CashFlowGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        items={items}
        modalAwal={modalAwal}
        summary={summary}
        onRestoreData={handleRestoreData}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Modal Konfirmasi Hapus Semua Data */}
      {isConfirmClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 font-sans space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Kosongkan Semua Data Barang?</h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Tindakan ini akan menghapus seluruh daftar barang dari tabel pembukuan kasir dan database cloud Supabase Anda ({items.length} barang). Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3 font-mono">
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/25"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Component */}
      <PrintReportView
        items={filteredMonthlyItems}
        summary={summary}
        modalAwal={modalAwal}
      />
      </div>
    </div>
  );
}
