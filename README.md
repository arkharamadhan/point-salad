# 🥗 Panen Sayur (Point Salad) — Digital Card Game

Sebuah adaptasi digital permainan kartu *"veggie drafting"* cepat yang terinspirasi dari mekanik **Point Salad** untuk 2–4 pemain (mode Hot-Seat lokal + Bot AI). Dibangun dari nol menggunakan arsitektur modern berstandar tinggi: **Pure TypeScript Game Engine (zero UI dependencies)** dipadukan dengan **React 19, Tailwind CSS, Zustand, dan Framer Motion**.

Setiap kartu memiliki **DUA sisi**:
1. **Sisi Sayur (Resource Side)**: 1 dari 6 jenis sayur (Tomat, Wortel, Paprika, Selada, Bawang, Kubis) dengan palet warna cerah, motif halftone, piring konsentris putih, dan ilustrasi kartun yang imut.
2. **Sisi Skor (Point Side)**: Kondisi penilaian skor dengan latar hijau limau, tab segitiga di pojok penunjuk jenis sayur di baliknya, dan mangkuk salad putih dengan lencana angka bergigi (*scalloped badges*).

---

## 🎮 Mekanik & Aturan Permainan (`RULES.md`)

### 1. Pasar Bersama (Shared Market)
- Pasar terdiri dari **3 kartu skor terbuka** (diambil dari puncak 3 tumpukan tertutup) + **6 kartu sayur terbuka** (2 kartu per kolom tumpukan).
- Jumlah kartu yang dimainkan disesuaikan secara otomatis berdasarkan jumlah pemain:
  - **2 Pemain**: 60 kartu (10 kartu per jenis sayur).
  - **3 Pemain**: 72 kartu (12 kartu per jenis sayur).
  - **4 Pemain**: 90 kartu (15 kartu per jenis sayur, seluruh dek).

### 2. Giliran Pemain
Pada setiap giliran, pemain wajib melakukan **SALAH SATU** aksi utama:
- **Aksi A — Ambil 2 Kartu Sayur**: Memilih kombinasi 2 kartu sayur mana saja dari 6 kartu yang terbuka di pasar. (Jika hanya tersisa 1 sayur di pasar dan tumpukan kosong, pemain diperbolehkan mengambil 1 kartu tersebut).
- **Aksi B — Ambil 1 Kartu Skor**: Memilih 1 kartu skor dari pasar (3 kartu terbuka) **ATAU** mengambil kartu teratas dari salah satu tumpukan tertutup (buta).

### 3. Aksi Bebas (Free Action) — Balik Kartu Skor
- Sekali atau beberapa kali pada gilirannya, pemain dapat **membalik kartu skor** yang dimilikinya menjadi sisi sayurnya secara permanen.
- *Catatan Penting*: Kartu sayur yang sudah diambil atau dibalik **tidak pernah bisa** dibalik kembali menjadi kartu skor.

### 4. Pengisian Ulang Pasar (Refill Mechanics)
- Pasar langsung diisi ulang setelah aksi pengambilan:
  - Urutan pengisian tumpukan: **Tumpukan 1 ➔ Tumpukan 2 ➔ Tumpukan 3**.
  - Slot sayur yang kosong diisi terlebih dahulu dari tumpukannya masing-masing. Jika tumpukannya kosong, diisi dari tumpukan lain yang memiliki kartu terbanyak (jika seimbang, gunakan tumpukan bernomor terkecil).
  - Slot skor yang kosong diisi dari puncak tumpukannya masing-masing.

### 5. Akhir Permainan & Penentu Kemenangan (Tiebreakers)
Permainan berakhir seketika ketika:
1. Pasar benar-benar kosong saat giliran baru akan dimulai.
2. Pemain aktif tidak memiliki aksi legal yang dapat dilakukan.

**Tingkat Penentu Pemenang (4-Tier Tiebreakers):**
1. **Total Skor Tertinggi**.
2. **Total Kartu Sayur Terbanyak**.
3. **Kartu Skor Belum Dibalik Terbanyak**.
4. **Kemenangan Bersama (Shared Win)** jika ketiga kriteria di atas imbang.

---

## 🏛️ Arsitektur Proyek

