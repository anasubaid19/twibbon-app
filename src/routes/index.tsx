import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Camera01Icon,
  CheckmarkCircle01Icon,
  CopyLinkIcon,
  FileUploadIcon,
  Image01Icon,
  Image02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getStats, listPublic } from "@/server/campaigns"

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    q: z.string().catch(""),
    hal: z.number().int().min(1).catch(1),
  }),
  loaderDeps: ({ search }) => ({ q: search.q, hal: search.hal }),
  loader: ({ deps }) =>
    Promise.all([listPublic({ data: deps }), getStats()]).then(([campaigns, stats]) => ({
      campaigns,
      stats,
    })),
  component: Beranda,
})

const features = [
  {
    icon: Image02Icon,
    title: "Multi-slot tanpa ribet",
    description: "Atur satu atau banyak area foto untuk frame kolase dan kampanye grup.",
  },
  {
    icon: FileUploadIcon,
    title: "Upload sekali, langsung jadi",
    description: "Gunakan frame PNG transparan sampai 10MB dan lihat hasilnya sebelum dibagikan.",
  },
  {
    icon: CopyLinkIcon,
    title: "Bagikan lewat satu link",
    description: "Tidak perlu akun untuk mulai. Terbitkan link kampanye dan sebarkan ke mana saja.",
  },
  {
    icon: CheckmarkCircle01Icon,
    title: "Tetap pegang kendali",
    description: "Pilih tampil di galeri publik atau simpan sebagai kampanye unlisted.",
  },
]

