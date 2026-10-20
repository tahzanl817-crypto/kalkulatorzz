import React, { useState, useRef } from 'react';
import { InventoryItem, GlobalSummary } from '../types/inventory';
import { exportBackupJSON, parseBackupJSON, fetchServerBackup } from '../utils/storageBackup';
import { useAuth } from '../context/AuthContext';
import { batchUploadToCloud, fetchUserItemsOnce, getUserProfile } from '../services/firestoreSync';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Laptop, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Server,
  Cloud,
  LogIn,
  RefreshCw
} from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  modalAwal: number;
  summary: GlobalSummary;
  onRestoreData: (items: InventoryItem[], modalAwal: number) => void;
  onOpenAuthModal?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  items,
  modalAwal,
  summary,
  onRestoreData,
  onOpenAuthModal,
}) => {
  const { user } = useAuth();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download CSV
  const handleDownloadCSV = () => {
    const headers = [
      'No',
      'Tanggal Input',
      'Nama Barang',
      'Jumlah 1 Wadah',
      'Harga Beli 1 Wadah',
      'Jumlah Terjual Satuan',
      'Harga Jual Satuan',
      'Gain (Untung Terealisasi)',
      'Modal Pokok Kembali',
      'Nilai Sisa Stok (Equity)',
      'TOTAL SETELAH UNTUNG (Uang Masuk Kas)',
      'SISA KAS'
    ];

    let runningCash = modalAwal;
    const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
    const rowCashMap = new Map<string, number>();
    for (const it of sorted) {
      runningCash = runningCash - (Number(it.hargaBeli) || 0) + ((Number(it.hargaJualSatuan) || 0) * (Number(it.jumlahBarangDijualSatuan) || 0));
      rowCashMap.set(it.id, runningCash);
    }

    const rows = items.map((item, idx) => {
      const hpp = item.hargaBeli / (item.jumlahBarangWadah || 1);
      const gainSatuan = item.hargaJualSatuan - hpp;
      const gainTerjual = Math.max(0, gainSatuan * item.jumlahBarangDijualSatuan);
      const modalBalik = Math.min(item.hargaBeli, hpp * item.jumlahBarangDijualSatuan);
      const sisaStokQty = Math.max(0, item.jumlahBarangWadah - item.jumlahBarangDijualSatuan);
      const nilaiSisaStok = sisaStokQty * hpp;
      const totalMasukKas = modalBalik + gainTerjual;
      const sisaKasRow = rowCashMap.get(item.id) ?? runningCash;

      return [
        idx + 1,
        `"${item.tanggalInput || ''} ${item.waktuInput || ''}"`,
        `"${item.namaBarang}"`,
        item.jumlahBarangWadah,
        item.hargaBeli,
        item.jumlahBarangDijualSatuan,
        item.hargaJualSatuan,
        Math.round(gainTerjual),
        Math.round(modalBalik),
        Math.round(nilaiSisaStok),
        Math.round(totalMasukKas),
        Math.round(sisaKasRow)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kalkulator_dagang_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage({ type: 'success', text: 'Data berhasil diekspor ke format CSV (Excel)!' });
  };

  // 2. Download JSON Backup
  const handleDownloadJSON = () => {
    try {
      exportBackupJSON(items, modalAwal);
      setStatusMessage({ 
        type: 'success', 
        text: 'File cadangan (.JSON) berhasil diunduh! Simpan file ini di tempat aman (Google Drive / WA).' 
      });
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal mengunduh file cadangan.' });
    }
  };

  // 3. Upload & Restore JSON Backup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseBackupJSON(content);
      if (parsed) {
        onRestoreData(parsed.items, parsed.modalAwal);
        setStatusMessage({
          type: 'success',
          text: `Berhasil memulihkan ${parsed.items.length} barang dan modal Rp ${parsed.modalAwal.toLocaleString('id-ID')} dari file cadangan!`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Format file tidak valid atau rusak. Pastikan file berakhiran .json hasil ekspor dari aplikasi ini.'
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // 4. Restore from Local Server
  const handleRestoreFromServer = async () => {
    setIsServerLoading(true);
    setStatusMessage(null);
    try {
      const serverData = await fetchServerBackup();
      if (serverData && serverData.items && serverData.items.length > 0) {
        onRestoreData(serverData.items, serverData.modalAwal || modalAwal);
        setStatusMessage({
          type: 'success',
          text: `Berhasil memulihkan ${serverData.items.length} barang dari salinan server lokal!`
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Belum ada data cadangan di server lokal.'
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal menghubungi server lokal.'
      });
    } finally {
      setIsServerLoading(false);
    }
  };

  // 5. Cloud Sync Now
  const handleCloudSyncNow = async () => {
    if (!user) return;
    setIsCloudSyncing(true);
    setStatusMessage(null);
    try {
      await batchUploadToCloud(user.uid, user.email || '', modalAwal, items);
      setStatusMessage({
        type: 'success',
        text: `Semua ${items.length} barang berhasil dicadangkan ke Cloud Server Firestore!`
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal sinkronisasi ke cloud: ' + (err instanceof Error ? err.message : String(err))
      });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // 6. Fetch / Restore from Cloud
  const handleCloudFetchNow = async () => {
    if (!user) return;
    setIsCloudSyncing(true);
    setStatusMessage(null);
    try {
      const [cloudItems, profile] = await Promise.all([
        fetchUserItemsOnce(user.uid),
        getUserProfile(user.uid)
      ]);
      if (cloudItems && cloudItems.length > 0) {
        onRestoreData(cloudItems, profile?.modalAwal ?? modalAwal);
        setStatusMessage({
          type: 'success',
          text: `Berhasil memuat ${cloudItems.length} barang dari akun cloud Anda!`
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Belum ada data tersimpan di akun cloud Anda.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal mengambil data dari cloud: ' + (err instanceof Error ? err.message : String(err))
      });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // 7. Standalone Offline HTML
  const handleDownloadOfflineHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Toko - ${new Date().toLocaleDateString('id-ID')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; }
    .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
    h1 { font-size: 20px; margin-top: 0; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .num { text-align: right; }
    .text-emerald { color: #059669; font-weight: 600; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .stat-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .stat-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Laporan Toko & Arus Kas Mandiri</h1>
    <p style="font-size: 12px; color: #64748b;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Modal Awal</div>
        <div class="stat-val">Rp ${modalAwal.toLocaleString('id-ID')}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Sisa Kas Berjalan</div>
        <div class="stat-val text-emerald">Rp ${summary.saldoKasSaatIni.toLocaleString('id-ID')}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total Untung (Gain)</div>
        <div class="stat-val text-emerald">Rp ${summary.totalGainTerjual.toLocaleString('id-ID')}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total Nilai Usaha</div>
        <div class="stat-val">Rp ${summary.totalSetelahUntung.toLocaleString('id-ID')}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Nama Barang</th>
          <th>Isi</th>
          <th class="num">Harga Beli</th>
          <th class="num">Terjual</th>
          <th class="num">Harga Jual</th>
          <th class="num">Untung</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
          const hpp = it.hargaBeli / (it.jumlahBarangWadah || 1);
          const untung = Math.max(0, (it.hargaJualSatuan - hpp) * it.jumlahBarangDijualSatuan);
          return `<tr>
            <td>${idx + 1}</td>
            <td><strong>${it.namaBarang}</strong></td>
            <td>${it.jumlahBarangWadah} unit</td>
            <td class="num">Rp ${it.hargaBeli.toLocaleString('id-ID')}</td>
            <td class="num"><strong>${it.jumlahBarangDijualSatuan}</strong> / ${it.jumlahBarangWadah}</td>
            <td class="num">Rp ${it.hargaJualSatuan.toLocaleString('id-ID')}</td>
            <td class="num text-emerald">+Rp ${Math.round(untung).toLocaleString('id-ID')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kalkulator_dagang_offline_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage({ type: 'success', text: 'Aplikasi web offline (.html) berhasil diunduh!' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 text-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Pusat Cadangan, Cloud & Ekspor Data</h3>
              <p className="text-[11px] text-slate-400 font-mono">Amankan pembukuan toko di server online atau file fisik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 font-mono ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                : statusMessage.type === 'error'
                ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                : 'bg-blue-950/70 border-blue-500/40 text-blue-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              ) : (
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* CLOUD SECTION: The user's requested solution */}
          <div className={`p-4 rounded-xl border transition-all ${
            user 
              ? 'bg-slate-950/80 border-emerald-500/30 text-slate-200' 
              : 'bg-slate-950/80 border-emerald-500/40 text-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2 font-mono">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs text-white">
                  {user ? 'Penyimpanan Cloud Online (Aktif)' : 'Simpan Online ke Server (Rekomendasi)'}
                </span>
              </div>
              {user ? (
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Tersinkron
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  Belum Login
                </span>
              )}
            </div>

            {user ? (
              <div>
                <p className="text-xs text-slate-400 font-mono">
                  Terhubung ke akun: <strong className="text-emerald-400">{user.email}</strong>. Seluruh penambahan barang dan perubahan kas otomatis tersimpan di database Cloud Server.
                </p>
                <div className="mt-3 flex items-center gap-2 font-mono">
                  <button
                    onClick={handleCloudSyncNow}
                    disabled={isCloudSyncing}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan Sekarang</span>
                  </button>
                  <button
                    onClick={handleCloudFetchNow}
                    disabled={isCloudSyncing}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tarik Data Cloud</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Dengan login email, Anda bebas menghapus histori penelusuran atau cache browser kapan saja tanpa takut data hilang. Cukup masuk kembali, dan data langsung pulih!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuthModal?.();
                  }}
                  className="mt-3 px-4 py-2 text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk dengan Email / Google</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 1: CADANGAN MANUAL (FILE FISIK) */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Cadangan Manual File Fisik (.JSON)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Download JSON Backup */}
              <button
                onClick={handleDownloadJSON}
                className="p-3 rounded-xl border border-blue-500/30 hover:border-blue-500/60 bg-blue-950/40 hover:bg-blue-950/60 flex items-start gap-2.5 text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-blue-200">Unduh Cadangan (.JSON)</div>
                  <div className="text-[10px] font-mono text-blue-300/70 mt-0.5">Simpan ke HP/Laptop atau kirim ke WA/Drive</div>
                </div>
              </button>

              {/* Upload & Restore JSON Backup */}
              <label className="p-3 rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-950/60 flex items-start gap-2.5 text-left transition-all cursor-pointer group shadow-2xs">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-emerald-200">Pulihkan File Cadangan</div>
                  <div className="text-[10px] font-mono text-emerald-300/70 mt-0.5">Pilih file .json cadangan Anda yang pernah diunduh</div>
                </div>
              </label>
            </div>

            {/* Restore from Server Button */}
            <button
              onClick={handleRestoreFromServer}
              disabled={isServerLoading}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 flex items-center justify-between text-left transition-all cursor-pointer disabled:opacity-60 text-xs text-slate-200 font-mono"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Pulihkan dari Salinan Server Lokal</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {isServerLoading ? 'Memeriksa...' : 'Cek Salinan'}
              </span>
            </button>
          </div>

          {/* SECTION 2: EKSPOR LAPORAN */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Ekspor & Rekap Laporan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option: CSV / Excel */}
              <button
                onClick={handleDownloadCSV}
                className="p-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 flex items-center gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-slate-100">Format Excel (CSV)</div>
                  <div className="text-[10.5px] font-mono text-slate-400">Bisa dibuka di Excel & Sheets</div>
                </div>
              </button>

              {/* Option: Standalone Offline Web HTML */}
              <button
                onClick={handleDownloadOfflineHTML}
                className="p-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 flex items-center gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-slate-100">Web Mandiri Offline (.html)</div>
                  <div className="text-[10.5px] font-mono text-slate-400">Buka di HP/PC tanpa internet</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Tersambung ke Cloud Database Firestore</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
