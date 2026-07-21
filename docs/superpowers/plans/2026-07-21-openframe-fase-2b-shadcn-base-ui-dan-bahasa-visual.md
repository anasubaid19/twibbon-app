# OpenFrame Fase 2b: shadcn/ui + Base UI dan Pemulihan Bahasa Visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memasang shadcn/ui di atas primitif Base UI sebagai lapisan komponen, memetakan variabelnya ke token OpenFrame yang sudah ada, dan mengembalikan bahasa visual aplikasi lama yang belum ikut terbawa — navbar, atmosfer, motion, badge berwarna, empty state, dan blok dukungan — supaya Fase 3–7 dibangun sekali, bukan dua kali.

**Architecture:** shadcn/ui dengan primitif Base UI (`@base-ui/react`), di atas Tailwind v4 yang sudah ada. Arah pemetaannya **satu arah**: variabel shadcn menunjuk ke token OpenFrame, bukan sebaliknya. Token lama (`--color-bg`, `bg-surface`, `text-accent`, …) tetap hidup, sehingga halaman bisa dimigrasi bertahap tanpa satu commit raksasa. `components/area-editor/` tidak disentuh sama sekali — SVG-nya tidak punya padanan di shadcn.

**Tech Stack:** shadcn/ui (CLI v4) · Base UI `@base-ui/react` · Tailwind CSS v4 · TanStack Start 1.168 · React 19 · Biome · Bun

**Spec:** `docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md` — bagian 3 (stack), 6 (arsitektur), 7 (sistem desain)
**Sumber visual:** `legacy file/twibbon-app-main/frontend/src/index.css` (647 baris) dan `pages/*.jsx`

---

## Kenapa fase ini ada

Spec menyebut shadcn/ui di **tiga** tempat — tabel stack (baris 69), diagram arsitektur `components/ui/ shadcn, ditema ulang` (baris 253), dan bagian sistem desain (baris 347). Fase 0–2 dibangun dengan Tailwind mentah dan tidak pernah memasangnya. Fase ini melunasi utang itu.

Sekaligus memperbaiki kesenjangan kedua: spec bagian 7 bilang bahasa visual lama *"dipindahkan, tidak diganti"*. Yang benar-benar pindah baru **paletnya**. Yang belum ikut, semuanya masih ada di `index.css` lama:

| Belum pindah | Sumber di kode lama |
|---|---|
| Navbar tetap (brand, tema, user, keluar, Support) | `components/Navbar.jsx` + `.navbar*` |
| Blok dukungan Trakteer + Instagram | `pages/Dashboard.jsx:112-139` |
| Aset `hero.png` | `frontend/src/assets/hero.png` |
| Atmosfer radial-gradient lime | `.auth-wrap::before`, `.twibbon-wrap::before` |
| Animasi masuk berjenjang | `@keyframes fadeUp`, `.fade-up{,-2,-3}` |
| Kartu hover: angkat + border lime + shadow | `.card:hover` |
| Focus ring `0 0 0 3px #caff3325` | `.field input:focus` |
| Badge berwarna: publik lime, privat ungu | `.badge-public`, `.badge-private` |
| Empty state dengan ikon dan ajakan | `.empty`, `.empty-icon` |
| Scrollbar tipis, spinner, `--card-shadow` | `::-webkit-scrollbar`, `.spinner` |
| Perbaikan kontras light mode | blok "FIXES KONTRAS" |
| Anti-zoom iOS pada input | `@media (max-width:768px) … font-size:16px` |

**Catatan penting soal sumbernya.** `legacy file/` **tidak ter-track di git**. Aset dan CSS yang masih dibutuhkan harus disalin ke dalam repo di fase ini, jangan dirujuk dari sana.

---

## Global Constraints

Berlaku untuk **setiap** task.

- **Bahasa UI dan pesan error: Bahasa Indonesia**, nada santai, sapaan "kamu". Brand: **OpenFrame**.
- **Identitas visual dipertahankan**, bukan diganti: warna merek `#CAFF33` (varian gelap `#a8d400`), danger `#FF4D4D`, judul Bricolage Grotesque 700/800, isi Nunito 400/500/600, tombol pill `999px`, kartu `18px`, dasar `14px`, kecil `8px`. Tema gelap default. Nilainya tidak berubah sama sekali di fase ini — yang berubah hanya **nama tokennya**, dari `accent` jadi `brand` (lihat tabel tabrakan di bawah).
- **Tema bawaan shadcn tidak dipakai apa adanya.** Aturan proyek melarang *"unmodified library defaults passed off as finished design"*.
- **Nol email, nol nomor telepon.** Tidak ada field baru yang meminta keduanya.
- `components/area-editor/**` **tidak diubah** di fase ini kecuali disebut eksplisit.
- Tidak ada perubahan pada server function, skema database, atau `lib/geometry.ts`.
- Package manager: `bun`. Komponen shadcn dipasang lewat `bunx shadcn@latest add`, **bukan** disalin manual.
- Formatter & linter: Biome. `bun run check` sebelum tiap commit.
- **`bun run build` wajib dijalankan sebelum menyatakan task selesai.** Fase 2 membuktikan `bun dev` tidak menangkap kegagalan resolusi modul.
- Commit message berbahasa Indonesia, conventional commits.

**Jebakan penamaan yang paling mahal — baca sebelum Task 1.**

Dua kosakata bertabrakan di tiga nama. Bukan sekadar kehati-hatian: kalau dibiarkan, tabrakannya muncul sebagai bug visual yang sulit dilacak.

