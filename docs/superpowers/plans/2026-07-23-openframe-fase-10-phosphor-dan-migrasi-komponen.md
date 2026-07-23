# OpenFrame Fase 10: Phosphor Icons dan Migrasi Komponen Penuh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti semua ikon emoji dan karakter panah dengan Phosphor Icons, lalu memigrasi setiap elemen form HTML mentah yang tersisa ke komponen shadcn/Base UI.

**Architecture:** Satu pustaka ikon, `@phosphor-icons/react`, dipakai lewat named import supaya bundler menyisihkan yang tidak terpakai. `lucide-react` — sisa `shadcn init` yang cuma dipakai `checkbox.tsx` — dibuang supaya tidak ada dua pustaka ikon di bundel. Migrasi form murni presentasi: `<input>` → `<Input>`, `<textarea>` → `<Textarea>`, `<button>` → `<Button>`, pasangan `<label><span>` → `<Label>`; tidak ada perubahan pada state, handler, atau server function.

**Tech Stack:** `@phosphor-icons/react` 2.1 · shadcn/ui · Base UI · React 19 · TanStack Start · Bun

**Dependensi baru:** `@phosphor-icons/react`. **Dibuang:** `lucide-react`.

**Fase sebelumnya:** `docs/superpowers/plans/2026-07-22-openframe-fase-9-adopsi-bahasa-visual-shadcn.md`

---

## Global Constraints

- **Bahasa Indonesia** untuk UI, pesan error, komentar. Santai, "kamu".
- **Ikon punya `aria-hidden`** kalau di samping teks yang sudah menjelaskan; tombol ikon-saja tetap butuh `aria-label`.
- **Panah di komentar kode dibiarkan.** `geometry.ts` dan `slug.ts` memakai `→` di dalam komentar, bukan UI — jangan disentuh.
- **Jangan ubah logika.** State, handler, validasi, dan server function tidak berubah. Fase ini presentasi.
- **Perilaku area editor dan pan foto wajib tetap sama** — keduanya diverifikasi lewat pengukuran di fase lalu.
- **P4 / ponytail.** Named import per ikon, bukan mengimpor seluruh set.
- Biome, `bun run check` sebelum commit. **`bun run build` wajib.**
- Commit Indonesia, conventional commits.

---

## Pemetaan ikon

| Emoji/karakter | Phosphor | Tempat |
|---|---|---|
| ☀️ / 🌙 | `Sun` / `Moon` | theme-toggle |
| ☕ | `Coffee` | navbar (Support), footer |
| 👤 | `User` | navbar, dashboard (chip username) |
| 😕 | `SmileyMeh` | twibbon (tidak ditemukan) |
| 📸 | `Camera` | twibbon (pilih foto) |
| 🔄 | `ArrowsClockwise` | twibbon (ganti foto) |
| 🖼 | `Image` | edit (ganti frame) |
| 🔑 | `Key` | register (simpan kode) |
| ⚠️ | `Warning` | register, lupa-password |
| ✅ | `Check` / `CheckCircle` | register, lupa-password (tersalin, berhasil) |
| 📋 | `Copy` | register, lupa-password (salin) |
| → | `ArrowRight` | tombol Masuk/Daftar/Reset, CTA |
| ↺ | `ArrowCounterClockwise` | slot-filler (reset posisi) |
| ↑ / ↓ | `ArrowUp` / `ArrowDown` | area-editor (urutkan) |
| ← / → | `CaretLeft` / `CaretRight` | index (paginasi) |
| 🎨 | `Palette` | dashboard (empty state) |

---

## Struktur Berkas

Tidak ada berkas baru. Yang diubah: `package.json`, `src/components/ui/checkbox.tsx`, `theme-toggle.tsx`, `navbar.tsx`, `footer.tsx`, `slot-filler/slot-filler.tsx`, `area-editor/area-editor.tsx`, dan seluruh `src/routes/*.tsx` yang masih memuat emoji atau elemen mentah.

---

## Task 1: Pasang Phosphor, buang lucide

**Files:** `package.json`, `src/components/ui/checkbox.tsx`

- [ ] **Step 1: Pasang dan cabut**

```bash
bun add @phosphor-icons/react@^2.1.10
bun remove lucide-react
```

- [ ] **Step 2: Ganti ikon di checkbox**

`checkbox.tsx` mengimpor `CheckIcon` dari lucide. Ganti:

```tsx
import { Check } from '@phosphor-icons/react'
// ...
// di tempat <CheckIcon ... /> sebelumnya:
<Check weight="bold" className="size-3.5" />
```

- [ ] **Step 3: Verifikasi**

```bash
grep -rn 'lucide' src/ || echo "bersih dari lucide"
bun run check && bun run typecheck && bun run build
```
Expected: `bersih dari lucide`, gerbang bersih.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: pasang Phosphor Icons, buang lucide-react

