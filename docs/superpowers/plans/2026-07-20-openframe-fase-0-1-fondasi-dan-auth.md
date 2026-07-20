# OpenFrame Fase 0–1: Fondasi & Autentikasi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti aplikasi Express + SQLite + SPA terpisah dengan satu aplikasi TanStack Start yang bisa dijalankan, lengkap dengan token desain OpenFrame, Postgres via Drizzle, dan autentikasi username + recovery code tanpa email.

**Architecture:** Satu project TanStack Start di root. Vite sebagai bundler (bawaan TanStack Start), Bun sebagai runtime, package manager, dan test runner. Autentikasi memakai Better Auth dengan plugin `username`; karena Better Auth mewajibkan kolom email, server membentuk sendiri alamat sintetis `<username>@openframe.local` yang tidak pernah dilihat atau dipakai pengguna. Reset password lewat recovery code yang di-hash, bukan email.

**Tech Stack:** TanStack Start 1.168 · React 19 · TanStack Router · PostgreSQL · Drizzle ORM 0.45 · Better Auth 1.6 · Tailwind CSS v4 · Biome 2.5 · Zod 4 · Bun

**Spec:** `docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md`

---

## Global Constraints

Berlaku untuk **setiap** task di bawah ini.

- **Bahasa UI dan pesan error: Bahasa Indonesia**, nada santai, sapaan "kamu". Brand: **OpenFrame**.
- **Nol email, nol nomor telepon.** Tidak ada field, form, atau kolom yang meminta keduanya dari pengguna. (Spec P1)
- Email sintetis berformat persis `<username>@openframe.local`, dibentuk **hanya di server**, tidak pernah ditampilkan di UI.
- Recovery code berformat persis `XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX` (32 heksadesimal huruf besar dalam 4 grup).
- Recovery code plaintext **hanya boleh keluar satu kali**, pada respons pendaftaran/reset. Yang tersimpan hanya hash-nya.
- Sesi memakai cookie HTTP-only. **Tidak ada token di `localStorage`.** (Spec 9.5)
- Package manager & test runner: `bun`. Jangan pakai `npm install`/`npx` untuk dependensi project.
- Formatter & linter: Biome. Jalankan `bun run check` sebelum tiap commit.
- Semua input di batas server function divalidasi Zod.
- Tema gelap adalah default. Accent `#CAFF33`, judul Bricolage Grotesque, isi Nunito.
- Commit message berbahasa Indonesia, format conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

**Versi terverifikasi 2026-07-20** (pakai ini kalau resolusi otomatis bermasalah):
`@tanstack/react-start@1.168.32` · `@tanstack/react-router@1.170.18` · `better-auth@1.6.23` · `@better-auth/drizzle-adapter@1.6.23` · `drizzle-orm@0.45.2` · `drizzle-kit@0.31.10` · `tailwindcss@4.3.3` · `@tailwindcss/vite@4.3.3` · `@biomejs/biome@2.5.4` · `zod@4.4.3` · `postgres@3.4.9` · `sharp@0.35.3` · `@fontsource-variable/bricolage-grotesque@5.3.0` · `@fontsource-variable/nunito@5.3.0`

---

## Struktur Berkas

Yang dibuat dalam plan ini. Berkas untuk campaign/slot **tidak** termasuk — itu milik Fase 2.

| Berkas | Tanggung jawab |
|---|---|
| `package.json` | Dependensi + skrip Bun |
| `vite.config.ts` | Plugin TanStack Start, React, Tailwind |
| `tsconfig.json` | Path alias `@/*` → `src/*` |
| `biome.json` | Aturan lint & format |
| `drizzle.config.ts` | Konfigurasi migrasi Drizzle |
| `.env` / `.env.example` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| `src/router.tsx` | Pembuatan router |
| `src/routes/__root.tsx` | Shell HTML, penyedia tema, muat font |
| `src/routes/index.tsx` | Placeholder landing (diisi Fase 6) |
| `src/routes/api/auth/$.ts` | Handler Better Auth |
| `src/styles/app.css` | Token `@theme` + varian tema |
| `src/db/schema.ts` | Tabel Better Auth + `recoveryCodeHash` |
| `src/db/index.ts` | Klien Drizzle |
| `src/lib/recovery-code.ts` | Generate, format, hash, verifikasi kode |
| `src/lib/auth.ts` | Konfigurasi server Better Auth |
| `src/lib/auth-client.ts` | Klien Better Auth (browser) |
| `src/server/auth.ts` | Server function: daftar, reset, sesi |
| `src/routes/register.tsx` | Form daftar + layar penyerahan kode |
| `src/routes/login.tsx` | Form masuk |
| `src/routes/lupa-password.tsx` | Form reset + layar kode baru |
| `src/routes/dashboard.tsx` | Stub terproteksi (diisi Fase 2) |
| `src/components/theme-toggle.tsx` | Tombol ganti tema |
| `tests/lib/recovery-code.test.ts` | Unit test kode pemulihan |
| `tests/server/auth.test.ts` | Integration test alur auth |

---

## Task 1: Bersihkan project dan siapkan TanStack Start

Scaffolder resmi (`npx @tanstack/cli@latest create`) bersifat interaktif dan akan menimpa direktori yang sudah berisi `.git`, `PRD.md`, dan `docs/`. Kita bangun manual agar deterministik dan tidak ada yang hilang.

**Files:**
- Delete: `backend/`, `frontend/`, `setup.sh`
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, `.env`
- Create: `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/styles/app.css`

**Interfaces:**
- Consumes: —
- Produces: alias `@/*` → `src/*`; `createRouter()` di `src/router.tsx`; perintah `bun dev`, `bun run build`, `bun test`

- [ ] **Step 1: Pastikan kode lama aman di git, lalu hapus**