| Nama | Arti di OpenFrame sekarang | Arti di shadcn |
|---|---|---|
| `accent` | Warna merek, lime `#CAFF33` | **Permukaan hover** yang halus (abu-abu tipis) |
| `muted` | Warna **teks** redup (`text-muted`) | Warna **latar** redup (`bg-muted`) |
| `primary` | — (tidak dipakai) | Warna merek |

Yang paling berbahaya `accent`. Komponen shadcn menulis `hover:bg-accent` di mana-mana, dan Tailwind meresolusinya lewat `--color-accent` — yang di proyek ini bernilai lime. Akibatnya **setiap hover di seluruh aplikasi menyala neon**: dropdown, item menu, tombol ghost, baris tabel.

Menyetel variabel CSS `--accent` saja **tidak menyelesaikannya**, karena tabrakannya terjadi di lapisan kelas Tailwind, bukan di lapisan variabel.

Penyelesaiannya di Task 1 Step 4: **token merek diganti nama jadi `brand`**, sehingga `accent` bebas dipakai shadcn sesuai artinya. Ini rename mekanis atas 32 pemakaian di 9 berkas, dan ia menghapus jebakannya secara permanen alih-alih menambalnya di tiap komponen yang di-generate.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `components.json` | **Baru.** Konfigurasi shadcn: primitif Base UI, alias, jalur CSS |
| `src/lib/utils.ts` | **Baru.** `cn()` — clsx + tailwind-merge |
| `src/styles/app.css` | **Ubah.** Pemetaan variabel shadcn → token OpenFrame, plus atmosfer/motion/scrollbar |
| `src/components/ui/*.tsx` | **Baru.** Hasil `shadcn add`, lalu ditema ulang |
| `src/components/navbar.tsx` | **Baru.** Shell tetap: brand, tema, Support, user, keluar |
| `src/components/theme-toggle.tsx` | **Ubah.** Pakai `Button` shadcn, tetap berbasis cookie |
| `src/assets/hero.png` | **Baru.** Disalin dari `legacy file/` sebelum folder itu hilang |
| `src/routes/register.tsx`, `login.tsx`, `lupa-password.tsx` | **Ubah.** Pakai komponen baru |
| `src/routes/dashboard.tsx` | **Ubah.** Card/Badge/empty state/blok dukungan |
| `src/routes/buat.tsx`, `edit.$id.tsx` | **Ubah.** Field form pakai komponen; AreaEditor tetap |

**Sengaja tidak dipasang sekarang** (YAGNI — menyusul bersama fasenya): `slider` dan `tabs` (Fase 3/5, kontrol zoom dan toggle mode), `dialog` dan `sonner` (Fase 7, konfirmasi hapus dan toast "link disalin"), `skeleton` (Fase 6, gallery).

---

## Task 1: Pasang shadcn + Base UI dan petakan token

Task paling berisiko di plan ini: `shadcn init` menulis ulang berkas CSS yang token-nya sedang dipakai seluruh aplikasi. Git yang jadi jaring pengamannya.

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `src/styles/app.css`, `package.json`

**Interfaces:**
- Consumes: token `--of-*` yang sudah ada di `src/styles/app.css:8-25`
- Produces: `cn()` dari `@/lib/utils`; variabel shadcn (`--background`, `--primary`, `--ring`, …) yang menunjuk ke token OpenFrame

- [ ] **Step 1: Pastikan pohon kerja bersih**

```bash
cd "/Users/anasubaid19/Vibe Code/twibbon-app"
git status --short
```
Expected: kosong (selain `legacy file/` dan `graphify-out/` yang memang untracked). Kalau ada perubahan lain, commit dulu — Step 3 mengandalkan `git diff` untuk melihat apa yang disentuh CLI.

- [ ] **Step 2: Jalankan init**

```bash
bunx shadcn@latest init
```

Jawaban prompt:
- Primitif: **Base UI** (sejak changelog `2026-07-base-ui-default` ini bawaannya; kalau CLI menawarkan Radix, pilih Base UI secara eksplisit)
- Base color: **Neutral** — nilainya akan ditimpa total di Step 4, jadi pilihan ini tidak penting
- CSS file: **`src/styles/app.css`**
- CSS variables: **Yes** — wajib; tanpa ini komponen memakai warna literal dan tidak bisa ditema ulang

Expected: `components.json` terbentuk, `src/lib/utils.ts` terbentuk, dan `clsx`/`tailwind-merge`/`class-variance-authority`/`@base-ui/react` masuk ke `package.json`.

> Kalau CLI gagal mendeteksi framework, jalankan `bunx shadcn@latest init -t start` (`-t start` = TanStack Start, didukung resmi).

- [ ] **Step 3: Lihat persis apa yang disentuh CLI**

```bash
git diff --stat
git diff src/styles/app.css
```

Yang **wajib masih ada** setelah init:
- blok `:root, [data-theme="dark"]` dan `[data-theme="light"]` berisi `--of-*`
- `@custom-variant dark (...)`
- `@theme inline` berisi `--color-accent`, `--font-display`, `--radius-pill`, dst.
- blok `@layer base` (body, h1-h3) dan `@media (prefers-reduced-motion: reduce)`

Kalau ada yang hilang, kembalikan dengan `git checkout -- src/styles/app.css` lalu tempelkan tambahan dari CLI secara manual. **Jangan** lanjut sebelum token lama utuh.

- [ ] **Step 4: Ganti nama token merek `accent` → `brand`**

Membebaskan nama `accent` untuk shadcn. Lihat tabel tabrakan di Global Constraints.

