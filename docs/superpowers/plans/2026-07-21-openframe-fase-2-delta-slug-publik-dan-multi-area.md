# OpenFrame Fase 2 (Delta): Slug Publik dan Pengelolaan Multi-Area — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melengkapi Fase 2 dengan `campaigns.getBySlug` (pintu masuk halaman partisipan di Fase 3) dan menjadikan area editor benar-benar multi-area: tambah lewat rectangle tool, hapus, urutkan ulang, dan beri label.

**Architecture:** Tidak ada berkas baru di `server/` maupun `lib/`. Toolbar tinggal **di dalam** `AreaEditor`, bukan komponen terpisah, supaya `buat.tsx` dan `edit.$id.tsx` tidak menyalin blok kontrol yang sama. `slotIndex` tidak pernah disimpan di state klien — ia diturunkan dari urutan array saat menyimpan, jadi hapus dan urutkan-ulang tidak butuh kode re-index sama sekali.

**Tech Stack:** TanStack Start 1.168 · React 19 · Drizzle ORM · Zod 4 · shadcn/ui di atas Base UI · Tailwind v4 · Biome · Bun

**Dependensi baru:** tidak ada. Framer Motion **belum** dipasang di fase ini — tidak ada gesture baru yang butuh spring, dan memasangnya sekarang melanggar ponytail. Ia masuk di Fase 3 bersama pan/zoom foto.

**Spec:** `docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md`
**Fase sebelumnya:** `docs/superpowers/plans/2026-07-21-openframe-fase-2-campaign-dan-area-editor.md`

---

## Global Constraints

Berlaku untuk **setiap** task.

- **Bahasa Indonesia** untuk UI, pesan error, dan komentar kode. Santai, sapaan "kamu". Brand: **OpenFrame**.
- **Nol email, nol nomor telepon.**
- Sesi memakai cookie HTTP-only. Tidak ada token di `localStorage`.
- **P2 — satu model koordinat.** Setiap perhitungan persen↔piksel lewat `lib/geometry.ts`. Rectangle tool memakai `toPercent` + `clampToFrame` yang sudah ada, tidak menghitung sendiri.
- **P4 / ponytail.** Tidak ada berkas baru kalau yang ada bisa dipakai. Tandai penyederhanaan dengan `// ponytail:`.
- Semua input di batas server function divalidasi Zod.
- **Hard-clamp di area editor dipertahankan** (aturan 26). Rubber-banding hanya untuk pan foto partisipan di Fase 3.
- Komponen shadcn yang sudah ada: `button`, `card`, `alert`, `input`, `textarea`, `checkbox`, `label`, `badge`. **Jangan tambah komponen baru di fase ini** — semua kebutuhan tertutup.
- **Jangan refactor kode Fase 0–2 yang tidak disebut plan ini.** `geometry.ts`, `slug.ts`, `upload.ts`, `use-drag-resize.ts`, `use-element-size.ts`, dan `api/frame.$id.ts` tidak disentuh sama sekali.
- Formatter & linter: Biome. `bun run check` sebelum tiap commit.
- **`bun run build` wajib sebelum menyatakan task selesai.** `bun dev` tidak menangkap kegagalan resolusi modul.
- Commit message Indonesia, conventional commits.

