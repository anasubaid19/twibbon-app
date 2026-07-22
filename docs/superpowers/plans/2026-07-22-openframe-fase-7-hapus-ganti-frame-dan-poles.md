# OpenFrame Fase 7: Hapus, Ganti Frame, dan Poles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup siklus hidup campaign — creator bisa mengganti frame dan menghapus campaignnya sampai bersih ke berkasnya — lalu memoles yang tersisa: aksi kartu dashboard, metadata berbagi, aksesibilitas, dan responsif.

**Architecture:** Menghapus baris campaign **tidak** menghapus berkas framenya; cascade database hanya mengurus baris. Itu bukan dugaan — terbukti saat membersihkan data uji di fase-fase sebelumnya. Karena itu `deleteCampaign` menghapus baris **lalu** direktorinya, dengan urutan itu: kalau berkas gagal terhapus yang tertinggal cuma sampah, sedangkan urutan sebaliknya bisa meninggalkan campaign hidup tanpa frame.

**Tech Stack:** TanStack Start · React 19 · Drizzle · Sharp · Zod 4 · shadcn/ui + Base UI · Bun

**Dependensi baru:** tidak ada.

**Fase sebelumnya:** `docs/superpowers/plans/2026-07-22-openframe-fase-6-galeri-publik.md`

---

## Global Constraints

- **Bahasa Indonesia**, santai, "kamu". Brand: **OpenFrame**.
- **Kepemilikan masuk ke dalam WHERE**, bukan diperiksa terpisah — pola yang sama sejak Fase 2.
- Penghapusan **tidak boleh** menyisakan berkas yatim di `uploads/`.
- **P4 / ponytail.** Tandai penyederhanaan dengan `// ponytail:`.
- Komponen shadcn baru **hanya** kalau butuh. Rencana: tidak ada — konfirmasi hapus memakai `confirm()` bawaan, sama seperti hapus area di Fase 2 delta.
- **Jangan ubah** kode fase sebelumnya yang tidak disebut plan ini. Khususnya `area-editor/`, `slot-filler/`, `composite.ts`, dan `geometry.ts`.
- Biome, `bun run check` sebelum commit. **`bun run build` wajib.**
- Commit Indonesia, conventional commits.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/server/campaigns.ts` | **Ubah.** Tambah `deleteCampaign` dan `replaceFrame` |
| `src/routes/dashboard.tsx` | **Ubah.** Aksi kartu: Lihat, Salin tautan, Hapus |
| `src/routes/edit.$id.tsx` | **Ubah.** Ganti frame |
| `src/routes/twibbon.$slug.tsx` | **Ubah.** Metadata Open Graph |

Tidak ada berkas baru.

---

## Task 1: `campaigns.delete`

**Files:**
- Modify: `src/server/campaigns.ts`

**Interfaces:**
- Consumes: `deleteFrameDir` (`@/server/upload`) — sudah ada sejak Fase 2, belum pernah dipakai
- Produces: `deleteCampaign` — input `{ id }`, keluaran `{ ok: true }`

- [ ] **Step 1: Tulis fungsinya**

```ts
/* --- deleteCampaign ------------------------------------------------------ */

export const deleteCampaign = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    // Kepemilikan ikut ke dalam WHERE. `returning` memberi tahu apakah baris
    // itu benar-benar terhapus — tanpa itu, menghapus campaign orang lain
    // akan terlihat berhasil padahal tidak melakukan apa-apa.
    const terhapus = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
      .returning({ id: campaigns.id })

    if (terhapus.length === 0) throw new Error(TIDAK_DITEMUKAN)

    // Baris slot ikut lewat ON DELETE CASCADE, tapi BERKASNYA tidak — cascade
    // database tidak menyentuh disk. Dihapus setelah baris, bukan sebelum:
    // kalau langkah ini gagal yang tertinggal cuma sampah, sedangkan urutan
    // sebaliknya bisa meninggalkan campaign hidup tanpa frame.
    await deleteFrameDir(data.id)

    return { ok: true as const }
  })
```

- [ ] **Step 2: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: campaigns.delete yang ikut menghapus berkas frame

Cascade database hanya mengurus baris; berkas frame tetap tertinggal.
Bukan dugaan — terbukti saat membersihkan data uji di fase sebelumnya.

Berkas dihapus SETELAH baris: kalau langkah itu gagal yang tertinggal
cuma sampah, sedangkan urutan sebaliknya bisa meninggalkan campaign
hidup tanpa frame."
```

---