Pemakaian saat ini: 32 tempat di 9 berkas — `text-accent` (11), `border-accent` (13), `bg-accent` (8), plus satu `var(--color-accent)` di dalam `slot-rect.tsx`.

```bash
# Kelas Tailwind di seluruh src/
grep -rlE '(text|bg|border|ring)-accent' src/ | xargs sed -i '' \
  -e 's/\(text\|bg\|border\|ring\)-accent-dark/\1-brand-dark/g' \
  -e 's/\(text\|bg\|border\|ring\)-accent/\1-brand/g'

# Referensi variabel langsung di slot-rect.tsx
sed -i '' 's/var(--color-accent)/var(--color-brand)/g' src/components/area-editor/slot-rect.tsx
```

Lalu di `src/styles/app.css`, ubah dua baris di dalam `@theme inline`:

```css
  --color-brand: #caff33;
  --color-brand-dark: #a8d400;
```

Verifikasi tidak ada yang tertinggal:

```bash
grep -rnE '(text|bg|border|ring)-accent|var\(--color-accent' src/ || echo "bersih: tidak ada sisa token accent lama"
bun run check && bun run typecheck && bun run build
bun dev   # buka /register — lime harus tetap lime
```
Expected: grep bersih, gerbang bersih, dan **tidak ada perubahan visual**. Ini rename murni.

> Ini satu-satunya perubahan yang boleh menyentuh `components/area-editor/` di
> fase ini, dan isinya cuma mengganti nama variabel CSS — perilaku SVG-nya
> tidak berubah sama sekali.

- [ ] **Step 5: Tulis pemetaan variabel shadcn → token OpenFrame**

Tambahkan blok berikut ke `src/styles/app.css`, **setelah** blok `[data-theme="light"]` yang sudah ada dan **sebelum** `@theme inline`.

Ini inti fase ini: shadcn tidak membawa palet sendiri, ia meminjam palet OpenFrame.

```css
/* ── Jembatan ke shadcn/ui ───────────────────────────────────────────────
   shadcn menamai perannya sendiri (background, card, primary, ring, …).
   Di sini peran-peran itu ditunjuk ke token OpenFrame yang sudah ada, bukan
   sebaliknya, supaya komponen shadcn mewarisi identitas aplikasi alih-alih
   membawa tema netral bawaannya.

   PERHATIKAN `--accent`. Di shadcn ia permukaan hover yang halus, BUKAN
   warna merek. Lime OpenFrame masuk ke `--primary`. Menaruh lime di
   `--accent` membuat setiap hover di aplikasi menyala neon. */
:root,
[data-theme='dark'],
[data-theme='light'] {
  --background: var(--of-bg);
  --foreground: var(--of-text);

  --card: var(--of-surface);
  --card-foreground: var(--of-text);
  --popover: var(--of-surface);
  --popover-foreground: var(--of-text);

  /* Merek. Teks di atas lime selalu gelap — lime terlalu terang untuk teks putih. */
  --primary: #caff33;
  --primary-foreground: #0b0b0d;

  --secondary: var(--of-surface2);
  --secondary-foreground: var(--of-text);

  --muted: var(--of-surface2);
  --muted-foreground: var(--of-muted);

  /* Permukaan hover, bukan warna merek. Lihat catatan di atas. */
  --accent: var(--of-surface2);
  --accent-foreground: var(--of-text);

  --destructive: #ff4d4d;
  --destructive-foreground: #ffffff;

  --border: var(--of-border);
  --input: var(--of-border);
  /* Cincin fokus lime, memindahkan `box-shadow: 0 0 0 3px #caff3325` dari
     `.field input:focus` di index.css lama. */
  --ring: #caff33;

  --radius: 14px;
}

/* Di tema terang, lime murni terlalu menyilaukan sebagai isian tombol besar
   dan kontrasnya tipis di atas latar krem. index.css lama sudah menyelesaikan
   ini dengan memakai varian gelapnya untuk elemen interaktif. */
[data-theme='light'] {
  --primary: #a8d400;
  --primary-foreground: #0b0b0d;
  --ring: #a8d400;
}
```

Lalu **tambahkan** baris berikut ke dalam blok `@theme inline` yang sudah ada, tanpa menghapus token yang sudah di sana:

```css
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-input: var(--input);
  --color-ring: var(--ring);
  /* Setelah rename di Step 4, nama `accent` bebas dipakai sesuai arti shadcn:
     permukaan hover, bukan warna merek. */
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  /* Teks redup versi shadcn. `--color-muted` yang sudah ada TIDAK diubah —
     lihat catatan di bawah. */
  --color-muted-foreground: var(--muted-foreground);
```

> **`--color-muted` sengaja dibiarkan apa adanya.** Di proyek ini ia berarti
> warna *teks* redup dan dipakai sebagai `text-muted` di hampir semua halaman;
> di shadcn ia berarti warna *latar* redup. Karena keduanya kebetulan
> berdekatan secara visual, tabrakan ini tidak berbahaya seperti `accent` —
> tetapi artinya komponen shadcn yang di-generate **tidak boleh memakai
> `bg-muted`**. Saat menema ulang di Task 2, ganti setiap `bg-muted` jadi
> `bg-surface2`. Ada satu-dua saja, dan `text-muted-foreground` tetap benar.

> `--color-border` juga sudah ada dari Fase 0 dan nilainya sama
> (`var(--of-border)`), jadi tidak perlu ditambahkan lagi.

- [ ] **Step 6: Verifikasi tidak ada yang rusak**

```bash
bun run check
bun run typecheck
bun run build
```
Expected: ketiganya bersih. Build wajib — Fase 2 membuktikan `bun dev` melewatkan kegagalan resolusi modul.

```bash
bun dev
```
Buka `/dashboard` dan `/register`. Expected: **tidak ada perubahan visual sama sekali**. Task ini murni memasang pipa; komponen baru belum dipakai. Kalau ada warna yang berubah, pemetaannya salah — periksa `--color-accent` di Step 4.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: pasang shadcn/ui di atas primitif Base UI

Spec menyebut shadcn di tiga tempat sejak awal tapi Fase 0-2 dibangun
dengan Tailwind mentah. Ini melunasinya.

Pemetaannya satu arah: variabel shadcn menunjuk ke token OpenFrame,
bukan sebaliknya, supaya komponen mewarisi identitas aplikasi alih-alih
tema netral bawaannya. Lime dipetakan ke --primary, BUKAN --accent:
di shadcn --accent adalah permukaan hover, jadi menaruh lime di sana
membuat setiap hover menyala neon."
```

