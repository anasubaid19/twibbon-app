import { randomUUID } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, like, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { campaigns, frameSlots, user } from '@/db/schema'
import { isValidSlot } from '@/lib/geometry'
import { resolveSlug, SLUG_PATTERN, slugify } from '@/lib/slug'
import { requireUserId } from '@/server/require-user'
import { deleteFrameDir, saveFrame, validateFrame } from '@/server/upload'

/* --- Skema bersama ------------------------------------------------------ */

// `crypto.randomUUID()` selalu menghasilkan UUID v4, jadi pola ini cocok
// untuk semua id yang kita terbitkan sendiri.
const idSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Kampanye tidak ditemukan',
  )

const slotSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().max(40, 'Label area maksimal 40 karakter').default(''),
})

const detailSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama kampanye minimal 3 karakter')
    .max(80, 'Nama kampanye maksimal 80 karakter'),
  description: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter').default(''),
  isPublic: z.boolean(),
  // Fase 2 hanya membuat satu slot lewat UI, tapi bentuk datanya memang array
  // (tabel frame_slots). Batas 20 mengikuti PRD US-02.
  slots: z
    .array(slotSchema)
    .min(1, 'Tentukan minimal satu area foto')
    .max(20, 'Maksimal 20 area foto'),
})

/** Pesan yang sama untuk "tidak ada" dan "bukan milikmu" — keberadaan campaign orang lain tidak bocor. */
const TIDAK_DITEMUKAN = 'Kampanye tidak ditemukan'
const AREA_TIDAK_SAH = 'Area foto harus berada di dalam frame dan minimal 20x20 piksel'

function assertSlotsFit(
  slots: readonly { x: number; y: number; width: number; height: number }[],
  frame: { width: number; height: number },
): void {
  // Klien sudah mencegah ini lewat editor, tapi klien bukan penjaga —
  // permintaannya bisa dibuat tangan (spec bagian 10).
  for (const slot of slots) {
    if (!isValidSlot(slot, frame)) throw new Error(AREA_TIDAK_SAH)
  }
}

function slotRows(campaignId: string, slots: z.infer<typeof detailSchema>['slots']) {
  return slots.map((slot, i) => ({
    id: randomUUID(),
    campaignId,
    slotIndex: i + 1,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    label: slot.label,
  }))
}

/* --- createCampaign ----------------------------------------------------- */

function parseCreateInput(input: unknown) {
  // Berkas dan field menyatu dalam satu FormData supaya penyimpanannya satu
  // langkah. Tidak ada endpoint unggah terpisah, jadi tidak ada berkas yatim
  // yang perlu dibersihkan kalau creator kabur di tengah jalan.
  if (!(input instanceof FormData)) throw new Error('Kiriman tidak sah')

  const frame = input.get('frame')
  if (!(frame instanceof File) || frame.size === 0) throw new Error('Frame PNG wajib diunggah')

  let slots: unknown
  try {
    slots = JSON.parse(String(input.get('slots') ?? '[]'))
  } catch {
    throw new Error('Data area foto rusak, coba muat ulang halaman')
  }

  return {
    frame,
    ...detailSchema.parse({
      name: String(input.get('name') ?? ''),
      description: String(input.get('description') ?? ''),
      isPublic: input.get('isPublic') === 'true',
      slots,
    }),
  }
}