```bash
cd "/Users/anasubaid19/Vibe Code/twibbon-app"
git status --porcelain          # harus bersih
git log --oneline -1 81149b9    # bukti kode lama ada di riwayat
rm -rf backend frontend setup.sh
```

Kode lama tetap bisa diambil kapan saja: `git show 81149b9:backend/routes/auth.js`

- [ ] **Step 2: Buat `package.json`**

```json
{
  "name": "openframe",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "start": "node .output/server/index.mjs",
    "test": "bun test",
    "check": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "auth:generate": "bunx @better-auth/cli generate --config src/lib/auth.ts --output src/db/auth-schema.ts"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.170.18",
    "@tanstack/react-start": "^1.168.32",
    "better-auth": "^1.6.23",
    "@better-auth/drizzle-adapter": "^1.6.23",
    "drizzle-orm": "^0.45.2",
    "postgres": "^3.4.9",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "sharp": "^0.35.3",
    "zod": "^4.4.3",
    "@fontsource-variable/bricolage-grotesque": "^5.3.0",
    "@fontsource-variable/nunito": "^5.3.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.4",
    "@tailwindcss/vite": "^4.3.3",
    "@types/bun": "^1.3.14",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^6.0.3",
    "drizzle-kit": "^0.31.10",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.9.0",
    "vite": "^8.1.5"
  }
}
```

> `typescript` sengaja dipatok `^5.9.0`, bukan 7.x. TypeScript 7 (port native) baru rilis dan belum diuji dengan rantai plugin TanStack Start. Naikkan belakangan sebagai langkah tersendiri, bukan di tengah rewrite.

- [ ] **Step 3: Pasang dependensi**

```bash
bun install
```
Expected: `node_modules/` terbentuk, tidak ada error resolusi.

- [ ] **Step 4: Buat `tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client", "bun"],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "tests", "*.config.ts"]
}
```

> Tipe Bun dibutuhkan karena berkas test mengimpor `bun:test` (Task 5 dan 8).
> Nama pendek `"bun"` me-resolve paket `@types/bun` yang terdaftar di
> devDependencies. **Jangan** tulis `"bun-types"` — paket itu tidak ada di
> dependensi project, sehingga TypeScript akan menaiki pohon direktori dan
> mungkin menemukan salinan nyasar di luar repo. Di checkout bersih atau CI
> hasilnya `TS2688: Cannot find type definition file for 'bun-types'`.

- [ ] **Step 5: Buat `vite.config.ts`**

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // plugin react WAJIB setelah plugin start
    viteReact(),
  ],
})
```

- [ ] **Step 6: Buat `.gitignore` dan berkas environment**

`.gitignore` — **tambahkan** ke berkas yang sudah ada, jangan timpa. Baris
`.superpowers` yang sudah ada wajib dipertahankan (di situ ledger eksekusi
disimpan):

```
node_modules
.output
.vinxi
.tanstack
dist
.env
uploads
*.tsbuildinfo
.DS_Store
*.log
.superpowers
```

Entri lama `*.sqlite` dan `backend/uploads/` boleh dibuang — keduanya merujuk
ke backend yang baru saja dihapus.

`.env.example`:
```
DATABASE_URL=postgres://localhost:5432/openframe
BETTER_AUTH_SECRET=ganti-dengan-hasil-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000
```

Buat `.env` asli dengan secret sungguhan dalam satu langkah:

```bash
{
  echo "DATABASE_URL=postgres://localhost:5432/openframe"
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
  echo "BETTER_AUTH_URL=http://localhost:3000"
} > .env
```

Verifikasi tepat tiga baris dan secret-nya bukan placeholder:
```bash
grep -c '' .env && grep BETTER_AUTH_SECRET .env
```
Expected: `3`, dan nilainya string base64 acak — bukan `ganti-dengan-...`.

- [ ] **Step 7: Buat `src/styles/app.css` dengan placeholder minimal**

Token lengkap menyusul di Task 2. Untuk sekarang cukup agar build jalan.

```css
@import "tailwindcss";
```

- [ ] **Step 8: Buat `src/router.tsx`**

```tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
  })
}
```

> **Namanya harus persis `getRouter`.** TanStack Start 1.168 mencari ekspor
> bernama `getRouter` di berkas entri; nama lain menghasilkan
> `TypeError: entries.routerEntry.getRouter is not a function` pada setiap
> request. `routeTree.gen.ts` yang digenerate juga mengimpor nama itu
> (`import type { getRouter } from './router.tsx'`).

> Tidak perlu blok `declare module` manual di sini. `routeTree.gen.ts`
> sudah men-declare `Register` untuk `@tanstack/react-start` sendiri.

> `routeTree.gen.ts` dihasilkan otomatis oleh plugin saat `bun dev` pertama kali. Editor akan menandai impor ini merah sampai itu terjadi — itu wajar. Berkas ini **di-commit** (konvensi TanStack), bukan di-ignore.

- [ ] **Step 9: Buat `src/routes/__root.tsx`**

```tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '@/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenFrame' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="id" data-theme="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 10: Buat `src/routes/index.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <h1>OpenFrame</h1>
}
```

- [ ] **Step 11: Jalankan dev server dan verifikasi**

```bash
bun dev
```
Expected: server hidup di `http://localhost:3000`, halaman menampilkan "OpenFrame", dan `src/routeTree.gen.ts` muncul. Hentikan dengan Ctrl+C.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: ganti Express+SPA dengan fondasi TanStack Start

Hapus backend/ dan frontend/ (tersimpan di 81149b9). Bangun manual
alih-alih pakai scaffolder interaktif agar .git, PRD.md, dan docs/
tidak tertimpa."
```

---

## Task 2: Token desain OpenFrame

Memindahkan bahasa visual dari `index.css` lama ke Tailwind v4. Nilai diambil persis dari spec bagian 7 — jangan mengarang warna baru.

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/routes/__root.tsx`
- Create: `src/components/theme-toggle.tsx`

