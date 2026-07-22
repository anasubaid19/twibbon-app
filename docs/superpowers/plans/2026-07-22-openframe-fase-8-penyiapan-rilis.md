# OpenFrame Fase 8: Penyiapan Rilis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melunasi tiga utang yang menghalangi deploy publik: aplikasi belum bisa disajikan di produksi, pendaftaran tidak dibatasi laju sama sekali, dan status rate limit hilang tiap proses restart.

**Architecture:** Build sudah menghasilkan handler bergaya `{ fetch }`, jadi penyajian produksi cukup satu berkas `Bun.serve()` yang menyajikan aset statis lalu menyerahkan sisanya ke handler itu. Pembatas laju memakai satu tabel `rate_limit` yang **kita** miliki: pembatas kita menghitungnya lewat satu upsert atomik, sedangkan Better Auth memakainya lewat `customStorage` dengan nilai yang tidak pernah kita tafsirkan. Dengan begitu tidak ada ketergantungan pada bentuk skema internal Better Auth.

**Tech Stack:** Bun.serve · TanStack Start 1.168 · Drizzle · PostgreSQL · Better Auth 1.6

**Dependensi baru:** tidak ada.

**Fase sebelumnya:** `docs/superpowers/plans/2026-07-22-openframe-fase-7-hapus-ganti-frame-dan-poles.md`

---

## Kenapa fase ini ada

Tiga temuan yang tercatat sejak review Fase 0–1 dan belum pernah disentuh:

1. **Belum ada penyajian produksi.** `bun run build` menghasilkan `dist/server/server.js` berisi handler `{ fetch }` tanpa `listen()`. `bun run start` masih sekadar mencetak pesan lalu keluar dengan kode 1.
2. **`registerUser` dan `resetPassword` tidak dibatasi laju.** Keduanya `createServerFn`, sedangkan rate limiter Better Auth hanya menutupi route `auth.handler`. Dokumentasi Better Auth menyatakannya terang-terangan: *"server-side requests via auth.api are not affected."* `registerUser` memanggil `auth.api.signUpEmail`, jadi spam pendaftaran sama sekali tidak tertahan.
3. **Status rate limit hilang tiap restart** karena disimpan di memori proses, dan tidak dibagi antar-instans.

Ketiganya digabung karena #2 dan #3 memakai tabel yang sama, dan #1 yang menentukan topologi tempat keduanya berjalan.

---

## Global Constraints

- **Bahasa Indonesia** untuk pesan error dan komentar. Santai, "kamu".
- **Fail closed.** Kalau pembatas laju sendiri gagal (database tidak terjangkau), permintaan **ditolak**, bukan diloloskan. Pembatas yang diam saat rusak lebih buruk daripada tidak ada, karena ia memberi rasa aman palsu.
- Pesan penolakan **tidak** membocorkan apakah username-nya ada.
- **P4 / ponytail.** Tandai penyederhanaan dengan `// ponytail:`.
- **Jangan ubah** logika fitur Fase 2–7. Fase ini hanya menyentuh penyajian, pembatas laju, dan skema tabel baru.
- Biome, `bun run check` sebelum commit. **`bun run build` wajib.**
- Commit Indonesia, conventional commits.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `server.ts` | **Baru.** Penyaji produksi: aset statis + handler SSR |
| `package.json` | **Ubah.** `start` benar-benar menjalankan server |
| `src/db/schema.ts` | **Ubah.** Tabel `rate_limit` |
| `src/server/batas-laju.ts` | **Baru.** `batasiLaju()` atomik + pembaca IP |
| `src/lib/auth.ts` | **Ubah.** `customStorage` menunjuk tabel yang sama |
| `src/server/auth.ts` | **Ubah.** `registerUser` dan `resetPassword` dibatasi |
| `tests/server/batas-laju.test.ts` | **Baru.** Perilaku jendela dan penghitungan |
| `README.md` | **Ubah.** Cara menjalankan produksi |

---

## Task 1: Penyaji produksi

**Files:**
- Create: `server.ts`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Consumes: `dist/server/server.js` (hasil build), `dist/client/**`
- Produces: `bun run start` menyalakan server di `PORT`

- [ ] **Step 1: Tulis `server.ts`**

Build menghasilkan objek `{ fetch }`, jadi tidak perlu adaptor apa pun.

