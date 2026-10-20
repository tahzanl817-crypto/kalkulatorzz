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
  saveUserProfile,
  getUserProfile,
  saveInventoryItemToCloud,
  deleteInventoryItemFromCloud,
  batchUploadToCloud,
  subscribeUserItems,
  fetchUserItemsOnce
} from './services/firestoreSync';

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

  // FIRESTORE REAL-TIME SYNCHRONIZATION EFFECT (100% Google Cloud Firestore)
  useEffect(() => {
    if (!user) {
      return;
    }

    let unsubscribeFirestore: (() => void) | undefined;

    const setupUserCloudData = async () => {
      setIsCloudSyncing(true);
      try {
        // 1. Fetch user store settings (modal awal)
        const profile = await getUserProfile(user.uid);
        if (profile && profile.modalAwal !== undefined) {
          setModalAwal(profile.modalAwal);
          localStorage.setItem(MODAL_KEY, String(profile.modalAwal));
        } else {
          // If first time, save current local modal awal to cloud
          await saveUserProfile(user.uid, {
            modalAwal: modalAwal,
            email: user.email || '',
            displayName: user.displayName || '',
          });
        }

        // 2. Fetch items from cloud once
        const cloudItems = await fetchUserItemsOnce(user.uid);

        if (cloudItems.length > 0) {
          // Cloud has data: use cloud data as single source of truth
          setItems(cloudItems);
          saveToIndexedDB(cloudItems);
          for (const key of ALL_STORAGE_KEYS) {
            localStorage.setItem(key, JSON.stringify(cloudItems));
          }
          setCloudNotification(`Data berhasil dimuat dari database cloud (${cloudItems.length} barang).`);
        } else if (items.length > 0) {
          // Cloud is empty, but local has items -> upload local items to cloud
          await batchUploadToCloud(user.uid, items, modalAwal);
          setCloudNotification(`Data lokal berhasil dicadangkan ke akun cloud (${items.length} barang).`);
        }

        // 3. Subscribe to real-time changes
        unsubscribeFirestore = subscribeUserItems(user.uid, (syncedItems) => {
          setItems(syncedItems);
          saveToIndexedDB(syncedItems);
          for (const key of ALL_STORAGE_KEYS) {
            localStorage.setItem(key, JSON.stringify(syncedItems));
          }
        });
      } catch (err: any) {
        console.error('Failed to setup cloud sync:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    };

    setupUserCloudData();

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
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
        await saveInventoryItemToCloud(user.uid, item);
      } catch (e) {
        console.error('Failed to sync added item to cloud:', e);
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
          await saveInventoryItemToCloud(user.uid, updatedTargetItem);
        } catch (e) {
          console.error('Failed to update item in cloud:', e);
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
          await saveInventoryItemToCloud(user.uid, newItem);
        } catch (e) {
          console.error('Failed to add item to cloud:', e);
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
          await deleteInventoryItemFromCloud(user.uid, id);
        } catch (e) {
          console.error('Failed to delete item from cloud:', e);
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
        await saveInventoryItemToCloud(user.uid, updatedItem);
      } catch (e) {
        console.error('Failed to update sold qty in cloud:', e);
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
        await saveInventoryItemToCloud(user.uid, updatedItem);
      } catch (e) {
        console.error('Failed to set sold qty in cloud:', e);
      }
    }
  };

  const handleUpdateModalAwal = async (newModal: number) => {
    setModalAwal(newModal);
    localStorage.setItem(MODAL_KEY, String(newModal));

    if (user) {
      try {
        await saveUserProfile(user.uid, { modalAwal: newModal });
      } catch (e) {
        console.error('Failed to update modalAwal in cloud:', e);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Kosongkan semua data barang dari tabel?')) {
      if (user) {
        setIsCloudSyncing(true);
        try {
          for (const item of items) {
            await deleteInventoryItemFromCloud(user.uid, item.id);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsCloudSyncing(false);
        }
      }

      setItems([]);
      for (const k of ALL_STORAGE_KEYS) {
        localStorage.removeItem(k);
      }
      saveToIndexedDB([], modalAwal);
      syncToServer([], modalAwal);
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
        await batchUploadToCloud(user.uid, restoredItems, restoredModalAwal ?? modalAwal);
        setCloudNotification('Data cadangan berhasil dipulihkan dan disinkronkan ke cloud.');
      } catch (e) {
        console.error('Failed to sync restored data to cloud:', e);
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
      await batchUploadToCloud(user.uid, items, modalAwal);
      setCloudNotification(`Sinkronisasi manual berhasil! ${items.length} barang tersimpan aman di cloud.`);
    } catch (e: any) {
      console.error(e);
      setCloudNotification('Gagal melakukan sinkronisasi cloud. Coba periksa koneksi internet.');
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
          <div className="no-print bg-amber-950/40 backdrop-blur-md text-amber-200 px-4 py-2.5 text-xs border-b border-amber-500/30">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono text-[11px] sm:text-xs text-slate-300">
                  <strong className="text-amber-300">Penyimpanan Google Cloud:</strong> Masuk dengan akun resmi Google atau Email agar seluruh data transaksi & modal kasir tersimpan 100% di Google Cloud Firestore.
                </span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-sm shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk ke Cloud</span>
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
