# 🥗 Panen Sayur (Point Salad) — Digital Card Game

Sebuah adaptasi digital permainan kartu *"veggie drafting"* cepat yang terinspirasi dari mekanik resmi **Point Salad** untuk 2–6 pemain (mode Hot-Seat lokal + Bot AI + Room). Dibangun dari nol menggunakan arsitektur modern berstandar tinggi: **Pure TypeScript Game Engine (zero UI dependencies)** dipadukan dengan **React 19, Tailwind CSS, Zustand, dan Framer Motion**.

Setiap kartu memiliki **DUA sisi (bolak-balik)**:
1. **Sisi Sayur (Resource Side)**: 1 dari 6 jenis sayuran (Tomat, Wortel, Paprika, Selada, Bawang, Kubis) dengan palet warna cerah, motif halftone, piring konsentris putih, dan ilustrasi kartun yang imut.
2. **Sisi Skor (Point Side)**: Kondisi penilaian skor dengan latar hijau limau, tab segitiga di pojok penunjuk jenis sayur di baliknya, dan mangkuk salad putih dengan lencana angka bergigi (*scalloped badges*).

---

## 🎮 Mekanik & Aturan Permainan (`RULES.md`)

### 1. Dek 108 Kartu & Penyiapan (Setup)
- Total terdapat **108 kartu bolak-balik** (18 kartu untuk setiap dari 6 jenis sayuran) dengan **108 kondisi resep poin unik** yang terbagi dalam 5 kategori:
  1. **Poin Per Sayur** (+2 per jenis, kombinasi +1/+1, atau +2/+1/-2).
  2. **Kumpulan Set / Resep** (paket sayur tertentu atau set lengkap 6 jenis sayur).
  3. **Paling Banyak / Paling Sedikit** (adu mayoritas sayur tertentu atau total seluruh sayur).
  4. **Ganjil / Genap** (angka 0 bernilai 0 / tidak genap).
  5. **Variasi / Jenis Sayur** (minimal 2 tiap sayur, jumlah sayur kosong, tumpukan terbanyak).

- Jumlah kartu yang dimainkan disesuaikan secara otomatis berdasarkan jumlah pemain (2–6 pemain):
  - **2 Pemain**: 36 kartu (6 per jenis sayur, 12 kartu per tumpukan).
  - **3 Pemain**: 54 kartu (9 per jenis sayur, 18 kartu per tumpukan).
  - **4 Pemain**: 72 kartu (12 per jenis sayur, 24 kartu per tumpukan).
  - **5 Pemain**: 90 kartu (15 per jenis sayur, 30 kartu per tumpukan).
  - **6 Pemain**: 108 kartu (18 per jenis sayur, seluruh dek dipakai).

### 2. Giliran Pemain
Pada setiap giliran, pemain wajib melakukan **SALAH SATU** aksi utama:
- **Aksi A — Ambil 2 Kartu Sayur**: Memilih 2 kartu sayur mana saja dari 6 sayur yang terbuka di atas talenan pasar.
- **Aksi B — Ambil 1 Kartu Resep Poin**: Memilih 1 kartu resep poin dari 3 piring resep yang terbuka di pasar.

### 3. Aksi Bebas (Free Action) — Balik Resep Jadi Sayur
- Kapan saja pada gilirannya, pemain dapat **membalik kartu resep poin** yang dimilikinya menjadi sisi sayurnya secara permanen dengan mengeklik ikon sayur di sudut kartu resep.
- *Catatan*: Kartu sayur yang sudah diambil atau dibalik **tidak pernah bisa** dibalik kembali menjadi kartu resep poin.

### 4. Akhir Permainan & Penentu Kemenangan (Tiebreakers)
Permainan berakhir seketika ketika seluruh pasar kosong atau tidak ada aksi legal yang dapat dilakukan pemain.

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
│   └── cards.json              # 108 data kartu resmi (sumber kebenaran tunggal)
├── engine/                     # PURE GAME ENGINE (Zero React / Zero DOM imports)
│   ├── actions.ts              # Immutable reducer (gameReducer & executeAction)
│   ├── evaluators.ts           # Evaluator murni 5 kategori formula kondisi skor
│   ├── scoring.ts              # Registry & kalkulator skor pemain & tiebreaker
│   ├── setup.ts                # Inisialisasi permainan 2–6 pemain, pemilahan dek per pemain
│   ├── market.ts               # Logika penataan & pengisian ulang pasar (RULES.md)
│   ├── endgame.ts              # Deteksi akhir permainan, aksi legal & ranking akhir
│   ├── rng.ts                  # Mulberry32 deterministic PRNG (reproducible seed)
│   ├── types.ts                # TypeScript interfaces & types lengkap
│   └── bot/                    # AI Bot System (GreedyBot & EasyBot)
└── ui/                         # REACT UI LAYER
    ├── components/             # Komponen visual (Talenan Pasar, Shelf Resep, Modal, dsb.)
    ├── sound/                  # Audio efek sintetis Web Audio API
    └── store/                  # State management Zustand dengan persistensi localStorage
```
