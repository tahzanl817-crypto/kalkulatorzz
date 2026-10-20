import React from 'react';
import { InventoryItem, GlobalSummary } from '../types/inventory';
import { calculateItem, formatRupiah } from '../utils/calculator';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintReportViewProps {
  items: InventoryItem[];
  summary: GlobalSummary;
  modalAwal?: number;
  onBack?: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ items, summary, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <div className="bg-white min-h-screen p-6 sm:p-10 max-w-5xl mx-auto text-neutral-900">
      <div className="no-print mb-8 pb-4 border-b border-neutral-200 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Aplikasi</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen / Simpan PDF</span>
        </button>
      </div>

      <div className="border-b-2 border-neutral-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <div className="text-[11px] font-mono font-bold tracking-widest text-emerald-800 uppercase mb-0.5">
            NIAGANOVA RETAIL MATRIX
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            LAPORAN PENJUALAN & EKUITAS ARUS KAS
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Format: Nama Barang · Qty 1 Wadah · Harga Beli · Terjual · Harga Jual · Gain (Untung Terjual) · Equity · Kas Masuk · Simpanan 1 Bln
          </p>
        </div>
        <div className="text-left sm:text-right text-xs text-neutral-600 font-mono">
          <div>Tanggal Laporan:</div>
          <div className="font-semibold text-neutral-900">{todayStr}</div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 border border-neutral-300 rounded bg-neutral-50">
          <span className="text-neutral-500 block">Modal Awal Usaha:</span>
          <span className="font-bold text-base font-mono tabular-nums">{formatRupiah(summary.modalAwalUsaha)}</span>
        </div>
        <div className="p-3 border border-neutral-300 rounded bg-neutral-50">
          <span className="text-neutral-500 block">Untung Terealisasi (Gain):</span>
          <span className="font-bold text-base font-mono tabular-nums text-emerald-800">+{formatRupiah(summary.totalGainTerjual)}</span>
        </div>
        <div className="p-3 border border-neutral-900 rounded bg-emerald-50 text-emerald-950">
          <span className="text-emerald-800 block font-semibold text-[10px] uppercase">SISA KAS TOKO:</span>
          <span className="font-extrabold text-base font-mono tabular-nums text-emerald-900">{formatRupiah(summary.saldoKasSaatIni)}</span>
        </div>
        <div className="p-3 border border-neutral-300 rounded bg-neutral-50">
          <span className="text-neutral-500 block">Total Setelah Untung:</span>
          <span className="font-extrabold text-base font-mono tabular-nums text-neutral-900">{formatRupiah(summary.totalSetelahUntung)}</span>
        </div>
      </div>

      {/* Itemized Table */}
      <table className="w-full text-left border-collapse text-xs mb-8">
        <thead>
          <tr className="border-y border-neutral-900 bg-neutral-100 text-neutral-900 font-bold">
            <th className="py-2 px-2">NAMA BARANG</th>
            <th className="py-2 px-2 text-center">ISI WADAH</th>
            <th className="py-2 px-2 text-right">HARGA BELI</th>
            <th className="py-2 px-2 text-center">TERJUAL</th>
            <th className="py-2 px-2 text-right">HARGA JUAL</th>
            <th className="py-2 px-2 text-right">GAIN (UNTUNG)</th>
            <th className="py-2 px-2 text-right">EQUITY (MODAL)</th>
            <th className="py-2 px-2 text-right bg-neutral-200">TOTAL SETELAH UNTUNG</th>
            <th className="py-2 px-2 text-right bg-emerald-100">SISA KAS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-300">
          {(() => {
            let runningCash = summary.modalAwalUsaha;
            const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
            const cashMap = new Map<string, number>();
            for (const it of sorted) {
              runningCash = runningCash - (Number(it.hargaBeli) || 0) + ((Number(it.hargaJualSatuan) || 0) * (Number(it.jumlahBarangDijualSatuan) || 0));
              cashMap.set(it.id, runningCash);
            }

            return items.map((item, idx) => {
              const calc = calculateItem(item);
              const rowCash = cashMap.get(item.id) ?? summary.modalAwalUsaha;

              return (
                <tr key={item.id} className="text-neutral-800">
                  <td className="py-2 px-2 font-medium">
                    <div>{idx + 1}. {item.namaBarang}</div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono tabular-nums">
                    {item.jumlahBarangWadah}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {formatRupiah(item.hargaBeli)}
                  </td>
                  <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold">
                    {item.jumlahBarangDijualSatuan}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {formatRupiah(item.hargaJualSatuan)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-emerald-800">
                    {calc.totalGainTerjual > 0 ? `+${formatRupiah(calc.totalGainTerjual)}` : 'Rp 0'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {formatRupiah(item.jumlahBarangDijualSatuan === 0 ? item.hargaBeli : calc.nilaiSisaStok)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums font-bold bg-neutral-50">
                    {formatRupiah(calc.totalSetelahUntungTerjual)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums font-bold bg-emerald-50 text-emerald-900">
                    {formatRupiah(rowCash)}
                  </td>
                </tr>
              );
            });
          })()}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-900 font-bold bg-neutral-100">
            <td colSpan={5} className="py-2.5 px-2 text-right">TOTAL KESELURUHAN:</td>
            <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-900">
              +{formatRupiah(summary.totalGainTerjual)}
            </td>
            <td className="py-2.5 px-2 text-right font-mono tabular-nums">
              {formatRupiah(summary.totalNilaiSisaStok)}
            </td>
            <td className="py-2.5 px-2 text-right font-mono tabular-nums text-neutral-950">
              {formatRupiah(summary.totalPemasukanJual)}
            </td>
            <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-950">
              {formatRupiah(summary.saldoKasSaatIni)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-8 pt-4 border-t border-neutral-300 grid grid-cols-2 text-xs">
        <div className="space-y-1 text-neutral-500">
          <p className="font-semibold text-neutral-700">Catatan Penutupan Kas Toko:</p>
          <p>• Barang belum laku mengurangi ekuitas kas dan tidak dicatat untung sebelum terjual.</p>
          <p>• Keuntungan dan simpanan dihitung nyata dari barang yang telah laku.</p>
        </div>
        <div className="text-right space-y-10">
          <p className="text-neutral-600">Kasir / Pemilik Usaha,</p>
          <p className="font-semibold text-neutral-900 underline underline-offset-4">( ........................................ )</p>
        </div>
      </div>
    </div>
  );
};
