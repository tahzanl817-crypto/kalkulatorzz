import { InventoryItem } from '../types/inventory';

export const INITIAL_SAMPLE_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    namaBarang: 'Minyak Goreng Sania 2L',
    satuanWadah: 'Karton',
    jumlahBarangWadah: 6,
    satuanUnit: 'Pouch',
    hargaBeli: 210000, // HPP Rp 35.000
    jumlahBarangDijualSatuan: 5,
    hargaJualSatuan: 38500, // Gain Rp 3.500
    perputaranBulan: 4, // 4 karton sebulan
    persentaseLabaDisimpanBulanan: 50,
    catatan: 'Fast-moving mingguan',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'item-2',
    namaBarang: 'Indomie Goreng Spesial 85g',
    satuanWadah: 'Dus',
    jumlahBarangWadah: 40,
    satuanUnit: 'Bungkus',
    hargaBeli: 120000, // HPP Rp 3.000
    jumlahBarangDijualSatuan: 34,
    hargaJualSatuan: 3500, // Gain Rp 500
    perputaranBulan: 3,
    persentaseLabaDisimpanBulanan: 50,
    catatan: 'Laris manis harian',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'item-3',
    namaBarang: 'Kopi Kapal Api Spesial Mix 24g',
    satuanWadah: 'Bal',
    jumlahBarangWadah: 120,
    satuanUnit: 'Sachet',
    hargaBeli: 144000, // HPP Rp 1.200
    jumlahBarangDijualSatuan: 85,
    hargaJualSatuan: 1500, // Gain Rp 300
    perputaranBulan: 2,
    persentaseLabaDisimpanBulanan: 50,
    catatan: 'Eceran sachet',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
  },
];
