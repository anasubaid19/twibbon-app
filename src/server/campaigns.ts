import { randomUUID } from "node:crypto"
import { createServerFn } from "@tanstack/react-start"
import { and, count, desc, eq, ilike, like, or, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { campaignEvents, campaigns, frameSlots, user } from "@/db/schema"
import { isValidSlot } from "@/lib/geometry"
import { resolveSlug, SLUG_PATTERN, slugify } from "@/lib/slug"
import { asalUrl } from "@/server/origin"
import { getOptionalUserId, requireUserId } from "@/server/require-user"
import { deleteFrameDir, hapusBerkas, saveFrame, validateFrame } from "@/server/upload"

/* --- Skema bersama ------------------------------------------------------ */

// `crypto.randomUUID()` selalu menghasilkan UUID v4, jadi pola ini cocok
// untuk semua id yang kita terbitkan sendiri.
const idSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Kampanye tidak ditemukan",
  )

const slotSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  // Sudut rotasi opsional — klien lama yang tidak tahu fitur ini cukup
  // dianggap 0 derajat.
  rotation: z.number().min(-360).max(360).default(0),
  label: z.string().max(40, "Label area maksimal 40 karakter").default(""),
})

const detailSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama kampanye minimal 3 karakter")
    .max(80, "Nama kampanye maksimal 80 karakter"),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").default(""),
  isPublic: z.boolean(),
  // Fase 2 hanya membuat satu slot lewat UI, tapi bentuk datanya memang array
  // (tabel frame_slots). Batas 20 mengikuti PRD US-02.
  slots: z
    .array(slotSchema)
    .min(1, "Tentukan minimal satu area foto")
    .max(20, "Maksimal 20 area foto"),
})

/** Pesan yang sama untuk "tidak ada" dan "bukan milikmu" — keberadaan campaign orang lain tidak bocor. */
const TIDAK_DITEMUKAN = "Kampanye tidak ditemukan"
const AREA_TIDAK_SAH = "Area foto harus berada di dalam frame dan minimal 20x20 piksel"

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

function slotRows(campaignId: string, slots: z.infer<typeof detailSchema>["slots"]) {
  return slots.map((slot, i) => ({
    id: randomUUID(),
    campaignId,
    slotIndex: i + 1,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    rotation: slot.rotation,
    label: slot.label,
  }))
}

/* --- createCampaign ----------------------------------------------------- */

function parseCreateInput(input: unknown) {
  // Berkas dan field menyatu dalam satu FormData supaya penyimpanannya satu
  // langkah. Tidak ada endpoint unggah terpisah, jadi tidak ada berkas yatim
  // yang perlu dibersihkan kalau creator kabur di tengah jalan.
  if (!(input instanceof FormData)) throw new Error("Kiriman tidak sah")

  const frame = input.get("frame")
  if (!(frame instanceof File) || frame.size === 0) throw new Error("Frame PNG wajib diunggah")

  let slots: unknown
  try {
    slots = JSON.parse(String(input.get("slots") ?? "[]"))
  } catch {
    throw new Error("Data area foto rusak, coba muat ulang halaman")
  }

  return {
    frame,
    // Slug custom opsional. Dibatasi panjangnya di sini; penyeragaman bentuknya
    // (huruf kecil, ganti karakter tak sah) diserahkan ke slugify di handler,
    // supaya klien dan server memakai aturan yang sama.
    slug: z
      .string()
      .max(200)
      .default("")
      .parse(String(input.get("slug") ?? "")),
    ...detailSchema.parse({
      name: String(input.get("name") ?? ""),
      description: String(input.get("description") ?? ""),
      isPublic: input.get("isPublic") === "true",
      slots,
    }),
  }
}

export const createCampaign = createServerFn({ method: "POST" })
  .validator(parseCreateInput)
  .handler(async ({ data }) => {
    const userId = await getOptionalUserId()

    const bytes = Buffer.from(await data.frame.arrayBuffer())
    const frame = await validateFrame(bytes)
    assertSlotsFit(data.slots, frame)

    // Slug custom yang diketik creator jadi basisnya; kalau kosong, diturunkan
    // dari nama seperti sebelumnya. slugify menyeragamkan keduanya, jadi
    // "HUT RI 80!!" maupun nama apa pun berakhir sebagai slug yang sah.
    const base = slugify(data.slug || data.name)
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
          userId: userId ?? sql`NULL`,
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
      if (error instanceof Error && error.message.includes("campaigns_slug_unique")) {
        throw new Error("Nama itu barusan dipakai orang lain. Ganti sedikit, lalu simpan lagi.")
      }
      throw error
    }

    return { id, slug }
  })

