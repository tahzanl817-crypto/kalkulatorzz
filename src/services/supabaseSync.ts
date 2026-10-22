import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types/inventory';

export async function fetchSupabaseItems(userId: string): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch items error:', error);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((d: any) => ({
      id: String(d.id),
      namaBarang: d.nama_barang || d.namaBarang || 'Barang',
      satuanWadah: d.satuan_wadah || d.satuanWadah || 'Dus',
      jumlahBarangWadah: Number(d.jumlah_barang_wadah ?? d.jumlahBarangWadah ?? 1),
      satuanUnit: d.satuan_unit || d.satuanUnit || 'Pcs',
      hargaBeli: Number(d.harga_beli ?? d.hargaBeli ?? 0),
      jumlahBarangDijualSatuan: Number(d.jumlah_barang_dijual_satuan ?? d.jumlahBarangDijualSatuan ?? 0),
      hargaJualSatuan: Number(d.harga_jual_satuan ?? d.hargaJualSatuan ?? 0),
      persentaseLabaDisimpanBulanan: Number(d.persentase_laba_disimpan_bulanan ?? d.persentaseLabaDisimpanBulanan ?? 50),
      perputaranBulan: d.perputaran_bulan ?? d.perputaranBulan ?? 1,
      tanggalInput: d.tanggal_input ?? d.tanggalInput,
      waktuInput: d.waktu_input ?? d.waktuInput,
      catatan: d.catatan || '',
      createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
      updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : Date.now(),
    }));
  } catch (err) {
    console.error('Failed to fetch Supabase items:', err);
    return [];
  }
}

export async function saveSupabaseItem(userId: string, item: InventoryItem): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      id: item.id,
      user_id: userId,
      nama_barang: item.namaBarang,
      satuan_wadah: item.satuanWadah,
      jumlah_barang_wadah: Number(item.jumlahBarangWadah),
      satuan_unit: item.satuanUnit,
      harga_beli: Number(item.hargaBeli),
      jumlah_barang_dijual_satuan: Number(item.jumlahBarangDijualSatuan),
      harga_jual_satuan: Number(item.hargaJualSatuan),
      persentase_laba_disimpan_bulanan: Number(item.persentaseLabaDisimpanBulanan ?? 50),
      perputaran_bulan: Number(item.perputaranBulan ?? 1),
      updated_at: new Date().toISOString(),
    };

    if (item.tanggalInput) payload.tanggal_input = item.tanggalInput;
    if (item.waktuInput) payload.waktu_input = item.waktuInput;
    if (item.catatan) payload.catatan = item.catatan;

    const { error } = await supabase
      .from('inventory_items')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save item error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save Supabase item:', err);
    return false;
  }
}

export async function batchSaveSupabaseItems(
  userId: string,
  items: InventoryItem[],
  modalAwal?: number
): Promise<boolean> {
  try {
    if (typeof modalAwal === 'number') {
      await saveSupabaseModalAwal(modalAwal);
    }
    if (items.length === 0) return true;

    const payloads = items.map((item) => {
      const p: Record<string, unknown> = {
        id: item.id,
        user_id: userId,
        nama_barang: item.namaBarang,
        satuan_wadah: item.satuanWadah,
        jumlah_barang_wadah: Number(item.jumlahBarangWadah),
        satuan_unit: item.satuanUnit,
        harga_beli: Number(item.hargaBeli),
        jumlah_barang_dijual_satuan: Number(item.jumlahBarangDijualSatuan),
        harga_jual_satuan: Number(item.hargaJualSatuan),
        persentase_laba_disimpan_bulanan: Number(item.persentaseLabaDisimpanBulanan ?? 50),
        perputaran_bulan: Number(item.perputaranBulan ?? 1),
        updated_at: new Date().toISOString(),
      };
      if (item.tanggalInput) p.tanggal_input = item.tanggalInput;
      if (item.waktuInput) p.waktu_input = item.waktuInput;
      if (item.catatan) p.catatan = item.catatan;
      return p;
    });

    const { error } = await supabase
      .from('inventory_items')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase batch save error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to batch save Supabase items:', err);
    return false;
  }
}

export async function deleteSupabaseItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.warn('Supabase delete item error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete Supabase item:', err);
    return false;
  }
}

export async function clearAllSupabaseItems(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase clear all items error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to clear Supabase items:', err);
    return false;
  }
}

export async function saveSupabaseModalAwal(modalAwal: number): Promise<void> {
  try {
    await supabase.auth.updateUser({
      data: { modalAwal },
    });
  } catch (e) {
    console.warn('Failed to update Supabase user metadata:', e);
  }
}
