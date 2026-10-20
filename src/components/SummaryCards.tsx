import React, { useState } from 'react';
import { GlobalSummary } from '../types/inventory';
import { formatRupiah, formatAngka } from '../utils/calculator';
import { Wallet, Edit3, Check, TrendingUp, ArrowDownRight, ArrowUpRight, Percent, ShieldCheck, Clock, Coins } from 'lucide-react';

interface SummaryCardsProps {
  summary: GlobalSummary;
  modalAwal: number;
  onUpdateModalAwal: (newModal: number) => void;
  onOpenGuide: () => void;
  currentRealTime: string;
  bulanFilter: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  modalAwal,
  onUpdateModalAwal,
  currentRealTime,
  bulanFilter,
}) => {
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalInput, setModalInput] = useState(String(modalAwal));

  const handleSaveModal = () => {
    const val = Math.max(0, Number(modalInput) || 0);
    onUpdateModalAwal(val);
    setIsEditingModal(false);
  };

  const isTumbuh = summary.persenTumbuhRugi > 0;
  const isRugi = summary.saldoKasSaatIni < 0;

  return (
    <section className="mb-6 space-y-4">
      {/* Top Banner: Modal Awal & Real-Time Flow Breakdown */}
      <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 text-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Modal Awal Setting */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-mono text-base shrink-0 shadow-inner">
              Rp
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Modal Awal Usaha (Kas Siap Pakai)
                </span>
                {!isEditingModal && (
                  <button
                    onClick={() => {
                      setModalInput(String(modalAwal));
                      setIsEditingModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Ubah Modal Awal Usaha"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditingModal ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveModal();
                      if (e.key === 'Escape') setIsEditingModal(false);
                    }}
                    className="px-3 py-1 text-base font-bold font-mono text-white bg-slate-950 border border-emerald-500 rounded-xl focus:outline-none w-44"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveModal}
                    className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight mt-0.5">
                  {formatRupiah(modalAwal)}
                </div>
              )}
            </div>
          </div>

          {/* Quick Flow Breakdown & Real-Time Clock */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-3 lg:pt-0 lg:pl-6">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span>Pengeluaran Beli (Modal Keluar):</span>
              </div>
              <div className="text-base font-bold text-rose-400 tabular-nums">
                -{formatRupiah(summary.totalPengeluaranBeli)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pemasukan Jual (Uang Masuk):</span>
              </div>
              <div className="text-base font-bold text-emerald-400 tabular-nums">
                +{formatRupiah(summary.totalPemasukanJual)}
              </div>
            </div>

            <div className="hidden sm:block text-slate-400 text-[11px] border-l border-slate-800 pl-4">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Waktu Sistem:</span>
              </div>
              <span className="text-white font-mono font-semibold text-xs">{currentRealTime}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Cashflow Mathematical Balance Line */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] flex-wrap">
            <span className="text-slate-400">Rumus Arus Kasir:</span>
            <span className="text-slate-200">Modal Awal ({formatRupiah(modalAwal)})</span>
            <span className="text-rose-400 font-bold">- Belanja ({formatRupiah(summary.totalPengeluaranBeli)})</span>
            <span className="text-emerald-400 font-bold">+ Penjualan ({formatRupiah(summary.totalPemasukanJual)})</span>
            <span className="text-slate-500">=</span>
            <span className="text-emerald-300 font-bold font-mono bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              Sisa Kas {formatRupiah(summary.saldoKasSaatIni)}
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px] shrink-0">
            Periode: <span className="text-slate-200 font-semibold">{bulanFilter === 'all' ? 'Semua Periode' : `Bulan ${bulanFilter}`}</span>
          </div>
        </div>
      </div>

      {/* 4 Synchronized Luxury Dark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SISA KAS SAAT INI (KASIR) */}
        <div className="bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-5 border border-emerald-500/30 border-t-2 border-t-emerald-400 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2.5">
              <div className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-emerald-300">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Sisa Kas Saat Ini</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Uang di Kasir
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight drop-shadow-md">
              {formatRupiah(summary.saldoKasSaatIni)}
            </div>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
              Sisa modal ({formatRupiah(summary.sisaModalSebelumJual)}) + hasil penjualan ({formatRupiah(summary.totalPemasukanJual)}).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kas siap dipakai kulakan stok barang baru</span>
          </div>
        </div>

        {/* Card 2: TOTAL UNTUNG (GAIN) BERSIH */}
        <div className="bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-5 border border-emerald-500/25 border-t-2 border-t-teal-400 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
              <div className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>Total Untung (Gain)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Laba Bersih
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              +{formatRupiah(summary.totalGainTerjual)}
            </div>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
              Keuntungan bersih riil yang didapat dari barang yang sudah terjual.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <span className="text-slate-400">Rata-rata Margin:</span>
            <span className="font-bold text-emerald-400">{formatAngka(summary.rataRataMargin, 1)}%</span>
          </div>
        </div>

        {/* Card 3: PERTUMBUHAN MODAL (ROI) */}
        <div className="bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-5 border border-cyan-500/25 border-t-2 border-t-cyan-400 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
              <div className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-slate-300">
                <Percent className="w-4 h-4 text-cyan-400" />
                <span>Pertumbuhan Modal</span>
              </div>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                isTumbuh ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/30' : isRugi ? 'text-rose-300 bg-rose-950/70 border border-rose-500/30' : 'text-slate-300 bg-slate-800'
              }`}>
                {isTumbuh ? 'Tumbuh' : isRugi ? 'Defisit' : 'Impas (BEP)'}
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight drop-shadow-sm">
              <span className={isTumbuh ? 'text-emerald-400' : isRugi ? 'text-rose-400' : 'text-slate-200'}>
                {isTumbuh ? `+${formatAngka(summary.persenTumbuhRugi, 1)}%` : isRugi ? `-${formatAngka(Math.abs(summary.persenTumbuhRugi), 1)}%` : '0.0%'}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
              {isTumbuh
                ? `Laba riil bertambah +${formatRupiah(summary.totalGainTerjual)} dari modal awal.`
                : isRugi
                ? 'Arus kas di bawah modal awal. Jual sisa stok untuk mengembalikan modal.'
                : 'Belum ada barang yang terjual.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <span className="text-slate-400">Nilai Stok di Rak:</span>
            <span className="font-bold text-cyan-300">{formatRupiah(summary.totalNilaiSisaStok)}</span>
          </div>
        </div>

        {/* Card 4: TOTAL EKUITAS SETELAH UNTUNG */}
        <div className="bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-5 border border-amber-500/25 border-t-2 border-t-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
              <div className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Total Setelah Untung</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-md">
                Ekuitas Usaha
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tabular-nums tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.25)]">
              {formatRupiah(summary.totalSetelahUntung)}
            </div>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
              Nilai keseluruhan modal awal usaha ditambah dengan laba bersih yang terealisasi.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Modal Awal:</span>
              <span className="font-semibold text-slate-300">{formatRupiah(modalAwal)}</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 block text-[10px]">+ Laba Bersih:</span>
              <span className="font-bold text-emerald-400">+{formatRupiah(summary.totalGainTerjual)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