**Interfaces:**
- Consumes: `src/styles/app.css` dari Task 1
- Produces: utilitas Tailwind `bg-bg`, `bg-surface`, `text-accent`, `font-display`, `font-body`, `rounded-pill`, `rounded-card`; komponen `<ThemeToggle />`

- [ ] **Step 1: Tulis ulang `src/styles/app.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/bricolage-grotesque";
@import "@fontsource-variable/nunito";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* Nilai mentah yang berganti mengikuti tema */
:root,
[data-theme="dark"] {
  --of-bg: #0B0B0D;
  --of-surface: #131316;
  --of-surface2: #1C1C21;
  --of-border: #2A2A35;
  --of-text: #F0F0EE;
  --of-muted: #6B6B7A;
}

[data-theme="light"] {
  --of-bg: #F2F1EC;
  --of-surface: #FAFAF7;
  --of-surface2: #EEECEA;
  --of-border: #D8D6D0;
  --of-text: #141412;
  --of-muted: #7A7A6A;
}

/* Token tetap + jembatan ke variabel tema di atas */
@theme inline {
  --color-bg: var(--of-bg);
  --color-surface: var(--of-surface);
  --color-surface2: var(--of-surface2);
  --color-border: var(--of-border);
  --color-text: var(--of-text);
  --color-muted: var(--of-muted);

  --color-accent: #CAFF33;
  --color-accent-dark: #a8d400;
  --color-danger: #FF4D4D;

  --font-display: "Bricolage Grotesque Variable", sans-serif;
  --font-body: "Nunito Variable", sans-serif;

  --radius-pill: 999px;
  --radius-card: 18px;
  --radius-base: 14px;
  --radius-sm: 8px;

  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
}

@layer base {
  html {
    color-scheme: dark;
  }
  html[data-theme="light"] {
    color-scheme: light;
  }
  body {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3 {
    font-family: var(--font-display);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    /* biome-ignore lint/complexity/noImportantStyles: !important wajib di sini
       supaya override reduced-motion mengalahkan animasi inline. Biome
       menandai fix ini FIXABLE — tanpa suppression, `--unsafe` akan
       menghapusnya dan mematikan dukungan reduced-motion tanpa suara. */
    animation-duration: 0.01ms !important;
    /* biome-ignore lint/complexity/noImportantStyles: alasan sama */
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Buat `src/components/theme-toggle.tsx`**

Tema disimpan di cookie, bukan `localStorage`, agar SSR merender tema yang benar sejak render pertama dan tidak ada kedipan.

```tsx
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // biome-ignore lint/suspicious/noDocumentCookie: Biome menyarankan
    // CookieStore API, tapi Safari belum mendukungnya. document.cookie
    // jalan di semua browser dan penulisannya sepele di sini.
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`
  }, [theme])

  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="rounded-pill border border-border bg-surface2 px-3 py-1.5 text-base transition-colors hover:bg-border"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

- [ ] **Step 3: Baca tema dari cookie di `__root.tsx`**

Ganti isi `src/routes/__root.tsx`:

```tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import appCss from '@/styles/app.css?url'

const getTheme = createServerFn({ method: 'GET' }).handler(() => {
  const cookie = getRequestHeaders().get('cookie') ?? ''
  return cookie.includes('theme=light') ? 'light' : 'dark'
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenFrame' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: () => getTheme(),
  component: RootComponent,
})

