# OpenFrame Fase 6: Landing dan Galeri Publik — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route `/` berhenti jadi placeholder dan menjadi halaman depan sungguhan: hero singkat, lalu galeri campaign publik dengan pencarian nama dan paginasi.

**Architecture:** Kata kunci dan nomor halaman hidup di **URL**, bukan state komponen — hasil pencarian jadi bisa dibagikan, tombol back browser bekerja, dan loader TanStack Router yang mengambil datanya. `campaigns.listPublic` mengembalikan baris **dan** jumlah totalnya dalam satu panggilan, karena paginasi tidak bisa dirender tanpa keduanya.

**Tech Stack:** TanStack Start · React 19 · Drizzle · Zod 4 · shadcn/ui + Base UI · Bun

**Dependensi baru:** tidak ada. Framer Motion **tidak** dipakai di sini — tidak ada gesture; fade-up yang sudah ada di `app.css` sudah cukup, dan memakai FM untuk itu melanggar aturan 33 secara eksplisit.

**Fase sebelumnya:** `docs/superpowers/plans/2026-07-22-openframe-fase-4-5-multi-slot-dan-multi-photo.md`

---

## Global Constraints

- **Bahasa Indonesia**, santai, "kamu". Brand: **OpenFrame**.
- **Hanya campaign publik** yang boleh muncul. `isPublic` masuk ke dalam WHERE, bukan disaring setelah query.
- Respons galeri **tidak boleh** memuat `userId` maupun email sintetis.
- **P4 / ponytail.** Tandai penyederhanaan dengan `// ponytail:`.
- Komponen shadcn baru **hanya** kalau butuh. Rencana: tidak ada — `Card`, `Button`, `Input`, `Badge` sudah cukup.
- **Jangan ubah** kode Fase 0–5 yang tidak disebut plan ini.
- Biome, `bun run check` sebelum commit. **`bun run build` wajib.**
- Commit Indonesia, conventional commits.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/server/campaigns.ts` | **Ubah.** Tambah `listPublic` |
| `src/routes/index.tsx` | **Ubah.** Landing + galeri, menggantikan placeholder |
| `tests/server/pencarian.test.ts` | **Baru.** Normalisasi kata kunci |

Tidak ada komponen baru. Kartu galeri ditulis langsung di route — ia hanya dipakai di satu tempat, dan mengekstraknya lebih dulu adalah abstraksi yang belum diminta.

---

## Task 1: `campaigns.listPublic`

**Files:**
- Modify: `src/server/campaigns.ts`
- Test: `tests/server/pencarian.test.ts`

**Interfaces:**
- Produces:
  - `bersihkanKataKunci(q: string): string` — dipakai juga oleh test
  - `listPublic` — input `{ q?: string; hal?: number }`, keluaran `{ rows, total, hal, totalHal }`

- [ ] **Step 1: Tulis test yang gagal**

Yang diuji bukan query-nya, melainkan penyiapan kata kunci — satu-satunya bagian yang murni dan justru paling gampang salah, karena `%` dan `_` adalah wildcard `LIKE`.

`tests/server/pencarian.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { bersihkanKataKunci } from '@/server/campaigns'

describe('bersihkanKataKunci', () => {
  test('memangkas spasi di tepi', () => {
    expect(bersihkanKataKunci('  hut ri  ')).toBe('hut ri')
  })

  test('kata kunci kosong tetap kosong', () => {
    expect(bersihkanKataKunci('   ')).toBe('')
  })

  test('meloloskan % supaya tidak jadi wildcard', () => {
    // Tanpa ini, mencari "50%" mencocokkan SEMUA campaign.
    expect(bersihkanKataKunci('50%')).toBe('50\\%')
  })

  test('meloloskan _ supaya tidak mencocokkan sembarang satu huruf', () => {
    expect(bersihkanKataKunci('a_b')).toBe('a\\_b')
  })

  test('meloloskan backslash lebih dulu supaya tidak dobel', () => {
    expect(bersihkanKataKunci('a\\b')).toBe('a\\\\b')
  })

  test('memotong kata kunci yang kelewat panjang', () => {
    expect(bersihkanKataKunci('x'.repeat(200)).length).toBe(80)
  })
})
```

- [ ] **Step 2: Jalankan test**

```bash
bun test tests/server/pencarian.test.ts
```
Expected: FAIL — `bersihkanKataKunci` belum ada.

- [ ] **Step 3: Tulis implementasinya**

Tambahkan ke `src/server/campaigns.ts`:

```ts
/** Berapa kartu per halaman. Cukup untuk grid 3 kolom tanpa bikin halaman berat. */
const PER_HALAMAN = 12
const MAKS_KATA_KUNCI = 80

/**
 * Menyiapkan kata kunci untuk `ILIKE`.
 *
 * `%` dan `_` adalah wildcard di `LIKE`; dibiarkan mentah, mencari "50%" akan
 * mencocokkan seluruh isi tabel. Backslash diloloskan lebih dulu supaya
 * pelolosan berikutnya tidak dobel.
 */