```
src/
├── data/
│   └── cards.json              # 90 data kartu resmi (sumber kebenaran tunggal)
├── engine/                     # PURE GAME ENGINE (Zero React / Zero DOM imports)
│   ├── actions.ts              # Immutable reducer (gameReducer & executeAction)
│   ├── evaluators.ts           # 10 fungsi murni evaluator kondisi skor
│   ├── scoring.ts              # Registry & kalkulator skor pemain & tiebreaker
│   ├── setup.ts                # Inisialisasi permainan, pemilahan dek per jumlah pemain
│   ├── market.ts               # Logika penataan & pengisian ulang pasar (RULES.md)
│   ├── endgame.ts              # Deteksi akhir permainan, aksi legal & ranking akhir
│   ├── rng.ts                  # Mulberry32 deterministic PRNG (reproducible seed)
│   ├── types.ts                # TypeScript interfaces & types lengkap
│   └── bot/                    # AI Bot System
│       ├── interface.ts        # Kontrak BotAI (planTurn)
│       ├── greedyBot.ts        # GreedyBot (pencari skor optimal & simulasi balik kartu) + EasyBot
│       └── index.ts
└── ui/                         # REACT UI LAYER
    ├── components/
    │   ├── CardView.tsx        # Render kartu autentik Point Salad (Veggie & Point side)
    │   ├── PointBowlRenderer.tsx # Render visual mangkuk salad & lencana poin bergigi
    │   ├── MarketBoard.tsx     # Papan pasar bersama interaktif
    │   ├── PlayerTableau.tsx   # Area kartu & inventaris sayur pemain aktif
    │   ├── TurnHeader.tsx      # Header giliran, status bot, & tombol pengaturan
    │   ├── SettingsModal.tsx   # Modal pengaturan jumlah pemain, bot, seed & audio
    │   ├── EndGameModal.tsx    # Modal penyerahan piala juara & rincian skor lengkap
    │   └── icons/
    │       └── SpiceIcon.tsx   # Ikon SVG kartun imut sayuran (Color-blind safe)
    ├── sound/
    │   └── soundEffects.ts     # Efek suara sintetis prosedural (Web Audio API)
    ├── store/
    │   └── gameStore.ts        # State management Zustand terintegrasi engine
    └── App.tsx
```

---

## 🎨 Desain Kartu & Aksesibilitas

Desain visual kartu dirancang khusus agar presisi menyerupai kartu asli **Point Salad**:
- **Sisi Sayur**: Latar belakang warna sayur dengan tekstur titik halftone, piring konsentris putih dengan cincin berwarna, ilustrasi sayur kartun dengan bayangan lantai dan kilau specular, teks nama sayur di sudut atas & bawah terbalik, serta lencana bulat mini.
- **Sisi Skor**: Latar belakang hijau limau (`#7CB342`), tab segitiga di sudut atas-kiri dan bawah-kanan sesuai warna sayur di sisi baliknya, teks lengkung "POINT" di atas dan "SALAD" di bawah, serta mangkuk salad putih dengan **lencana angka bergigi (*scallop rosette*)** dan garis miring hijau limau.
- **Color-Blind Safe**: Setiap jenis sayur dilengkapi bentuk geometris unik selain warna (Tomat = Lingkaran, Wortel = Segitiga, Paprika = Kotak, Selada = Bintang, Bawang = Belah Ketupat, Kubis = Segienam).
- **Aksesibilitas Keyboard**: Navigasi keyboard penuh menggunakan `[1] - [3]` untuk kartu skor, `[Q] - [Y]` untuk kartu sayur, dan `[Spasi] / [Enter]` untuk konfirmasi.

---

## 🧪 Pengujian & Simulasi Keseimbangan (Unit Tests)

Proyek ini memiliki cakupan unit test **>95%** pada seluruh modul game engine menggunakan **Vitest**:
- ✅ Evaluasi seluruh 10 tipe formula penilaian kartu (`perItem`, `perSet`, `perDistinctSet`, `parity`, `majority`, `perTypeAtLeast`, `perMissingType`, `perPairAny`, `maxStack`, `balanced`).
- ✅ Validasi transisi giliran & reducer immutability.
- ✅ Validasi aturan pengisian ulang pasar dan prioritas tumpukan saat habis.
- ✅ Validasi deteksi akhir permainan dan penentuan juara 4 tingkat.
- ✅ Bot AI test (GreedyBot & EasyBot).

Jalankan test:
```bash
npm test
```

Periksa cakupan kode:
```bash
npm run test:coverage
```

### Simulasi Keseimbangan (300+ Automated Games)
Tersedia skrip simulasi otomatis bot vs bot untuk menguji kestabilan engine dan distribusi kartu:
```bash
npm run simulate
```
*Hasil simulasi 300 game menunjukkan engine berjalan 100% deterministik tanpa eror, dengan durasi rata-rata 52 giliran dan distribusi draf seimbang merata di seluruh 6 sayur.*

---

## 🚀 Menjalankan Secara Lokal

Pastikan Node.js 18+ telah terpasang:

```bash
# 1. Install dependencies
npm install

# 2. Jalankan mode pengembangan
npm run dev

# 3. Build untuk produksi
npm run build

# 4. Preview hasil build produksi
npm run preview
```

---

## 🌐 Panduan Deploy (Static Hosting)

Aplikasi ini dikompilasi menjadi bundel statis murni di folder `dist/` dan siap di-deploy ke penyedia hosting statis mana pun tanpa server backend:

### 1. Vercel
Konfigurasi `vercel.json` sudah disediakan:
```bash
npx vercel
```

### 2. Netlify
Konfigurasi `netlify.toml` sudah disediakan:
```bash
npx netlify deploy --prod --dir=dist
```

### 3. GitHub Pages
Alur kerja GitHub Actions `.github/workflows/deploy.yml` telah disertakan. Cukup aktifkan **GitHub Pages** di tab Settings repositori (pilih sumber **GitHub Actions**).

---

## 📜 Lisensi
Lisensi MIT. Dibuat dengan presisi untuk pengalaman bermain kartu digital terbaik! 🥗