function RootComponent() {
  const theme = Route.useLoaderData()
  return (
    <html lang="id" data-theme={theme}>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verifikasi token terpakai**

Ganti `src/routes/index.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="font-display text-5xl">
        Open<span className="text-accent">Frame</span>
      </h1>
      <p className="text-muted">Bikin twibbon multi-slot. Gratis, tanpa email.</p>
      <ThemeToggle />
    </main>
  )
}
```

```bash
bun dev
```
Expected: latar `#0B0B0D`, judul Bricolage Grotesque dengan "Frame" berwarna lime `#CAFF33`, isi Nunito. Klik toggle → berubah ke latar `#F2F1EC`. Muat ulang halaman → tema terang bertahan tanpa kedipan.

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: port token desain OpenFrame ke Tailwind v4

Palet, pasangan font, dan radius dipindahkan dari index.css lama.
Font dimuat lokal via @fontsource, bukan CDN Google Fonts.
Tema disimpan di cookie supaya SSR tidak berkedip."
```

---

## Task 3: Biome

**Files:**
- Create: `biome.json`

**Interfaces:**
- Consumes: —
- Produces: perintah `bun run check`

- [ ] **Step 1: Buat `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",
  "files": {
    "includes": ["src/**", "tests/**", "*.config.ts", "!src/routeTree.gen.ts"],
    "ignoreUnknown": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "suspicious": { "noConsole": "warn" }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "asNeeded" }
  },
  "css": {
    "parser": { "tailwindDirectives": true }
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

> `css.parser.tailwindDirectives` wajib ada. Tanpanya parser CSS Biome
> menolak sintaks Tailwind v4 (`@theme`, `@custom-variant`) yang dipakai
> Task 2, dan `bun run check` gagal.

- [ ] **Step 2: Jalankan dan perbaiki**

```bash
bun run check
git status --porcelain src/routeTree.gen.ts
```
Expected: `Checked N files`, tanpa peringatan deprecated, dan `git status`
tidak mengeluarkan apa pun.

> `src/routeTree.gen.ts` **wajib** dikecualikan lewat `!src/routeTree.gen.ts`.
> Pola `src/**` mencakupnya, dan tanpa negasi itu Biome akan memformat ulang
> berkas tersebut serta menghapus `import type { createStart }` yang justru
> dipakai blok `declare module` di dalamnya. Karena plugin TanStack menulis
> ulang berkas ini setiap `bun dev`, keduanya akan saling menimpa tanpa henti.

> Gunakan `"preset": "recommended"`, bukan `"recommended": true` — bentuk lama
> sudah deprecated di Biome 2.5 dan akan dihapus di versi mayor berikutnya.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: konfigurasi Biome sebagai linter dan formatter"
```

---

## Task 4: Postgres dan Drizzle

**Files:**
- Create: `drizzle.config.ts`, `src/db/index.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` dari `.env`
- Produces: `db` (instance Drizzle) diekspor dari `@/db`

- [ ] **Step 1: Buat database**

```bash
createdb openframe
psql -d openframe -c 'SELECT 1;'
```
Expected: satu baris berisi `1`.

- [ ] **Step 2: Buat `src/db/index.ts`**

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL belum diset di .env')

const client = postgres(url)
export const db = drizzle(client, { schema })
```

> Berkas `./schema` dibuat di Task 6. Sampai saat itu impor ini akan gagal — itu wajar, dan Task 6 menyelesaikannya.

- [ ] **Step 3: Buat `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/openframe',
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: sambungkan Postgres lewat Drizzle"
```

---

## Task 5: Modul recovery code (TDD)

Logika murni, tanpa database dan tanpa jaringan. Ini task pertama yang punya siklus TDD penuh.

**Files:**
- Create: `src/lib/recovery-code.ts`
- Test: `tests/lib/recovery-code.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `generateRecoveryCode(): string` — 32 hex huruf besar, 4 grup dipisah `-`
  - `hashRecoveryCode(code: string): Promise<string>`
  - `verifyRecoveryCode(code: string, hash: string): Promise<boolean>` — mengabaikan spasi dan besar-kecil huruf

- [ ] **Step 1: Tulis test yang gagal**

`tests/lib/recovery-code.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import {
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '@/lib/recovery-code'

describe('generateRecoveryCode', () => {
  test('menghasilkan 4 grup 8 heksadesimal huruf besar', () => {
    expect(generateRecoveryCode()).toMatch(/^[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}$/)
  })

  test('menghasilkan kode berbeda tiap panggilan', () => {
    const codes = new Set(Array.from({ length: 50 }, generateRecoveryCode))
    expect(codes.size).toBe(50)
  })
})

describe('hashRecoveryCode', () => {
  test('hash tidak sama dengan kode aslinya', async () => {
    const code = generateRecoveryCode()
    expect(await hashRecoveryCode(code)).not.toBe(code)
  })

  test('dua hash dari kode sama tetap berbeda karena salt', async () => {
    const code = generateRecoveryCode()
    expect(await hashRecoveryCode(code)).not.toBe(await hashRecoveryCode(code))
  })
})

describe('verifyRecoveryCode', () => {
  test('menerima kode yang benar', async () => {
    const code = generateRecoveryCode()
    expect(await verifyRecoveryCode(code, await hashRecoveryCode(code))).toBe(true)
  })

  test('menolak kode yang salah', async () => {
    const hash = await hashRecoveryCode(generateRecoveryCode())
    expect(await verifyRecoveryCode(generateRecoveryCode(), hash)).toBe(false)
  })

  test('mengabaikan spasi yang tidak sengaja tersalin', async () => {
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(await verifyRecoveryCode(`  ${code} `, hash)).toBe(true)
  })

  test('mengabaikan besar-kecil huruf', async () => {
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(await verifyRecoveryCode(code.toLowerCase(), hash)).toBe(true)
  })

  test('mengembalikan false untuk hash yang rusak, bukan melempar error', async () => {
    expect(await verifyRecoveryCode(generateRecoveryCode(), 'bukan-hash')).toBe(false)
  })
})
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

```bash
bun test tests/lib/recovery-code.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/recovery-code'`.

- [ ] **Step 3: Tulis implementasi minimal**

`src/lib/recovery-code.ts`:

> Memakai `node:crypto`, **bukan** `Bun.password`. Test berjalan di bawah Bun,
> tetapi server produksi dijalankan `node .output/server/index.mjs` — API
> khusus Bun akan hilang di sana sementara test tetap hijau. `node:crypto`
> bekerja di kedua runtime.

```ts
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const GROUP_SIZE = 8
const BYTE_COUNT = 16
const SALT_BYTES = 16
const KEY_LENGTH = 64

/** Kode 32 heksadesimal huruf besar: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX */
export function generateRecoveryCode(): string {
  const hex = randomBytes(BYTE_COUNT).toString('hex').toUpperCase()
  return (hex.match(new RegExp(`.{${GROUP_SIZE}}`, 'g')) ?? []).join('-')
}

/** Menyeragamkan kode sebelum hash/verifikasi agar salin-tempel yang berantakan tetap diterima. */
function normalize(code: string): string {
  return code.replace(/\s/g, '').toUpperCase()
}

/** Mengembalikan `<salt hex>:<turunan hex>`. */
export async function hashRecoveryCode(code: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const derived = (await scryptAsync(normalize(code), salt, KEY_LENGTH)) as Buffer
  return `${salt.toString('hex')}:${derived.toString('hex')}`
}

export async function verifyRecoveryCode(code: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false

    const expected = Buffer.from(hashHex, 'hex')
    if (expected.length !== KEY_LENGTH) return false

    const derived = (await scryptAsync(
      normalize(code),
      Buffer.from(saltHex, 'hex'),
      KEY_LENGTH,
    )) as Buffer

    // Perbandingan waktu-tetap: jangan bocorkan berapa banyak byte yang cocok.
    return timingSafeEqual(expected, derived)
  } catch {
    // Hash rusak atau formatnya tidak dikenal — perlakukan sebagai tidak cocok.
    return false
  }
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```bash
bun test tests/lib/recovery-code.test.ts
```
Expected: PASS, 9 test.

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: modul recovery code dengan hash scrypt

Pakai node:crypto, bukan Bun.password, supaya tetap jalan di server
produksi yang dijalankan Node. Normalisasi spasi dan besar-kecil huruf
supaya kode hasil salin-tempel yang berantakan tetap diterima."
```

---

## Task 6: Skema database dan konfigurasi Better Auth

**Files:**
- Create: `src/db/schema.ts`, `src/lib/auth.ts`
- Create: `drizzle/` (hasil generate)

**Interfaces:**
- Consumes: `db` dari Task 4, `recoveryCodeHash` dari Task 5
- Produces:
  - Tabel `user`, `session`, `account`, `verification` diekspor dari `@/db/schema`
  - `auth` diekspor dari `@/lib/auth`
  - `user.recoveryCodeHash` (text, nullable — diisi tepat setelah pendaftaran)

- [ ] **Step 1: Buat `src/db/schema.ts`**

```ts
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  // Diisi server tepat setelah pendaftaran. Nullable karena Better Auth
  // membuat baris user lebih dulu, baru kita tempelkan hash-nya.
  recoveryCodeHash: text('recovery_code_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

- [ ] **Step 2: Buat `src/lib/auth.ts`**

```ts
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    // Tidak ada verifikasi email: alamatnya sintetis dan tidak pernah dikirimi apa pun.
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      recoveryCodeHash: {
        type: 'string',
        required: false,
        // input: false — klien tidak boleh menentukan hash-nya sendiri.
        input: false,
      },
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },

  plugins: [
    username(),
    // tanstackStartCookies HARUS jadi plugin terakhir.
    tanstackStartCookies(),
  ],
})
```

- [ ] **Step 3: Generate dan jalankan migrasi**

```bash
bun run db:generate
bun run db:migrate
```
Expected: berkas SQL muncul di `drizzle/`, migrasi selesai tanpa error.

- [ ] **Step 4: Verifikasi tabel benar-benar ada**

```bash
psql -d openframe -c '\d user'
```
Expected: tabel `user` dengan kolom `username`, `display_username`, dan `recovery_code_hash`.

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: skema Better Auth dengan plugin username dan recovery code

recoveryCodeHash dipasang input:false supaya klien tidak bisa
menentukan hash-nya sendiri lewat endpoint sign-up."
```