```ts
/**
 * Penyaji produksi.
 *
 * `bun run build` menghasilkan handler bergaya `{ fetch }` di
 * `dist/server/server.js` — tanpa `listen()` sendiri. Berkas ini yang
 * menyalakannya, sekaligus menyajikan aset statis yang tidak diurus handler
 * itu.
 *
 * ponytail: Bun.serve() langsung, tanpa framework HTTP tambahan. Yang
 * dibutuhkan cuma "coba berkas dulu, kalau tidak ada serahkan ke SSR".
 */
import { serve } from 'bun'
import handler from './dist/server/server.js'

const PORT = Number(process.env.PORT ?? 3000)
const KLIEN = 'dist/client'

/** Aset ber-hash aman di-cache selamanya; sisanya tidak. */
function cacheUntuk(pathname: string): string {
  return pathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600'
}

serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url)

    // Jangan pernah keluar dari direktori klien. `pathname` datang dari
    // permintaan, jadi ia tidak boleh dipercaya sebagai jalur berkas.
    if (url.pathname !== '/' && !url.pathname.includes('..')) {
      const berkas = Bun.file(`${KLIEN}${url.pathname}`)
      if (await berkas.exists()) {
        return new Response(berkas, {
          headers: { 'Cache-Control': cacheUntuk(url.pathname) },
        })
      }
    }

    return handler.fetch(request)
  },
})

// biome-ignore lint/suspicious/noConsole: satu baris saat start, supaya jelas server benar-benar hidup
console.log(`OpenFrame jalan di http://localhost:${PORT}`)
```

- [ ] **Step 2: Sambungkan skrip `start`**

Di `package.json`, ganti skrip `start` yang sekarang cuma mencetak pesan:

```json
    "start": "bun run server.ts",
```

Tambahkan `PORT` ke `.env.example`:

```
PORT=3000
```

- [ ] **Step 3: Buktikan produksi benar-benar melayani**

```bash
bun run build
bun run start &
sleep 3
curl -s -o /dev/null -w 'beranda   %{http_code}\n' -L http://localhost:3000/
curl -s -o /dev/null -w 'login     %{http_code}\n' http://localhost:3000/login
curl -s -o /dev/null -w 'aset      %{http_code} %{content_type}\n' "http://localhost:3000$(curl -sL http://localhost:3000/ | grep -oE '/assets/[^"]+\.js' | head -1)"
```
Expected: beranda 200, login 200, aset 200 dengan `content_type` JavaScript.

> `bun run build` **wajib** dijalankan lebih dulu. Tanpa `dist/`, `server.ts`
> gagal mengimpor dan pesannya menyesatkan.

- [ ] **Step 4: Commit**

```bash
bun run check
git add -A
git commit -m "feat: penyaji produksi dengan Bun.serve

Build sudah menghasilkan handler bergaya { fetch }, jadi yang kurang cuma
yang menyalakannya plus penyajian aset statis. Tidak perlu framework HTTP
tambahan.

bun run start berhenti mencetak pesan 'belum disambungkan'."
```

---

## Task 2: Pembatas laju yang bertahan (TDD)

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/server/batas-laju.ts`
- Test: `tests/server/batas-laju.test.ts`

**Interfaces:**
- Produces:
  - `batasiLaju(kunci: string, maks: number, jendelaDetik: number): Promise<void>` — melempar bila kuota habis
  - `kunciDariPermintaan(prefiks: string): string`
  - `jendelaBaru(mulai: Date, jendelaDetik: number, sekarang: Date): boolean` — murni, diuji

- [ ] **Step 1: Tambahkan tabelnya**

```ts
export const rateLimit = pgTable('rate_limit', {
  key: text('key').primaryKey(),
  // Dipakai pembatas milik kita: penghitung atomik per jendela.
  count: integer('count').default(0).notNull(),
  windowStart: timestamp('window_start').defaultNow().notNull(),
  // Dipakai Better Auth lewat customStorage. Isinya opaque — kita menyimpan
  // dan mengembalikannya apa adanya, tidak pernah menafsirkannya, supaya
  // perubahan bentuk internal Better Auth tidak merembet ke sini.
  value: text('value'),
})
```

```bash
bun run db:generate && bun run db:migrate
```

- [ ] **Step 2: Tulis test yang gagal**

Yang diuji bagian murninya — kapan sebuah jendela dianggap habis:

```ts
import { describe, expect, test } from 'bun:test'
import { jendelaBaru } from '@/server/batas-laju'

describe('jendelaBaru', () => {
  const mulai = new Date('2026-07-22T10:00:00Z')

  test('masih di dalam jendela', () => {
    expect(jendelaBaru(mulai, 60, new Date('2026-07-22T10:00:30Z'))).toBe(false)
  })

  test('tepat di batas masih dianggap jendela yang sama', () => {
    expect(jendelaBaru(mulai, 60, new Date('2026-07-22T10:01:00Z'))).toBe(false)
  })

  test('lewat sedikit dari batas sudah jendela baru', () => {
    expect(jendelaBaru(mulai, 60, new Date('2026-07-22T10:01:01Z'))).toBe(true)
  })

  test('jam mundur tidak membuka kuota tanpa batas', () => {
    // Jam server bisa mundur karena NTP. Kalau itu dianggap jendela baru,
    // penyerang yang bisa memicunya dapat kuota gratis.
    expect(jendelaBaru(mulai, 60, new Date('2026-07-22T09:59:00Z'))).toBe(false)
  })
})
```

