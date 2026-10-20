import { InventoryItem } from '../types/inventory';

const DB_NAME = 'kalkulator_dagang_db';
const DB_VERSION = 1;
const STORE_NAME = 'dagang_data';

export interface BackupPayload {
  version: number;
  appName: string;
  exportedAt: string;
  modalAwal: number;
  items: InventoryItem[];
}

// Request persistent storage so browsers do not aggressively purge data
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn('Persistent storage request error:', e);
    }
  }
  return false;
}

// Initialize IndexedDB
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save to IndexedDB (second local defense)
export async function saveToIndexedDB(items: InventoryItem[], modalAwal: number = 50000): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(items, 'items');
    store.put(modalAwal, 'modalAwal');
    store.put(new Date().toISOString(), 'lastSaved');
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

// Load from IndexedDB
export async function loadFromIndexedDB(): Promise<{ items: InventoryItem[] | null; modalAwal: number | null }> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const reqItems = store.get('items');
      const reqModal = store.get('modalAwal');

      tx.oncomplete = () => {
        resolve({
          items: Array.isArray(reqItems.result) && reqItems.result.length > 0 ? reqItems.result : null,
          modalAwal: typeof reqModal.result === 'number' ? reqModal.result : null,
        });
      };
      tx.onerror = () => resolve({ items: null, modalAwal: null });
    });
  } catch {
    return { items: null, modalAwal: null };
  }
}

// Auto-sync to server backend
export async function syncToServer(items: InventoryItem[], modalAwal: number): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, modalAwal }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Fetch backup from server
export async function fetchServerBackup(): Promise<{ items: InventoryItem[] | null; modalAwal: number | null }> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return { items: null, modalAwal: null };
    const data = await res.json();
    if (data.success && Array.isArray(data.items) && data.items.length > 0) {
      return {
        items: data.items,
        modalAwal: typeof data.modalAwal === 'number' ? data.modalAwal : 50000,
      };
    }
  } catch (e) {
    console.warn('Server backup fetch error:', e);
  }
  return { items: null, modalAwal: null };
}

// Generate JSON download file
export function exportBackupJSON(items: InventoryItem[], modalAwal: number): void {
  const payload: BackupPayload = {
    version: 1,
    appName: 'Kalkulator Dagang & Arus Kas',
    exportedAt: new Date().toISOString(),
    modalAwal,
    items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `cadangan_toko_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse imported JSON backup
export function parseBackupJSON(jsonString: string): { items: InventoryItem[]; modalAwal: number } {
  const data = JSON.parse(jsonString);
  let items: InventoryItem[] = [];
  let modalAwal = 50000;

  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) {
      items = data.items;
    }
    if (typeof data.modalAwal === 'number' && !isNaN(data.modalAwal)) {
      modalAwal = data.modalAwal;
    }
  }

  // Sanitize items
  const validItems = items.filter((it) => it && typeof it.namaBarang === 'string');
  return { items: validItems, modalAwal };
}
