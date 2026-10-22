# Kalkulator Dagang & Arus Kas — NiagaNova

Aplikasi pencatatan perputaran modal, margin keuntungan per wadah & unit ritel, serta arus kas toko real-time yang terhubung 100% dengan Google Cloud Firestore.

---

## 🚀 Cara Menjalankan di Komputer Lokal (Laptop/PC)

### 1. Prasyarat
- Pasang [Node.js](https://nodejs.org/) (Versi 18 ke atas disarankan).
- Pasang [Git](https://git-scm.com/).

### 2. Langkah Menjalankan
Buka Terminal atau Command Prompt (CMD), lalu jalankan perintah berikut:

```bash
# 1. Clone repository dari GitHub
git clone https://github.com/sirojuddinkafabillah-hash/kalku.git

# 2. Masuk ke folder proyek
cd kalku

# 3. Pasang semua dependensi
npm install

# 4. Jalankan server pengembangan
npm run dev
```

Buka peramban (browser) dan akses alamat:
👉 **`http://localhost:3000`**

---

## 🌐 Cara Menjadikan Web Online Aktif (100% Gratis via Vercel)

Cara paling mudah dan cepat untuk mempublikasikan proyek GitHub menjadi web online adalah menggunakan **Vercel** (bebas biaya selamanya):

### Langkah-langkah:
1. Buka situs [vercel.com](https://vercel.com) dan masuk menggunakan akun **GitHub** Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari repositori **`kalku`**, lalu klik tombol **"Import"**.
4. Di bagian konfigurasi proyek:
   - **Framework Preset**: Pilih `Vite` (biasanya terdeteksi otomatis).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klik tombol **"Deploy"**.
6. Tunggu sekitar 1 menit hingga proses build selesai. Anda akan mendapatkan URL web publik (contoh: `https://kalku.vercel.app`).

---

## 🔑 Langkah Penting: Menghubungkan Firebase ke Domain Baru

Agar fitur **Login dengan Akun Google** dan sinkronisasi **Google Cloud Firestore** berjalan lancar di web publik baru Anda:

1. Buka [Firebase Console Authentication Settings](https://console.firebase.google.com/project/aesthetic-marker-tk6n5/authentication/settings).
2. Pilih tab **"Authorized domains"** (Domain yang diotorisasi).
3. Klik **"Add domain"** (Tambahkan domain).
4. Masukkan domain web Anda yang didapat dari Vercel (misal: `kalku.vercel.app` atau `localhost` untuk uji lokal).
5. Klik **"Save"**.

Selesai! Aplikasi web Anda kini berfungsi penuh, online, dan dapat diakses dari gadget mana pun.
