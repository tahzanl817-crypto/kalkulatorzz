import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types/inventory';
import { calculateItem, formatRupiah, formatAngka, formatTanggalSederhana } from '../utils/calculator';
import { Plus, Minus, Trash2, Edit2, Search, Calendar, Package, ArrowUpDown, Filter, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  modalAwal: number;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateSoldQty: (id: string, delta: number) => void;
  onSetSoldQty: (id: string, qty: number) => void;
  onResetToSampleData?: () => void;
  onClearAll: () => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  modalAwal,
  onEditItem,
  onDeleteItem,
  onUpdateSoldQty,
  onSetSoldQty,
  onResetToSampleData,
  onClearAll,
  selectedMonth,
  onSelectMonth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalQuickSoldItem, setModalQuickSoldItem] = useState<InventoryItem | null>(null);
  const [quickSoldInputVal, setQuickSoldInputVal] = useState<number>(0);

  // Extract unique months from items
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    items.forEach((item) => {
      const dateStr = item.tanggalInput || new Date(item.createdAt).toISOString().slice(0, 7);
      const ym = dateStr.slice(0, 7); // YYYY-MM
      if (ym) monthSet.add(ym);
    });
    return Array.from(monthSet).sort().reverse();
  }, [items]);

  // Calculate Running Cash Balance ("Sisa Kas") per item chronologically
  const runningCashMap = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
    let cash = modalAwal;
    for (const it of sorted) {
      const hargaBeli = Number(it.hargaBeli) || 0;
      const hargaJual = Number(it.hargaJualSatuan) || 0;
      const terjual = Number(it.jumlahBarangDijualSatuan) || 0;
      cash = cash - hargaBeli + (hargaJual * terjual);
      map.set(it.id, cash);
    }
    return map;
  }, [items, modalAwal]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Month filter
      if (selectedMonth !== 'all') {
        const itemMonth = (item.tanggalInput || new Date(item.createdAt).toISOString().slice(0, 7)).slice(0, 7);
        if (itemMonth !== selectedMonth) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.namaBarang.toLowerCase().includes(query) || (item.catatan || '').toLowerCase().includes(query);
      }
      return true;
    });
  }, [items, selectedMonth, searchQuery]);

  // Totals for the filtered list
  const tableTotals = useMemo(() => {
    let totalBeli = 0;
    let totalTerjualUnit = 0;
    let totalKapasitasUnit = 0;
    let totalGain = 0;
    let totalEquitySisa = 0;
    let totalSetelahUntung = 0;

    for (const item of filteredItems) {
      const c = calculateItem(item);
      totalBeli += item.hargaBeli;
      totalTerjualUnit += item.jumlahBarangDijualSatuan;
      totalKapasitasUnit += item.jumlahBarangWadah;
      totalGain += c.totalGainTerjual;
      totalEquitySisa += c.nilaiSisaStok;
      totalSetelahUntung += c.totalSetelahUntungTerjual;
    }

    return {
      totalBeli,
      totalTerjualUnit,
      totalKapasitasUnit,
      totalGain,
      totalEquitySisa,
      totalSetelahUntung,
    };
  }, [filteredItems]);

  const handleOpenQuickSoldModal = (item: InventoryItem) => {
    setModalQuickSoldItem(item);
    setQuickSoldInputVal(item.jumlahBarangDijualSatuan);
  };

  const handleSaveQuickSoldModal = () => {
    if (modalQuickSoldItem) {
      const val = Math.min(modalQuickSoldItem.jumlahBarangWadah, Math.max(0, Number(quickSoldInputVal) || 0));
      onSetSoldQty(modalQuickSoldItem.id, val);
      setModalQuickSoldItem(null);
    }
  };

  return (
    <div className="bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.4)] overflow-hidden transition-all">
      {/* Table Toolbar & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-800/90 bg-slate-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Buku Kas & Inventaris Toko
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            · {filteredItems.length} barang tercatat
          </span>

          {/* Month Filter Buttons */}
          <div className="flex items-center gap-1.5 sm:ml-2 flex-wrap">
            <button
              onClick={() => onSelectMonth('all')}
              className={`px-3 py-1.5 text-xs rounded-xl font-mono transition-all cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Semua Periode
            </button>
            {availableMonths.map((ym) => {
              const [year, month] = ym.split('-');
              const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
              return (
                <button
                  key={ym}
                  onClick={() => onSelectMonth(ym)}
                  className={`px-3 py-1.5 text-xs rounded-xl font-mono transition-all cursor-pointer ${
                    selectedMonth === ym
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Reset Utility */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang atau catatan..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-2 text-xs font-mono font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
              title="Kosongkan seluruh data tabel"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Main Luxury Dark Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-mono text-[10px] tracking-wider select-none uppercase">
              <th className="py-3.5 px-3 text-center w-12 text-slate-500">#</th>
              <th className="py-3.5 px-4 min-w-[200px]">BARANG & WAKTU</th>
              <th className="py-3.5 px-3 text-center min-w-[100px]">KEMASAN</th>
              <th className="py-3.5 px-3 text-right min-w-[115px]">MODAL BELI</th>
              <th className="py-3.5 px-3 text-center min-w-[170px] bg-slate-950 text-emerald-300 font-bold border-l border-r border-slate-800">
                PENJUALAN (TERJUAL)
              </th>
              <th className="py-3.5 px-3 text-right min-w-[105px]">HARGA JUAL</th>
              <th className="py-3.5 px-3 text-right min-w-[125px] text-emerald-400 font-bold">
                LABA (GAIN)
              </th>
              <th className="py-3.5 px-3 text-right min-w-[135px] text-amber-300 font-bold">
                EKUITAS & TOTAL
              </th>
              <th className="py-3.5 px-4 text-right min-w-[145px] bg-emerald-950/40 text-emerald-300 font-bold border-l border-r border-emerald-500/25">
                SISA KAS KASIR
              </th>
              <th className="py-3.5 px-3 text-center min-w-[70px] text-slate-500">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 px-4 text-center">
                  <div className="max-w-md mx-auto space-y-2.5 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                      <Package className="w-6 h-6 stroke-1" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      {searchQuery || selectedMonth !== 'all' ? 'Tidak ada barang yang cocok dengan filter.' : 'Belum Ada Transaksi Barang'}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Masukkan data barang melalui formulir di atas untuk memulai pencatatan kas kasir, estimasi laba, dan pemantauan perputaran stok.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                const calc = calculateItem(item);
                const tanggalTampil = formatTanggalSederhana(item.tanggalInput || item.createdAt);
                const jamTampil = item.waktuInput ? item.waktuInput.slice(0, 5) : new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const rowSisaKas = runningCashMap.get(item.id) ?? modalAwal;
                const sisaUnit = item.jumlahBarangWadah - item.jumlahBarangDijualSatuan;
                const soldPercent = Math.min(100, Math.round((item.jumlahBarangDijualSatuan / Math.max(1, item.jumlahBarangWadah)) * 100));

                return (
                  <tr key={item.id} className="hover:bg-slate-800/35 transition-colors group">
                    {/* NO */}
                    <td className="py-4 px-3 text-center align-middle font-mono font-medium text-slate-500 text-xs">
                      {index + 1}
                    </td>

                    {/* BARANG & WAKTU (HERO COLUMN) */}
                    <td className="py-4 px-4 align-middle">
                      <div className="font-semibold text-slate-100 text-sm tracking-tight group-hover:text-emerald-300 transition-colors font-sans">
                        {item.namaBarang}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1 flex-wrap">
                        <span>{tanggalTampil}</span>
                        <span>·</span>
                        <span>{jamTampil}</span>
                        {item.catatan && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400 italic max-w-[160px] truncate" title={item.catatan}>
                              {item.catatan}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* KEMASAN & ISI */}
                    <td className="py-4 px-3 text-center align-middle font-mono">
                      <div className="font-semibold text-slate-200 text-xs">
                        {item.jumlahBarangWadah} <span className="text-slate-400 text-[11px]">{item.satuanUnit || 'pcs'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        per 1 {item.satuanWadah || 'Wadah'}
                      </div>
                    </td>

                    {/* MODAL BELI */}
                    <td className="py-4 px-3 text-right align-middle font-mono tabular-nums">
                      <div className="font-semibold text-slate-100 text-xs">{formatRupiah(item.hargaBeli)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        @{formatRupiah(calc.hppSatuan)}/{item.satuanUnit || 'pcs'}
                      </div>
                    </td>

                    {/* PENJUALAN / TERJUAL (STEPPER & PROGRESS BAR) */}
                    <td className="py-4 px-3 text-center align-middle bg-slate-950/40 border-l border-r border-slate-800/80">
                      <div className="flex flex-col items-center gap-1.5 max-w-[150px] mx-auto">
                        <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700/80 p-0.5 rounded-xl shadow-xs">
                          <button
                            onClick={() => onUpdateSoldQty(item.id, -1)}
                            disabled={item.jumlahBarangDijualSatuan <= 0}
                            title="Kurangi 1 unit terjual"
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            max={item.jumlahBarangWadah}
                            value={item.jumlahBarangDijualSatuan}
                            onChange={(e) => {
                              const val = Math.min(item.jumlahBarangWadah, Math.max(0, Number(e.target.value) || 0));
                              onSetSoldQty(item.id, val);
                            }}
                            className="w-12 text-center font-mono font-bold text-xs bg-slate-950 text-white border border-slate-700/70 rounded-md py-0.5 focus:outline-none focus:border-emerald-500"
                            title="Ketik angka terjual"
                          />

                          <button
                            onClick={() => onUpdateSoldQty(item.id, 1)}
                            disabled={item.jumlahBarangDijualSatuan >= item.jumlahBarangWadah}
                            title="Tambah 1 unit terjual"
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleOpenQuickSoldModal(item)}
                            className="ml-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition-colors"
                            title="Buka dialog input terjual"
                          >
                            Set
                          </button>
                        </div>

                        {/* Progress Bar of Stock Depletion */}
                        <div className="w-full space-y-1">
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                              style={{ width: `${soldPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>{soldPercent}% laku</span>
                            <span>Sisa <strong className="text-slate-200">{sisaUnit}</strong></span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* HARGA JUAL */}
                    <td className="py-4 px-3 text-right align-middle font-mono tabular-nums">
                      <div className="font-semibold text-slate-100 text-xs">
                        {formatRupiah(item.hargaJualSatuan)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        per {item.satuanUnit || 'pcs'}
                      </div>
                    </td>

                    {/* GAIN (LABA BERSIH) */}
                    <td className="py-4 px-3 text-right align-middle font-mono tabular-nums">
                      {calc.totalGainTerjual > 0 ? (
                        <div>
                          <div className="text-emerald-400 font-bold text-xs drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                            +{formatRupiah(calc.totalGainTerjual)}
                          </div>
                          <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
                            +{formatRupiah(calc.gainSatuan)}/unit ({formatAngka(calc.marginPersen, 0)}%)
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-slate-500 text-xs">Rp 0</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Belum ada laku</div>
                        </div>
                      )}
                    </td>

                    {/* EKUITAS & TOTAL SETELAH UNTUNG */}
                    <td className="py-4 px-3 text-right align-middle font-mono tabular-nums">
                      <div className="font-bold text-amber-300 text-xs">
                        {formatRupiah(calc.totalSetelahUntungTerjual)}
                      </div>
                      <div className="text-[10px] text-cyan-300/80 mt-0.5">
                        Sisa Stok: {formatRupiah(calc.nilaiSisaStok)}
                      </div>
                    </td>

                    {/* SISA KAS KASIR (STATUS GLOW PILL) */}
                    <td className="py-4 px-4 text-right align-middle font-mono tabular-nums bg-emerald-950/20 border-l border-r border-emerald-500/15">
                      <div className="inline-block">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold shadow-sm ${
                          rowSisaKas < 0 
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40 shadow-rose-950/30' 
                            : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-emerald-950/30'
                        }`}>
                          {formatRupiah(rowSisaKas)}
                        </span>
                      </div>
                    </td>

                    {/* AKSI */}
                    <td className="py-4 px-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditItem(item)}
                          title="Edit barang"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          title="Hapus barang"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer Row (Clear & Harmonious) */}
          {filteredItems.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950 text-slate-200 font-mono text-xs">
                <td colSpan={3} className="py-4 px-4 text-left font-bold uppercase tracking-wider text-slate-300">
                  Total Ringkasan ({filteredItems.length} Barang):
                </td>
                <td className="py-4 px-3 text-right font-bold text-slate-100">
                  {formatRupiah(tableTotals.totalBeli)}
                </td>
                <td className="py-4 px-3 text-center font-bold text-slate-200">
                  {tableTotals.totalTerjualUnit} / {tableTotals.totalKapasitasUnit} <span className="text-slate-400 text-[10px]">unit terjual</span>
                </td>
                <td className="py-4 px-3 text-right text-slate-500 font-normal">
                  -
                </td>
                <td className="py-4 px-3 text-right font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                  +{formatRupiah(tableTotals.totalGain)}
                </td>
                <td className="py-4 px-3 text-right font-extrabold text-amber-300">
                  {formatRupiah(tableTotals.totalSetelahUntung)}
                </td>
                <td className="py-4 px-4 text-right font-extrabold bg-emerald-950/70 text-emerald-300 border-l border-r border-emerald-500/30">
                  {formatRupiah(runningCashMap.get(filteredItems[filteredItems.length - 1]?.id) ?? modalAwal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Quick Sold Modal Dialog */}
      {modalQuickSoldItem && (() => {
        const tempItem: InventoryItem = {
          ...modalQuickSoldItem,
          jumlahBarangDijualSatuan: Math.min(modalQuickSoldItem.jumlahBarangWadah, Math.max(0, Number(quickSoldInputVal) || 0)),
        };
        const tempCalc = calculateItem(tempItem);

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveQuickSoldModal();
              } else if (e.key === 'Escape') {
                setModalQuickSoldItem(null);
              }
            }}
          >
            <div className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Input Unit Terjual: {modalQuickSoldItem.namaBarang}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Kapasitas wadah: <strong className="text-emerald-400">{modalQuickSoldItem.jumlahBarangWadah} unit</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalQuickSoldItem(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                    Jumlah Unit yang Sudah Terjual:
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickSoldInputVal(Math.max(0, (Number(quickSoldInputVal) || 0) - 1))}
                      disabled={Number(quickSoldInputVal) <= 0}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-slate-700 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max={modalQuickSoldItem.jumlahBarangWadah}
                      value={quickSoldInputVal}
                      onChange={(e) => setQuickSoldInputVal(Math.min(modalQuickSoldItem.jumlahBarangWadah, Math.max(0, Number(e.target.value) || 0)))}
                      className="flex-1 text-center py-2.5 text-2xl font-mono font-extrabold text-white bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />

                    <button
                      type="button"
                      onClick={() => setQuickSoldInputVal(Math.min(modalQuickSoldItem.jumlahBarangWadah, (Number(quickSoldInputVal) || 0) + 1))}
                      disabled={Number(quickSoldInputVal) >= modalQuickSoldItem.jumlahBarangWadah}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-slate-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <input
                      type="range"
                      min="0"
                      max={modalQuickSoldItem.jumlahBarangWadah}
                      value={quickSoldInputVal}
                      onChange={(e) => setQuickSoldInputVal(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>0 (Belum laku)</span>
                      <span>Habis ({modalQuickSoldItem.jumlahBarangWadah} unit)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Sisa Stok Belum Terjual:</span>
                    <span className="font-bold text-slate-200">
                      {modalQuickSoldItem.jumlahBarangWadah - (Number(quickSoldInputVal) || 0)} unit
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Untung Bersih (Gain):</span>
                    <span className="font-bold text-emerald-400">
                      +{formatRupiah(tempCalc.totalGainTerjual)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Setelah Untung:</span>
                    <span className="font-bold text-amber-300">
                      {formatRupiah(tempCalc.totalSetelahUntungTerjual)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalQuickSoldItem(null)}
                    className="px-4 py-2 text-xs font-mono font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuickSoldModal}
                    className="px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Terapkan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
