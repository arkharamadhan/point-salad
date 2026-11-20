# PANEN SAYUR — Aturan Permainan (v1.0)

> Judul kerja. Game kartu drafting cepat untuk 2–4 pemain, sekitar 20 menit.
> File ini adalah **sumber kebenaran tunggal** untuk logika game. Data kartu ada di `cards.json`.
> Jangan menambah atau mengubah aturan di luar dokumen ini. Jika ada yang ambigu, tanyakan, jangan menebak.

---

## 1. Ringkasan

Setiap kartu punya **dua sisi**:

- **Sisi Skor**: berisi satu kondisi penghitungan poin (misalnya "+3 poin per Wortel, -1 poin per Brokoli").
- **Sisi Sayur**: berisi satu dari 6 jenis sayur.

Pemain mengumpulkan kartu dari pasar bersama. Kartu bisa dipakai sebagai **kartu skor** (sisi skor menghadap atas) atau sebagai **sayur** (sisi sayur menghadap atas). Di akhir game, setiap kartu skor dihitung berdasarkan sayur yang berhasil dikumpulkan pemain. Poin tertinggi menang.

## 2. Komponen

- **90 kartu** (lihat `cards.json`): 30 kondisi skor berbeda, masing-masing 3 salinan.
- **6 jenis sayur**, masing-masing 15 kartu: Wortel, Jagung, Tomat, Terong, Jamur, Brokoli.
- Setiap kartu mempunyai tepat satu jenis sayur di sisi sayurnya. Ketiga salinan dari satu kondisi skor selalu punya jenis sayur yang berbeda.

## 3. Persiapan

1. **Sesuaikan jumlah kartu dengan jumlah pemain.** Buang secara acak (berdasarkan sisi sayurnya) sejumlah kartu dari tiap jenis sayur:

   | Pemain | Buang per jenis sayur | Total kartu dipakai | Isi tiap tumpukan |
   |--------|------------------------|---------------------|-------------------|
   | 2      | 5                      | 60                  | 20                |
   | 3      | 3                      | 72                  | 24                |
   | 4      | 0                      | 90                  | 30                |

   Kartu yang dibuang tidak dipakai dan tidak diketahui siapa pun selama permainan.
2. Kocok kartu yang dipakai, lalu bagi menjadi **3 tumpukan tertutup** (Tumpukan 1, 2, 3) berukuran sama.
3. Setiap tumpukan memiliki **3 slot pasar** di sebelahnya:
   - **1 slot Skor**: kartu ditampilkan dengan **sisi skor** menghadap atas.
   - **2 slot Sayur**: kartu ditampilkan dengan **sisi sayur** menghadap atas.
4. Isi semua slot: untuk setiap tumpukan, ambil kartu teratas ke slot Skor, lalu 2 kartu berikutnya ke slot Sayur (total 9 kartu di pasar).
5. Tentukan pemain pertama secara acak. Giliran berjalan searah jarum jam.

Setiap pemain punya **area pribadi** (tableau) dengan dua bagian: **Kartu Skor** dan **Sayur**.

## 4. Giliran

Pada gilirannya, pemain **harus** melakukan **tepat satu** dari dua aksi:

### Aksi A — Ambil Sayur
Ambil **2 kartu** dari slot Sayur di pasar (boleh dua kartu dari tumpukan yang sama, boleh dari tumpukan berbeda). Kartu masuk ke bagian Sayur pemain dengan sisi sayur menghadap atas.

### Aksi B — Ambil Kartu Skor
Ambil **1 kartu** dengan salah satu cara:
- dari slot Skor di pasar, atau
- dari **atas tumpukan tertutup** mana pun (diambil buta; pemain melihat sisi skornya saat mengambil).

Kartu masuk ke bagian Kartu Skor pemain dengan sisi skor menghadap atas.

### Membalik kartu (bebas)
Selama gilirannya sendiri, sebelum atau sesudah aksi utama, pemain boleh **membalik** kartu skor miliknya sendiri menjadi kartu sayur (jumlahnya bebas, termasuk nol).
- Pembalikan **permanen**. Kartu yang sudah dibalik tidak bisa dikembalikan menjadi kartu skor.
- Kartu yang dibalik **tidak lagi menghasilkan skor**, tetapi dihitung sebagai 1 sayur sesuai jenis di sisi sayurnya.
- Kartu sayur yang sudah diambil dari pasar tidak bisa dibalik menjadi kartu skor.
- Membalik kartu bukan aksi utama dan tidak boleh menggantikan Aksi A atau B.

### Isi ulang pasar
Setelah aksi selesai (dan setelah semua pembalikan), isi ulang slot kosong dengan urutan: Tumpukan 1, 2, lalu 3; dalam tiap tumpukan isi slot Sayur dulu, kemudian slot Skor.
- Kartu teratas tumpukan itu ditarik ke slot yang kosong, dengan sisi yang sesuai jenis slot-nya.
- **Jika tumpukan itu sudah habis**, ambil kartu teratas dari **tumpukan terbesar** yang masih ada. Jika ada beberapa yang terbesar, pilih bernomor paling kecil.
- Jika **semua** tumpukan habis, slot yang kosong dibiarkan kosong.

## 5. Akhir Permainan

Permainan berakhir **saat sebuah giliran akan dimulai dan pasar kosong total** (semua tumpukan habis dan semua slot Skor dan Sayur kosong).

