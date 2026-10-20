import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types/inventory';
import { calculateItem, formatRupiah, formatAngka } from '../utils/calculator';
import { X, Calculator, Calendar } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  editingItem?: InventoryItem | null;
}

const COMMON_CONTAINERS = ['Dus', 'Karton', 'Slop', 'Bal', 'Peti', 'Pak', 'Karung', 'Krat', 'Boks', 'Botol'];
const COMMON_UNITS = ['Pcs', 'Bungkus', 'Botol', 'Sachet', 'Kg', 'Kaleng', 'Butir', 'Pack'];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [tanggalInput, setTanggalInput] = useState(todayStr);
  const [namaBarang, setNamaBarang] = useState('');
  const [satuanWadah, setSatuanWadah] = useState('Dus');
  const [jumlahBarangWadah, setJumlahBarangWadah] = useState<number>(24);
  const [satuanUnit, setSatuanUnit] = useState('Pcs');
  const [hargaBeli, setHargaBeli] = useState<number>(120000);
  const [jumlahBarangDijualSatuan, setJumlahBarangDijualSatuan] = useState<number>(0);
  const [hargaJualSatuan, setHargaJualSatuan] = useState<number>(6500);
  const [perputaranBulan, setPerputaranBulan] = useState<number>(1);
  const [persentaseLabaDisimpanBulanan, setPersentaseLabaDisimpanBulanan] = useState<number>(50);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTanggalInput(editingItem.tanggalInput || todayStr);
      setNamaBarang(editingItem.namaBarang);
      setSatuanWadah(editingItem.satuanWadah);
      setJumlahBarangWadah(editingItem.jumlahBarangWadah);
      setSatuanUnit(editingItem.satuanUnit);
      setHargaBeli(editingItem.hargaBeli);
      setJumlahBarangDijualSatuan(editingItem.jumlahBarangDijualSatuan);
      setHargaJualSatuan(editingItem.hargaJualSatuan);
      setPerputaranBulan(editingItem.perputaranBulan ?? 1);
      setPersentaseLabaDisimpanBulanan(editingItem.persentaseLabaDisimpanBulanan ?? 50);
      setCatatan(editingItem.catatan || '');
    } else {
      setTanggalInput(todayStr);
      setNamaBarang('');
      setSatuanWadah('Dus');
      setJumlahBarangWadah(24);
      setSatuanUnit('Pcs');
      setHargaBeli(120000);
      setJumlahBarangDijualSatuan(0);
      setHargaJualSatuan(6500);
      setPerputaranBulan(1);
      setPersentaseLabaDisimpanBulanan(50);
      setCatatan('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const previewItem: InventoryItem = {
    id: 'preview',
    namaBarang: namaBarang || 'Barang Baru',
    satuanWadah,
    jumlahBarangWadah: Number(jumlahBarangWadah) || 1,
    satuanUnit,
    hargaBeli: Number(hargaBeli) || 0,
    jumlahBarangDijualSatuan: Number(jumlahBarangDijualSatuan) || 0,
    hargaJualSatuan: Number(hargaJualSatuan) || 0,
    perputaranBulan,
    persentaseLabaDisimpanBulanan,
    createdAt: 0,
    updatedAt: 0,
  };

  const previewCalc = calculateItem(previewItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    onSave(
      {
        namaBarang: namaBarang.trim(),
        satuanWadah,
        jumlahBarangWadah: Number(jumlahBarangWadah) || 1,
        satuanUnit,
        hargaBeli: Number(hargaBeli) || 0,
        jumlahBarangDijualSatuan: Number(jumlahBarangDijualSatuan) || 0,
        hargaJualSatuan: Number(hargaJualSatuan) || 0,
        perputaranBulan: Number(perputaranBulan) || 1,
        persentaseLabaDisimpanBulanan: Number(persentaseLabaDisimpanBulanan) ?? 50,
        tanggalInput: tanggalInput || todayStr,
        catatan: catatan.trim(),
      },
      editingItem ? editingItem.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 text-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {editingItem ? 'Edit Data Barang' : 'Form Lengkap Tambah Barang'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Kelola nomor transaksi, tanggal input, modal beli, dan harga jual
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanggal Transaksi</span>
              </label>
              <input
                type="date"
                required
                value={tanggalInput}
                onChange={(e) => setTanggalInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Nama Barang <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                placeholder="Contoh: Sprite 390ml, Minyak 2L"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Wadah Pembelian (Grosir)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={satuanWadah}
                  onChange={(e) => setSatuanWadah(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                />
                <select
                  onChange={(e) => e.target.value && setSatuanWadah(e.target.value)}
                  value=""
                  className="px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="">Pilih</option>
                  {COMMON_CONTAINERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Jumlah Isi 1 Wadah <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={jumlahBarangWadah || ''}
                onChange={(e) => setJumlahBarangWadah(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl font-mono focus:outline-none focus:border-emerald-500 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Satuan Eceran Dijual
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={satuanUnit}
                  onChange={(e) => setSatuanUnit(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                />
                <select
                  onChange={(e) => e.target.value && setSatuanUnit(e.target.value)}
                  value=""
                  className="px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="">Pilih</option>
                  {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Harga Beli 1 Wadah (Modal) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={hargaBeli || ''}
                onChange={(e) => setHargaBeli(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl font-mono focus:outline-none focus:border-emerald-500 text-white"
              />
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                HPP per {satuanUnit}: <strong className="text-slate-200">{formatRupiah(previewCalc.hppSatuan)}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Jumlah Barang Dijual (Satuan)
              </label>
              <input
                type="number"
                min="0"
                max={jumlahBarangWadah}
                value={jumlahBarangDijualSatuan ?? 0}
                onChange={(e) => setJumlahBarangDijualSatuan(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl font-mono focus:outline-none focus:border-emerald-500 text-white"
              />
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                {jumlahBarangDijualSatuan === 0 ? 'Status: Belum terjual' : `Terjual: ${jumlahBarangDijualSatuan} ${satuanUnit}`}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Harga Jual per Satuan <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={hargaJualSatuan || ''}
                onChange={(e) => setHargaJualSatuan(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl font-mono focus:outline-none focus:border-emerald-500 text-white"
              />
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                Potensi untung/{satuanUnit}: <strong className="text-emerald-400 font-bold">+{formatRupiah(previewCalc.gainSatuan)}</strong>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
              Catatan Barang (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Stok kulakan agen, rak depan"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-white font-mono text-[11px] uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Kalkulasi Finansial Ritel:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Potong Modal:</span>
                <span className="font-bold text-rose-400 text-xs">-{formatRupiah(hargaBeli)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Untung Terjual:</span>
                <span className="font-bold text-emerald-400 text-xs">+{formatRupiah(previewCalc.totalGainTerjual)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Uang Masuk:</span>
                <span className="font-bold text-amber-300 text-xs">+{formatRupiah(previewCalc.totalSetelahUntungTerjual)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Net ke Kasir:</span>
                <span className={`font-bold text-xs ${previewCalc.totalSetelahUntungTerjual - hargaBeli >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {previewCalc.totalSetelahUntungTerjual - hargaBeli >= 0 ? '+' : ''}{formatRupiah(previewCalc.totalSetelahUntungTerjual - hargaBeli)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-mono font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
            >
              Simpan Barang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