---

## Task 2: Komponen dasar, ditema ulang jadi OpenFrame

`shadcn add` menghasilkan komponen bertema netral. Task ini menempelkan bentuk khas OpenFrame yang diambil dari `index.css` lama: tombol pill dengan angkat-dan-glow, kartu radius 18px, badge berwarna.

**Files:**
- Create: `src/components/ui/{button,input,textarea,label,checkbox,card,badge,alert}.tsx`

**Interfaces:**
- Consumes: `cn()` dan variabel dari Task 1
- Produces: `<Button>` (varian `default`/`ghost`/`destructive`/`outline`), `<Input>`, `<Textarea>`, `<Label>`, `<Checkbox>`, `<Card>` + `<CardContent>`, `<Badge>` (varian `default`/`publik`/`privat`/`netral`), `<Alert>`

- [ ] **Step 1: Pasang komponennya**

```bash
bunx shadcn@latest add button input textarea label checkbox card badge alert
```
Expected: delapan berkas muncul di `src/components/ui/`.

- [ ] **Step 2: Beri tombol bentuk OpenFrame**

Di `src/components/ui/button.tsx`, ganti isi `buttonVariants` — pertahankan struktur `cva` yang digenerate, ubah nilainya:

```ts
const buttonVariants = cva(
  // Pill adalah bentuk tombol OpenFrame (index.css lama: border-radius 999px).
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition-all disabled:pointer-events-none disabled:opacity-45 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:border-ring [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Angkat 1px + glow lime, dipindahkan dari `.btn-primary:hover`.
        default:
          'bg-primary text-primary-foreground hover:bg-brand-dark hover:-translate-y-px hover:shadow-[0_4px_16px_#caff3340]',
        outline: 'border border-border bg-transparent text-text hover:bg-surface2',
        ghost: 'text-text hover:bg-surface2',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-85',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-[18px] text-[0.88rem]',
        // `.btn-primary` lama melebar penuh dengan padding 12px — bentuk tombol
        // utama di semua form auth.
        blok: 'w-full py-3 text-[0.95rem]',
        sm: 'h-8 px-3 text-[0.78rem]',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
```

> `hover:-translate-y-px` sudah dinetralkan otomatis oleh blok
> `prefers-reduced-motion` yang ada di `app.css` sejak Fase 0.

- [ ] **Step 3: Beri kartu dan badge bentuk OpenFrame**

Di `src/components/ui/card.tsx`, pada elemen `Card` terluar, ganti kelas radius/shadow menjadi:

```
rounded-card border border-border bg-card text-card-foreground shadow-[0_2px_20px_#00000060] transition-all
```

Di `src/components/ui/badge.tsx`, ganti daftar variannya — warna diambil persis dari `.badge-public` dan `.badge-private` lama:

```ts
variants: {
  variant: {
    // Kelas penanda dipakai perbaikan kontras tema terang di Task 4.
    netral: 'badge-netral bg-surface2 border-border text-muted',
    publik: 'bg-[#caff3322] border-[#caff3344] text-brand',
    privat: 'bg-[#c080ff22] border-[#c080ff44] text-[#c080ff]',
  },
},
defaultVariants: { variant: 'netral' },
```

- [ ] **Step 4: Verifikasi**

```bash
bun run check
bun run typecheck
bun run build
```
Expected: bersih. Belum ada perubahan visual — komponennya belum dipakai halaman mana pun.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: komponen dasar shadcn ditema ulang jadi OpenFrame

Tombol pill dengan angkat-dan-glow, kartu radius 18px, dan badge
publik/privat berwarna — semuanya dipindahkan dari index.css lama,
bukan memakai tema netral bawaan shadcn."
```

---

## Task 3: Navbar sebagai shell tetap

Empat halaman sekarang menyalin blok header yang hampir sama. Aplikasi lama menyelesaikan ini dengan satu `Navbar.jsx`; fase ini memindahkannya.

**Files:**
- Create: `src/components/navbar.tsx`
- Modify: `src/components/theme-toggle.tsx`

**Interfaces:**
- Consumes: `<Button>` (Task 2), `getSession` dari `@/server/session`, `authClient`
- Produces: `<Navbar username?: string />` — dipakai dashboard, buat, edit, dan (Fase 6) landing

- [ ] **Step 1: Ubah `theme-toggle.tsx` agar memakai `Button`**

Pertahankan seluruh logika cookie dan `useLoaderData` yang sudah ada — **jangan** ganti ke `localStorage`, itu melanggar spec 9.5. Yang berubah hanya elemen terluarnya:

```tsx
import { Button } from '@/components/ui/button'
// ... sisa impor tetap

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  )
```

- [ ] **Step 2: Buat `src/components/navbar.tsx`**

```tsx
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'