---

## Task 7: Handler auth, klien, dan helper sesi

**Files:**
- Create: `src/routes/api/auth/$.ts`, `src/lib/auth-client.ts`, `src/server/session.ts`

**Interfaces:**
- Consumes: `auth` dari Task 6
- Produces:
  - `authClient` dari `@/lib/auth-client` — punya `signIn.username`, `signOut`, `useSession`
  - `getSession(): Promise<Session | null>` dari `@/server/session`

- [ ] **Step 1: Pasang handler di `src/routes/api/auth/$.ts`**

```ts
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
})
```

- [ ] **Step 2: Buat `src/lib/auth-client.ts`**

```ts
import { usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [usernameClient()],
})
```

- [ ] **Step 3: Buat `src/server/session.ts`**

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  return await auth.api.getSession({ headers: getRequestHeaders() })
})
```

> Dokumentasi Better Auth juga menawarkan `ensureSession` yang melempar bila
> tidak ada sesi. Sengaja **tidak** dibuat sekarang: tidak ada pemanggilnya di
> Fase 0–1. Tambahkan di Fase 2 saat server function campaign benar-benar
> membutuhkannya.

- [ ] **Step 4: Verifikasi endpoint hidup**

```bash
bun dev
```
Di terminal lain:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/auth/session
```
Expected: `200` (badan respons `null` karena belum ada sesi).

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: pasang handler Better Auth dan helper sesi"
```

---

## Task 8: Server function pendaftaran (TDD)

Di sinilah email sintetis dibentuk. Klien tidak pernah memanggil `authClient.signUp` secara langsung — semuanya lewat server function ini agar alamat sintetis dan hash recovery code tidak bisa diintervensi dari luar.

**Files:**
- Create: `src/server/auth.ts`
- Test: `tests/server/auth.test.ts`

**Interfaces:**
- Consumes: `auth` (Task 6), `db`/`user` (Task 4/6), modul recovery code (Task 5)
- Produces:
  - `syntheticEmail(username: string): string`
  - `registerUser({ data: { username, password } }): Promise<{ recoveryCode: string }>`
  - `resetPassword({ data: { username, recoveryCode, newPassword } }): Promise<{ recoveryCode: string }>`

- [ ] **Step 1: Tulis test yang gagal**

`tests/server/auth.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { syntheticEmail } from '@/server/auth'

describe('syntheticEmail', () => {
  test('membentuk alamat di domain openframe.local', () => {
    expect(syntheticEmail('budi')).toBe('budi@openframe.local')
  })

  test('menurunkan huruf besar agar alamat selalu konsisten', () => {
    expect(syntheticEmail('BudiSantoso')).toBe('budisantoso@openframe.local')
  })

  test('username berbeda menghasilkan alamat berbeda', () => {
    expect(syntheticEmail('budi')).not.toBe(syntheticEmail('budi2'))
  })
})
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

```bash
bun test tests/server/auth.test.ts
```
Expected: FAIL — `Cannot find module '@/server/auth'`.