/* --- listMyCampaigns ---------------------------------------------------- */

export const listMyCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId()

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      slug: campaigns.slug,
      isPublic: campaigns.isPublic,
      useCount: campaigns.useCount,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
      slotCount: count(frameSlots.id),
      viewCount:
        sql<number>`COALESCE(SUM(CASE WHEN ${campaignEvents.eventType} = 'view' THEN 1 ELSE 0 END), 0)`.as(
          "view_count",
        ),
      shareCount:
        sql<number>`COALESCE(SUM(CASE WHEN ${campaignEvents.eventType} = 'share' THEN 1 ELSE 0 END), 0)`.as(
          "share_count",
        ),
    })
    .from(campaigns)
    .leftJoin(frameSlots, eq(frameSlots.campaignId, campaigns.id))
    .leftJoin(campaignEvents, eq(campaignEvents.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt))

  // `userId` sengaja tidak ikut: tidak dipakai UI, dan apa pun yang
  // dikembalikan server function terlihat di payload hidrasi.
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
})

/* --- getCampaignForEdit ------------------------------------------------- */

export const getCampaignForEdit = createServerFn({ method: "GET" })
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
        rotation: frameSlots.rotation,
        label: frameSlots.label,
      })
      .from(frameSlots)
      .where(eq(frameSlots.campaignId, row.id))
      .orderBy(frameSlots.slotIndex)

    return { ...row, slots }
  })

/* --- updateCampaign ----------------------------------------------------- */

export const updateCampaign = createServerFn({ method: "POST" })
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

export const getCampaignBySlug = createServerFn({ method: "GET" })
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
        isPublic: campaigns.isPublic,
        frameWidth: campaigns.frameWidth,
        frameHeight: campaigns.frameHeight,
        useCount: campaigns.useCount,
        // `username` nullable di schema, jadi diambil berdua lalu dijatuhkan
        // ke `name` — pola yang sama dipakai getSession di server/session.ts.
        username: user.username,
        ownerName: user.name,
      })
      .from(campaigns)
      .leftJoin(user, eq(user.id, campaigns.userId))
      // `isPublic` sengaja TIDAK ikut menyaring di sini. Privat berarti
      // "tidak terdaftar", bukan "hanya pemilik": slug adalah tautannya, dan
      // siapa pun yang memegang tautan itu boleh membuka halamannya. Yang
      // menjaga kerahasiaannya adalah listPublic — campaign privat tidak
      // pernah muncul di galeri, jadi tidak bisa ditemukan tanpa tautan.
      .where(eq(campaigns.slug, data.slug))
      .limit(1)

    if (!row) return null

    const slots = await db
      .select({
        x: frameSlots.x,
        y: frameSlots.y,
        width: frameSlots.width,
        height: frameSlots.height,
        rotation: frameSlots.rotation,
        label: frameSlots.label,
      })
      .from(frameSlots)
      .where(eq(frameSlots.campaignId, row.id))
      .orderBy(frameSlots.slotIndex)

    // `userId` sengaja tidak ikut. Yang keluar cuma username, yang memang
    // ditampilkan di halaman partisipan sebagai "oleh @siapa".
    const { ownerName, username, ...campaign } = row
    // Open Graph mengabaikan URL relatif, dan hanya server yang tahu alamat
    // kanonik aplikasi.
    const asal = asalUrl()
    return {
      ...campaign,
      username: username ?? ownerName,
      slots,
      ogImage: `${asal}/api/frame/${campaign.id}`,
      ogUrl: `${asal}/twibbon/${campaign.slug}`,
    }
  })

/* --- incrementUse -------------------------------------------------------- */

export const incrementUse = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    // Tanpa sesi: partisipan memang anonim. Dinaikkan lewat ekspresi SQL,
    // bukan baca-lalu-tulis, supaya dua unduhan bersamaan tidak saling
    // menimpa. `isPublic` tidak disaring: campaign privat tetap bisa dipakai
    // lewat tautannya, jadi pemakaiannya harus ikut terhitung juga.
    await db
      .update(campaigns)
      .set({ useCount: sql`${campaigns.useCount} + 1` })
      .where(eq(campaigns.id, data.id))

    return { ok: true as const }
  })