export function bersihkanKataKunci(q: string): string {
  return q
    .trim()
    .slice(0, MAKS_KATA_KUNCI)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

export const listPublic = createServerFn({ method: 'GET' })
  .validator((input: unknown) =>
    z
      .object({
        q: z.string().max(MAKS_KATA_KUNCI).default(''),
        hal: z.number().int().min(1).default(1),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const kunci = bersihkanKataKunci(data.q)

    // `isPublic` masuk ke dalam WHERE, bukan disaring setelah query — campaign
    // privat tidak boleh sempat terbaca sama sekali.
    const syarat = kunci
      ? and(eq(campaigns.isPublic, true), ilike(campaigns.name, `%${kunci}%`))
      : eq(campaigns.isPublic, true)

    const [jumlah] = await db.select({ n: count() }).from(campaigns).where(syarat)
    const total = jumlah?.n ?? 0
    const totalHal = Math.max(1, Math.ceil(total / PER_HALAMAN))
    // Halaman di luar jangkauan dijepit, bukan ditolak: URL yang dibagikan
    // orang bisa saja menunjuk halaman yang isinya sudah menyusut.
    const hal = Math.min(data.hal, totalHal)

    const rows = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        slug: campaigns.slug,
        description: campaigns.description,
        useCount: campaigns.useCount,
        slotCount: count(frameSlots.id),
      })
      .from(campaigns)
      .leftJoin(frameSlots, eq(frameSlots.campaignId, campaigns.id))
      .where(syarat)
      .groupBy(campaigns.id)
      .orderBy(desc(campaigns.createdAt))
      .limit(PER_HALAMAN)
      .offset((hal - 1) * PER_HALAMAN)

    // `userId` sengaja tidak ikut.
    return { rows, total, hal, totalHal }
  })
```

Tambahkan `ilike` ke impor drizzle yang sudah ada:

```ts
import { and, count, desc, eq, ilike, like, or, sql } from 'drizzle-orm'
```

- [ ] **Step 4: Jalankan test dan verifikasi**

```bash
bun test tests/server/pencarian.test.ts
bun run check && bun run typecheck && bun run build
```
Expected: PASS 6 test, sisanya bersih.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: campaigns.listPublic dengan pencarian dan paginasi

% dan _ diloloskan sebelum masuk ILIKE — dibiarkan mentah, mencari '50%'
akan mencocokkan seluruh isi tabel.

Halaman di luar jangkauan dijepit, bukan ditolak: URL yang dibagikan
orang bisa menunjuk halaman yang isinya sudah menyusut."
```

---

## Task 2: Landing dan galeri di `/`

**Files:**
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `listPublic`, `<Navbar>`, `<Card>`, `<Button>`, `<Input>`, `<Badge>`, `hero.png`
- Produces: halaman `/` dengan search param `?q=` dan `?hal=`

- [ ] **Step 1: Validasi search param**

Kata kunci dan halaman hidup di URL supaya hasil pencarian bisa dibagikan dan tombol back browser bekerja.

```tsx
export const Route = createFileRoute('/')({
  validateSearch: z.object({
    q: z.string().catch(''),
    hal: z.number().int().min(1).catch(1),
  }),
  loaderDeps: ({ search }) => ({ q: search.q, hal: search.hal }),
  loader: ({ deps }) => listPublic({ data: deps }),
  component: Beranda,
})
```

> `.catch()` dipakai, bukan `.default()`: search param datang dari URL yang
> bisa diketik siapa saja. `?hal=abc` harus jatuh ke halaman 1, bukan
> menjatuhkan seluruh halaman.

- [ ] **Step 2: Hero**

Singkat dan tidak menghalangi galeri — nilai halaman ini ada di campaign-nya, bukan di teks pemasarannya.

```tsx
<section className="atmosfer flex flex-col items-center gap-4 px-6 py-14 text-center">
  <img
    src={heroPng}
    alt=""
    width={120}
    height={120}
    className="fade-up"
  />
  <h1 className="fade-up font-display text-4xl tracking-[-0.02em] sm:text-5xl">
    Bikin twibbon <span className="text-brand">multi-slot</span>
  </h1>
  <p className="fade-up-2 max-w-md text-muted">
    Unggah frame-mu, gambar area fotonya, lalu bagikan tautannya. Gratis, tanpa
    email, tanpa nomor telepon.
  </p>
  <div className="fade-up-3 flex gap-2">
    <Button asChildLink to="/buat">Bikin punyamu</Button>
  </div>
</section>
```

> `Button` dari Base UI tidak punya `asChild`. Untuk tautan bergaya tombol,
> pakai `buttonVariants({ ... })` sebagai `className` pada `<Link>` — pola yang
> sama sudah dipakai `navbar.tsx`.

- [ ] **Step 3: Pencarian**

Form yang disubmit, bukan filter hidup per ketikan. `// ponytail:` — tanpa
debounce, tanpa dependensi, dan setiap pencarian menghasilkan satu URL yang
bisa dibagikan.

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q')?.toString() ?? ''
    navigate({ to: '/', search: { q, hal: 1 } })
  }}
  className="mx-auto mb-6 flex max-w-md gap-2"
>
  <Input name="q" defaultValue={search.q} placeholder="Cari nama kampanye…" />
  <Button type="submit">Cari</Button>
