import React, { useState } from 'react';
import { InventoryItem } from '../types/inventory';
import { calculateItem, formatRupiah, formatAngka } from '../utils/calculator';
import { Plus, Calendar, Package, Tag, ArrowRight, Sparkles } from 'lucide-react';

interface QuickAddBarProps {
  onAdd: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  globalSavePercentMonthly?: number;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAdd, globalSavePercentMonthly = 0 }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [tanggalInput, setTanggalInput] = useState(todayStr);
  const [namaBarang, setNamaBarang] = useState('');
  const [satuanWadah, setSatuanWadah] = useState('Dus');
  const [jumlahWadah, setJumlahWadah] = useState<number | ''>('');
  const [satuanUnit, setSatuanUnit] = useState('pcs');
  const [hargaBeli, setHargaBeli] = useState<number | ''>('');
  const [hargaJual, setHargaJual] = useState<number | ''>('');

  const numJumlahWadah = Number(jumlahWadah) || 0;
  const numHargaBeli = Number(hargaBeli) || 0;
  const numHargaJual = Number(hargaJual) || 0;

  const hasBasicData = numJumlahWadah > 0 && numHargaBeli > 0 && numHargaJual > 0;

  const previewCalc = hasBasicData
    ? calculateItem({
        id: 'tmp',
        namaBarang: namaBarang || 'Barang',
        satuanWadah: satuanWadah || 'Wadah',
        jumlahBarangWadah: numJumlahWadah,
        satuanUnit: satuanUnit || 'pcs',
        hargaBeli: numHargaBeli,
        jumlahBarangDijualSatuan: 0,
        hargaJualSatuan: numHargaJual,
        perputaranBulan: 1,
        persentaseLabaDisimpanBulanan: globalSavePercentMonthly,
        tanggalInput: tanggalInput || todayStr,
        createdAt: 0,
        updatedAt: 0,
      })
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;
    if (numJumlahWadah <= 0) return;
    if (numHargaBeli <= 0) return;
    if (numHargaJual <= 0) return;

    onAdd({
      namaBarang: namaBarang.trim(),
      satuanWadah: satuanWadah || 'Wadah',
      jumlahBarangWadah: numJumlahWadah,
      satuanUnit: satuanUnit || 'pcs',
      hargaBeli: numHargaBeli,
      jumlahBarangDijualSatuan: 0, // Default 0 (belum ada yang laku)
      hargaJualSatuan: numHargaJual,
      perputaranBulan: 1,
      persentaseLabaDisimpanBulanan: globalSavePercentMonthly,
      tanggalInput: tanggalInput || todayStr,
    });

    setNamaBarang('');
    setJumlahWadah('');
    setHargaBeli('');
    setHargaJual('');
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Input Transaksi Barang Baru
          </h2>
        </div>
        <p className="text-[11px] font-mono text-slate-400">
          Uang kas kasir otomatis disesuaikan secara real-time saat barang dibeli dan terjual.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-3.5">
          {/* Tanggal Input */}
          <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
              Tanggal Input
            </label>
            <input
              type="date"
              required
              value={tanggalInput}
              onChange={(e) => setTanggalInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/70 text-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono transition-colors"
            />
          </div>

          {/* Nama Barang */}
          <div className="sm:col-span-1 md:col-span-4 lg:col-span-4">
            <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
              Nama Barang
            </label>
            <input
              type="text"
              required
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              placeholder="Misal: Sprite Botol 390ml / Kopi 1 Dus"
              className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-sans transition-colors"
            />
          </div>

          {/* Isi Wadah */}
          <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
              Isi (Unit/Pcs)
            </label>
            <input
              type="number"
              min="1"
              required
              value={jumlahWadah}
              onChange={(e) => setJumlahWadah(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 24"
              className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 rounded-xl font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
          </div>

          {/* Harga Beli Wadah */}
          <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
              Harga Beli Wadah
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">Rp</span>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={hargaBeli}
                onChange={(e) => setHargaBeli(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="108.000"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 rounded-xl font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Harga Jual Satuan */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
              Harga Jual Satuan
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">Rp</span>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={hargaJual}
                onChange={(e) => setHargaJual(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="6.000"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 rounded-xl font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Preview & Submit Button */}
        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300 flex-wrap">
            {previewCalc ? (
              <div className="flex items-center gap-3 text-[11px] bg-slate-950/90 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl flex-wrap shadow-inner">
                <span>
                  HPP Pokok: <strong className="text-white">{formatRupiah(previewCalc.hppSatuan)}</strong>/unit
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  Untung Satuan: <strong className="text-emerald-400 font-bold">+{formatRupiah(previewCalc.gainSatuan)}</strong> ({formatAngka(previewCalc.marginPersen, 1)}%)
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  Potensi Laba Penuh: <strong className="text-amber-300 font-bold">+{formatRupiah(previewCalc.potensiTotalGain)}</strong>
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-mono text-[11px]">
                Ketik harga beli dan harga jual untuk menghitung HPP pokok dan estimasi keuntungan otomatis.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-mono font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Simpan ke Tabel</span>
          </button>
        </div>
      </form>
    </div>
  );
};