- [ ] **Step 3: Tulis `src/server/auth.ts`**

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth'
import {
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '@/lib/recovery-code'

/**
 * Better Auth mewajibkan kolom email. OpenFrame tidak pernah memintanya
 * (lihat spec P1), jadi alamatnya dibentuk di sini dan tidak pernah
 * ditampilkan, dikirimi, atau dipakai untuk masuk.
 */
export function syntheticEmail(username: string): string {
  return `${username.toLowerCase()}@openframe.local`
}

const usernameSchema = z
  .string()
  .min(3, 'Username minimal 3 karakter')
  .max(30, 'Username maksimal 30 karakter')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan garis bawah')

const passwordSchema = z.string().min(6, 'Password minimal 6 karakter')

const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export const registerUser = createServerFn({ method: 'POST' })
  .validator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const recoveryCode = generateRecoveryCode()
    const recoveryCodeHash = await hashRecoveryCode(recoveryCode)

    const result = await auth.api.signUpEmail({
      body: {
        email: syntheticEmail(data.username),
        username: data.username,
        name: data.username,
        password: data.password,
      },
      headers: getRequestHeaders(),
    })

    // Ditempelkan setelah pendaftaran karena recoveryCodeHash memakai
    // input:false — klien tidak boleh menentukannya lewat endpoint sign-up.
    await db.update(user).set({ recoveryCodeHash }).where(eq(user.id, result.user.id))

    // Satu-satunya kesempatan kode ini terlihat.
    return { recoveryCode }
  })

const resetSchema = z.object({
  username: usernameSchema,
  recoveryCode: z.string().min(1, 'Recovery code wajib diisi'),
  newPassword: passwordSchema,
})

export const resetPassword = createServerFn({ method: 'POST' })
  .validator((input: unknown) => resetSchema.parse(input))
  .handler(async ({ data }) => {
    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.username, data.username.toLowerCase()))
      .limit(1)

    // Pesan yang sama untuk username tidak ada maupun kode salah, supaya
    // tidak bisa dipakai menebak username mana yang terdaftar.
    const invalid = new Error('Username atau recovery code salah')
    if (!found?.recoveryCodeHash) throw invalid
    if (!(await verifyRecoveryCode(data.recoveryCode, found.recoveryCodeHash))) throw invalid

    const ctx = await auth.$context
    const hashed = await ctx.password.hash(data.newPassword)
    await ctx.internalAdapter.updatePassword(found.id, hashed)

    // Kode lama hangus begitu dipakai.
    const nextCode = generateRecoveryCode()
    await db
      .update(user)
      .set({ recoveryCodeHash: await hashRecoveryCode(nextCode) })
      .where(eq(user.id, found.id))

    return { recoveryCode: nextCode }
  })
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```bash
bun test tests/server/auth.test.ts
```
Expected: PASS, 3 test.

- [ ] **Step 5: Verifikasi alur pendaftaran sungguhan lewat HTTP**

```bash
bun dev
```
Di terminal lain:
```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"tesmanual@openframe.local","username":"tesmanual","name":"tesmanual","password":"rahasia123"}' \
  -i | head -20
```
Expected: `200`, dan header `Set-Cookie` berisi cookie sesi dengan `HttpOnly`.

Verifikasi `recoveryCodeHash` **tidak** bisa disuntik klien:
```bash
psql -d openframe -c "SELECT username, recovery_code_hash FROM \"user\" WHERE username='tesmanual';"
```
Expected: `recovery_code_hash` bernilai `NULL` — karena jalur ini melewati server function kita.

Bersihkan:
```bash
psql -d openframe -c "DELETE FROM \"user\" WHERE username='tesmanual';"
```

- [ ] **Step 6: Commit**

```bash
bun run check
git add -A
git commit -m "feat: server function daftar dan reset password

Email sintetis dan hash recovery code dibentuk di server supaya tidak
bisa diintervensi klien. Reset memakai pesan error seragam agar tidak
bocor username mana yang terdaftar."
```

---

## Task 9: Halaman daftar

**Files:**
- Create: `src/routes/register.tsx`

**Interfaces:**
- Consumes: `registerUser` (Task 8), `ThemeToggle` (Task 2)
- Produces: rute `/register`

- [ ] **Step 1: Buat `src/routes/register.tsx`**

```tsx
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { registerUser } from '@/server/auth'

export const Route = createFileRoute('/register')({ component: RegisterPage })

function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await registerUser({ data: { username, password } })
      setRecoveryCode(result.recoveryCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (recoveryCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
          <h1 className="mb-1 font-display text-2xl">🔑 Simpan Kode</h1>
          <p className="mb-7 text-sm text-muted">
            Akun berhasil dibuat! Kode ini <strong>hanya muncul sekali</strong> — simpan di
            tempat aman seperti catatan atau password manager.
          </p>

          <output className="mb-5 block rounded-base border-2 border-dashed border-accent bg-surface2 p-5 text-center font-mono tracking-widest text-accent">
            {recoveryCode}
          </output>

          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            ⚠️ Tanpa kode ini, kamu tidak bisa reset password kalau lupa.
          </p>

          <button
            type="button"
            onClick={copyCode}
            className="mb-3 w-full rounded-pill border border-border py-3 font-semibold transition-colors hover:bg-surface2"
          >
            {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/dashboard' })}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px"
          >
            Sudah disimpan → Masuk Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-5 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
        <h1 className="mb-1 font-display text-2xl">
          OpenFrame<span className="text-accent">.</span>
        </h1>
        <p className="mb-7 text-sm text-muted">
          Buat akun gratis — tanpa email, tanpa nomor telepon
        </p>

        {error && (
          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Username <span className="normal-case tracking-normal">min. 3 karakter</span>
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              // biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus pendaftaran
              autoFocus
              placeholder="pilih username unik"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Password <span className="normal-case tracking-normal">min. 6 karakter</span>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Membuat akun...' : 'Daftar Sekarang →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verifikasi di browser**

```bash
bun dev
```
Buka `http://localhost:3000/register`. Daftar dengan username `budi` dan password `rahasia123`.
Expected: layar recovery code muncul dengan kode berformat `XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX`. Tombol salin berubah jadi "✅ Tersalin!".