**Catatan `biome-ignore`:** harus **satu baris** dan persis di atas baris yang ditandai. Bentuk multi-baris tidak menempel dan Biome melaporkan `Suppression comment has no effect`.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/server/campaigns.ts` | **Ubah.** Tambah `getCampaignBySlug` |
| `src/components/area-editor/area-editor.tsx` | **Ubah.** Toolbar, mode tambah, hapus, urutkan, label |
| `src/components/area-editor/slot-rect.tsx` | **Ubah.** Menampilkan label di atas kotak |
| `src/routes/buat.tsx` | **Ubah.** State pilihan slot yang sebenarnya |
| `src/routes/edit.$id.tsx` | **Ubah.** Label ikut tersimpan |
| `tests/lib/geometry.test.ts` | **Ubah.** Satu test untuk penempatan kotak baru |

Tidak ada berkas baru. `slotIndex` tetap diturunkan `slotRows()` di `campaigns.ts` dari urutan array — tidak ada kode re-index yang perlu ditulis.

---

## Task 1: `campaigns.getBySlug`

Pintu masuk halaman partisipan. Dipakai Fase 3; dibangun sekarang karena ia bagian dari Fase 2 di brief.

**Files:**
- Modify: `src/server/campaigns.ts`

**Interfaces:**
- Consumes: `db`, `campaigns`/`frameSlots` (`@/db/schema`), `user` (`@/db/schema`)
- Produces: `getCampaignBySlug` — input `{ slug: string }`, keluaran `{ id, name, description, slug, frameWidth, frameHeight, useCount, username: string, slots: { x, y, width, height, label }[] }` — `username` selalu string, dijatuhkan ke `user.name` karena kolomnya nullable

- [ ] **Step 1: Tambahkan skema slug dan fungsinya**

Tambahkan `user` ke impor schema yang sudah ada di baris teratas:

```ts
import { campaigns, frameSlots, user } from '@/db/schema'
```

Lalu tambahkan di akhir berkas, memakai `SLUG_PATTERN` yang sudah diekspor `lib/slug.ts` — jangan menulis regex kedua:

```ts
/* --- getCampaignBySlug --------------------------------------------------- */

export const getCampaignBySlug = createServerFn({ method: 'GET' })
  .validator((input: unknown) =>
    z.object({ slug: z.string().regex(SLUG_PATTERN, TIDAK_DITEMUKAN) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Tidak ada `requireUserId` di sini: halaman partisipan memang publik.
    const [row] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        slug: campaigns.slug,
        frameWidth: campaigns.frameWidth,
        frameHeight: campaigns.frameHeight,
        useCount: campaigns.useCount,
        // `username` nullable di schema, jadi diambil berdua lalu dijatuhkan
        // ke `name` — pola yang sama dipakai `getSession` di server/session.ts.
        username: user.username,
        name: user.name,
      })
      .from(campaigns)
      .innerJoin(user, eq(user.id, campaigns.userId))
      // `isPublic` masuk ke WHERE, bukan diperiksa setelah baris didapat.
      // Campaign privat jadi "tidak ditemukan", bukan 403 — keberadaannya
      // tidak boleh bocor ke orang yang bukan pemiliknya (spec 6.5).
      .where(and(eq(campaigns.slug, data.slug), eq(campaigns.isPublic, true)))
      .limit(1)

    if (!row) throw new Error(TIDAK_DITEMUKAN)

    const slots = await db
      .select({
        x: frameSlots.x,
        y: frameSlots.y,
        width: frameSlots.width,
        height: frameSlots.height,
        label: frameSlots.label,
      })
      .from(frameSlots)
      .where(eq(frameSlots.campaignId, row.id))
      .orderBy(frameSlots.slotIndex)

    // `userId` sengaja tidak ikut. Yang keluar cuma username, yang memang
    // ditampilkan di halaman partisipan sebagai "oleh @siapa".
    const { name, username, ...campaign } = row
    return { ...campaign, username: username ?? name, slots }
  })
```

Tambahkan impor `SLUG_PATTERN` ke baris impor `lib/slug` yang sudah ada:

```ts
import { resolveSlug, SLUG_PATTERN, slugify } from '@/lib/slug'
```

- [ ] **Step 2: Verifikasi**

```bash
bun run check && bun run typecheck && bun run build
```
Expected: bersih. Pengujian perilakunya di Task 6 — butuh campaign publik dan privat yang nyata.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: campaigns.getBySlug untuk halaman partisipan

isPublic masuk ke dalam WHERE, bukan diperiksa setelah baris didapat,
jadi campaign privat menghasilkan 'tidak ditemukan' dan keberadaannya
tidak bocor. Yang dikembalikan cuma username, bukan userId."
```

---

## Task 2: Pilihan slot yang sebenarnya + kerangka toolbar

`buat.tsx` sekarang mengunci `selectedIndex={0}` dan `onSelect` kosong. Tanpa pilihan yang nyata, tombol hapus dan label tidak punya sasaran.