</form>
```

Saat `search.q` terisi, tampilkan tombol untuk menghapusnya.

- [ ] **Step 4: Grid kartu**

Kartu menautkan ke `/twibbon/$slug` — route itu sudah ada sejak Fase 3.

```tsx
<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {data.rows.map((c) => (
    <li key={c.id}>
      <Link to="/twibbon/$slug" params={{ slug: c.slug }}>
        <Card className="overflow-hidden transition-all hover:-translate-y-[3px] hover:border-brand">
          <img
            src={`/api/frame/${c.id}`}
            alt=""
            loading="lazy"
            className="aspect-square w-full bg-surface2 object-contain"
          />
          <div className="p-4">
            <h2 className="mb-1.5 truncate font-display text-base">{c.name}</h2>
            {c.description && (
              <p className="mb-2 line-clamp-2 text-xs text-muted">{c.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="netral">{c.slotCount} area</Badge>
              <Badge variant="netral">{c.useCount}x dipakai</Badge>
            </div>
          </div>
        </Card>
      </Link>
    </li>
  ))}
</ul>
```

Empty state membedakan dua sebab: belum ada campaign sama sekali, atau
pencariannya tidak ketemu.

- [ ] **Step 5: Paginasi**

```tsx
{data.totalHal > 1 && (
  <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginasi">
    <Link
      to="/"
      search={{ q: search.q, hal: data.hal - 1 }}
      disabled={data.hal <= 1}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      ← Sebelumnya
    </Link>
    <span className="text-sm text-muted">
      Halaman {data.hal} dari {data.totalHal}
    </span>
    <Link
      to="/"
      search={{ q: search.q, hal: data.hal + 1 }}
      disabled={data.hal >= data.totalHal}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      Berikutnya →
    </Link>
  </nav>
)}
```

- [ ] **Step 6: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: landing dan galeri publik di /

Kata kunci dan nomor halaman hidup di URL, bukan state komponen: hasil
pencarian bisa dibagikan dan tombol back browser bekerja.

validateSearch memakai .catch(), bukan .default() — search param datang
dari URL yang bisa diketik siapa saja, dan ?hal=abc harus jatuh ke
halaman 1, bukan menjatuhkan seluruh halaman."
```

---

## Task 3: Verifikasi menyeluruh

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 101 test (95 + 6 pencarian), sisanya bersih.

- [ ] **Step 2: Isi dan paginasi**

Buat 14 campaign publik + 1 privat, lalu:

1. `/` menampilkan 12 kartu, paginasi bilang "Halaman 1 dari 2"
2. Halaman 2 menampilkan 2 sisanya
3. **Campaign privat tidak muncul di halaman mana pun**
4. `?hal=99` jatuh ke halaman terakhir, bukan error
5. `?hal=abc` jatuh ke halaman 1

- [ ] **Step 3: Pencarian**

1. Cari sebagian nama → hanya yang cocok yang tampil, jumlah halaman ikut menyesuaikan
2. Cari `%` → **tidak** mengembalikan semua campaign (bukti pelolosan wildcard bekerja)
3. Cari kata yang tidak ada → empty state khusus "tidak ketemu"
4. Salin URL hasil pencarian ke tab baru → hasilnya sama

- [ ] **Step 4: Tidak ada kebocoran**

```bash
curl -s http://localhost:3000/ | grep -c 'openframe.local'
curl -s http://localhost:3000/ | grep -c 'userId'
```
Expected: keduanya `0`.

- [ ] **Step 5: Kartu menuju halaman partisipan**

Klik satu kartu → sampai di `/twibbon/<slug>` dan halamannya termuat.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: verifikasi galeri publik, pencarian, dan paginasi"
```

---

## Definition of Done — Fase 6

- [ ] `bun test` (101), `typecheck`, `check`, `build` bersih
- [ ] `/` menampilkan hero dan galeri, bukan placeholder lagi
- [ ] Hanya campaign publik yang muncul — privat tidak pernah tampil
- [ ] Paginasi benar; halaman di luar jangkauan dijepit, bukan error
- [ ] Pencarian `%` tidak mengembalikan seluruh isi tabel
- [ ] Kata kunci dan halaman ada di URL dan bisa dibagikan
- [ ] Kartu menautkan ke `/twibbon/$slug` yang berfungsi
- [ ] Tidak ada `userId` maupun `openframe.local` di sumber halaman
- [ ] Semua teks berbahasa Indonesia

---

## Yang menyusul — Fase 7

- `campaigns.delete` — **wajib memanggil `deleteFrameDir`**; cascade database hanya menghapus baris, berkas frame tetap tertinggal (terbukti saat membersihkan data uji di Fase 2 delta)
- Ganti frame di `updateCampaign`, termasuk menghapus berkas lama
- Tombol Salin tautan / Lihat / Hapus di kartu dashboard — ditunda sejak Fase 2 karena `/twibbon/$slug` belum ada; sekarang sudah
- OG metadata (`og:title`, `og:image`, `og:description`) untuk berbagi ke medsos
- Aksesibilitas dan responsive menyeluruh di 320/768/1024/1440