/** Tautan dukungan dipertahankan dari aplikasi lama (spec bagian 7). */
const TRAKTEER = 'https://trakteer.id/m_anas_ubaidillah/gift'

type Props = {
  /** Kalau ada, navbar menampilkan chip user dan tombol keluar. */
  username?: string
}

export function Navbar({ username }: Props) {
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    try {
      await authClient.signOut()
      navigate({ to: '/login' })
    } catch (err) {
      // signOut bisa MELEMPAR saat jaringan putus — tanpa ini tombolnya
      // tidak melakukan apa pun yang terlihat.
      setLogoutError(pesanError(err))
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-[58px] max-w-[1140px] items-center justify-between px-6">
        <Link
          to={username ? '/dashboard' : '/'}
          className="font-display text-[1.15rem] font-extrabold tracking-[-0.5px] text-text no-underline"
        >
          OpenFrame
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={TRAKTEER} target="_blank" rel="noopener noreferrer" title="Traktir kopi">
              ☕ <span className="hidden sm:inline">Support</span>
            </a>
          </Button>

          <ThemeToggle />

          {username && (
            <>
              <span className="hidden rounded-pill border border-border bg-surface2 px-2.5 py-1 text-[0.82rem] text-muted sm:inline">
                👤 {username}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          )}
        </div>
      </nav>

      {logoutError && (
        <p role="alert" className="bg-danger/10 px-6 py-2 text-center text-sm text-danger">
          {logoutError}
        </p>
      )}
    </header>
  )
}
```

> `asChild` mengandalkan `Slot`. Kalau komponen `Button` hasil generate tidak
> mengekspornya, ganti pembungkusnya jadi `<a>` biasa yang memakai
> `className={buttonVariants({ variant: 'outline', size: 'sm' })}`.

- [ ] **Step 3: Verifikasi**

```bash
bun run check && bun run typecheck && bun run build
```
Expected: bersih. Navbar belum dipasang di halaman mana pun — itu Task 5–7.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: navbar sebagai shell tetap

Memindahkan Navbar.jsx dari aplikasi lama: brand, tautan Support,
toggle tema, chip user, dan tombol keluar. Empat halaman sekarang
menyalin blok header yang hampir sama; Task 5-7 menggantinya dengan ini.

Tautan Trakteer dipertahankan sesuai spec bagian 7."
```

---

## Task 4: Kembalikan atmosfer, motion, dan detail yang hilang

Semua nilai di sini disalin dari `index.css` lama. Jangan mengarang nilai baru.

**Files:**
- Modify: `src/styles/app.css`
- Create: `src/assets/hero.png`

**Interfaces:**
- Consumes: token dari Task 1
- Produces: utilitas `.atmosfer`, `.fade-up`, `.fade-up-2`, `.fade-up-3`; scrollbar tipis; perbaikan kontras dan input iOS

- [ ] **Step 1: Selamatkan aset sebelum foldernya hilang**

`legacy file/` tidak ter-track di git. Kalau foldernya terhapus, asetnya hilang.

```bash
mkdir -p src/assets
cp "legacy file/twibbon-app-main/frontend/src/assets/hero.png" src/assets/hero.png
ls -la src/assets/hero.png
```
Expected: berkas ~13KB. Dipakai landing di Fase 6; disimpan sekarang supaya aman.

- [ ] **Step 2: Tambahkan atmosfer, motion, dan detail ke `src/styles/app.css`**

Tempelkan di akhir berkas:

```css
/* ── Atmosfer ────────────────────────────────────────────────────────────
   Cahaya lime samar di latar, dipindahkan dari `.auth-wrap::before` dan
   `.twibbon-wrap::before`. Ditaruh di elemen tersendiri, bukan ::before
   halaman, supaya halaman mana pun bisa memakainya. */
.atmosfer {
  position: relative;
}
.atmosfer::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse 60% 50% at 70% 20%, #caff3312 0%, transparent 70%);
}
[data-theme='light'] .atmosfer::before {
  background: radial-gradient(ellipse 60% 50% at 70% 20%, #a8d40010 0%, transparent 70%);
}

/* ── Animasi masuk berjenjang ────────────────────────────────────────────
   Blok prefers-reduced-motion di atas sudah memangkas durasinya jadi 0.01ms,
   jadi tidak perlu penjagaan tambahan di sini. */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-up {
  animation: fadeUp 0.4s ease both;
}
.fade-up-2 {
  animation: fadeUp 0.4s 0.08s ease both;
}
.fade-up-3 {
  animation: fadeUp 0.4s 0.16s ease both;
}

/* ── Scrollbar tipis ─────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--of-bg);
}
::-webkit-scrollbar-thumb {
  background: var(--of-border);
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--of-muted);
}

/* ── Perbaikan kontras tema terang ───────────────────────────────────────
   Hasil trial-error di aplikasi lama (blok "FIXES KONTRAS"); dipertahankan
   supaya tidak ditemukan ulang lewat jalan yang sama. */
[data-theme='light'] .badge-netral {
  background: #e0ded8;
  border-color: #c8c6c0;
  color: #444;
}

/* ── Anti-zoom iOS ───────────────────────────────────────────────────────
   Safari iOS otomatis memperbesar halaman saat input yang fontnya di bawah
   16px mendapat fokus, dan tidak mengembalikannya. */
@media (max-width: 768px) {
  input,
  select,
  textarea {
    font-size: 16px;
  }
}
```

- [ ] **Step 3: Verifikasi di browser**