lucide sisa shadcn init dan cuma dipakai checkbox. Satu pustaka ikon
saja di bundel."
```

---

## Task 2: Ikon di komponen bersama

**Files:** `theme-toggle.tsx`, `navbar.tsx`, `footer.tsx`, `slot-filler/slot-filler.tsx`, `area-editor/area-editor.tsx`

- [ ] **Step 1: theme-toggle**

```tsx
import { Moon, Sun } from '@phosphor-icons/react'
// ...
{theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
```
`aria-label` pada tombolnya sudah ada dan dipertahankan.

- [ ] **Step 2: navbar**

- Tombol Support: `<Coffee aria-hidden />` menggantikan ☕
- Chip username: `<User aria-hidden />` menggantikan 👤

- [ ] **Step 3: slot-filler dan area-editor**

- Reset posisi: `<ArrowCounterClockwise aria-hidden />` + teks
- Tombol urutkan naik/turun: `<ArrowUp />` / `<ArrowDown />` — keduanya sudah punya `aria-label`, jadi ikonnya `aria-hidden`

- [ ] **Step 4: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: ikon Phosphor di navbar, theme toggle, dan editor"
```

---

## Task 3: Migrasi halaman auth

register dan lupa-password masih memakai `<input>`/`<button>`/`<label>` mentah dan paling banyak emoji.

**Files:** `src/routes/register.tsx`, `src/routes/lupa-password.tsx`

- [ ] **Step 1: register**

Pola migrasi — tidak menyentuh state atau handler:
- `<label className="…block"><span>Label</span><input/></label>` → `<div><Label htmlFor>…</Label><Input id/></div>`
- Tombol submit dan tombol salin/dashboard → `<Button>` (ukuran `blok` untuk tombol utama)
- Emoji → ikon: 🔑 `Key`, ⚠️ `Warning`, ✅/📋 `Check`/`Copy`, → `ArrowRight`

**Yang tidak berubah:**
- Elemen `<output>` untuk recovery code tetap `<output>`
- Kotak dashed recovery code tetap; hanya warna bordernya sudah primary sejak Fase 9
- `autoFocus` dengan `biome-ignore`-nya, `beforeunload`, dan fokus ke heading tetap

- [ ] **Step 2: lupa-password**

Pola sama. Dua layar (form reset + layar kode baru) sama-sama dimigrasi.

- [ ] **Step 3: Verifikasi di browser**

Uji alur penuh — daftar, lihat recovery code, masuk; lalu reset dengan kode itu. Ikon tampil, form berfungsi seperti sebelumnya.

- [ ] **Step 4: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: migrasi halaman daftar dan reset ke komponen shadcn + Phosphor"
```

---

## Task 4: Migrasi buat, edit, dan halaman partisipan

**Files:** `src/routes/buat.tsx`, `src/routes/edit.$id.tsx`, `src/routes/twibbon.$slug.tsx`

- [ ] **Step 1: buat dan edit**

- Input nama, deskripsi (`<Textarea>`), dan grup slug → komponen shadcn
- Grup slug (`/twibbon/` + input) mempertahankan bentuk grupnya; bagian yang diketik memakai `<Input>` tanpa border sendiri
- Tombol simpan, batal, dan toolbar area → `<Button>` (sebagian sudah)
- Ganti frame di edit: 🖼 → `Image`

**Yang tidak berubah:** `<AreaEditor>` dan seluruh isi `area-editor/`. Pembungkusnya boleh, propertinya tidak.

- [ ] **Step 2: twibbon**

- Label unggah foto: 📸 `Camera` (pilih), 🔄 `ArrowsClockwise` (ganti)
- Halaman "tidak ditemukan": 😕 → `SmileyMeh`
- Input file dibungkus `<label>` tetap — itu pola unggah yang sah, bukan yang perlu jadi `<Input>`

- [ ] **Step 3: Verifikasi perilaku, bukan cuma tampilan**

Ini yang paling penting — berkas ini menyentuh alur yang sudah diukur:
1. Area editor: geser mempertahankan ukuran, resize satu sisi, hard-clamp di tepi
2. Rectangle tool, hapus, urutkan, label masih bekerja
3. Unggah foto partisipan → geser 1:1, unduh masih sama dengan preview

- [ ] **Step 4: Commit**

---

## Task 5: Migrasi dashboard dan landing, lalu verifikasi menyeluruh

**Files:** `src/routes/dashboard.tsx`, `src/routes/index.tsx`

- [ ] **Step 1: dashboard**

- Tombol Keluar (`<button>` mentah) → `<Button variant="outline">`
- Chip username: 👤 `User`
- Empty state: 🎨 `Palette`

- [ ] **Step 2: index (landing)**

- Paginasi ← → → `CaretLeft` / `CaretRight`
- CTA → → `ArrowRight`

- [ ] **Step 3: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 105 test, sisanya bersih.

- [ ] **Step 4: Tidak ada emoji tersisa di UI**

```bash
grep -rnP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]' src/routes src/components | grep -vE 'geometry|slug\.ts' || echo "bersih"
```
Expected: `bersih` (panah di komentar geometry/slug boleh tersisa).

- [ ] **Step 5: Regresi visual dan perilaku di browser**

- Ikon tampil di kedua tema, di 320 dan 1440
- Ikon ikut warna teks sekitarnya (pakai `currentColor`, bawaan Phosphor)
- Area editor dan pan foto berperilaku persis seperti sebelum fase ini

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: migrasi dashboard dan landing; tuntaskan Phosphor + shadcn"
```

---

## Definition of Done

- [ ] `bun test` (105), `typecheck`, `check`, `build` bersih
- [ ] Tidak ada emoji di UI (`src/routes`, `src/components`) selain panah di komentar kode
- [ ] `lucide-react` terhapus; hanya `@phosphor-icons/react` di bundel
- [ ] Semua form memakai `<Input>`/`<Textarea>`/`<Button>`/`<Label>`, tidak ada `<input>`/`<button>` mentah di route (kecuali `<input type=file>` di dalam `<label>` unggah dan `<output>` recovery code)
- [ ] Tombol ikon-saja punya `aria-label`; ikon dekoratif `aria-hidden`
- [ ] Area editor dan pan foto berperilaku persis seperti sebelum fase ini
- [ ] Ikon tampil benar di tema gelap dan terang