Toolbar ditaruh **di dalam** `AreaEditor`, bukan komponen sendiri: `buat.tsx` dan `edit.$id.tsx` sama-sama membutuhkannya, dan komponen terpisah berarti empat prop tambahan yang dioper bolak-balik. `// ponytail:` — satu berkas lebih sedikit, nol prop drilling.

**Files:**
- Modify: `src/components/area-editor/area-editor.tsx`
- Modify: `src/routes/buat.tsx`

**Interfaces:**
- Consumes: `slots`, `onChange`, `selectedIndex`, `onSelect` yang sudah ada
- Produces: `<AreaEditor>` merender toolbar di bawah kanvas

- [ ] **Step 1: Beri `buat.tsx` state pilihan**

Ganti dua baris di `buat.tsx`. Tambahkan state:

```tsx
const [selectedIndex, setSelectedIndex] = useState(0)
```

Lalu ganti prop `<AreaEditor>`:

```tsx
selectedIndex={selectedIndex}
onSelect={setSelectedIndex}
```

- [ ] **Step 2: Tambahkan kerangka toolbar di `area-editor.tsx`**

Impor `Button` dan bungkus keluaran yang ada. Kanvasnya **tidak diubah** — hanya ditambahi saudara di bawahnya:

```tsx
import { Button } from '@/components/ui/button'
```

Ubah `return` terluar dari `<div className="relative …">` menjadi fragment berisi kanvas lama plus toolbar:

```tsx
  const terpilih = slots[selectedIndex]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative select-none overflow-hidden rounded-card border border-border bg-surface2">
        {/* isi kanvas TIDAK BERUBAH: <img> dan <svg> persis seperti sekarang */}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-base border border-border bg-surface p-2">
        <span className="px-1 text-sm text-muted">
          {slots.length} area{terpilih ? ` · area ${selectedIndex + 1} terpilih` : ''}
        </span>
      </div>
    </div>
  )
```

- [ ] **Step 3: Verifikasi**

```bash
bun run check && bun run typecheck && bun run build
bun dev
```
Buka `/buat`, unggah frame. Expected: kanvas tampil persis seperti sebelumnya, dengan baris toolbar di bawahnya bertuliskan `1 area · area 1 terpilih`. Geser dan resize masih bekerja.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: pilihan slot yang sebenarnya dan kerangka toolbar area

Toolbar ditaruh di dalam AreaEditor, bukan komponen terpisah: buat dan
edit sama-sama membutuhkannya, dan memisahkannya berarti empat prop
dioper bolak-balik tanpa manfaat."
```

---

## Task 3: Rectangle tool — tambah area

**Files:**
- Modify: `src/components/area-editor/area-editor.tsx`
- Test: `tests/lib/geometry.test.ts`

**Interfaces:**
- Consumes: `toPercent`, `clampToFrame` (`@/lib/geometry`)
- Produces: tombol "Tambah Area" dan mode klik-untuk-menaruh

- [ ] **Step 1: Tulis test yang gagal**

Kotak baru harus tetap di dalam frame walau diklik di pojok. Yang menjamin itu `clampToFrame`, dan perilakunya sudah teruji — yang belum teruji adalah **komposisi** "pusatkan kotak di titik klik lalu clamp".

Tambahkan ke `tests/lib/geometry.test.ts` di dalam `describe('clampToFrame', …)`:

```ts
  test('kotak baru yang dipusatkan di pojok tetap masuk frame', () => {
    // Rectangle tool memusatkan kotak 20x20% di titik klik. Klik di pojok
    // kiri-atas berarti separuh kotaknya negatif sebelum di-clamp.
    const UKURAN = 20
    const kotakDiPojok = { x: 0 - UKURAN / 2, y: 0 - UKURAN / 2, width: UKURAN, height: UKURAN }
    expect(clampToFrame(kotakDiPojok)).toEqual({ x: 0, y: 0, width: 20, height: 20 })

    const kotakDiPojokKanan = { x: 100 - UKURAN / 2, y: 100 - UKURAN / 2, width: UKURAN, height: UKURAN }
    expect(clampToFrame(kotakDiPojokKanan)).toEqual({ x: 80, y: 80, width: 20, height: 20 })
  })