```bash
bun dev
```
Buka `/register`, lalu tambahkan `className="atmosfer"` sementara di `<main>`-nya untuk memastikan gradiennya terlihat. Expected: cahaya lime sangat samar di kanan atas, tidak mengganggu keterbacaan. Hapus lagi perubahan sementara itu — pemasangan sungguhannya di Task 5.

Uji juga reduced-motion: DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Expected: elemen `fade-up` muncul langsung tanpa gerakan.

- [ ] **Step 4: Commit**

```bash
bun run check
git add -A
git commit -m "feat: kembalikan atmosfer, motion, dan detail dari aplikasi lama

Radial-gradient lime, fade-up berjenjang, scrollbar tipis, perbaikan
kontras tema terang, dan anti-zoom input iOS — semuanya dipindahkan dari
index.css lama sesuai spec bagian 7.

hero.png ikut disalin ke dalam repo: legacy file/ tidak ter-track di git,
jadi asetnya hilang begitu foldernya dihapus."
```

---

## Task 5: Migrasi halaman auth

Tiga halaman dengan bentuk yang sama. Register yang paling rumit karena punya layar penyerahan recovery code.

**Files:**
- Modify: `src/routes/register.tsx`, `src/routes/login.tsx`, `src/routes/lupa-password.tsx`

**Interfaces:**
- Consumes: `<Button>`, `<Input>`, `<Label>`, `<Alert>`, `<Checkbox>` (Task 2); `.atmosfer`, `.fade-up` (Task 4)
- Produces: —

- [ ] **Step 1: Petakan penggantinya**

Pola ini berlaku untuk ketiga halaman. Jangan mengubah satu pun pemanggilan server function atau logika state — hanya lapisan presentasinya.

| Sekarang | Jadi |
|---|---|
| `<main className="flex min-h-screen …">` | tambahkan `atmosfer` ke daftar kelasnya |
| `<div className="w-full max-w-md rounded-card border …">` | `<Card className="w-full max-w-md fade-up">` + `<CardContent className="p-9">` |
| `<p role="alert" className="… text-danger">` | `<Alert variant="destructive">` |
| `<label className="mb-4 block"><span …>Label</span><input …/></label>` | `<div className="mb-4"><Label htmlFor="x">Label</Label><Input id="x" …/></div>` |
| `<button type="submit" className="w-full rounded-pill bg-accent …">` | `<Button type="submit" size="blok" disabled={…}>` |
| `<button type="button" className="… border-border …">` | `<Button type="button" variant="outline" size="blok">` |
| `<input type="checkbox" …>` | `<Checkbox checked={…} onCheckedChange={…}>` |

**Yang tidak boleh berubah:**
- Kotak recovery code tetap `border-2 border-dashed border-accent` dengan font mono — itu penanda visual paling penting di aplikasi ini.
- Elemen `<output>` untuk kode tetap `<output>`, jangan jadi `<div>`.
- `beforeunload`, `autoFocus` dengan `biome-ignore`-nya, dan fokus ke heading tetap apa adanya.
- `onCheckedChange` milik Checkbox memberi `boolean | 'indeterminate'` — bungkus jadi `setConfirmed(v === true)`, jangan lempar langsung ke setter.

- [ ] **Step 2: Kerjakan `login.tsx` lebih dulu**

Halaman paling sederhana, jadi jadi patokan sebelum dua lainnya.

```bash
bun dev
```
Buka `/login`. Expected: bentuknya sama seperti sebelumnya — kartu di tengah, tombol lime melebar penuh — tapi sekarang input punya cincin fokus lime `3px` saat di-Tab, dan tombolnya terangkat 1px saat hover.

- [ ] **Step 3: Lanjut ke `register.tsx` dan `lupa-password.tsx`**

Uji alur penuhnya di browser:
1. Daftar akun baru → layar recovery code muncul, kotak dashed lime utuh
2. Centang checkbox → tombol menyala → masuk dashboard
3. Keluar, lalu `/lupa-password` dengan kode tadi → password baru + kode baru

- [ ] **Step 4: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: migrasi halaman auth ke komponen shadcn

Cincin fokus lime akhirnya kembali seperti index.css lama. Kotak
recovery code sengaja tidak disentuh: border dashed lime adalah penanda
visual paling penting di aplikasi ini."
```

---

## Task 6: Migrasi dashboard

**Files:**
- Modify: `src/routes/dashboard.tsx`

**Interfaces:**
- Consumes: `<Navbar>` (Task 3), `<Card>`, `<Badge>`, `<Button>` (Task 2)
- Produces: —

- [ ] **Step 1: Ganti header dengan `<Navbar>`**

Buang blok `<header>` beserta `handleLogout` dan state `logoutError` — semuanya sekarang milik Navbar. `beforeLoad` dan `loader` tidak berubah.

```tsx
return (
  <>
    <Navbar username={username} />
    <main className="atmosfer mx-auto max-w-[1140px] px-6">
      <div className="fade-up my-9 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.5px]">Kampanye Saya</h2>
          <p className="mt-0.5 text-sm text-muted">Kelola semua kampanye twibbon kamu</p>
        </div>
        <Button asChild>
          <Link to="/buat">+ Buat Kampanye</Link>
        </Button>
      </div>
      {/* … */}
    </main>
  </>
)
```

- [ ] **Step 2: Empty state dengan ikon dan ajakan**

Menggantikan kotak putus-putus polos. Nilai dan nada diambil dari `.empty` lama:

```tsx
{campaigns.length === 0 ? (
  <div className="fade-up-2 py-20 text-center text-muted">
    <div className="mb-3.5 text-[3.5rem]">🎨</div>
    <h3 className="mb-1.5 font-display text-[1.1rem] text-text">Belum ada kampanye</h3>
    <p className="mb-5 text-[0.88rem]">Buat kampanye pertamamu dan bagikan ke semua orang</p>
    <Button asChild>
      <Link to="/buat">+ Buat Kampanye Pertama</Link>
    </Button>
  </div>
) : (
  /* grid kartu */
)}
```

- [ ] **Step 3: Kartu dengan hover dan badge berwarna**

```tsx
<Card className="group overflow-hidden hover:-translate-y-[3px] hover:border-brand hover:shadow-[0_8px_32px_#00000040]">
  <Link to="/edit/$id" params={{ id: campaign.id }} className="block">
    <img
      src={`/api/frame/${campaign.id}`}
      alt=""
      loading="lazy"
      className="aspect-square w-full bg-surface2 object-contain"
    />
    <div className="p-4">
      <h2 className="mb-1.5 truncate font-display text-[0.95rem] font-bold">{campaign.name}</h2>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="netral">{campaign.slotCount} area</Badge>
        <Badge variant={campaign.isPublic ? 'publik' : 'privat'}>
          {campaign.isPublic ? 'Publik' : 'Privat'}
        </Badge>
        <Badge variant="netral">{campaign.useCount}x dipakai</Badge>
      </div>
    </div>
  </Link>
