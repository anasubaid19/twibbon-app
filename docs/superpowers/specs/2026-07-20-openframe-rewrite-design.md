# OpenFrame — Desain Rewrite ke TanStack Start

**Tanggal:** 2026-07-20
**Status:** Disetujui, siap masuk tahap rencana implementasi
**Menggantikan:** `backend/` (Express + SQLite) dan `frontend/` (Vite SPA)

---

## 1. Ringkasan

OpenFrame adalah platform twibbon: creator mengunggah frame PNG, menggambar
area foto di atasnya, lalu membagikan tautan. Partisipan mengisi area itu
dengan foto mereka dan mengunduh hasilnya.

Pembeda utamanya dari alat twibbon lain: **satu campaign bisa punya banyak
slot foto**, bukan hanya satu.

Dokumen ini memindahkan aplikasi yang sudah ada — Express + SQLite + SPA
terpisah — menjadi satu aplikasi TanStack Start, sekaligus menambahkan
fitur multi-slot yang belum pernah ada.

---

## 2. Prinsip desain

Empat prinsip ini mengikat. Keputusan implementasi yang melanggarnya harus
dibawa kembali ke diskusi, bukan diselesaikan diam-diam.

### P1 — Privasi sebagai posisi produk, bukan fitur

Aplikasi lama sudah menjanjikan ini secara harfiah di layar pendaftaran:
*"Buat akun gratis — tanpa email, tanpa nomor telepon"* (`Register.jsx:67`).
Rewrite ini mempertahankannya.

| Data | Status |
|---|---|
| Email creator | Tidak pernah diminta |
| Nomor telepon | Tidak pernah diminta |
| Foto partisipan | Tidak pernah menyentuh server |
| Yang tersimpan | Username, hash password, hash recovery code, frame PNG, koordinat slot |

### P2 — Satu model koordinat

Creator menggambar kotak; partisipan menggeser foto di dalam kotak yang
sama. Keduanya wajib memakai modul geometri yang sama. Dua implementasi
koordinat berarti dua peluang untuk tidak sinkron.

### P3 — Satu jalur compositing

Preview di layar dan berkas unduhan dihasilkan fungsi yang sama, hanya
berbeda skala. Preview yang berbeda dari hasil unduhan adalah kelas bug
yang dihapus lewat konstruksi, bukan lewat pengujian.

### P4 — YAGNI

Setiap tabel, kolom, endpoint, dan dependensi harus bisa dibenarkan oleh
fitur MVP yang nyata. Bagian 8 mencatat apa yang dibuang dan mengapa.

---

## 3. Stack

| Lapisan | Pilihan |
|---|---|
| Framework | TanStack Start (React 19 + TanStack Router + server functions) |
| Database | PostgreSQL |
| ORM | Drizzle |
| Auth | Better Auth + plugin `username`, sesi lewat cookie HTTP-only |
| UI | shadcn/ui di atas Tailwind CSS v4 |
| Pemrosesan gambar | Sharp (server, hanya baca metadata) + Canvas API (client, compositing) |
| Linter/formatter | Biome |
| Runtime & paket | Bun |

### 3.1 Penyimpangan dari SETUP_PROMPT

Tiga hal berbeda dari SETUP_PROMPT.md. Semuanya disengaja dan sudah
disetujui.

**Fabric.js dibuang.** SETUP_PROMPT dan tabel "Key Technical Decisions" di
PRD memintanya, tapi bagian "Creator canvas" di PRD yang sama justru
mendeskripsikan SVG `<rect>` overlay — dua arah yang bertabrakan. Kami
pilih SVG + pointer events: sekitar 150 baris, nol dependensi, pointer
tracking 1:1 yang presisi, dan tidak melawan spring milik apple-design
seperti easing bawaan Fabric. Fabric ~300KB berbasis canvas, yang juga
menyulitkan styling dan aksesibilitas.

**Compositing di client, bukan Sharp di server.** PRD membenarkan
rendering server dengan *"no client-side composite leaking raw frames"*.
Alasan itu tidak berdiri: frame PNG sudah publik — ia ditampilkan di
halaman campaign dan bisa diunduh siapa pun dari network tab. Sementara
compositing di client justru menguatkan P1, karena foto partisipan tidak
pernah dikirim ke mana pun. Sharp tetap dipakai di server untuk membaca
dan memvalidasi frame yang diunggah.