export const createCampaign = createServerFn({ method: 'POST' })
  .validator(parseCreateInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const bytes = Buffer.from(await data.frame.arrayBuffer())
    const frame = await validateFrame(bytes)
    assertSlotsFit(data.slots, frame)

    const base = slugify(data.name)
    const mirip = await db
      .select({ slug: campaigns.slug })
      .from(campaigns)
      .where(or(eq(campaigns.slug, base), like(campaigns.slug, `${base}-%`)))
    const slug = resolveSlug(
      base,
      mirip.map((row) => row.slug),
    )

    const id = randomUUID()
    const framePath = await saveFrame(id, bytes)

    try {
      await db.transaction(async (tx) => {
        await tx.insert(campaigns).values({
          id,
          userId,
          name: data.name,
          description: data.description,
          slug,
          framePath,
          frameWidth: frame.width,
          frameHeight: frame.height,
          isPublic: data.isPublic,
        })
        await tx.insert(frameSlots).values(slotRows(id, data.slots))
      })
    } catch (error) {
      // Berkas sudah telanjur ditulis sebelum transaksi. Kalau transaksinya
      // gagal, hapus lagi — kalau tidak, direktori upload menumpuk frame yang
      // tidak dirujuk baris mana pun dan tidak ada yang tahu boleh dihapus.
      await deleteFrameDir(id)

      // Celah antara SELECT slug di atas dan INSERT ini: dua permintaan dengan
      // nama sama bisa sama-sama lolos pemeriksaan lalu bertabrakan di
      // constraint. Jarang, dan pengguna bisa langsung mencoba lagi.
      if (error instanceof Error && error.message.includes('campaigns_slug_unique')) {
        throw new Error('Nama itu barusan dipakai orang lain. Ganti sedikit, lalu simpan lagi.')
      }
      throw error
    }

    return { id, slug }
  })

/* --- listMyCampaigns ---------------------------------------------------- */

export const listMyCampaigns = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId()

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      slug: campaigns.slug,
      isPublic: campaigns.isPublic,
      useCount: campaigns.useCount,
      createdAt: campaigns.createdAt,
      slotCount: count(frameSlots.id),
    })
    .from(campaigns)
    .leftJoin(frameSlots, eq(frameSlots.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt))

  // `userId` sengaja tidak ikut: tidak dipakai UI, dan apa pun yang
  // dikembalikan server function terlihat di payload hidrasi.
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
})

/* --- getCampaignForEdit ------------------------------------------------- */

export const getCampaignForEdit = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    // Spec 9.1: aplikasi lama mengambil data lewat endpoint publik yang
    // menolak campaign private tanpa memeriksa pemiliknya, sehingga pemilik
    // terkunci dari campaign private-nya sendiri. Kepemilikan ikut ke dalam
    // WHERE, jadi tidak ada cabang kode yang bisa lupa memeriksanya.
    const [row] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        slug: campaigns.slug,
        isPublic: campaigns.isPublic,
        frameWidth: campaigns.frameWidth,
        frameHeight: campaigns.frameHeight,
      })
      .from(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
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

    return { ...row, slots }
  })

/* --- updateCampaign ----------------------------------------------------- */

export const updateCampaign = createServerFn({ method: 'POST' })
  .validator((input: unknown) => detailSchema.extend({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [existing] = await db
      .select({ frameWidth: campaigns.frameWidth, frameHeight: campaigns.frameHeight })
      .from(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
      .limit(1)

    if (!existing) throw new Error(TIDAK_DITEMUKAN)

    assertSlotsFit(data.slots, { width: existing.frameWidth, height: existing.frameHeight })

    await db.transaction(async (tx) => {
      // `slug` sengaja TIDAK ikut diperbarui saat nama berubah. Tautan yang
      // sudah dibagikan creator harus tetap hidup; slug adalah alamat, bukan
      // cerminan nama.
      await tx
        .update(campaigns)
        .set({
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, data.id))

      // Hapus-lalu-tulis, bukan diff. Slot tidak punya identitas yang berarti
      // di luar nomor urutnya, dan keduanya dalam satu transaksi.
      await tx.delete(frameSlots).where(eq(frameSlots.campaignId, data.id))
      await tx.insert(frameSlots).values(slotRows(data.id, data.slots))
    })

    return { ok: true as const }
  })

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
        // ke `name` — pola yang sama dipakai getSession di server/session.ts.
        username: user.username,
        ownerName: user.name,
      })
      .from(campaigns)
      .innerJoin(user, eq(user.id, campaigns.userId))
      // `isPublic` masuk ke dalam WHERE, bukan diperiksa setelah barisnya
      // didapat. Campaign privat jadi "tidak ditemukan", bukan 403 —
      // keberadaannya tidak boleh bocor ke orang yang bukan pemiliknya.
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
    const { ownerName, username, ...campaign } = row
    return { ...campaign, username: username ?? ownerName, slots }
  })