```

- [ ] **Step 2: Jalankan test**

```bash
bun test tests/lib/geometry.test.ts
```
Expected: PASS, 27 test. `clampToFrame` memang sudah menanganinya — test ini mengunci perilaku yang diandalkan rectangle tool supaya tidak hilang tanpa sengaja.

- [ ] **Step 3: Tambahkan mode dan tombolnya**

Di `area-editor.tsx`, tambahkan konstanta dan state:

```tsx
/** Ukuran kotak baru dalam persen, dipusatkan di titik klik. */
const UKURAN_BARU = 20
/** PRD US-02. */
const MAKS_SLOT = 20
```

```tsx
const [modeTambah, setModeTambah] = useState(false)
```

Tambahkan penangan klik latar. `toPercent` menerjemahkan titik klik; `clampToFrame` menahannya di dalam frame — dua-duanya sudah ada, tidak ada matematika baru:

```tsx
  function handleBackgroundPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!modeTambah || slots.length >= MAKS_SLOT) return

    const box = event.currentTarget.getBoundingClientRect()
    const titik = toPercent(
      { x: event.clientX - box.left, y: event.clientY - box.top, width: 0, height: 0 },
      display,
    )

    const baru = clampToFrame({
      x: titik.x - UKURAN_BARU / 2,
      y: titik.y - UKURAN_BARU / 2,
      width: UKURAN_BARU,
      height: UKURAN_BARU,
    })

    onChange([...slots, baru])
    onSelect(slots.length)
    setModeTambah(false)
  }
```

Pasang di elemen `<svg>` yang sudah ada, di samping penangan yang sudah terpasang:

```tsx
        onPointerDown={handleBackgroundPointerDown}
        style={{ touchAction: 'none', cursor: modeTambah ? 'crosshair' : undefined }}
```

> `SlotRect` memanggil `event.stopPropagation()` di `begin`, jadi klik di
> atas kotak yang sudah ada tidak akan menembus ke latar dan membuat kotak
> kedua. Itu perilaku yang memang sudah ada, bukan tambahan.

Tambahkan tombolnya ke toolbar:

```tsx
        <Button
          type="button"
          variant={modeTambah ? 'default' : 'outline'}
          size="sm"
          disabled={slots.length >= MAKS_SLOT}
          onClick={() => setModeTambah((m) => !m)}
        >
          {modeTambah ? 'Klik di frame…' : '+ Tambah Area'}
        </Button>
```

- [ ] **Step 4: Verifikasi di browser**

```bash
bun dev
```
Di `/buat` setelah frame terunggah:
1. Klik "+ Tambah Area" → tombolnya jadi lime, kursor di frame jadi crosshair
2. Klik di tengah frame → kotak baru muncul terpusat di sana, langsung terpilih, mode mati sendiri
3. Klik "+ Tambah Area" lalu klik di pojok kiri-atas → kotak tetap penuh di dalam frame
4. Klik di atas kotak yang sudah ada (mode mati) → kotaknya tergeser, **bukan** bikin kotak baru

- [ ] **Step 5: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: rectangle tool untuk menambah area foto

Titik klik diterjemahkan toPercent lalu ditahan clampToFrame — keduanya
sudah ada di geometry, jadi tidak ada matematika koordinat baru (P2)."
```

---

## Task 4: Hapus dan urutkan ulang area

Keduanya cuma memanipulasi array. `slotIndex` diturunkan `slotRows()` dari urutan array saat menyimpan, jadi **tidak ada kode re-index yang perlu ditulis** — itu jatuh gratis dari desain Fase 2.

**Files:**
- Modify: `src/components/area-editor/area-editor.tsx`

**Interfaces:**
- Consumes: `slots`, `onChange`, `selectedIndex`, `onSelect`
- Produces: tombol Hapus, Naik, Turun di toolbar

- [ ] **Step 1: Tambahkan ketiga fungsinya**

