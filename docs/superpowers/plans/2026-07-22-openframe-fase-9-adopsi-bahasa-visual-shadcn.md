# OpenFrame Fase 9: Adopsi Bahasa Visual shadcn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti bahasa visual OpenFrame dengan bahasa visual shadcn seperti yang dipakai `uikit/` — netral dengan aksen biru, font Geist — sekaligus mengadopsi arsitektur tokennya yang lebih matang.

**Architecture:** Palet dan tipografi diganti di **satu tempat** (`src/styles/app.css`); sisanya rename token mekanis di seluruh route. Mekanisme tema **tidak ikut diganti**: `uikit` memakai kelas `.dark` + `next-themes`, sedangkan kita memakai `[data-theme]` yang dibaca dari cookie di loader root. Punya kita tidak berkedip saat SSR dan sudah terbukti sejak Fase 0 — yang dipinjam nilainya, bukan mekanismenya.

**Tech Stack:** shadcn/ui · Base UI · Tailwind v4 · Geist · TanStack Start · Bun

**Referensi:** `uikit/src/styles.css` (token) dan `uikit/src/components/**`

---

## Pembalikan keputusan — dicatat sengaja

Fase 2b dibangun di atas pilihan eksplisit **"Pertahankan identitas OpenFrame"**: lime `#CAFF33`, Bricolage Grotesque + Nunito, tombol pill, kartu 18px. Fase ini **membalik** keputusan itu atas permintaan langsung.

Konsekuensinya diambil sekalian, bukan ditunda:

- Spec bagian 7 dan PRD menyebut lime dan pasangan fontnya. Keduanya **diperbarui di fase ini**. Dokumen yang dibiarkan bertentangan akan menyesatkan fase berikutnya.
- Token `brand` yang di Fase 2b sengaja dipisahkan dari `accent` sekarang tidak diperlukan lagi — warna merek dan `--primary` shadcn menjadi hal yang sama.
- Atmosfer radial-gradient lime dipensiunkan. Ia dipindahkan dari aplikasi lama di Fase 2b, dan tidak punya tempat di bahasa visual shadcn yang rata.

Yang **tidak** ikut dibalik: fade-up, navbar, empty state berikon, blok dukungan Trakteer/Instagram, dan mekanisme tema berbasis cookie. Semuanya struktur, bukan warna.

---

## Global Constraints