**Nama paket adapter.** SETUP_PROMPT menulis `@better-auth/drizzle`; nama
yang benar `@better-auth/drizzle-adapter`.

### 3.2 Bun dan Vite

**Diputuskan: Vite dipakai, menyesuaikan TanStack Start.**

`/Users/anasubaid19/CLAUDE.md` menyatakan *"Don't use vite."* Berkas itu
berada di home directory, bukan di project ini, dan tidak ter-track di
repo `twibbon-app` — isinya boilerplate Bun umum yang berlaku ke semua
project di bawah `~`. Ia tidak pernah ditulis untuk OpenFrame, sedangkan
PRD dan SETUP_PROMPT ditulis khusus untuk OpenFrame. Yang spesifik menang.

Pembagiannya:

- **Vite** — bundler dan dev server, bawaan TanStack Start, dipakai apa
  adanya tanpa dilawan.
- **Bun** — runtime, package manager (`bun install`), penjalan skrip
  (`bun run`), dan test runner (`bun test`).

Keduanya bekerja bersama; tidak ada yang perlu dikorbankan.

---

## 4. Autentikasi

### 4.1 Identitas

Login memakai **username**, bukan email — sesuai PRD US-01 dan P1.

Kendalanya: plugin `username` Better Auth tidak menggantikan email, ia
hanya menambah. Schema resminya hanya menambahkan kolom `username` dan
`displayUsername` (keduanya opsional), sementara tabel `user` bawaan tetap
mewajibkan `email` (`notNull().unique()`) dan `name`. Pendaftaran tetap
melewati `signUp.email()`.

Solusinya: saat mendaftar, server membentuk sendiri
`<username>@openframe.local` dan mengisi `name` dengan username. Pengguna
tidak pernah melihat, mengetik, atau menerima apa pun di alamat itu.
Kolom email ada di database tetapi mati.

Jika suatu saat email asli dibutuhkan, pengguna diminta mengisinya saat
itu — tidak ada data palsu yang perlu dibersihkan lebih dulu karena domain
`.local` tidak mungkin bertabrakan dengan alamat nyata.

### 4.2 Reset password

Lewat **recovery code**, bukan email — tidak ada infrastruktur email sama
sekali.

1. Saat mendaftar, server membuat kode 32 heksadesimal berformat
   `XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX`.
2. Kode ditampilkan **satu kali**, lalu hanya hash-nya yang disimpan di
   `user.recoveryCodeHash` (lewat `additionalFields`).
3. Untuk reset: username + recovery code + password baru.
4. Setelah dipakai, kode lama hangus dan kode baru diterbitkan.

Alur ini sudah ada di aplikasi lama (`routes/auth.js:56-79`) dan
dipertahankan apa adanya. Layar penyerahan kode di `Register.jsx:39-58`
juga dipertahankan — termasuk peringatan bahwa kode hanya muncul sekali.

### 4.3 Sesi

Cookie HTTP-only, Secure, SameSite. Ini memperbaiki kelemahan aplikasi
lama yang menaruh JWT di `localStorage` (`Login.jsx:21`,
`middleware/auth.js:5`) sehingga terekspos ke XSS.

Rate limiting memakai bawaan Better Auth. Aplikasi lama tidak punya sama
sekali.

---

## 5. Model data

### 5.1 Tabel Better Auth

`user`, `session`, `account`, `verification` — dihasilkan Better Auth CLI.
`user` diperluas dengan:

| Kolom | Tipe | Sumber |
|---|---|---|
| `username` | text unique | plugin `username` |
| `displayUsername` | text | plugin `username` |
| `recoveryCodeHash` | text not null | `additionalFields` |

### 5.2 `campaigns`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | text PK | uuid |
| `userId` | text FK → `user.id` | cascade on delete |
| `name` | text not null | |
| `description` | text default `''` | |
| `slug` | text not null unique | selalu digenerate, lihat 5.4 |
| `framePath` | text not null | relatif terhadap direktori upload |
| `frameWidth` | int not null | piksel asli, dibaca Sharp |
| `frameHeight` | int not null | piksel asli, dibaca Sharp |
| `isPublic` | boolean default true | |
| `useCount` | int default 0 | dinaikkan saat unduh |
| `createdAt` | timestamptz | |
| `updatedAt` | timestamptz | |