- [ ] **Step 3: Tulis implementasinya**

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { rateLimit } from '@/db/schema'

/** Apakah `sekarang` sudah melewati jendela yang dimulai pada `mulai`. */
export function jendelaBaru(mulai: Date, jendelaDetik: number, sekarang: Date): boolean {
  return sekarang.getTime() - mulai.getTime() > jendelaDetik * 1000
}

/**
 * Kunci pembatas untuk permintaan yang sedang berjalan.
 *
 * Di belakang proxy, IP asli ada di `x-forwarded-for`. Kalau header itu tidak
 * diteruskan, semua lalu lintas jatuh ke satu ember bersama — membatasi lebih
 * ketat dari seharusnya, tapi tidak pernah membiarkan lolos. Itu arah gagal
 * yang benar.
 */
export function kunciDariPermintaan(prefiks: string): string {
  const h = getRequestHeaders()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || 'tanpa-ip'
  return `${prefiks}:${ip}`
}

const TERLALU_SERING = 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.'

/**
 * Menaikkan penghitung dan melempar bila kuotanya habis.
 *
 * Satu pernyataan upsert, bukan baca-lalu-tulis: dua permintaan bersamaan
 * harus menghasilkan dua hitungan, bukan satu. `GREATEST` menjaga agar jam
 * yang mundur tidak membuka jendela baru.
 */
export async function batasiLaju(
  kunci: string,
  maks: number,
  jendelaDetik: number,
): Promise<void> {
  let hitungan: number
  try {
    const hasil = await db.execute(sql`
      INSERT INTO rate_limit (key, count, window_start)
      VALUES (${kunci}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN now() - rate_limit.window_start > ${sql.raw(`interval '${jendelaDetik} seconds'`)}
          THEN 1 ELSE rate_limit.count + 1 END,
        window_start = CASE
          WHEN now() - rate_limit.window_start > ${sql.raw(`interval '${jendelaDetik} seconds'`)}
          THEN now() ELSE rate_limit.window_start END
      RETURNING count
    `)
    hitungan = Number((hasil as unknown as { count: number }[])[0]?.count ?? 0)
  } catch {
    // Fail closed. Pembatas yang diam saat rusak lebih buruk daripada tidak
    // ada sama sekali, karena ia memberi rasa aman palsu.
    throw new Error(TERLALU_SERING)
  }

  if (hitungan > maks) throw new Error(TERLALU_SERING)
}
```

> `sql.raw` dipakai **hanya** untuk `jendelaDetik`, yang selalu konstanta di
> kode kita dan tidak pernah datang dari pengguna. Kunci dan nilai lainnya
> tetap terparameterisasi.

- [ ] **Step 4: Jalankan test dan commit**

```bash
bun test tests/server/batas-laju.test.ts
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: pembatas laju berbasis database

Satu upsert atomik, bukan baca-lalu-tulis: dua permintaan bersamaan harus
menghasilkan dua hitungan.

Gagal tertutup — kalau database tidak terjangkau, permintaan ditolak.
Pembatas yang diam saat rusak lebih buruk daripada tidak ada, karena ia
memberi rasa aman palsu."
```

---

## Task 3: Pasang pembatas di titik yang bocor

**Files:**
- Modify: `src/server/auth.ts`, `src/lib/auth.ts`

- [ ] **Step 1: Batasi `registerUser` dan `resetPassword`**

Di `src/server/auth.ts`, panggil di awal masing-masing handler — **sebelum**
pekerjaan apa pun, termasuk sebelum scrypt, supaya percobaan yang ditolak juga
tidak memakan CPU:

```ts
    // Pendaftaran adalah titik terlemah: rate limiter Better Auth hanya
    // menutupi route auth.handler, sedangkan ini server function yang
    // memanggil auth.api secara langsung.
    await batasiLaju(kunciDariPermintaan('daftar'), 5, 600)
```

Untuk `resetPassword`, batas lebih ketat karena ia menebak recovery code:

```ts
    await batasiLaju(kunciDariPermintaan('reset'), 5, 900)