function Beranda() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const adaPencarian = search.q.trim().length > 0

  return (
    <>
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden border-b border-border/70">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_22%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_30%),radial-gradient(circle_at_8%_35%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_28%)]" />
          <div className="pointer-events-none absolute right-[12%] top-20 -z-10 h-32 w-32 rounded-full border border-primary/15 bg-primary/5 blur-[1px]" />

          <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-6 py-16 sm:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-28">
            <div className="max-w-xl">
              <div className="fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                Twibbon yang siap dibagikan
              </div>
              <h1 className="fade-up font-heading text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-7xl">
                Satu frame.
                <br />
                <span className="text-primary">Semua cerita.</span>
              </h1>
              <p className="fade-up-2 mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Buat twibbon multi-slot untuk komunitas, acara, dan momen yang ingin dikenang.
                Upload frame, atur area foto, lalu bagikan link-nya. Gratis tanpa perlu bikin akun.
              </p>
              <div className="fade-up-3 mt-8 flex flex-wrap items-center gap-3">
                <Link to="/buat" className={buttonVariants({ size: "lg" })}>
                  Bikin twibbon gratis <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
                </Link>
                <a href="#galeri" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Lihat galeri
                </a>
              </div>
              <div className="fade-up-3 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    aria-hidden
                    className="text-primary"
                  />
                  Tanpa email
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    aria-hidden
                    className="text-primary"
                  />
                  Gratis selamanya
                </span>
              </div>
            </div>

            <FrameMockup />
          </div>
        </section>

        {data.stats.campaignCount > 0 && (
          <section className="mx-auto grid max-w-[1140px] gap-3 px-6 py-8 sm:grid-cols-3">
            <Stat value={data.stats.campaignCount} label="kampanye publik" />
            <Stat value={data.stats.useCount} label="pemakaian twibbon" />
            <Stat value={data.stats.creatorCount} label="creator bergabung" />
          </section>
        )}

        <section className="mx-auto max-w-[1140px] px-6 py-section">
          <div className="mb-8 max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Kenapa OpenFrame
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Dari ide ke link dalam hitungan menit.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group h-full p-5 motion-safe:transition-transform motion-safe:hover:-translate-y-1"
              >
                <div className="mb-8 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <HugeiconsIcon icon={feature.icon} aria-hidden className="size-5" />
                </div>
                <h3 className="font-heading text-base font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section id="galeri" className="scroll-mt-24 border-y border-border/70 bg-muted/25">
          <div className="mx-auto max-w-[1140px] px-6 py-section">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Dibuat oleh komunitas
                </p>
                <h2 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                  Kampanye terbaru
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Temukan frame yang sedang dipakai dan mulai dari sana.
                </p>
              </div>
              {data.campaigns.total > 0 && (
                <span className="text-sm text-muted-foreground">
                  {data.campaigns.total} kampanye publik
                </span>
              )}
            </div>

            {(data.campaigns.total > 0 || adaPencarian) && (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  const q = new FormData(event.currentTarget).get("q")?.toString() ?? ""
                  navigate({ to: "/", search: { q, hal: 1 }, hash: "galeri" })
                }}
                className="mb-8 flex max-w-xl gap-2"
              >
                <Input
                  name="q"
                  defaultValue={search.q}
                  placeholder="Cari kampanye…"
                  aria-label="Cari nama kampanye"
                  className="bg-background"
                />
                <Button type="submit">Cari</Button>
                {adaPencarian && (
                  <Link
                    to="/"
                    search={{ q: "", hal: 1 }}
                    hash="galeri"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Hapus
                  </Link>
                )}
              </form>
            )}

            {data.campaigns.rows.length === 0 ? (
              <EmptyGallery hasSearch={adaPencarian} query={search.q} />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.campaigns.rows.map((campaign) => (
                  <li key={campaign.id}>
                    <Link
                      to="/twibbon/$slug"
                      params={{ slug: campaign.slug }}
                      className="group block"
                    >
                      <Card className="overflow-hidden transition-[border-color,box-shadow,transform] motion-safe:group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-[0_18px_50px_-22px_var(--primary)]">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <img
                            src={`/api/frame/${campaign.id}`}
                            alt=""
                            loading="lazy"
                            className="size-full object-contain motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                          />
                          <span className="absolute left-3 top-3 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                            OpenFrame
                          </span>
                        </div>
                        <div className="p-5">
                          <h3 className="truncate font-heading text-base font-bold">
                            {campaign.name}
                          </h3>
                          {campaign.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
                              {campaign.description}
                            </p>
                          )}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            <Badge variant="netral">{campaign.slotCount} area</Badge>
                            <Badge variant="netral">{campaign.useCount}x dipakai</Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {data.campaigns.totalHal > 1 && <Pagination data={data.campaigns} search={search} />}
          </div>
        </section>

        <section className="mx-auto max-w-[1140px] px-6 py-section">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-7 py-10 text-primary-foreground sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[32px] border-primary-foreground/10" />
            <div className="relative max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">
                Siap mulai?
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
                Bawa kampanyemu ke semua foto.
              </h2>
              <p className="mt-4 max-w-lg text-primary-foreground/75">
                Tidak ada setup panjang. Frame PNG kamu adalah satu-satunya bahan yang dibutuhkan.
              </p>
              <Link
                to="/buat"
                className={`${buttonVariants({ variant: "secondary", size: "lg" })} mt-7`}
              >
                Mulai bikin sekarang <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

function FrameMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] px-4 py-8 sm:px-12">
      <div className="absolute inset-x-16 top-4 bottom-4 rounded-[3rem] bg-primary/15 blur-3xl" />
      <div className="relative rotate-2 rounded-[2rem] border border-border/80 bg-card p-3 shadow-[0_30px_80px_-28px_var(--primary)] motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:rotate-0">
        <div className="relative aspect-[4/4.6] overflow-hidden rounded-[1.4rem] bg-muted">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_26%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_26%),linear-gradient(145deg,color-mix(in_oklab,var(--primary)_12%,var(--muted)),var(--muted))]" />
          <div className="absolute left-[14%] top-[15%] aspect-square w-[32%] rounded-[1.4rem] border-4 border-background/80 bg-background/30 shadow-lg backdrop-blur-sm">
            <div className="flex size-full items-center justify-center text-primary/70">
              <HugeiconsIcon icon={Camera01Icon} aria-hidden className="size-8" />
            </div>
          </div>
          <div className="absolute bottom-[18%] right-[13%] aspect-[1.18] w-[38%] rounded-[1.4rem] border-4 border-background/80 bg-background/25 shadow-lg backdrop-blur-sm">
            <div className="flex size-full items-center justify-center text-primary/70">
              <HugeiconsIcon icon={UserIcon} aria-hidden className="size-8" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-[1.4rem] border-[14px] border-primary/20" />
          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-background/40 bg-background/80 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Campaign preview
                </p>
                <p className="mt-1 font-heading text-sm font-bold">Hari yang dirayakan</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                2 slots
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -left-1 top-6 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg sm:left-0">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={FileUploadIcon} aria-hidden className="size-4" />
          </span>
          Upload & arrange
        </div>
      </div>
      <div className="absolute -right-1 bottom-6 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg sm:right-0">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={CopyLinkIcon} aria-hidden className="size-4" />
          </span>
          Ready to share
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 px-5 py-4 shadow-(--shadow-surface)">
      <p className="font-heading text-2xl font-bold tabular-nums tracking-[-0.04em]">
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyGallery({ hasSearch, query }: { hasSearch: boolean; query: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-primary/25 bg-card px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={Image01Icon} aria-hidden className="size-7" />
        </div>
        <h3 className="mt-5 font-heading text-xl font-bold">
          {hasSearch ? "Tidak menemukan yang cocok" : "Jadilah yang pertama"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hasSearch
            ? `Tidak ada kampanye publik yang cocok dengan “${query}”. Coba kata lain.`
            : "Belum ada kampanye publik di sini. Buat frame pertamamu dan bagikan ke komunitas."}
        </p>
        {!hasSearch && (
          <Link to="/buat" className={`${buttonVariants({})} mt-6`}>
            Bikin kampanye pertama <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}

function Pagination({
  data,
  search,
}: {
  data: { hal: number; totalHal: number }
  search: { q: string }
}) {
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginasi">
      {data.hal > 1 ? (
        <Link
          to="/"
          search={{ q: search.q, hal: data.hal - 1 }}
          hash="galeri"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden /> Sebelumnya
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-sm text-muted-foreground opacity-45">
          <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden /> Sebelumnya
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        Halaman {data.hal} dari {data.totalHal}
      </span>
      {data.hal < data.totalHal ? (
        <Link
          to="/"
          search={{ q: search.q, hal: data.hal + 1 }}
          hash="galeri"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Berikutnya <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-sm text-muted-foreground opacity-45">
          Berikutnya <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </span>
      )}
    </nav>
  )
}