### 5.3 `frame_slots`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | text PK | uuid |
| `campaignId` | text FK → `campaigns.id` | `ON DELETE CASCADE` |
| `slotIndex` | int not null | urutan berbasis 1 |
| `x` `y` `width` `height` | real not null | persen 0–100 dari dimensi frame |
| `label` | text default `''` | opsional |
| `createdAt` | timestamptz | |

Koordinat disimpan sebagai persen agar bebas resolusi — slot yang sama
bekerja pada keluaran 1×, 2×, maupun 3×, dan tetap valid jika frame
diganti dengan gambar berdimensi lain.

### 5.4 Slug

Selalu ada, tidak pernah null. Digenerate dari nama campaign; jika
bentrok, ditambahi sufiks (`hut-ri-80`, `hut-ri-80-2`). Creator boleh
menimpanya secara manual dengan validasi `^[a-z0-9-]{3,60}$`.

Aplikasi lama membolehkan slug null dan jatuh kembali ke id numerik
(`campaign.js:75-81`), sehingga satu campaign punya dua URL yang sah dan
dua cabang kode di setiap tempat yang menyelesaikannya. Satu URL kanonik
menghapus keduanya.

---

## 6. Arsitektur

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx              landing + gallery publik
│   ├── login.tsx
│   ├── register.tsx
│   ├── lupa-password.tsx
│   ├── dashboard.tsx          campaign milik user
│   ├── buat.tsx               buat campaign + petakan area
│   ├── edit.$id.tsx
│   ├── twibbon.$slug.tsx      halaman partisipan
│   └── api/auth/$.ts          handler Better Auth
├── db/
│   ├── schema.ts
│   └── index.ts
├── lib/
│   ├── auth.ts                konfigurasi server Better Auth
│   ├── auth-client.ts
│   ├── geometry.ts            model koordinat bersama  ← P2
│   ├── slug.ts
│   └── recovery-code.ts
├── server/
│   ├── campaigns.ts           server functions
│   └── upload.ts              upload frame + validasi Sharp
├── components/
│   ├── ui/                    shadcn, ditema ulang
│   ├── area-editor/           AreaEditor · SlotRect · useDragResize
│   └── slot-filler/           SlotFiller · useSlotTransform · composite.ts
└── styles/app.css             token @theme
```

### 6.1 `lib/geometry.ts` — model koordinat bersama

Satu-satunya modul yang tahu cara menerjemahkan antara persen dan piksel.

```ts
type SlotRect = { x: number; y: number; width: number; height: number }; // persen 0–100
type FrameSize = { width: number; height: number };                      // piksel

toPixels(rect: SlotRect, frame: FrameSize): PixelRect
toPercent(rect: PixelRect, frame: FrameSize): SlotRect
clampToFrame(rect: SlotRect): SlotRect
isValidSlot(rect: SlotRect, frame: FrameSize): boolean   // minimum 20×20px
```

Dipakai `area-editor` (creator menggambar) dan `slot-filler` (partisipan
mengisi), serta divalidasi ulang di server.

### 6.2 Mode single-photo dan multi-photo

Bukan dua fitur. Satu fitur dengan sumber data berbeda.

```ts
type SlotFill = { image: HTMLImageElement; transform: Transform };
type Transform = { scale: number; offsetX: number; offsetY: number };

// Multi-photo: tiap slot punya isinya sendiri
getFill = (slotId) => fills.get(slotId)