</Card>
```

> Tombol "Salin link", "Lihat", dan "Hapus" milik aplikasi lama **belum**
> ditambahkan: route `/twibbon/$slug` baru ada di Fase 3 dan `campaigns.delete`
> di Fase 7. Menambahkannya sekarang berarti tautan bertipe ke route yang
> belum ada, dan TanStack Router menolaknya saat kompilasi.

- [ ] **Step 4: Kembalikan blok dukungan**

Dipertahankan sesuai spec bagian 7. Nada dan tautannya persis dari `Dashboard.jsx:112-139`:

```tsx
<Card className="fade-up-3 my-3 mb-12 flex flex-wrap items-center justify-between gap-4 p-7">
  <div>
    <p className="mb-1 font-display text-base font-bold">☕ Suka dengan OpenFrame?</p>
    <p className="max-w-md text-[0.82rem] text-muted">
      Aplikasi ini gratis selamanya. Kalau suka, yuk dukung developer-nya!
    </p>
  </div>
  <div className="flex flex-wrap gap-2.5">
    <Button variant="outline" size="sm" asChild>
      <a href="https://www.instagram.com/_anasubaid/" target="_blank" rel="noreferrer">
        📸 Instagram
      </a>
    </Button>
    <Button size="sm" asChild>
      <a href="https://trakteer.id/m_anas_ubaidillah/gift" target="_blank" rel="noreferrer">
        ☕ Traktir Kopi
      </a>
    </Button>
  </div>
</Card>
```

- [ ] **Step 5: Verifikasi di browser**

Buat satu kampanye, lalu buka `/dashboard`. Expected: navbar menempel di atas saat digulir, kartu terangkat dan border-nya jadi lime saat hover, badge Publik lime dan Privat ungu, blok dukungan di bawah. Akun tanpa kampanye melihat ikon 🎨 dan ajakan.

- [ ] **Step 6: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: dashboard memakai navbar, kartu shadcn, dan badge berwarna

Mengembalikan empty state berikon dan blok dukungan Trakteer/Instagram
yang diminta spec bagian 7 tapi belum ikut terbawa di Fase 2.

Tombol Salin/Lihat/Hapus belum ditambahkan: route /twibbon/$slug baru
ada di Fase 3 dan campaigns.delete di Fase 7."
```

---

## Task 7: Migrasi halaman buat dan edit

**Files:**
- Modify: `src/routes/buat.tsx`, `src/routes/edit.$id.tsx`

**Interfaces:**
- Consumes: `<Navbar>`, `<Card>`, `<Button>`, `<Input>`, `<Textarea>`, `<Label>`, `<Checkbox>`, `<Alert>`
- Produces: —

- [ ] **Step 1: Ganti header dan bungkus panel form**

Pakai pemetaan yang sama seperti Task 5. Panel kanan (`<aside>`) jadi `<Card className="p-5">`.

Header masing-masing halaman diganti `<Navbar username={username} />` plus judul halaman di bawahnya. Tombol "Batal" pindah ke sisi judul, bukan ke navbar.

- [ ] **Step 2: JANGAN sentuh AreaEditor**

`<AreaEditor>` beserta seluruh isi `components/area-editor/` tidak berubah sama sekali di task ini. Ia sudah diverifikasi lewat browser automation di Fase 2 — drag, resize, clamp, pegangan tepi, jalur keyboard. Menyentuhnya berarti verifikasi itu hangus.

Yang boleh berubah hanya pembungkusnya di halaman: `<section>` di sekitarnya boleh jadi `<Card>`, tapi properti dan kelas `<AreaEditor>` sendiri tetap.

- [ ] **Step 3: Pesan validasi area pakai `<Alert>`**

```tsx
{!areaValid && (
  <Alert variant="destructive" className="mt-2">
    Area foto terlalu kecil. Perbesar sampai minimal 20x20 piksel pada ukuran frame aslinya.
  </Alert>
)}
```

- [ ] **Step 4: Verifikasi bahwa editornya masih utuh**

Ini bukan langkah opsional. Jalankan ulang pemeriksaan inti dari Fase 2 di browser:

1. Unggah frame → kotak muncul di tengah
2. Geser badan kotak → posisinya berubah, **ukurannya tidak**
3. Tarik pegangan kanan → hanya sisi kanan bergerak
4. Dorong ke tepi → berhenti, ukuran tetap
5. Kecilkan di bawah 20px → kotak merah, tombol simpan mati
6. Simpan → nilai di database sama dengan yang di layar