```tsx
  function hapusTerpilih() {
    if (!terpilih || slots.length <= 1) return
    // ponytail: confirm() bawaan browser sudah cukup untuk konfirmasi
    // sesederhana ini. Dialog sendiri berarti satu komponen shadcn baru,
    // state terbuka/tertutup, dan penjebak fokus — untuk satu pertanyaan
    // ya/tidak yang tidak merusak apa pun kalau dibatalkan.
    if (!confirm(`Hapus area ${selectedIndex + 1}?`)) return

    onChange(slots.filter((_, i) => i !== selectedIndex))
    // Pilihan bergeser ke area sebelumnya supaya tidak menunjuk indeks
    // yang sudah tidak ada.
    onSelect(Math.max(0, selectedIndex - 1))
  }

  function pindah(arah: -1 | 1) {
    const tujuan = selectedIndex + arah
    if (tujuan < 0 || tujuan >= slots.length) return

    const berikut = [...slots]
    // Tukar tempat. Nomor slot yang dilihat partisipan adalah urutan array
    // ini; `slotRows()` di server menurunkannya saat menyimpan, jadi tidak
    // ada slotIndex yang perlu diperbarui di sini.
    ;[berikut[selectedIndex], berikut[tujuan]] = [berikut[tujuan], berikut[selectedIndex]]
    onChange(berikut)
    onSelect(tujuan)
  }
```

- [ ] **Step 2: Tambahkan tombolnya ke toolbar**

```tsx
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={selectedIndex <= 0}
          aria-label="Naikkan urutan area"
          onClick={() => pindah(-1)}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={selectedIndex >= slots.length - 1}
          aria-label="Turunkan urutan area"
          onClick={() => pindah(1)}
        >
          ↓
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={slots.length <= 1}
          onClick={hapusTerpilih}
        >
          Hapus area
        </Button>
```

> Tombol hapus mati saat tersisa satu area: campaign tanpa area sama sekali
> akan ditolak server (`slots.min(1)`), jadi mencegahnya di sini lebih baik
> daripada membiarkan pengguna menabrak pesan error saat menyimpan.

- [ ] **Step 3: Verifikasi di browser**

1. Tambah dua area sehingga ada tiga
2. Pilih area 2, klik ↑ → nomornya berganti jadi 1, dan yang tadi 1 jadi 2
3. Klik "Hapus area" → muncul konfirmasi; setelah OK, tersisa dua area dan nomornya berurutan 1–2
4. Sisakan satu area → tombol hapus mati
5. Simpan, lalu periksa database: `slot_index` berurutan 1..N tanpa lompatan

```bash
psql -d openframe -c "SELECT slot_index, x, y FROM frame_slots ORDER BY slot_index;"
```

- [ ] **Step 4: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: hapus dan urutkan ulang area foto

Tidak ada kode re-index: slotIndex sudah diturunkan slotRows() dari
urutan array saat menyimpan sejak Fase 2, jadi menukar isi array sudah
cukup.

confirm() bawaan browser dipakai alih-alih dialog sendiri — satu
pertanyaan ya/tidak tidak sepadan dengan komponen baru berikut state dan
penjebak fokusnya."
```

---

## Task 5: Label area

**Files:**
- Modify: `src/components/area-editor/area-editor.tsx`
- Modify: `src/components/area-editor/slot-rect.tsx`
- Modify: `src/routes/buat.tsx`, `src/routes/edit.$id.tsx`

**Interfaces:**
- Consumes: kolom `label` di `frame_slots` dan `slotSchema` yang sudah menerimanya
- Produces: `SlotRect` menerima prop `label`; slot di klien membawa `label`

- [ ] **Step 1: Longgarkan tipe slot di klien**

`SlotRect` milik `geometry.ts` sengaja tidak punya `label` — ia tipe koordinat murni dan tidak boleh dikotori. Di editor, slot dibawa sebagai tipe lokal.

Di `area-editor.tsx`, tambahkan di bawah impor:

```tsx
/** Slot seperti yang dipegang editor: koordinat plus label opsional. */
export type SlotEditor = Rect & { label?: string }
```

Ganti tipe `slots` dan `onChange` di `Props` dari `Rect` menjadi `SlotEditor`.

- [ ] **Step 2: Tambahkan input label ke toolbar**

```tsx
        <Input
          value={terpilih?.label ?? ''}
          maxLength={40}
          placeholder={`Label area ${selectedIndex + 1} (opsional)`}
          disabled={!terpilih}
          className="h-8 w-52"
          onChange={(event) =>
            onChange(
              slots.map((slot, i) =>
                i === selectedIndex ? { ...slot, label: event.target.value } : slot,
              ),
            )
          }
        />