- **Bahasa Indonesia** untuk UI, pesan error, komentar. Santai, "kamu".
- **Mekanisme tema tidak berubah.** Tetap `[data-theme]` + cookie + loader root. Jangan memasang `next-themes`.
- **Jangan sentuh logika fitur.** Fase ini hanya presentasi: tidak ada perubahan pada server function, `geometry.ts`, `composite.ts`, `batas-laju.ts`, atau alur mana pun.
- **Perilaku area editor dan pan foto wajib tetap sama.** Keduanya diverifikasi lewat pengukuran di Fase 2 dan 4+5; fase ini tidak boleh menggesernya.
- **P4 / ponytail.** Komponen dari `uikit` ditarik **hanya saat ada pemakainya**. Tandai penyederhanaan dengan `// ponytail:`.
- Biome, `bun run check` sebelum commit. **`bun run build` wajib.**
- Commit Indonesia, conventional commits.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/styles/app.css` | **Tulis ulang lapisan tokennya.** Palet shadcn + arsitektur token uikit |
| `src/routes/*.tsx`, `src/components/**` | **Ubah.** Rename token mekanis |
| `src/components/ui/{button,card,badge}.tsx` | **Ubah.** Cabut tema OpenFrame, kembali ke bentuk shadcn |
| `src/components/footer.tsx` | **Baru.** Diadaptasi dari `uikit` |
| `docs/superpowers/specs/…-design.md`, `PRD.md`, `README.md` | **Ubah.** Selaraskan dengan kenyataan baru |

---

## Task 1: Lapisan token

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Ganti nilai palet dan tipografi**

Ambil nilainya dari `uikit/src/styles.css`, **tetapi** tulis ke selektor
`[data-theme]` kita, bukan `.dark`:

- `:root, [data-theme='light']` → palet terang uikit
- `[data-theme='dark']` → palet gelap uikit
- `--primary: oklch(0.546 0.245 262.9)` (blue-600) di terang, `oklch(0.623 0.214 259.8)` (blue-500) di gelap
- `--font-sans: "Geist Variable", sans-serif`, `--font-heading: var(--font-sans)`
- `--radius: 0.625rem` plus skala turunan `--radius-sm/md/lg/xl/2xl/3xl/4xl`
- Token semantik `--space-inline/stack/section/page`
- Token motion `--motion-duration-*`, `--motion-ease-*`
- Alias shadow `--shadow-surface`, `--shadow-overlay`
- `--info`, `--info-subtle` beserta foreground-nya

**Yang dibuang:** `--of-*`, `--color-brand`, `--color-brand-dark`,
`--color-bg`, `--color-surface`, `--color-surface2`, `--color-text`,
`--radius-pill`, `--radius-card`, `--font-display`, `--font-body`, dan blok
`.atmosfer`.

**Yang dipertahankan:** `@custom-variant dark` versi `[data-theme]`, blok
`prefers-reduced-motion`, `fade-up`, scrollbar tipis, dan anti-zoom input iOS.

- [ ] **Step 2: Pasang font Geist**

`@fontsource-variable/geist` sudah ada di `package.json` sejak `shadcn init`.
Cukup impor lagi di baris teratas `app.css`, dan buang impor Bricolage serta
Nunito.

- [ ] **Step 3: Verifikasi**

```bash
bun run check && bun run typecheck && bun run build
```
Halaman akan tampak rusak sampai Task 2 selesai — kelas lama belum diganti.
Itu diharapkan.

---

## Task 2: Rename token di seluruh aplikasi

**Files:** semua di `src/routes/` dan `src/components/`

- [ ] **Step 1: Jalankan rename berurutan**

**Urutannya mengikat.** `bg-surface2` harus lebih dulu daripada `bg-surface`,
dan `brand-dark` lebih dulu daripada `brand` — kalau terbalik, prefiksnya
tertelan pengganti yang salah.

| Dari | Ke | Jumlah |
|---|---|---|
| `bg-surface2` | `bg-muted` | 37 |
| `bg-surface` | `bg-card` | 12 |
| `brand-dark` | `primary/90` | 2 |
| `bg-brand` | `bg-primary` | 8 |
| `text-brand` | `text-primary` | 13 |
| `border-brand` | `border-primary` | 15 |
| `text-bg` | `text-primary-foreground` | 7 |
| `text-text` | `text-foreground` | 2 |
| `text-muted` | `text-muted-foreground` | 54 |
| `text-danger` | `text-destructive` | 13 |
| `border-danger` | `border-destructive` | 10 |
| `bg-danger` | `bg-destructive` | 11 |
| `rounded-card` | `rounded-xl` | 12 |
| `rounded-base` | `rounded-lg` | 7 |
| `rounded-pill` | `rounded-lg` | 17 |
| `font-display` | `font-heading` | 19 |
| `font-body` | `font-sans` | 2 |
| `atmosfer` | *(dihapus)* | 5 |

`var(--color-brand)` di `slot-rect.tsx` menjadi `var(--color-primary)`, dan
`var(--color-danger)` menjadi `var(--color-destructive)`.

- [ ] **Step 2: Pastikan tidak ada sisa**

```bash
grep -rnE '(bg|text|border)-(brand|surface2?|danger)|rounded-(card|pill|base)|font-(display|body)|atmosfer|--color-(brand|bg|surface)' src/ || echo "bersih"
```
Expected: `bersih`.

- [ ] **Step 3: Verifikasi**

```bash
bun run check && bun run typecheck && bun test && bun run build
```
Expected: 105 test tetap lulus — tidak ada logika yang tersentuh.

---

## Task 3: Cabut tema OpenFrame dari komponen

Di Fase 2b, `button`, `card`, dan `badge` sengaja ditema ulang jadi bentuk
OpenFrame. Sekarang dikembalikan ke bentuk shadcn.

**Files:**
- Modify: `src/components/ui/{button,card,badge}.tsx`

- [ ] **Step 1: Button**

- `rounded-pill` → `rounded-lg`
- Varian `default` kembali ke `bg-primary text-primary-foreground hover:bg-primary/90`; buang angkat 1px dan glow lime
- `disabled:opacity-45` → `disabled:opacity-50`
- Ukuran `blok` **dipertahankan** — tombol utama form auth memakainya

- [ ] **Step 2: Card**

- `rounded-card` → `rounded-xl`
- Shadow lime-era `0_2px_20px_#00000060` → `var(--shadow-surface)`

- [ ] **Step 3: Badge**

Varian `publik`/`privat`/`netral` dipertahankan sebagai konsep, tapi warnanya
mengikuti palet baru: publik memakai `--info-subtle`, privat memakai
`secondary`, netral memakai `muted`. Kelas penanda `badge-netral` dan aturan
kontras tema terangnya ikut dibuang karena warnanya sudah semantik.

- [ ] **Step 4: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun test && bun run build
git add -A
git commit -m "feat: adopsi bahasa visual shadcn

Palet netral dengan aksen biru dan font Geist menggantikan lime dengan
Bricolage + Nunito, mengikuti uikit/. Arsitektur tokennya ikut diadopsi:
spacing semantik, motion, shadow, dan skala radius.

Mekanisme tema TIDAK ikut diganti. uikit memakai kelas .dark dengan
next-themes, sedangkan punya kita [data-theme] dari cookie yang dibaca
loader root — itu yang membuat SSR tidak berkedip, dan sudah terbukti
sejak Fase 0. Yang dipinjam nilainya, bukan mekanismenya."
```

---

## Task 4: Footer dan penyelarasan landing

**Files:**
- Create: `src/components/footer.tsx`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Adaptasi footer dari uikit**

Ambil strukturnya dari `uikit/src/components/footer.tsx`, lalu ganti isinya
dengan milik OpenFrame: tautan Trakteer dan Instagram yang selama ini menumpang
di dashboard, plus tautan ke beranda dan halaman buat.

> Blok dukungan di dashboard **tetap ada** — ia ajakan yang kontekstual di
> sana. Footer menambah tempat kedua yang muncul di semua halaman publik.

- [ ] **Step 2: Pasang footer di landing dan halaman partisipan**

- [ ] **Step 3: Verifikasi dan commit**

---

## Task 5: Selaraskan dokumen

Spec dan PRD sekarang menyebut warna yang sudah tidak dipakai. Dibiarkan, fase
berikutnya akan dibangun dari deskripsi yang salah.

**Files:**
- Modify: `docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md`, `PRD.md`, `README.md`

- [ ] **Step 1: Perbarui tabel sistem desain di spec bagian 7**

Ganti barisnya, dan tambahkan satu paragraf yang mencatat bahwa keputusan
"pindahkan bahasa visual lama" **dibalik di Fase 9** beserta alasannya —
supaya riwayatnya terbaca, bukan seolah tidak pernah ada.

- [ ] **Step 2: Perbarui PRD dan README**

- [ ] **Step 3: Commit**

---

## Task 6: Verifikasi menyeluruh

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 105 test, sisanya bersih.

- [ ] **Step 2: Regresi perilaku — bukan tampilan**

Ini yang paling penting: fase ini menyentuh berkas yang perilakunya sudah
diukur di fase lalu.

1. Area editor: geser mempertahankan ukuran, pegangan timur hanya menggerakkan
   sisi kanan, tepi berhenti keras, pegangan tepi tetap terjangkau
2. Pan foto partisipan tetap 1:1 dengan pointer, rubber-band tetap memantul
3. Unduhan masih sama dengan preview

- [ ] **Step 3: Tampilan di kedua tema dan empat breakpoint**

320/768/1024/1440, tema gelap dan terang. Tidak ada gulir horizontal, dan
tidak ada sisa lime di mana pun.

```bash
grep -rn 'caff33\|CAFF33\|a8d400' src/ || echo "tidak ada sisa lime"
```

- [ ] **Step 4: Commit**

---

## Definition of Done

- [ ] `bun test` (105), `typecheck`, `check`, `build` bersih
- [ ] Tidak ada satu pun sisa lime di `src/`
- [ ] Font Geist terpakai; Bricolage dan Nunito tidak lagi diimpor
- [ ] Tema tetap berbasis `[data-theme]` + cookie; SSR tidak berkedip
- [ ] Area editor dan pan foto berperilaku persis seperti sebelum fase ini
- [ ] Footer tampil di landing dan halaman partisipan
- [ ] Spec, PRD, dan README tidak lagi menyebut lime sebagai warna merek
- [ ] Tidak ada gulir horizontal di 320/768/1024/1440, kedua tema
