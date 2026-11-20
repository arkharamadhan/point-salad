# PANEN SAYUR (POINT SALAD) — Aturan Permainan (v2.0)

> Adaptasi digital resmi Point Salad. Game kartu drafting cepat untuk 2–6 pemain, sekitar 15–25 menit.
> File ini adalah **sumber kebenaran tunggal** untuk logika game. Data kartu ada di `cards.json` dan `src/data/cards.json`.

---

## 1. Ringkasan

Setiap kartu punya **dua sisi (bolak-balik)**:

- **Sisi Sayur**: berisi salah satu dari 6 jenis sayuran (Wortel, Selada, Bawang, Paprika, Tomat, Kubis).
- **Sisi Skor (Resep / Syarat Poin)**: berisi satu kondisi penghitungan poin unik. Di sudut kartu poin terdapat ikon indikator kecil yang menunjukkan jenis sayur apa yang ada di baliknya.

Pemain mengumpulkan kartu dari pasar bersama di atas talenan. Kartu bisa diambil sebagai **kartu resep poin** (sisi poin menghadap atas) atau sebagai **sayuran** (sisi sayur menghadap atas). Di akhir game, setiap kartu poin dihitung berdasarkan jumlah sayuran yang berhasil dikumpulkan pemain. Pemain dengan total poin tertinggi menang.

## 2. Komponen Kartu (Total 108 Kartu)

### 1. Sisi Sayuran (Total 108 Sisi)
Terdiri dari 6 jenis sayuran, masing-masing berjumlah tepat 18 kartu:
- **Wortel (Carrot)**: 18 kartu
- **Selada (Lettuce)**: 18 kartu
- **Bawang (Onion)**: 18 kartu
- **Paprika (Pepper)**: 18 kartu
- **Tomat (Tomato)**: 18 kartu
- **Kubis (Cabbage)**: 18 kartu

*(Catatan: Di pojok kartu poin selalu ada ikon kecil yang menunjukkan sayur apa yang ada di balik kartu tersebut).*

### 2. Sisi Kartu Poin / Resep (108 Syarat Unik)
Semua 108 sisi poin memiliki kombinasi aturan yang berbeda-beda, terbagi dalam 5 kategori:
1. **Poin Per Sayur (`perItem`)**: Mendapatkan (atau minus) poin dari setiap jumlah sayur tertentu.
   - Contoh: +2 poin tiap Wortel; +1 Tomat & +1 Bawang; atau +2 Paprika, +1 Kubis, tapi -2 Tomat.
2. **Kumpulan Set / Resep (`perSet`, `perDistinctSet`)**: Mendapatkan poin jika berhasil mengumpulkan kombinasi sayur tertentu.
   - Contoh: +5 poin tiap 2 Selada; +8 poin tiap 3 Wortel; +8 poin untuk paket (1 Wortel + 1 Paprika + 1 Bawang); atau +12 poin jika punya lengkap semua 6 jenis sayur berbeda.
3. **Paling Banyak / Paling Sedikit (`majority`)**: Mengadu jumlah sayur dengan pemain lain di akhir game.
   - Contoh: +10 poin untuk pemilik Tomat terbanyak; +7 poin untuk pemilik Paprika tersedikit; atau +10 poin untuk total sayur terbanyak. (Jika terjadi seri, poin dibagi rata dan dibulatkan ke bawah).
4. **Ganjil / Genap (`parity`)**: Dihitung dari total sayur jenis tertentu (**angka 0 tidak dihitung genap, bernilai 0**).
   - Contoh: +7 poin jika jumlah Bawang genap; +3 poin jika jumlah Wortel ganjil.
5. **Variasi / Jenis Sayur (`perTypeAtLeast`, `perMissingType`, `perPairAny`, `maxStack`, `balanced`)**: Dihitung dari keberagaman sayur yang dimiliki atau tidak dimiliki sama sekali.
   - Contoh: +5 poin untuk setiap jenis sayur yang dimiliki minimal 2; +5 poin untuk setiap jenis sayur yang tidak dimiliki sama sekali (jumlah 0); x2 per kartu di tumpukan sayur terbanyak.

## 3. Persiapan Permainan (Setup)

Sebelum mulai, jumlah kartu yang dipakai harus disesuaikan dengan jumlah pemain (ambil rata dari tiap jenis sayur):