```

Tambahkan impornya:

```tsx
import { Input } from '@/components/ui/input'
```

- [ ] **Step 3: Tampilkan label di atas kotak**

Di `slot-rect.tsx`, tambahkan `label?: string` ke `Props`, terima di parameter, lalu ganti elemen `<text>` yang sudah ada:

```tsx
      <text
        x={rect.x + 8}
        y={rect.y + 20}
        fill={stroke}
        fontSize={13}
        fontWeight={700}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label ? `${index + 1} · ${label}` : index + 1}
      </text>
```

Oper dari `area-editor.tsx`:

```tsx
            label={slot.label}
```

- [ ] **Step 4: Kirim label saat menyimpan**

Di `buat.tsx`, ubah tipe state agar membawa label:

```tsx
const [slots, setSlots] = useState<SlotEditor[]>([SLOT_AWAL])
```

dengan impor `import { AreaEditor, type SlotEditor } from '@/components/area-editor/area-editor'`.

`JSON.stringify(slots)` sudah mengirim `label` apa adanya, dan `slotSchema` di server sudah punya `label: z.string().max(40).default('')` sejak Fase 2 — tidak ada perubahan server sama sekali.

Di `edit.$id.tsx`, ganti tipe state-nya dan hapus penimpaan yang sekarang
membuang label yang baru saja diketik pengguna:

```tsx
// impor: ganti `type SlotRect` dengan tipe editor
import { AreaEditor, type SlotEditor } from '@/components/area-editor/area-editor'

const [slots, setSlots] = useState<SlotEditor[]>(campaign.slots)
```

lalu di `handleSubmit`:

```tsx
          slots: slots.map((slot) => ({ ...slot, label: slot.label ?? '' })),
```

> Baris lama `label: ''` membuang label tanpa suara — apa pun yang diketik
> pengguna hilang saat menyimpan. Ini bug yang baru muncul begitu label
> benar-benar bisa diisi; sebelum task ini nilainya memang selalu kosong.

- [ ] **Step 5: Verifikasi**

1. Buat campaign dengan dua area, beri label "Kiri" dan "Kanan", simpan
2. `psql -d openframe -c "SELECT slot_index, label FROM frame_slots ORDER BY slot_index;"` → labelnya tersimpan
3. Buka `/edit/$id` → label muncul di input dan di atas kotaknya
4. Ubah label, simpan, muat ulang → perubahannya bertahan

- [ ] **Step 6: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: label opsional per area foto

SlotRect di geometry.ts sengaja tetap tipe koordinat murni; label dibawa
tipe SlotEditor milik editor. Sisi server tidak berubah sama sekali —
slotSchema sudah menerima label sejak Fase 2."
```

---

## Task 6: Verifikasi menyeluruh delta