- [ ] **Step 5: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: migrasi halaman buat dan edit ke komponen shadcn

AreaEditor sengaja tidak disentuh sama sekali: perilakunya sudah
diverifikasi lewat browser automation di Fase 2, dan mengubahnya berarti
verifikasi itu hangus. Yang berubah hanya pembungkus dan field form."
```

---

## Task 8: Verifikasi menyeluruh

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: semuanya
- Produces: `README.md` yang menyebut lapisan UI dengan jujur

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test
bun run typecheck
bun run check
bun run build
```
Expected: 74 test lulus, tiga lainnya bersih. Tidak ada test baru di fase ini — perubahannya presentasi, dan `geometry`/`slug`/`upload` tidak disentuh.

- [ ] **Step 2: Pastikan tidak ada sisa gaya lama**

```bash
grep -rn "rounded-pill bg-brand py-3" src/routes/ || echo "bersih: tidak ada tombol tangan tersisa"
grep -rn "border-\[1.5px\] border-border bg-surface2" src/routes/ || echo "bersih: tidak ada input tangan tersisa"
```
Expected: keduanya melaporkan bersih. Kalau masih ada, halaman itu belum dimigrasi.

- [ ] **Step 3: Regresi visual lewat browser**

Pakai agent-browser. Untuk tiap breakpoint **320, 768, 1024, 1440**, di tema **gelap dan terang**, tangkap `/login`, `/dashboard`, dan `/buat`:

```bash
agent-browser open http://localhost:3000/login
agent-browser viewport 320 800
agent-browser screenshot login-320-dark.png
```

Yang diperiksa di tiap tangkapan:
- Tidak ada gulir horizontal
- Navbar tidak menumpuk isi di 320px
- Tombol lime tetap terbaca di tema terang (harus `#a8d400`, bukan `#caff33`)
- Chip user dan label Support tersembunyi di layar sempit, bukan meluber

- [ ] **Step 4: Aksesibilitas**

- Tab melintasi seluruh halaman: tiap elemen interaktif punya cincin fokus lime yang terlihat
- DevTools → Rendering → `prefers-reduced-motion: reduce`: tidak ada elemen yang bergerak, termasuk hover tombol
- Kontras teks `text-muted` di atas `bg-surface` pada kedua tema ≥ 4.5:1

- [ ] **Step 5: Perbarui `README.md`**

Ganti baris stack menjadi:

```markdown
TanStack Start (React 19) · Vite · Bun · PostgreSQL + Drizzle ORM · Better Auth
(plugin username) · Tailwind CSS v4 · shadcn/ui di atas Base UI · Biome.
```

- [ ] **Step 6: Commit**

```bash
bun run check
git add -A
git commit -m "docs: README menyebut lapisan UI shadcn/ui + Base UI"
```

---

## Definition of Done — Fase 2b

- [ ] `bun test` (74), `bun run typecheck`, `bun run check`, `bun run build` semuanya bersih
- [ ] `components.json` memakai primitif **Base UI**, bukan Radix
- [ ] Variabel shadcn menunjuk ke token OpenFrame; **tidak ada** warna netral bawaan yang tersisa
- [ ] Token merek bernama `brand`; `grep -rE "(text|bg|border|ring)-accent" src/` hanya menemukan pemakaian bergaya shadcn (hover), bukan lime
- [ ] Hover di dropdown/menu **tidak** menyala neon (bukti `--accent` dipetakan benar)
- [ ] Tombol berbentuk pill, terangkat 1px + glow saat hover, mati saat disabled
- [ ] Navbar tetap di empat halaman; tidak ada lagi blok header yang disalin
- [ ] Input punya cincin fokus lime 3px saat di-Tab
- [ ] Badge Publik lime, Privat ungu
- [ ] Empty state punya ikon 🎨, judul, dan ajakan
- [ ] Blok dukungan Trakteer + Instagram ada di dashboard
- [ ] `src/assets/hero.png` ada di dalam repo
- [ ] Atmosfer radial-gradient terlihat samar, tidak mengganggu keterbacaan
- [ ] `prefers-reduced-motion` mematikan seluruh gerakan
- [ ] Tidak ada gulir horizontal di 320/768/1024/1440, tema gelap maupun terang
- [ ] **AreaEditor berperilaku persis seperti sebelum fase ini** — geser, resize, clamp, pegangan tepi, keyboard
- [ ] Semua teks yang terlihat pengguna berbahasa Indonesia

---

## Yang menyusul di fase berikutnya

| Menyusul di | Komponen shadcn yang dipasang saat itu |
|---|---|
| Fase 3 | `slider` (zoom foto partisipan), `slot-filler/`, `composite.ts`, route `/twibbon/$slug` |
| Fase 4 | — (multi-slot memakai komponen yang sudah ada) |
| Fase 5 | `tabs` atau `switch` (toggle mode single/multi photo) |
| Fase 6 | `skeleton` (gallery memuat), `input` pencarian, landing memakai `hero.png` |
| Fase 7 | `dialog` (konfirmasi hapus), `sonner` (toast "link disalin"), `dropdown-menu` (aksi kartu) |

**Utang dari Fase 0–1 yang masih belum lunas** — bukan pekerjaan fase ini, tapi wajib beres sebelum deploy publik: preset server produksi (`bun run start` masih mencetak pesan), `registerUser` tidak dibatasi rate limiter Better Auth, dan rate limit memakai penyimpanan dalam memori per-proses.