Verifikasi hash tersimpan:
```bash
psql -d openframe -c "SELECT username, email, recovery_code_hash IS NOT NULL AS punya_kode FROM \"user\" WHERE username='budi';"
```
Expected: `budi | budi@openframe.local | t`

- [ ] **Step 3: Commit**

```bash
bun run check
git add -A
git commit -m "feat: halaman daftar dengan penyerahan recovery code"
```

---

## Task 10: Halaman masuk, keluar, dan dashboard terproteksi

**Files:**
- Create: `src/routes/login.tsx`, `src/routes/dashboard.tsx`

**Interfaces:**
- Consumes: `authClient` (Task 7), `getSession` (Task 7)
- Produces: rute `/login` dan `/dashboard`; `/dashboard` melempar ke `/login` bila tidak ada sesi

- [ ] **Step 1: Buat `src/routes/login.tsx`**

```tsx
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await authClient.signIn.username({ username, password })
    setLoading(false)
    if (authError) {
      // Pesan seragam: jangan bocorkan username mana yang terdaftar.
      setError('Username atau password salah')
      return
    }
    navigate({ to: '/dashboard' })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-5 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
        <h1 className="mb-1 font-display text-2xl">
          OpenFrame<span className="text-accent">.</span>
        </h1>
        <p className="mb-7 text-sm text-muted">Masuk ke akun kamu dan mulai berkarya</p>

        {error && (
          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Username
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              // biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus masuk
              autoFocus
              placeholder="username kamu"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="mb-2 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <div className="mb-5 text-right">
            <Link to="/lupa-password" className="text-xs text-accent hover:underline">
              Lupa password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Memproses...' : 'Masuk →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Buat `src/routes/dashboard.tsx`**

Isi sebenarnya menyusul di Fase 2. Yang penting sekarang: proteksinya bekerja.

```tsx
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { getSession } from '@/server/session'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()

  async function handleLogout() {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between py-6">
        <h1 className="font-display text-2xl">Kampanye Saya</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="rounded-pill border border-border bg-surface2 px-3 py-1 text-sm text-muted">
            👤 {session.user.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:bg-surface2"
          >
            Keluar
          </button>
        </div>
      </header>

      <p className="text-muted">Daftar kampanye muncul di sini pada Fase 2.</p>
    </main>
  )
}
```

- [ ] **Step 3: Verifikasi proteksi rute**

```bash
bun dev
```

1. Buka `http://localhost:3000/dashboard` dalam jendela penyamaran → Expected: dilempar ke `/login`.
2. Masuk sebagai `budi` / `rahasia123` → Expected: mendarat di `/dashboard`, terlihat `👤 budi`.
3. Cek cookie di DevTools → Application → Cookies → Expected: cookie sesi bertanda **HttpOnly**, dan `localStorage` **kosong**.
4. Klik "Keluar" → Expected: kembali ke `/login`; membuka `/dashboard` lagi melempar ke `/login`.

- [ ] **Step 4: Commit**

```bash
bun run check
git add -A
git commit -m "feat: halaman masuk, keluar, dan dashboard terproteksi

Sesi memakai cookie HTTP-only, bukan JWT di localStorage seperti
aplikasi lama."
```

---

## Task 11: Halaman reset password

**Files:**
- Create: `src/routes/lupa-password.tsx`

**Interfaces:**
- Consumes: `resetPassword` (Task 8)
- Produces: rute `/lupa-password`

- [ ] **Step 1: Buat `src/routes/lupa-password.tsx`**

```tsx
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { resetPassword } from '@/server/auth'

export const Route = createFileRoute('/lupa-password')({ component: LupaPasswordPage })

const inputClass =
  'w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent'
const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted'

function LupaPasswordPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [nextCode, setNextCode] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('Password baru dan konfirmasi tidak cocok')
      return
    }
    setLoading(true)
    try {
      const result = await resetPassword({ data: { username, recoveryCode, newPassword } })
      setNextCode(result.recoveryCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(nextCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (nextCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
          <h1 className="mb-1 font-display text-2xl">✅ Reset Berhasil</h1>
          <p className="mb-7 text-sm text-muted">
            Password berhasil diperbarui. Recovery code lama sudah tidak berlaku — simpan yang
            baru ini.
          </p>

          <output className="mb-5 block rounded-base border-2 border-dashed border-accent bg-surface2 p-5 text-center font-mono tracking-widest text-accent">
            {nextCode}
          </output>

          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            ⚠️ Ini recovery code barumu. Simpan sekarang sebelum menutup halaman.
          </p>

          <button
            type="button"
            onClick={copyCode}
            className="mb-3 w-full rounded-pill border border-border py-3 font-semibold transition-colors hover:bg-surface2"
          >
            {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code Baru'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px"
          >
            Lanjut ke Halaman Masuk →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-5 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
        <h1 className="mb-1 font-display text-2xl">Reset Password</h1>
        <p className="mb-7 text-sm text-muted">
          Masukkan username dan recovery code yang kamu simpan saat mendaftar
        </p>

        {error && (
          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className={labelClass}>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              // biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus reset
              autoFocus
              placeholder="username kamu"
              className={inputClass}
            />
          </label>

          <label className="mb-4 block">
            <span className={labelClass}>Recovery Code</span>
            <input
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              required
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              className={`${inputClass} font-mono tracking-wide`}
            />
          </label>

          <label className="mb-4 block">
            <span className={labelClass}>
              Password Baru <span className="normal-case tracking-normal">min. 6 karakter</span>
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <label className="mb-6 block">
            <span className={labelClass}>Konfirmasi Password Baru</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Memproses...' : 'Reset Password →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Ingat password?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verifikasi alur reset dari ujung ke ujung**

```bash
bun dev
```

1. Buka `/lupa-password`. Isi username `budi`, recovery code yang disimpan dari Task 9, password baru `passwordbaru123`, konfirmasi sama.
2. Expected: layar sukses dengan recovery code **baru** yang berbeda dari sebelumnya.
3. Buka `/login`, masuk dengan `budi` / `passwordbaru123` → Expected: berhasil.
4. Buka `/lupa-password` lagi, coba pakai recovery code **lama** → Expected: gagal dengan "Username atau recovery code salah".
5. Coba username yang tidak ada, misal `tidakada`, dengan kode asal → Expected: pesan error **sama persis** seperti langkah 4 (tidak bocor username mana yang terdaftar).
6. Coba password baru dan konfirmasi berbeda → Expected: "Password baru dan konfirmasi tidak cocok", tanpa permintaan ke server.

- [ ] **Step 3: Commit**

```bash
bun run check
git add -A
git commit -m "feat: halaman reset password lewat recovery code

