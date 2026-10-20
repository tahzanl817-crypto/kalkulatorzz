import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryItem } from '../types/inventory';

export interface UserProfileData {
  userId: string;
  email: string;
  modalAwal: number;
  displayName?: string;
  updatedAt?: string;
}

/**
 * Save or update user profile with modalAwal
 */
export async function saveUserProfile(
  userId: string,
  emailOrData?: string | number | { email?: string; modalAwal?: number; displayName?: string },
  modalAwalNum?: number
): Promise<void> {
  const path = `users/${userId}`;
  try {
    let email = '';
    let modalAwal = 50000;
    let displayName = '';

    if (typeof emailOrData === 'object' && emailOrData !== null) {
      email = emailOrData.email || '';
      modalAwal = Number(emailOrData.modalAwal) || 0;
      displayName = emailOrData.displayName || '';
    } else if (typeof emailOrData === 'number') {
      modalAwal = emailOrData;
    } else if (typeof emailOrData === 'string') {
      email = emailOrData;
      if (modalAwalNum !== undefined) {
        modalAwal = modalAwalNum;
      }
    }

    const userRef = doc(db, 'users', userId);
    const dataToSave: Record<string, unknown> = {
      userId,
      email: email || '',
      modalAwal: Number(modalAwal) || 0,
      updatedAt: new Date().toISOString()
    };
    if (displayName) dataToSave.displayName = displayName;

    await setDoc(userRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save a single inventory item to user's items subcollection
 */
export async function saveInventoryItemToCloud(userId: string, item: InventoryItem): Promise<void> {
  const path = `users/${userId}/items/${item.id}`;
  try {
    const itemRef = doc(db, 'users', userId, 'items', item.id);
    const payload: Record<string, unknown> = {
      id: item.id,
      userId,
      namaBarang: item.namaBarang,
      satuanWadah: item.satuanWadah,
      jumlahBarangWadah: Number(item.jumlahBarangWadah),
      satuanUnit: item.satuanUnit,
      hargaBeli: Number(item.hargaBeli),
      jumlahBarangDijualSatuan: Number(item.jumlahBarangDijualSatuan),
      hargaJualSatuan: Number(item.hargaJualSatuan),
      persentaseLabaDisimpanBulanan: Number(item.persentaseLabaDisimpanBulanan ?? 50),
      createdAt: Number(item.createdAt || Date.now()),
      updatedAt: Number(item.updatedAt || Date.now())
    };

    if (item.perputaranBulan !== undefined) payload.perputaranBulan = Number(item.perputaranBulan);
    if (item.tanggalInput) payload.tanggalInput = String(item.tanggalInput);
    if (item.waktuInput) payload.waktuInput = String(item.waktuInput);
    if (item.catatan) payload.catatan = String(item.catatan);

    await setDoc(itemRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a single inventory item from cloud
 */
export async function deleteInventoryItemFromCloud(userId: string, itemId: string): Promise<void> {
  const path = `users/${userId}/items/${itemId}`;
  try {
    const itemRef = doc(db, 'users', userId, 'items', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Batch upload / migrate all items and profile to cloud
 * Supports:
 * - batchUploadToCloud(userId, items, modalAwal)
 * - batchUploadToCloud(userId, email, modalAwal, items)
 */
export async function batchUploadToCloud(
  userId: string,
  arg2: string | InventoryItem[],
  arg3?: number | InventoryItem[],
  arg4?: InventoryItem[]
): Promise<void> {
  const path = `users/${userId}`;
  try {
    let email = '';
    let modalAwal = 50000;
    let itemsToUpload: InventoryItem[] = [];

    if (Array.isArray(arg2)) {
      itemsToUpload = arg2;
      modalAwal = typeof arg3 === 'number' ? arg3 : 50000;
    } else {
      email = String(arg2);
      modalAwal = typeof arg3 === 'number' ? arg3 : 50000;
      itemsToUpload = Array.isArray(arg4) ? arg4 : [];
    }

    // 1. Save profile
    await saveUserProfile(userId, { email, modalAwal });

    // 2. Batch write items
    if (itemsToUpload.length > 0) {
      const batch = writeBatch(db);
      for (const item of itemsToUpload) {
        const itemRef = doc(db, 'users', userId, 'items', item.id);
        const payload: Record<string, unknown> = {
          id: item.id,
          userId,
          namaBarang: item.namaBarang,
          satuanWadah: item.satuanWadah,
          jumlahBarangWadah: Number(item.jumlahBarangWadah),
          satuanUnit: item.satuanUnit,
          hargaBeli: Number(item.hargaBeli),
          jumlahBarangDijualSatuan: Number(item.jumlahBarangDijualSatuan),
          hargaJualSatuan: Number(item.hargaJualSatuan),
          persentaseLabaDisimpanBulanan: Number(item.persentaseLabaDisimpanBulanan ?? 50),
          createdAt: Number(item.createdAt || Date.now()),
          updatedAt: Number(item.updatedAt || Date.now())
        };

        if (item.perputaranBulan !== undefined) payload.perputaranBulan = Number(item.perputaranBulan);
        if (item.tanggalInput) payload.tanggalInput = String(item.tanggalInput);
        if (item.waktuInput) payload.waktuInput = String(item.waktuInput);
        if (item.catatan) payload.catatan = String(item.catatan);

        batch.set(itemRef, payload, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to real-time updates of user's inventory items
 */
export function subscribeUserItems(
  userId: string,
  onUpdate: (items: InventoryItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `users/${userId}/items`;
  const itemsColl = collection(db, 'users', userId, 'items');

  return onSnapshot(
    itemsColl,
    (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: d.id || docSnap.id,
          namaBarang: d.namaBarang,
          satuanWadah: d.satuanWadah,
          jumlahBarangWadah: d.jumlahBarangWadah,
          satuanUnit: d.satuanUnit,
          hargaBeli: d.hargaBeli,
          jumlahBarangDijualSatuan: d.jumlahBarangDijualSatuan,
          hargaJualSatuan: d.hargaJualSatuan,
          persentaseLabaDisimpanBulanan: d.persentaseLabaDisimpanBulanan ?? 50,
          perputaranBulan: d.perputaranBulan,
          tanggalInput: d.tanggalInput,
          waktuInput: d.waktuInput,
          catatan: d.catatan,
          createdAt: d.createdAt || Date.now(),
          updatedAt: d.updatedAt || Date.now(),
        });
      });
      // Sort newest created first
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Fetch all items once (useful for initial check or migration)
 */
export async function fetchUserItemsOnce(userId: string): Promise<InventoryItem[]> {
  const path = `users/${userId}/items`;
  try {
    const itemsColl = collection(db, 'users', userId, 'items');
    const snap = await getDocs(itemsColl);
    const items: InventoryItem[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        id: d.id || docSnap.id,
        namaBarang: d.namaBarang,
        satuanWadah: d.satuanWadah,
        jumlahBarangWadah: d.jumlahBarangWadah,
        satuanUnit: d.satuanUnit,
        hargaBeli: d.hargaBeli,
        jumlahBarangDijualSatuan: d.jumlahBarangDijualSatuan,
        hargaJualSatuan: d.hargaJualSatuan,
        persentaseLabaDisimpanBulanan: d.persentaseLabaDisimpanBulanan ?? 50,
        perputaranBulan: d.perputaranBulan,
        tanggalInput: d.tanggalInput,
        waktuInput: d.waktuInput,
        catatan: d.catatan,
        createdAt: d.createdAt || Date.now(),
        updatedAt: d.updatedAt || Date.now(),
      });
    });
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}