## Task 2: Ganti frame

**Files:**
- Modify: `src/server/campaigns.ts`, `src/routes/edit.$id.tsx`

**Interfaces:**
- Produces: `replaceFrame` — input `FormData` (`id`, `frame`), keluaran `{ frameWidth, frameHeight }`

- [ ] **Step 1: Server function tersendiri, bukan menyatu ke `updateCampaign`**

`updateCampaign` menerima JSON. Menyatukan penggantian frame ke dalamnya berarti setiap simpan biasa harus melewati jalur `FormData`, padahal frame jarang diganti. `// ponytail:` — fungsi terpisah, jalur yang sering dipakai tetap sederhana.

```ts
/* --- replaceFrame -------------------------------------------------------- */

function parseReplaceInput(input: unknown) {
  if (!(input instanceof FormData)) throw new Error('Kiriman tidak sah')
  const frame = input.get('frame')
  if (!(frame instanceof File) || frame.size === 0) throw new Error('Frame PNG wajib diunggah')
  return { id: idSchema.parse(String(input.get('id') ?? '')), frame }
}

export const replaceFrame = createServerFn({ method: 'POST' })
  .validator(parseReplaceInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [lama] = await db
      .select({ framePath: campaigns.framePath })
      .from(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
      .limit(1)

    if (!lama) throw new Error(TIDAK_DITEMUKAN)

    const bytes = Buffer.from(await data.frame.arrayBuffer())
    const frame = await validateFrame(bytes)

    // Nama berkas baru diacak `saveFrame`, jadi jalurnya berbeda dari yang
    // lama. Itu yang membuat ETag di route penyaji ikut berubah dan browser
    // tidak menyajikan frame lama dari cache.
    const framePath = await saveFrame(data.id, bytes)

    await db
      .update(campaigns)
      .set({
        framePath,
        frameWidth: frame.width,
        frameHeight: frame.height,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, data.id))

    // Slot TIDAK perlu dipetakan ulang: koordinatnya persen, jadi ia otomatis
    // menyesuaikan dimensi frame baru (spec 5.3). Itu bukan kebetulan —
    // memang alasan koordinatnya disimpan sebagai persen sejak awal.
    await hapusBerkas(lama.framePath)

    return { frameWidth: frame.width, frameHeight: frame.height }
  })
```

Tambahkan penghapus satu berkas ke `src/server/upload.ts`:

```ts
/** Menghapus satu berkas frame. Dipakai saat frame diganti. */
export async function hapusBerkas(relativePath: string): Promise<void> {
  await rm(frameAbsolutePath(relativePath), { force: true })
}
```

- [ ] **Step 2: Tombol ganti frame di halaman edit**

Di bawah area editor, tambahkan input berkas. Setelah berhasil, muat ulang
route supaya dimensi baru dan gambar barunya terpakai:

```tsx
  async function gantiFrame(berkas: File | undefined) {
    if (!berkas) return
    setError('')
    setSedangGanti(true)
    try {
      const form = new FormData()
      form.set('id', id)
      form.set('frame', berkas)
      await replaceFrame({ data: form })
      // Muat ulang: dimensi frame berubah, dan validitas slot dihitung
      // terhadap dimensi itu.
      await router.invalidate()
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSedangGanti(false)
    }
  }
```

- [ ] **Step 3: Verifikasi dan commit**

Ganti frame 1000×500 dengan frame 800×800. Expected: gambar di editor berganti,
kotak area tetap di posisi persen yang sama, dan `frame_width`/`frame_height`
di database ikut berubah. Berkas lama hilang dari `uploads/frames/<id>/`.

```bash
git add -A
git commit -m "feat: ganti frame campaign

Fungsi terpisah dari updateCampaign: menyatukannya berarti setiap simpan
biasa melewati jalur FormData padahal frame jarang diganti.

Slot tidak perlu dipetakan ulang — koordinatnya persen, jadi otomatis
menyesuaikan dimensi frame baru. Itu memang alasan koordinatnya disimpan
sebagai persen sejak awal."
```

---

## Task 3: Aksi kartu dashboard

Ditunda sejak Fase 2 karena `/twibbon/$slug` belum ada. Sekarang sudah.

**Files:**
- Modify: `src/routes/dashboard.tsx`

- [ ] **Step 1: Pisahkan tautan dari tombol**

Kartu sekarang membungkus seluruh isinya dalam satu `<Link>` ke `/edit/$id`.
Menaruh tombol di dalamnya menghasilkan `<a>` bersarang di `<a>` — HTML tidak
sah dan perilaku kliknya jadi tak terduga.