Kasus khusus saat tumpukan sudah habis:
- Jika slot Sayur hanya berisi 1 kartu, pemain boleh melakukan Aksi A dengan mengambil **1 kartu** saja.
- Jika tidak ada kartu Sayur yang tersisa tetapi masih ada slot Skor terisi, pemain hanya bisa melakukan Aksi B.
- Jika pemain tidak punya aksi legal sama sekali, permainan berakhir.
- Pemain **tidak boleh** melewatkan giliran jika punya aksi legal.

Kartu yang tersisa di pasar saat game berakhir tidak dihitung.

## 6. Penghitungan Skor

Setiap pemain menghitung semua **kartu skor yang belum dibalik** miliknya, berdasarkan **jumlah sayur** miliknya:

```
jumlah[jenis] = banyak kartu sayur jenis itu di bagian Sayur pemain
              + banyak kartu yang sudah dibalik dengan sisi sayur jenis itu
```

Skor akhir pemain = jumlah poin dari seluruh kartu skornya (boleh negatif). Semua kartu skor dihitung bersamaan; tidak ada sayur yang "habis terpakai" oleh satu kartu skor, jadi sayur yang sama dihitung ulang oleh tiap kartu skor.

### Tipe kondisi skor

Detail parameter tiap kartu ada di `cards.json` pada `scoringConditions`. Tipe yang digunakan:

| Tipe | Cara hitung |
|------|-------------|
| `perItem` | Jumlahkan poin x jumlah sayur untuk tiap jenis yang tertulis (poin boleh negatif). |
| `perSet` | Poin x jumlah set lengkap; jumlah set = nilai terkecil dari jumlah tiap jenis dalam set. |
| `perDistinctSet` | Poin x jumlah set berisi N jenis berbeda yang bisa dibentuk. Satu kartu sayur hanya masuk satu set. Jumlah set maksimum m adalah bilangan bulat terbesar dengan sum(min(jumlah_i, m)) >= N x m. |
| `parity` | Jumlah jenis tertentu genap (0 dianggap genap) memberi poin genap; ganjil memberi poin ganjil. |
| `majority` | Dibandingkan antar semua pemain. `most`: jumlah terbanyak; `least`: jumlah tersedikit (0 sah dan sering menang). Pemain yang seri membagi poin rata, dibulatkan ke bawah. |
| `perTypeAtLeast` | Poin untuk tiap jenis sayur yang jumlahnya mencapai ambang batas. |
| `perMissingType` | Poin untuk tiap jenis sayur yang jumlahnya 0. |
| `perPairAny` | Poin x total pasangan sejenis (jumlah per jenis dibagi 2, dibulatkan ke bawah, dijumlahkan). |
| `maxStack` | Poin x jumlah terbesar di antara keenam jenis sayur. |
| `balanced` | Poin penuh jika selisih jumlah terbesar dan terkecil (dari 6 jenis, termasuk yang 0) tidak lebih dari batas; selain itu 0. |

### Penentu pemenang

1. Skor total tertinggi menang.
2. Jika seri: pemain dengan **lebih banyak total kartu sayur** (termasuk yang dibalik).
3. Jika masih seri: pemain dengan **lebih banyak kartu skor belum dibalik**.
4. Jika masih seri: **menang bersama**.

## 7. Contoh Singkat

Pemain punya sayur: Wortel 4, Jagung 2, Tomat 3, Terong 0, Jamur 5, Brokoli 1, dan dua kartu skor:
- "+3 per Wortel, -1 per Brokoli" → 4x3 - 1x1 = **11**
- "4 poin per set Wortel + Jagung" → min(4, 2) = 2 set → **8**

Skor total = **19**.

## 8. Catatan untuk Implementasi Digital

Bagian ini menetapkan keputusan agar tidak ada tebakan:

- **Informasi tersembunyi**: urutan tumpukan tertutup tidak boleh bocor ke UI mana pun; pada Aksi B dari tumpukan, kartu baru terungkap setelah dipilih.
- **Determinisme**: pengocokan memakai RNG ber-seed agar game bisa diulang. Pembuangan kartu saat setup juga memakai RNG yang sama.
- **Pembalikan** hanya boleh dilakukan oleh pemain yang sedang giliran dan tidak mengubah giliran.
- **Pratinjau skor** di UI boleh menampilkan skor berjalan, tetapi `majority` harus dihitung terhadap kondisi pemain lain saat ini dan diberi tanda "sementara".
- **Urutan isi ulang pasar** harus persis seperti pada Bagian 4 agar hasil deterministik.
- **Kartu dibuang** (setup 2 dan 3 pemain) tidak muncul di UI.
- **Kartu skor negatif** itu sah. Tidak ada batas bawah skor total.
- **Nilai poin belum diseimbangkan lewat playtest.** Sediakan skrip simulasi (bot vs bot, ribuan game) untuk melihat sebaran skor sebelum nilai di `cards.json` dianggap final. Angka poin hanya ada di data, jadi menyetel ulang tidak perlu mengubah kode engine.
- **Desain visual** tidak diatur di sini. Dokumen ini hanya aturan logika.

## 9. Glosarium

| Istilah | Arti |
|---------|------|
| Pasar | 3 slot Skor + 6 slot Sayur yang terbuka di tengah meja. |
| Kartu skor | Kartu yang sisi skornya menghadap atas di area pemain. |
| Sayur | Kartu yang sisi sayurnya menghadap atas, atau kartu skor yang sudah dibalik. |
| Tumpukan | Satu dari 3 deretan kartu tertutup. |
| Balik | Mengubah kartu skor milikmu menjadi sayur secara permanen. |