Kode lama hangus setelah dipakai dan diganti kode baru."
```

---

## Task 12: Verifikasi menyeluruh Fase 0–1

**Files:**
- Modify: `.env.example` (kalau ada variabel yang terlewat)
- Create: `README.md`

**Interfaces:**
- Consumes: semuanya
- Produces: `README.md` dengan langkah setup yang benar-benar bisa dijalankan

- [ ] **Step 1: Jalankan seluruh test**

```bash
bun test
```
Expected: PASS, 12 test (9 recovery code + 3 synthetic email), 0 gagal.

- [ ] **Step 2: Pastikan build produksi berhasil**

```bash
bun run build
```
Expected: selesai tanpa error, `.output/` terbentuk.

- [ ] **Step 3: Pastikan lint dan tipe bersih**

```bash
bun run check
bun run typecheck
```
Expected: keduanya tanpa error.

Verifikasi tipe Bun benar-benar berasal dari dalam repo, bukan dari paket
nyasar di direktori induk:
```bash
bun run typecheck -- --listFiles | grep -c "^/Users/[^/]*/node_modules"
```
Expected: `0`. Angka selain nol berarti TypeScript menaiki pohon direktori
keluar dari project — di checkout bersih typecheck-nya akan gagal.

- [ ] **Step 4: Tulis `README.md`**

```markdown
# OpenFrame

Bikin twibbon multi-slot. Gratis, tanpa email, tanpa nomor telepon.

Creator mengunggah frame PNG, menggambar area foto di atasnya, lalu membagikan
tautan. Partisipan mengisi area itu dengan fotonya dan mengunduh hasilnya.

## Jalankan lokal

Butuh [Bun](https://bun.sh) dan PostgreSQL.

```bash
bun install
createdb openframe

{
  echo "DATABASE_URL=postgres://localhost:5432/openframe"
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
  echo "BETTER_AUTH_URL=http://localhost:3000"
} > .env

bun run db:migrate
bun dev
```

Buka http://localhost:3000

## Perintah

| Perintah | Kegunaan |
|---|---|
| `bun dev` | Server pengembangan di port 3000 |
| `bun test` | Jalankan test |
| `bun run check` | Lint + format (Biome) |
| `bun run typecheck` | Cek tipe TypeScript |
| `bun run build` | Build produksi |
| `bun run db:generate` | Buat berkas migrasi dari perubahan skema |
| `bun run db:migrate` | Terapkan migrasi |

## Privasi

OpenFrame tidak pernah meminta email maupun nomor telepon. Reset password
memakai recovery code yang diberikan sekali saat mendaftar. Foto partisipan
diproses sepenuhnya di browser dan tidak pernah dikirim ke server.

## Dokumen

- Spesifikasi desain: `docs/superpowers/specs/`
- Rencana implementasi: `docs/superpowers/plans/`
- Persyaratan produk: `PRD.md`
```

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "docs: README dengan langkah setup Fase 0-1

Fase 0-1 selesai: fondasi TanStack Start, token desain, Postgres via
Drizzle, dan autentikasi username + recovery code tanpa email."
```

---

## Definition of Done — Fase 0–1

- [ ] `backend/` dan `frontend/` terhapus; riwayatnya tetap ada di `81149b9`
- [ ] `bun dev` menyalakan aplikasi di port 3000
- [ ] `bun run build` berhasil
- [ ] `bun test` lulus semua (12 test)
- [ ] `bun run check` bersih
- [ ] Latar `#0B0B0D`, accent `#CAFF33`, judul Bricolage Grotesque, isi Nunito
- [ ] Toggle tema bertahan setelah muat ulang, tanpa kedipan saat SSR
- [ ] Bisa daftar dengan username saja — **tidak ada** field email atau telepon di mana pun
- [ ] Recovery code tampil sekali saat daftar; hanya hash yang tersimpan di database
- [ ] Bisa masuk dengan username + password
- [ ] Cookie sesi bertanda `HttpOnly`; `localStorage` kosong
- [ ] `/dashboard` melempar ke `/login` saat belum masuk
- [ ] Reset password bekerja; kode lama hangus setelah dipakai
- [ ] Username tidak terdaftar dan recovery code salah memberi pesan error **identik**
- [ ] Semua teks yang terlihat pengguna berbahasa Indonesia

---

## Yang menyusul di fase berikutnya

Sengaja **tidak** ada dalam plan ini, agar tidak dibangun sebelum dibutuhkan:

| Menyusul di | Isi |
|---|---|
| Fase 2 | `lib/geometry.ts`, `lib/slug.ts`, skema `campaigns` + `frame_slots`, upload frame + validasi Sharp, area editor satu slot |
| Fase 3 | `slot-filler/`, `composite.ts`, unduhan sisi klien |
| Fase 4 | Multi-slot: tambah, hapus, urutkan ulang, resize |
| Fase 5 | Mode multi-photo |
| Fase 6 | Gallery publik, pencarian, paginasi |
| Fase 7 | Edit/hapus campaign, aksesibilitas, performa, E2E Playwright |