Susunan baru: gambar dan judul tetap tautan ke halaman edit, aksi jadi baris
tersendiri di bawahnya.

```tsx
<Card className="overflow-hidden transition-all hover:-translate-y-[3px] hover:border-brand">
  <Link to="/edit/$id" params={{ id: campaign.id }} className="block">
    <img src={`/api/frame/${campaign.id}`} alt="" loading="lazy" className="aspect-square w-full bg-surface2 object-contain" />
    <div className="px-4 pt-4">
      <h2 className="mb-1.5 truncate font-display text-base">{campaign.name}</h2>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="netral">{campaign.slotCount} area</Badge>
        <Badge variant={campaign.isPublic ? 'publik' : 'privat'}>
          {campaign.isPublic ? 'Publik' : 'Privat'}
        </Badge>
        <Badge variant="netral">{campaign.useCount}x dipakai</Badge>
      </div>
    </div>
  </Link>

  <div className="flex flex-wrap gap-1.5 p-4">
    <Link
      to="/twibbon/$slug"
      params={{ slug: campaign.slug }}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      Lihat
    </Link>
    <Button variant="outline" size="sm" onClick={() => salin(campaign.slug)}>
      {tersalin === campaign.slug ? 'Tersalin!' : 'Salin tautan'}
    </Button>
    <Button variant="destructive" size="sm" onClick={() => hapus(campaign.id, campaign.name)}>
      Hapus
    </Button>
  </div>
</Card>
```

- [ ] **Step 2: Salin dan hapus**

