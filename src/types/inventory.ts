export interface InventoryItem {
  id: string;
  namaBarang: string;
  satuanWadah: string; // e.g. Wadah, Dus, Karton, Slop, Bal, Peti
  jumlahBarangWadah: number; // Jumlah isi 1 wadah (e.g. 24)
  satuanUnit: string; // e.g. pcs, bks, botol
  hargaBeli: number; // Harga beli modal 1 wadah penuh (mengurangi kas)
  jumlahBarangDijualSatuan: number; // Jumlah unit yang sudah terjual
  hargaJualSatuan: number; // Harga jual per satuan
  perputaranBulan?: number; // Estimasi siklus perputaran
  persentaseLabaDisimpanBulanan: number; // Persentase untung yang disimpan akhir bulan
  tanggalInput?: string; // Tanggal input transaksi (e.g. 2026-10-11)
  waktuInput?: string; // Jam input real-time (e.g. 14:26:07)
  catatan?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ItemCalculations {
  hppSatuan: number; // Harga Pokok Pembelian per satuan (hargaBeli / jumlahBarangWadah)
  gainSatuan: number; // Untung per satuan (hargaJualSatuan - hppSatuan)
  totalPendapatanTerjual: number; // Hasil penjualan unit terjual (Modal Kembali + Untung)
  totalModalKembali: number; // Modal pokok yang kembali dari penjualan
  totalGainTerjual: number; // Total untung bersih yang terealisasi
  marginPersen: number; // Margin %
  markupPersen: number; // Markup %
  sisaStokSatuan: number; // Sisa barang belum terjual
  nilaiSisaStok: number; // Nilai modal stok yang belum terjual
  bepSatuan: number; // Break-even unit
  isModalLunas: boolean; // Apakah hasil jual sudah menutup modal beli wadah

  // TOTAL SETELAH UNTUNG
  totalSetelahUntungTerjual: number; // Modal Kembali + Untung Terjual (= Uang Kas Masuk)
  totalSetelahUntungPenuh: number; // Modal Beli + Potensi Untung Penuh 1 Wadah
  potensiTotalGain: number; // Potensi untung penuh 1 wadah

  // AKUMULASI SIMPANAN SETELAH 1 BULAN
  estimasiUntung1Bulan: number;
  simpananSetelahUntung1Bulan: number;
  modalDiputarBulanDepan: number;
}

export interface GlobalSummary {
  modalAwalUsaha: number; // Modal awal yang disiapkan (e.g. Rp 50.000)
  totalItems: number;
  totalPengeluaranBeli: number; // Total harga beli barang yang diinput (mengurangi kas)
  sisaModalSebelumJual: number; // Modal awal - total harga beli
  totalPemasukanJual: number; // Total hasil penjualan barang (modal kembali + untung)
  totalModalKembali: number; // Modal pokok yang sudah balik
  totalGainTerjual: number; // Total untung (gain) terkumpul
  totalNilaiSisaStok: number; // Nilai barang yang masih ada di stok
  
  // SALDO KAS BERJALAN YANG SIAP DIPUTAR
  saldoKasSaatIni: number;
  
  // TOTAL SETELAH UNTUNG (TOTAL EKUITAS TOKO)
  totalSetelahUntung: number;
  totalSetelahUntungPenuh: number;

  // PERSENTASE TUMBUH / RUGI
  persenTumbuhRugi: number; // ((totalGainTerjual) / modalAwalUsaha) * 100%
  statusTumbuhRugi: 'tumbuh' | 'rugi' | 'impas';

  // SIMPANAN SETELAH UNTUNG 1 BULAN
  totalUntung1Bulan: number;
  totalSimpananSetelah1Bulan: number;
  totalKasDiputarBulanDepan: number;
  rataRataMargin: number;
}
