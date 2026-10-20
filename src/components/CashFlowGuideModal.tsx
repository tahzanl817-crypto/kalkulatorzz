import React from 'react';
import { X, Calendar, PiggyBank, ShieldCheck, Wallet } from 'lucide-react';

interface CashFlowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashFlowGuideModal: React.FC<CashFlowGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Panduan Manajemen Arus Kas & Ekuitas Toko
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Konsep 1: Total Setelah Untung */}
          <div className="bg-slate-950 border border-slate-800 text-white p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400 font-mono">
              <Wallet className="w-4 h-4" />
              <span>1. APA ITU &apos;TOTAL SETELAH UNTUNG&apos;?</span>
            </div>
            <p className="text-slate-300">
              <strong>Total Setelah Untung</strong> adalah total uang kas hasil penjualan setelah ditambahkan laba bersih riil:
            </p>
            <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-lg font-mono text-emerald-300 text-xs shadow-inner">
              Total Setelah Untung = Modal Pokok (HPP) + Total Keuntungan (Gain)
            </div>
            <p className="text-slate-400 text-[11px] font-mono">
              Contoh: Jika modal beli Rp 100.000 dan dapat untung Rp 20.000, maka uang masuk di kasir adalah <strong className="text-white">Rp 120.000</strong>.
            </p>
          </div>

          {/* Konsep 2: Mengapa Simpanan Baru Dihitung Setelah 1 Bulan? */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm font-mono">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>2. MENGAPA SIMPANAN BARU DIHITUNG SETELAH UNTUNG 1 BULAN?</span>
            </div>
            <p className="text-slate-300">
              Banyak toko ritel mengalami defisit kas karena mengambil laba harian untuk keperluan pribadi secara prematur. Akibatnya ketika distributor datang menagih atau ingin belanja stok baru, uang kasir sudah tidak cukup.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-400 font-mono text-[11px]">
              <li>
                <strong className="text-slate-200">Hari ke-1 s/d Hari ke-30:</strong> Seluruh uang hasil penjualan diputar 100% untuk belanja wadah dan stok dagangan agar display toko selalu penuh.
              </li>
              <li>
                <strong className="text-slate-200">Tutup Buku Akhir Bulan:</strong> Seluruh laba terakumulasi menjadi <strong className="text-emerald-400">Untung 1 Bulan</strong>.
              </li>
              <li>
                <strong className="text-slate-200">Penyisihan Simpanan:</strong> Di akhir bulan diambil porsi yang disepakati (misal 50% atau 70%) untuk dimasukkan ke tabungan cadangan atau dana darurat toko.
              </li>
            </ul>
          </div>

          {/* Contoh Nyata */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400 font-mono text-xs uppercase tracking-wide">
              <PiggyBank className="w-4 h-4" />
              <span>Contoh Nyata Penjualan 1 Bulan:</span>
            </div>
            <div className="space-y-1 text-slate-200 font-mono text-[11px]">
              <div>• Modal Pokok Terjual: Rp 2.000.000</div>
              <div>• Total Untung Bersih (Gain): <span className="text-emerald-400 font-bold">+Rp 600.000</span></div>
              <div className="font-bold pt-1.5 border-t border-slate-800 text-amber-300">• TOTAL SETELAH UNTUNG: Rp 2.600.000</div>
            </div>
            <div className="pt-2 text-[11px] text-slate-400 font-mono border-t border-slate-800/80">
              Jika aturan simpanan bulanan adalah <strong className="text-white">50%</strong>:
              <br />
              → <strong className="text-emerald-400">Simpanan Setelah Untung:</strong> Rp 300.000 (disimpan ke tabungan).
              <br />
              → <strong className="text-cyan-300">Modal Diputar Bulan Depan:</strong> Rp 2.300.000 (modal pokok Rp 2 jt + sisa laba Rp 300 rb untuk tambah barang).
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
          >
            Saya Paham
          </button>
        </div>
      </div>
    </div>
  );
};