```tsx
  async function salin(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/twibbon/${slug}`)
      setTersalin(slug)
      setTimeout(() => setTersalin(''), 2000)
    } catch {
      // Clipboard bisa ditolak izinnya. Jangan diam — pengguna mengira
      // tautannya sudah tersalin padahal tidak.
      setError('Gagal menyalin. Salin manual dari halaman kampanyenya.')
    }
  }

  async function hapus(id: string, nama: string) {
    // ponytail: confirm() bawaan, sama seperti hapus area di Fase 2 delta.
    if (!confirm(`Hapus kampanye "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await deleteCampaign({ data: { id } })
      await router.invalidate()
    } catch (err) {
      setError(pesanError(err))
    }
  }
```

- [ ] **Step 3: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: aksi Lihat, Salin tautan, dan Hapus di kartu dashboard

Ditunda sejak Fase 2 karena /twibbon/\$slug belum ada.

Tombol dipindah keluar dari <Link> pembungkus: <a> bersarang di <a>
bukan HTML yang sah dan perilaku kliknya tak terduga.

Kegagalan clipboard ditampilkan, tidak ditelan — kalau diam, pengguna
mengira tautannya sudah tersalin padahal tidak."
```

---

## Task 4: Metadata Open Graph

**Files:**
- Modify: `src/server/campaigns.ts`, `src/routes/twibbon.$slug.tsx`

- [ ] **Step 1: Kembalikan URL absolut dari server**

Open Graph mewajibkan URL absolut; URL relatif diabaikan scraper. Yang tahu
alamat kanonik aplikasi hanya server.

Di `getCampaignBySlug`, tambahkan ke nilai kembaliannya:

```ts
    // Open Graph menolak URL relatif, dan hanya server yang tahu alamat
    // kanonik aplikasi.
    const asal = process.env.BETTER_AUTH_URL ?? ''
    return {
      ...campaign,
      username: username ?? ownerName,
      slots,
      ogImage: `${asal}/api/frame/${campaign.id}`,
      ogUrl: `${asal}/twibbon/${campaign.slug}`,
    }
```

- [ ] **Step 2: Pasang `head` di route**

```tsx
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.name} · OpenFrame` },
            { name: 'description', content: loaderData.description || 'Bikin twibbonmu di OpenFrame.' },
            { property: 'og:type', content: 'website' },
            { property: 'og:title', content: loaderData.name },
            { property: 'og:description', content: loaderData.description || 'Bikin twibbonmu di OpenFrame.' },
            { property: 'og:image', content: loaderData.ogImage },
            { property: 'og:url', content: loaderData.ogUrl },
            { name: 'twitter:card', content: 'summary_large_image' },
          ],
        }
      : {},
```

- [ ] **Step 3: Verifikasi dan commit**

```bash
curl -s "http://localhost:3000/twibbon/<slug>" | grep -oE '<meta property="og:[^>]*>'
```
Expected: `og:title`, `og:image`, `og:url` terisi dengan URL absolut.

```bash
git add -A
git commit -m "feat: metadata Open Graph untuk halaman kampanye

URL absolut dibentuk di server: Open Graph mengabaikan URL relatif, dan
hanya server yang tahu alamat kanonik aplikasi."
```

---

## Task 5: Aksesibilitas, responsif, dan verifikasi menyeluruh

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 101 test, sisanya bersih.

- [ ] **Step 2: Siklus hidup penuh**

1. Buat campaign 2 area → muncul di dashboard dan di galeri `/`
2. Salin tautan → tempel di tab baru → halaman partisipan terbuka
3. Ganti frame dengan yang dimensinya berbeda → kotak area tetap di persen yang sama
4. Isi foto, unduh → berkas jadi
5. Hapus campaign dari dashboard → hilang dari dashboard **dan** galeri
6. **`uploads/frames/<id>/` ikut hilang** — tidak ada berkas yatim
7. Buka `/twibbon/<slug>` yang barusan dihapus → "Kampanye tidak ditemukan"

- [ ] **Step 3: Tidak ada berkas yatim**

```bash
for d in uploads/frames/*/; do
  id=$(basename "$d")
  n=$(psql -d openframe -tAc "SELECT count(*) FROM campaigns WHERE id='$id';" | tr -d ' ')
  [ "$n" = "0" ] && echo "YATIM: $id"
done; echo "(selesai)"
```
Expected: tidak ada baris YATIM.

- [ ] **Step 4: Responsif**

Tangkap `/`, `/dashboard`, `/buat`, dan `/twibbon/<slug>` di **320, 768, 1024, 1440**, tema gelap dan terang. Yang diperiksa:

- Tidak ada gulir horizontal di lebar mana pun
- Navbar tidak menumpuk isi di 320px
- Grid galeri turun jadi satu kolom di 320px
- Kanvas partisipan tidak melebihi lebar layar
- Tombol lime tetap terbaca di tema terang

- [ ] **Step 5: Aksesibilitas**

- Tab melintasi tiap halaman: semua elemen interaktif punya cincin fokus lime yang terlihat
- Tiap tombol ikon punya `aria-label`
- `prefers-reduced-motion: reduce` mematikan seluruh gerakan, termasuk pantulan pan foto dan hover tombol
- Kontras `text-muted` di atas `bg-surface` ≥ 4.5:1 di kedua tema

- [ ] **Step 6: Perbarui README dan commit**

Status berubah jadi Fase 0–7 selesai; sebutkan juga utang yang masih ada
(penyajian produksi, rate limit `registerUser`).

```bash
git add -A
git commit -m "docs: README status Fase 0-7"
```

---

## Definition of Done — Fase 7

- [ ] `bun test` (101), `typecheck`, `check`, `build` bersih
- [ ] Hapus campaign menghapus baris, slot, **dan berkas framenya**
- [ ] Menghapus campaign orang lain ditolak dengan "tidak ditemukan"
- [ ] Ganti frame berhasil; slot tetap di persen yang sama; berkas lama terhapus
- [ ] Kartu dashboard punya Lihat, Salin tautan, dan Hapus yang berfungsi
- [ ] Tidak ada `<a>` bersarang di dalam `<a>`
- [ ] `og:title`, `og:image`, `og:url` terisi URL absolut
- [ ] Tidak ada berkas yatim di `uploads/` setelah siklus penuh
- [ ] Tidak ada gulir horizontal di 320/768/1024/1440, kedua tema
- [ ] `prefers-reduced-motion` mematikan seluruh gerakan
- [ ] Semua teks berbahasa Indonesia

---

## Utang yang tetap terbuka setelah Fase 7

Bukan pekerjaan fase ini, tapi **wajib beres sebelum deploy publik**:

1. **Belum ada preset server produksi.** `bun run build` menghasilkan handler SSR tanpa `listen()`; `bun run start` masih mencetak pesan "belum disambungkan".
2. **`registerUser` dan `resetPassword` tidak dibatasi rate limiter.** Keduanya `createServerFn`, sedangkan rate limiter Better Auth hanya menutupi route `auth.handler`. Spam pendaftaran adalah titik terlemahnya.
3. **Rate limit memakai penyimpanan dalam memori per-proses.** Perlu penyimpanan bersama begitu ada lebih dari satu instans.

Ketiganya sebaiknya dikerjakan bersamaan, sebagai satu fase penyiapan rilis.