// Single-photo: semua slot membaca isi yang sama
getFill = () => sharedFill
```

Fungsi render tidak tahu mode mana yang aktif — ia hanya memanggil
`getFill`. Toggle mode mengganti fungsi pencari, bukan menambah cabang
kode kedua.

Mode single-photo adalah default dan ditawarkan lebih dulu, sesuai PRD
US-04.

### 6.3 `composite.ts` — satu jalur, dua ukuran

```ts
renderComposite(
  frame: HTMLImageElement,
  slots: FrameSlot[],
  getFill: (slotId: string) => SlotFill | undefined,
  scale: number,
): HTMLCanvasElement
```

Urutan lapisan: slot 1 → slot 2 → … → frame di paling atas, sehingga
transparansi frame tetap terjaga.

Fungsi yang sama melayani preview langsung (skala tampilan) dan unduhan
(1×, 2×, 3×). Ini yang menegakkan P3.

### 6.4 Area editor (creator)

SVG `<rect>` di atas gambar frame. Tiap slot punya delapan pegangan resize
(4 sudut, 4 sisi) plus badan yang bisa digeser. Sesuai apple-design:
tracking 1:1 dengan pointer, spring critically damped untuk transisi,
rubber-banding saat pegangan menyentuh batas frame, panel toolbar dengan
`backdrop-filter`.

Slot tidak bisa digeser keluar frame — di-clamp lewat `geometry.ts`.

### 6.5 Server functions

| Fungsi | Auth | Keterangan |
|---|---|---|
| `campaigns.listMy` | ya | campaign milik user |
| `campaigns.listPublic` | tidak | gallery, berpaginasi + pencarian |
| `campaigns.getBySlug` | tidak | halaman partisipan; hanya campaign publik, private selalu 404 (bukan 403, agar keberadaannya tidak bocor) |
| `campaigns.getForEdit` | ya | **cek kepemilikan**, lihat 9.1 |
| `campaigns.create` | ya | frame + definisi slot |
| `campaigns.update` | ya | termasuk ganti frame |
| `campaigns.delete` | ya | cascade menghapus slot + berkas frame |
| `campaigns.incrementUse` | tidak | dipanggil saat unduh |
| `upload.frame` | ya | multipart, divalidasi Sharp |

Dibanding PRD: `upload.slotPhoto` dan `composite.render` **tidak ada** —
konsekuensi compositing di client.

---

## 7. Sistem desain

Aplikasi lama punya bahasa visual yang matang di `index.css`. Rewrite ini
memindahkannya, tidak menggantinya. shadcn/ui di-generate **di atas** token
ini, bukan dengan tema netral bawaannya.

| Token | Nilai |
|---|---|
| Accent | `#CAFF33` (lime), gelap `#a8d400` |
| Danger | `#FF4D4D` |
| Font judul | Bricolage Grotesque 700/800 |
| Font isi | Nunito 400/500/600 |
| Dark (default) | bg `#0B0B0D` · surface `#131316` · border `#2A2A35` · teks `#F0F0EE` |
| Light | bg `#F2F1EC` · surface `#FAFAF7` · border `#D8D6D0` · teks `#141412` |
| Radius | tombol pill `999px` · kartu `18px` · dasar `14px` · kecil `8px` |

Dark tetap default. Toggle tema dipertahankan. Font dimuat lokal
(`font-display: swap`) alih-alih dari Google Fonts CDN seperti sekarang
(`index.css:1`), agar sesuai aturan performa dan menghapus permintaan
pihak ketiga.

Yang juga dipertahankan: tautan Trakteer dan Instagram, aset `hero.png`,
serta nada bahasa Indonesia yang santai dan memakai "kamu".

---

## 8. Apa yang dibuang, dan mengapa

| Dibuang | Alasan |
|---|---|
| `campaigns.slot_count` (PRD) | Turunan dari `COUNT(frame_slots)`; data ganda yang bisa desinkron |
| Slug boleh null + fallback id (lama) | Dua URL sah untuk satu campaign berarti dua cabang kode di mana-mana |
| `uploads/slots/` (PRD) | Foto partisipan tidak pernah dikirim ke server |
| `uploads/composites/` + cache hash (PRD) | Tidak ada rendering di server yang perlu di-cache |
| Session token ephemeral + cron TTL (PRD) | Tidak ada berkas partisipan yang perlu kedaluwarsa |
| `upload.slotPhoto`, `composite.render` (PRD) | Idem |
| Fabric.js (SETUP_PROMPT) | ~300KB untuk drag/resize kotak; lihat 3.1 |
| Kolom `ratio` (lama) | Digantikan `frameWidth`/`frameHeight` yang sebenarnya. Badge rasio di kartu dashboard (`Dashboard.jsx:81`) diganti jumlah slot — informasi yang lebih berguna di produk multi-slot |
| Analytics, tier berbayar, auto-publish medsos | Non-goal PRD bagian 2 |

---

## 9. Bug yang tidak boleh ikut terbawa

Ditemukan saat membaca kode lama. Masing-masing punya penanganan eksplisit
di desain ini.

### 9.1 Campaign private tidak bisa diedit pemiliknya

`EditCampaign.jsx:34` mengambil data lewat `GET /api/campaigns/:id` yang
publik, sedangkan `campaign.js:84` menolak campaign private dengan 403
tanpa memeriksa apakah pemintanya adalah pemiliknya. Akibatnya pemilik
terkunci dari campaign private-nya sendiri.