| Jumlah Pemain | Buang per Jenis Sayur | Total Kartu Dipakai | Jumlah Kartu per Tumpukan (3 Tumpukan) |
|:---:|:---:|:---:|:---:|
| **2 Pemain** | Buang 12 per jenis (72 dibuang) | **36 kartu** (6 per jenis) | **12 kartu** per tumpukan |
| **3 Pemain** | Buang 9 per jenis (54 dibuang) | **54 kartu** (9 per jenis) | **18 kartu** per tumpukan |
| **4 Pemain** | Buang 6 per jenis (36 dibuang) | **72 kartu** (12 per jenis) | **24 kartu** per tumpukan |
| **5 Pemain** | Buang 3 per jenis (18 dibuang) | **90 kartu** (15 per jenis) | **30 kartu** per tumpukan |
| **6 Pemain** | Buang 0 per jenis (0 dibuang) | **108 kartu** (18 per jenis / semua) | **36 kartu** per tumpukan |

Kartu yang dibuang disingkirkan secara acak dari permainan tanpa dilihat.

### Langkah Penataan Pasar:
1. Kocok kartu yang dipakai, lalu bagi rata menjadi **3 tumpukan tertutup** (Tumpukan 1, 2, 3).
2. Dari setiap tumpukan:
   - Ambil 1 kartu teratas dan letakkan di **slot Poin** (sisi resep/poin terbuka menghadap atas).
   - Ambil 2 kartu berikutnya dan letakkan di **slot Pasar Sayur** (sisi sayur terbuka menghadap atas).
   - Pasar kini berisi **3 piring resep poin** dan **6 sayuran segar** di atas talenan kayu.
3. Tentukan pemain pertama secara acak. Giliran berjalan bergantian.

## 4. Alur Giliran (Turn Flow)

Pada gilirannya, pemain **wajib** melakukan **salah satu** dari dua aksi utama:

### Aksi A — Ambil Sayuran
Ambil **2 kartu** dari slot sayur di pasar (boleh dari tumpukan yang sama atau berbeda). Kartu masuk ke inventaris sayuran pemain.

### Aksi B — Ambil Kartu Resep Poin
Ambil **1 kartu resep poin** dari salah satu dari 3 slot resep yang terbuka di pasar.

### Aksi Bebas (Free Action) — Membalik Resep Jadi Sayur
Selama gilirannya (sebelum atau setelah aksi utama), pemain boleh **membalik kartu resep poin** miliknya menjadi kartu sayur:
- Pembalikan bersifat **permanen**. Kartu yang sudah dibalik tidak bisa diubah kembali menjadi resep poin.
- Kartu yang dibalik **tidak lagi menghasilkan skor**, melainkan dihitung sebagai 1 sayuran sesuai ikon di sisi baliknya.
- Kartu sayur yang diambil dari pasar tidak bisa dibalik menjadi kartu resep poin.

### Pengisian Ulang Pasar (Refill)
Setelah aksi pemain selesai:
1. Slot sayur yang kosong diisi ulang dari tumpukan kolomnya masing-masing. Jika tumpukan tersebut habis, isi dari tumpukan lain yang memiliki sisa kartu terbanyak.
2. Slot resep poin yang kosong diisi ulang dari puncak tumpukannya.
3. Jika seluruh tumpukan habis, slot yang kosong dibiarkan kosong.

## 5. Akhir Permainan & Penentuan Juara

Permainan berakhir seketika saat sebuah giliran akan dimulai dan **pasar kosong total** (seluruh tumpukan dan slot di pasar habis), atau pemain tidak memiliki aksi legal yang tersisa.

### Penghitungan Skor Akhir:
Skor setiap pemain adalah penjumlahan skor dari seluruh kartu resep poin miliknya yang belum dibalik, dihitung berdasarkan total inventaris sayuran yang dikumpulkan (termasuk sayur hasil pembalikan resep). Sayuran tidak "terpakai habis" oleh suatu resep; sayuran yang sama dapat dihitung berulang kali untuk setiap kartu resep yang relevan.

### Penentu Seri (Tiebreakers):
1. Total skor tertinggi.
2. Jika imbang, pemain dengan **total kartu sayur terbanyak**.
3. Jika masih imbang, pemain dengan **kartu resep belum dibalik terbanyak**.
4. Jika tetap imbang, kemenangan dibagi bersama (shared win).