**Files:** —

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test
bun run typecheck
bun run check
bun run build
```
Expected: 75 test lulus (74 dari sebelumnya + 1 penempatan kotak baru), tiga lainnya bersih.

- [ ] **Step 2: Buktikan `getBySlug` menutup campaign privat**

Pakai protokol RPC yang sama seperti Fase 2 — `x-tsr-serverFn: true`, payload seroval di query untuk fungsi GET, dan **error datang di badan respons dengan status 200**, bukan lewat status HTTP.

Yang harus terbukti:

| Percobaan | Harapan |
|---|---|
| `getBySlug` slug campaign publik | mengembalikan nama, slot, dan `username` pembuatnya |
| `getBySlug` slug campaign **privat** | badan memuat `Kampanye tidak ditemukan` |
| `getBySlug` slug yang tidak ada | pesan identik dengan kasus privat |
| respons publik | **tidak** memuat `userId` maupun `openframe.local` |

- [ ] **Step 3: Alur multi-area penuh di browser**

1. Buat campaign, tambah dua area lewat rectangle tool → tiga area
2. Beri label ketiganya, urutkan ulang, hapus satu
3. Simpan → `slot_index` di database berurutan 1..2 tanpa lompatan, label tersimpan
4. Buka halaman edit → posisi, label, dan urutan persis seperti saat disimpan

- [ ] **Step 4: Pastikan perilaku Fase 2 tidak rusak**

Ini yang paling penting: area editor sudah terverifikasi lewat browser di Fase 2, dan task-task di atas menyentuh berkas yang sama.

1. Geser badan kotak → posisi berubah, **ukuran tidak**
2. Tarik pegangan kanan → hanya sisi kanan bergerak
3. Dorong ke tepi → berhenti keras, ukuran tetap (hard-clamp, aturan 26)
4. Pegangan pada kotak yang menempel tepi tetap bisa diklik di titik tengahnya
5. Panah keyboard menggeser, Shift+panah mengubah ukuran
6. Kotak di bawah 20×20 piksel asli → merah dan tombol simpan mati

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verifikasi delta Fase 2 dan regresi area editor"
```

---

## Definition of Done — Fase 2 (Delta)

- [ ] `bun test` (75), `bun run typecheck`, `bun run check`, `bun run build` bersih
- [ ] `getBySlug` mengembalikan campaign publik lengkap dengan username pembuatnya
- [ ] Campaign privat dan slug tak dikenal memberi pesan **identik**
- [ ] Respons `getBySlug` tidak memuat `userId` maupun `openframe.local`
- [ ] Rectangle tool menaruh kotak terpusat di titik klik dan menahannya di dalam frame
- [ ] Batas 20 area ditegakkan (tombol mati saat tercapai)
- [ ] Hapus meminta konfirmasi dan tidak pernah menyisakan nol area
- [ ] Urutkan ulang mengubah nomor yang tampil, dan `slot_index` tersimpan berurutan tanpa lompatan
- [ ] Label tersimpan, tampil di atas kotak, dan bertahan setelah dimuat ulang
- [ ] **Perilaku Fase 2 tidak berubah:** geser mempertahankan ukuran, resize hanya menggerakkan sisi yang ditarik, hard-clamp di tepi, pegangan tepi tetap terjangkau, jalur keyboard hidup
- [ ] Tidak ada dependensi baru; tidak ada komponen shadcn baru; tidak ada berkas baru
- [ ] Semua teks yang terlihat pengguna berbahasa Indonesia

---

## Yang menyusul

| Fase | Isi | Dependensi baru |
|---|---|---|
| 3 | `/twibbon/$slug`, `slot-filler/`, `lib/composite.ts`, `incrementUse`, unduh 1×/2×/3× | **Framer Motion** — pan/zoom foto butuh spring interruptible, velocity handoff, dan rubber-banding (aturan 23–26) |
| 4 | Satu foto diterapkan ke semua slot, global pan/zoom | — |
| 5 | Mode multi-photo, editor independen per slot | — |
| 6 | `campaigns.listPublic`, `/` jadi landing + galeri, pencarian, paginasi | — |
| 7 | `campaigns.delete`, ganti frame, OG metadata, aksesibilitas, responsive | — |

**Utang Fase 0–1 yang belum lunas**, wajib beres sebelum deploy publik: belum ada preset server produksi (`bun run start` masih mencetak pesan), `registerUser` tidak dibatasi rate limiter Better Auth, dan rate limit memakai penyimpanan dalam memori per-proses.

**Migrasi UI yang belum selesai:** `register.tsx`, `lupa-password.tsx`, `dashboard.tsx`, `buat.tsx`, dan `edit.$id.tsx` masih memakai Tailwind mentah, bukan komponen shadcn. Keduanya berjalan berdampingan tanpa masalah karena berbagi token yang sama. Dimigrasi saat fase berikutnya menyentuh halamannya, bukan sebagai refactor tersendiri — aturan "jangan refactor kode terverifikasi kecuali diminta".