```

> Pesannya sengaja sama untuk semua kasus dan tidak menyebut username, supaya
> tidak bisa dipakai menebak akun mana yang ada — konsisten dengan pesan
> seragam yang sudah dipakai `resetPassword` sejak Fase 1.

- [ ] **Step 2: Arahkan Better Auth ke tabel yang sama**

Di `src/lib/auth.ts`:

```ts
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    // Status pembatas bertahan melewati restart dan dibagi antar-instans.
    // Nilainya disimpan opaque: kita tidak pernah menafsirkan bentuknya,
    // jadi perubahan internal Better Auth tidak merembet ke skema kita.
    customStorage: {
      get: async (key) => {
        const [row] = await db
          .select({ value: rateLimitTable.value })
          .from(rateLimitTable)
          .where(eq(rateLimitTable.key, key))
          .limit(1)
        return row?.value ? JSON.parse(row.value) : undefined
      },
      set: async (key, value) => {
        const teks = JSON.stringify(value)
        await db
          .insert(rateLimitTable)
          .values({ key, value: teks })
          .onConflictDoUpdate({ target: rateLimitTable.key, set: { value: teks } })
      },
    },
  },
```

- [ ] **Step 3: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: batasi laju pendaftaran dan reset password

Dokumentasi Better Auth menyatakannya terang-terangan: permintaan lewat
auth.api tidak tersentuh rate limiter. registerUser memanggil
auth.api.signUpEmail, jadi selama ini spam pendaftaran sama sekali tidak
tertahan.

Pembatas dipanggil sebelum pekerjaan apa pun, termasuk sebelum scrypt,
supaya percobaan yang ditolak tidak memakan CPU."
```

---

## Task 4: Verifikasi menyeluruh

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 105 test (101 + 4 jendela), sisanya bersih.

- [ ] **Step 2: Pembatas benar-benar menahan**

Jalankan produksi, lalu daftar berulang kali dari satu klien:

```bash
for i in $(seq 1 8); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3000/_serverFn/<id-registerUser> \
    -H 'x-tsr-serverFn: true' -H 'Origin: http://localhost:3000' \
    -H 'Content-Type: application/json' --data "<payload seroval>"
done
```

Expected: beberapa percobaan pertama berhasil, lalu badan respons memuat
`Terlalu banyak percobaan`. Pesannya **tidak** menyebut username.

- [ ] **Step 3: Status bertahan melewati restart**

Habiskan kuota, matikan server, nyalakan lagi, lalu coba sekali:

Expected: masih tertahan. Sebelum fase ini, restart mengembalikan kuota penuh.

```bash
psql -d openframe -c "SELECT key, count FROM rate_limit ORDER BY key;"
```
Expected: baris berkunci `daftar:<ip>` dengan hitungan yang sesuai.

- [ ] **Step 4: Pengguna sah tidak ikut terkena**

Dari IP berbeda (atau setelah jendelanya lewat), pendaftaran normal tetap
berhasil. Rate limiter yang memblokir pengguna sungguhan lebih buruk daripada
tidak ada.

- [ ] **Step 5: Perbarui README dan commit**

Tambahkan cara menjalankan produksi, dan hapus catatan "belum disambungkan".

```bash
git add -A
git commit -m "docs: README cara menjalankan produksi"
```

---

## Definition of Done — Fase 8

- [ ] `bun test` (105), `typecheck`, `check`, `build` bersih
- [ ] `bun run start` menyalakan server yang melayani halaman **dan** aset statis
- [ ] Aset ber-hash dikirim dengan `Cache-Control: immutable`
- [ ] Pendaftaran berulang dari satu klien tertahan dengan pesan Indonesia
- [ ] Pesan penolakan tidak membocorkan keberadaan username
- [ ] Status pembatas **bertahan melewati restart**
- [ ] Pembatas gagal tertutup saat database tidak terjangkau
- [ ] Pengguna sah dari IP berbeda tidak ikut tertahan
- [ ] README menjelaskan cara menjalankan produksi

---

## Yang tetap di luar cakupan

- **HTTPS dan reverse proxy.** Diserahkan ke lapisan deploy. Kalau memakai proxy, `x-forwarded-for` **wajib** diteruskan — kalau tidak, semua pengunjung berbagi satu ember pembatas.
- **Pembersihan baris `rate_limit` lama.** Barisnya kecil dan tertimpa sendiri per kunci. Kalau nanti tumbuh, satu cron `DELETE ... WHERE window_start < now() - interval '1 day'` sudah cukup.
- **CDN untuk aset.** Header cache-nya sudah benar; menaruh CDN di depannya tidak menuntut perubahan kode.