/* --- trackEvent ---------------------------------------------------------- */

export const trackEvent = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        id: idSchema,
        type: z.enum(["view", "download", "share"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await db.insert(campaignEvents).values({
      id: randomUUID(),
      campaignId: data.id,
      eventType: data.type,
    })
    return { ok: true as const }
  })

/* --- getDailyAnalytics --------------------------------------------------- */

export const getDailyAnalytics = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [own] = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
      .limit(1)

    if (!own) throw new Error(TIDAK_DITEMUKAN)

    const rows = await db
      .select({
        date: sql<string>`DATE(${campaignEvents.createdAt})`.as("date"),
        views: sql<number>`COUNT(*) FILTER (WHERE ${campaignEvents.eventType} = 'view')`.as(
          "views",
        ),
        downloads: sql<number>`COUNT(*) FILTER (WHERE ${campaignEvents.eventType} = 'download')`.as(
          "downloads",
        ),
        shares: sql<number>`COUNT(*) FILTER (WHERE ${campaignEvents.eventType} = 'share')`.as(
          "shares",
        ),
      })
      .from(campaignEvents)
      .where(
        and(
          eq(campaignEvents.campaignId, data.id),
          sql`${campaignEvents.createdAt} >= NOW() - INTERVAL '7 days'`,
        ),
      )
      .groupBy(sql`DATE(${campaignEvents.createdAt})`)
      .orderBy(sql`DATE(${campaignEvents.createdAt})`)

    return rows
  })

/* --- getDashboardAnalytics ----------------------------------------------- */

export const getDashboardAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId()

  const rows = await db
    .select({
      campaignId: campaignEvents.campaignId,
      viewCount: sql<number>`COUNT(*) FILTER (WHERE ${campaignEvents.eventType} = 'view')`.as(
        "view_count",
      ),
      downloadCount:
        sql<number>`COUNT(*) FILTER (WHERE ${campaignEvents.eventType} = 'download')`.as(
          "download_count",
        ),
      shareCount: sql<number>`COUNT(*) FILTER (WHERE ${campaignEvents.eventType} = 'share')`.as(
        "share_count",
      ),
    })
    .from(campaignEvents)
    .innerJoin(campaigns, eq(campaignEvents.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId))
    .groupBy(campaignEvents.campaignId)

  return rows
})

/* --- listPublic ---------------------------------------------------------- */

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
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
}

export const listPublic = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        q: z.string().max(MAKS_KATA_KUNCI).default(""),
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

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const [stats] = await db
    .select({
      campaignCount: count(campaigns.id),
      useCount: sql<number>`COALESCE(SUM(${campaigns.useCount}), 0)`,
      creatorCount: sql<number>`COUNT(DISTINCT ${campaigns.userId})`,
    })
    .from(campaigns)
    .where(eq(campaigns.isPublic, true))

  return {
    campaignCount: stats?.campaignCount ?? 0,
    useCount: Number(stats?.useCount ?? 0),
    creatorCount: Number(stats?.creatorCount ?? 0),
  }
})

/* --- deleteCampaign ------------------------------------------------------ */

export const deleteCampaign = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    // Kepemilikan ikut ke dalam WHERE. `returning` memberi tahu apakah barisnya
    // benar-benar terhapus — tanpa itu, mencoba menghapus campaign orang lain
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

/* --- replaceFrame -------------------------------------------------------- */

function parseReplaceInput(input: unknown) {
  if (!(input instanceof FormData)) throw new Error("Kiriman tidak sah")
  const frame = input.get("frame")
  if (!(frame instanceof File) || frame.size === 0) throw new Error("Frame PNG wajib diunggah")
  return { id: idSchema.parse(String(input.get("id") ?? "")), frame }
}

export const replaceFrame = createServerFn({ method: "POST" })
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

    // Nama berkas baru diacak saveFrame, jadi jalurnya berbeda dari yang lama.
    // Itu yang membuat ETag di route penyaji ikut berubah dan browser tidak
    // menyajikan frame lama dari cache.
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

    // Slot TIDAK perlu dipetakan ulang: koordinatnya persen, jadi otomatis
    // menyesuaikan dimensi frame baru (spec 5.3). Itu memang alasan
    // koordinatnya disimpan sebagai persen sejak awal.
    await hapusBerkas(lama.framePath)

    return { frameWidth: frame.width, frameHeight: frame.height }
  })