Penanganan: `campaigns.getForEdit` terpisah dari `campaigns.getBySlug`,
memerlukan sesi, dan memeriksa `userId` cocok.

### 9.2 Validasi PNG bisa dipalsukan

`campaign.js:20` hanya memeriksa `file.mimetype`, yang dikirim client dan
bisa diisi apa saja.

Penanganan: Sharp mem-parse berkasnya. Format diambil dari
`metadata.format`. Berkas yang gagal di-parse ditolak.

### 9.3 Skema database sudah menyimpang dari kode

`db/database.js:14-24` tidak mendeklarasikan `slug` maupun
`recovery_code_hash`, padahal keduanya dipakai `routes/auth.js` dan
`routes/campaign.js`. Kolom itu jelas ditambahkan manual ke berkas SQLite
tanpa jejak.

Penanganan: Drizzle migrations. Skema hidup di kode dan perubahannya
punya riwayat.

### 9.4 Gallery publik setengah jadi

`GET /api/campaigns/public` (`campaign.js:67`) sudah ada dan tidak pernah
dipanggil frontend mana pun. Tidak ada route `/`; `App.jsx:26` melempar
semua path tak dikenal ke `/dashboard`.

Penanganan: route `/` menjadi landing + gallery, memakai
`campaigns.listPublic`.

### 9.5 JWT di localStorage

`Login.jsx:21` menyimpan token di `localStorage`, terbaca skrip mana pun
jika ada XSS. Diganti cookie HTTP-only lewat Better Auth (lihat 4.3).

---

## 10. Penanganan error

- Validasi Zod di setiap batas server function; koordinat slot dari client
  **selalu** divalidasi ulang di server.
- Frame: maksimum 10MB (PRD US-02), harus PNG menurut Sharp, alpha
  dipertahankan.
- Slot: minimum 20×20px, di-clamp ke batas frame, `slotIndex` unik per
  campaign.
- Foto partisipan: maksimum 15MB mode single, 5MB per slot mode multi —
  divalidasi di client karena berkasnya memang tidak pernah dikirim.
- Pesan error berbahasa Indonesia dan tidak membocorkan detail internal.
- Rate limiting Better Auth pada endpoint auth.

---

## 11. Pengujian

**Unit** (`bun test`) — `geometry.ts` menanggung beban terbesar karena
seluruh perilaku spasial bertumpu padanya: roundtrip persen↔piksel,
clamping di setiap tepi, penegakan ukuran minimum. Ditambah generasi slug
(termasuk penyelesaian bentrok) dan hash/verifikasi recovery code.

**Integration** — server functions dengan database uji: kepemilikan
campaign, cascade delete, paginasi gallery.

**E2E** (Playwright) — satu alur penuh: daftar → simpan recovery code →
buat campaign dengan 2 slot → buka tautan publik → isi kedua slot →
unduh → berkas hasil ada dan berdimensi benar.

**Visual regression** — breakpoint 320/768/1024/1440, tema terang dan
gelap.

---

## 12. Fase pengerjaan

Vertical slice: setiap fase menghasilkan sesuatu yang bisa dijalankan dan
dinilai.

| Fase | Hasil |
|---|---|
| 0 | Scaffold, token desain, Postgres tersambung, `bun dev` hidup |
| 1 | Daftar dengan recovery code, masuk, keluar, reset password |
| 2 | Buat campaign, unggah frame, **satu** slot |
| 3 | Partisipan mengisi satu foto lalu mengunduh |
| 4 | Multi-slot: tambah, hapus, urutkan ulang, resize |
| 5 | Mode multi-photo |
| 6 | Gallery publik, pencarian, paginasi |
| 7 | Edit/hapus campaign, poles, aksesibilitas, performa |

Fase 0–3 adalah tulang punggungnya. Risiko terbesar proyek ini bukan
fiturnya, melainkan apakah TanStack Start, Better Auth dengan email
sintetis, Drizzle, dan Tailwind v4 mau bekerja bersama. Fase 0–1
menjawabnya lebih awal, saat perbaikan masih murah.

---

## 13. Yang dihapus

`backend/` dan `frontend/` dihapus seluruhnya. Keduanya sudah ter-commit di
`81149b9`, jadi bisa diambil kembali kapan saja lewat git.

Tidak ada migrasi data dari SQLite ke Postgres. Basis data lama berisi data
pengembangan, dan skemanya sudah menyimpang dari kode (lihat 9.3).
