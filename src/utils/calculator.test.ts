import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateItem, calculateSummary, formatRupiah, formatAngka } from './calculator.ts';
import { InventoryItem } from '../types/inventory.ts';

test('calculateItem: calculates HPP, Gain, and Margin correctly', () => {
  const sampleItem: InventoryItem = {
    id: 'test-1',
    namaBarang: 'Kopi Sachet',
    satuanWadah: 'Renceng',
    jumlahBarangWadah: 10,
    satuanUnit: 'sachet',
    hargaBeli: 10000,
    jumlahBarangDijualSatuan: 5,
    hargaJualSatuan: 1500,
    persentaseLabaDisimpanBulanan: 50,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const calc = calculateItem(sampleItem);

  // HPP = 10000 / 10 = 1000
  assert.equal(calc.hppSatuan, 1000);
  // Gain Satuan = 1500 - 1000 = 500
  assert.equal(calc.gainSatuan, 500);
  // Total Pendapatan Terjual = 1500 * 5 = 7500
  assert.equal(calc.totalPendapatanTerjual, 7500);
  // Total Modal Kembali = 1000 * 5 = 5000
  assert.equal(calc.totalModalKembali, 5000);
  // Total Gain Terjual = 500 * 5 = 2500
  assert.equal(calc.totalGainTerjual, 2500);
  // Margin = (500 / 1500) * 100 = 33.333...
  assert.ok(Math.abs(calc.marginPersen - 33.333) < 0.1);
  // Sisa Stok = 10 - 5 = 5
  assert.equal(calc.sisaStokSatuan, 5);
  // Nilai Sisa Stok = 5 * 1000 = 5000
  assert.equal(calc.nilaiSisaStok, 5000);
});

test('calculateSummary: aggregates financial totals accurately', () => {
  const item1: InventoryItem = {
    id: 'item-1',
    namaBarang: 'Snack A',
    satuanWadah: 'Dus',
    jumlahBarangWadah: 20,
    satuanUnit: 'bungkus',
    hargaBeli: 20000,
    jumlahBarangDijualSatuan: 20,
    hargaJualSatuan: 1500,
    persentaseLabaDisimpanBulanan: 50,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const summary = calculateSummary([item1], 50000);

  // Modal Awal: 50000
  assert.equal(summary.modalAwalUsaha, 50000);
  // Pengeluaran: 20000
  assert.equal(summary.totalPengeluaranBeli, 20000);
  // Pemasukan: 20 * 1500 = 30000
  assert.equal(summary.totalPemasukanJual, 30000);
  // Total Gain: (1500 - 1000) * 20 = 10000
  assert.equal(summary.totalGainTerjual, 10000);
  // Saldo Kas Saat Ini = 50000 - 20000 + 30000 = 60000
  assert.equal(summary.saldoKasSaatIni, 60000);
});

test('formatters: formats rupiah and numbers correctly', () => {
  assert.ok(formatRupiah(50000).includes('50.000'));
  assert.equal(formatAngka(1234.5, 1), '1.234,5');
});
