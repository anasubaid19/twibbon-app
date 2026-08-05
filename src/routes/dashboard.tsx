import {
  Add01Icon,
  Award01Icon,
  BarChartIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  CopyLinkIcon,
  Delete01Icon,
  Download01Icon,
  Edit01Icon,
  EyeIcon,
  GlobeIcon,
  Image01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Search01Icon,
  Share01Icon,
  SquareLock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Alert } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pesanError } from "@/lib/pesan-error"
import {
  type FilterVisibilitas,
  filterDanSortKampanye,
  type KampanyeRingkas,
  SORT_OPTIONS,
  type SortKampanye,
} from "@/lib/sort-kampanye"
import { cn } from "@/lib/utils"
import {
  deleteCampaign,
  duplicateCampaign,
  getDailyAnalytics,
  listMyCampaigns,
  renameCampaign,
} from "@/server/campaigns"
import { getSession } from "@/server/session"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: "/login" })
  },
  loader: () => listMyCampaigns(),
  pendingComponent: GridSkeleton,
  component: DashboardPage,
})

const FILTER_OPTIONS: Array<{ value: FilterVisibilitas; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "publik", label: "Publik" },
  { value: "privat", label: "Privat" },
]

type TabDashboard = "kampanye" | "analytics"

function DashboardPage() {
  const campaigns = Route.useLoaderData()
  const router = useRouter()
  const [error, setError] = useState("")
  const [tersalin, setTersalin] = useState("")

  const [tab, setTab] = useState<TabDashboard>("kampanye")
  const [cari, setCari] = useState("")
  const [filter, setFilter] = useState<FilterVisibilitas>("semua")
  const [sort, setSort] = useState<SortKampanye>("terbaru")

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.length > 0 ? campaigns[0].id : null,
  )
  const [dailyData, setDailyData] = useState<
    Array<{ date: string; views: number; downloads: number; shares: number }>
  >([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(
    null,
  )

  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [campaignToRename, setCampaignToRename] = useState<{ id: string; name: string } | null>(
    null,
  )
  const [renameValue, setRenameValue] = useState("")
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameError, setRenameError] = useState("")

  const terlihat = useMemo(
    () => filterDanSortKampanye(campaigns, cari, filter, sort),
    [campaigns, cari, filter, sort],
  )

  const ringkasan = useMemo(
    () => ({
      total: campaigns.length,
      publik: campaigns.filter((c) => c.isPublic).length,
      privat: campaigns.filter((c) => !c.isPublic).length,
      tampilan: campaigns.reduce((n, c) => n + c.viewCount, 0),
      pemakaian: campaigns.reduce((n, c) => n + c.useCount, 0),
      share: campaigns.reduce((n, c) => n + c.shareCount, 0),
    }),
    [campaigns],
  )

  const selectItems = campaigns.map((c) => ({ value: c.id, label: c.name }))

  // Kalau kampanye terpilih terhapus (misal lewat dialog), pindah ke yang pertama.
  useEffect(() => {
    const masihAda = selectedCampaignId ? campaigns.some((c) => c.id === selectedCampaignId) : false
    const berikut = masihAda ? selectedCampaignId : (campaigns[0]?.id ?? null)
    if (berikut !== selectedCampaignId) setSelectedCampaignId(berikut)
  }, [campaigns, selectedCampaignId])

  // Analytics hanya dimuat saat tab Analytics terbuka — membuka dashboard
  // tidak lagi menyeret recharts/query sia-sia.
  useEffect(() => {
    if (tab !== "analytics" || !selectedCampaignId) return
    let cancel = false
    setDailyData([])
    setAnalyticsError("")
    setAnalyticsLoading(true)
    getDailyAnalytics({ data: { id: selectedCampaignId } })
      .then((data) => {
        if (!cancel) setDailyData(data)
      })
      .catch((err) => {
        if (!cancel) {
          setDailyData([])
          setAnalyticsError(pesanError(err))
        }
      })
      .finally(() => {
        if (!cancel) setAnalyticsLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [tab, selectedCampaignId])

  async function salin(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/twibbon/${slug}`)
      setTersalin(slug)
      setTimeout(() => setTersalin(""), 2000)
    } catch {
      setError("Gagal menyalin. Buka halaman kampanyenya lalu salin dari bilah alamat.")
    }
  }

  function hapus(id: string, nama: string) {
    setCampaignToDelete({ id, name: nama })
    setDeleteDialogOpen(true)
  }

  async function confirmHapus() {
    if (!campaignToDelete) return
    try {
      await deleteCampaign({ data: { id: campaignToDelete.id } })
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
      await router.invalidate()
    } catch (err) {
      setError(pesanError(err))
    }
  }

  async function gandakan(id: string) {
    setError("")
    try {
      await duplicateCampaign({ data: { id } })
      await router.invalidate()
    } catch (err) {
      setError(pesanError(err))
    }
  }

  function mulaiRename(kampanye: { id: string; name: string }) {
    setCampaignToRename(kampanye)
    setRenameValue(kampanye.name)
    setRenameError("")
    setRenameDialogOpen(true)
  }

  async function confirmRename() {
    if (!campaignToRename) return
    try {
      await renameCampaign({ data: { id: campaignToRename.id, name: renameValue } })
      setRenameDialogOpen(false)
      setCampaignToRename(null)
      await router.invalidate()
    } catch (err) {
      setRenameError(pesanError(err))
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl p-6">
        <header className="flex flex-wrap items-end justify-between gap-3 py-6">
          <div>
            <h1 className="font-heading text-2xl">Kampanye Saya</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola seluruh campaign OpenFrame milikmu dari satu tempat.
            </p>
          </div>
          <Link to="/buat" className={buttonVariants({})}>
            <HugeiconsIcon icon={Add01Icon} aria-hidden /> Bikin Kampanye
          </Link>
        </header>

        {error && (
          <Alert variant="destructive" role="alert" className="mb-4">
            {error}
          </Alert>
        )}

        <section
          aria-label="Ringkasan"
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          <StatRingkas icon={Image01Icon} label="Total Kampanye" nilai={ringkasan.total} />
          <StatRingkas icon={GlobeIcon} label="Publik" nilai={ringkasan.publik} />
          <StatRingkas icon={SquareLock01Icon} label="Privat" nilai={ringkasan.privat} />
          <StatRingkas icon={EyeIcon} label="Tampilan" nilai={ringkasan.tampilan} />
          <StatRingkas icon={Download01Icon} label="Pemakaian" nilai={ringkasan.pemakaian} />
          <StatRingkas icon={Share01Icon} label="Share" nilai={ringkasan.share} />
        </section>

        <Tabs value={tab} onValueChange={(nilai) => setTab((nilai as TabDashboard) ?? "kampanye")}>
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList>
              <TabsTrigger value="kampanye">Kampanye</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {tab === "kampanye" && campaigns.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    aria-label="Cari kampanye"
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    placeholder="Cari kampanye…"
                    className="bg-background pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <fieldset
                    aria-label="Filter visibilitas"
                    className="inline-flex items-center gap-0.5 rounded-full bg-muted p-1"
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={filter === opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                          filter === opt.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-foreground/60 hover:text-foreground",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </fieldset>
                  <Select
                    items={SORT_OPTIONS}
                    value={sort}
                    onValueChange={(nilai) => setSort((nilai as SortKampanye) ?? "terbaru")}
                  >
                    <SelectTrigger aria-label="Urutkan" size="sm" className="w-auto bg-background">
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="kampanye">
            {campaigns.length === 0 ? (
              <Kosong />
            ) : terlihat.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">
                  Tidak ada kampanye yang cocok dengan pencarian atau filter ini.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCari("")
                    setFilter("semua")
                  }}
                  className="mt-4"
                >
                  Hapus filter
                </Button>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {terlihat.map((campaign) => (
                  <li key={campaign.id}>
                    <Card className="overflow-hidden rounded-xl transition-[border-color,box-shadow,transform] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background motion-safe:hover:-translate-y-[3px] hover:border-primary hover:shadow-[0_18px_50px_-22px_var(--primary)]">
                      <Link
                        to="/edit/$id"
                        params={{ id: campaign.id }}
                        className="block focus-visible:outline-none"
                      >
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <img
                            src={`/api/frame/${campaign.id}`}
                            alt=""
                            loading="lazy"
                            className="size-full object-contain motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/card:scale-[1.04]"
                          />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                            {campaign.isPublic ? (
                              <HugeiconsIcon icon={GlobeIcon} aria-hidden className="size-3" />
                            ) : (
                              <HugeiconsIcon
                                icon={SquareLock01Icon}
                                aria-hidden
                                className="size-3"
                              />
                            )}
                            {campaign.isPublic ? "Publik" : "Privat"}
                          </span>
                        </div>
                        <div className="px-4 pt-4">
                          <h2 className="line-clamp-2 font-heading text-base">{campaign.name}</h2>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <HugeiconsIcon icon={Image01Icon} aria-hidden className="size-4" />
                              {campaign.slotCount}
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <HugeiconsIcon icon={EyeIcon} aria-hidden className="size-4" />
                              {campaign.viewCount.toLocaleString("id-ID")}
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <HugeiconsIcon icon={Download01Icon} aria-hidden className="size-4" />
                              {campaign.useCount.toLocaleString("id-ID")}
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <HugeiconsIcon icon={Share01Icon} aria-hidden className="size-4" />
                              {campaign.shareCount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </Link>

                      <CardFooter className="justify-between gap-2">
                        <Link
                          to="/edit/$id"
                          params={{ id: campaign.id }}
                          className={buttonVariants({ size: "sm" })}
                        >
                          Kelola
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={
                              tersalin === campaign.slug ? "Tautan tersalin" : "Salin tautan"
                            }
                            onClick={() => salin(campaign.slug)}
                          >
                            {tersalin === campaign.slug ? (
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden />
                            ) : (
                              <HugeiconsIcon icon={CopyLinkIcon} aria-hidden />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Analytics"
                            onClick={() => {
                              setTab("analytics")
                              setSelectedCampaignId(campaign.id)
                            }}
                          >
                            <HugeiconsIcon icon={BarChartIcon} aria-hidden />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  aria-label="Aksi kampanye"
                                />
                              }
                            >
                              <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  render={<Link to="/edit/$id" params={{ id: campaign.id }} />}
                                >
                                  <HugeiconsIcon icon={Edit01Icon} aria-hidden />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => gandakan(campaign.id)}>
                                  <HugeiconsIcon icon={Copy01Icon} aria-hidden />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    mulaiRename({ id: campaign.id, name: campaign.name })
                                  }
                                >
                                  <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden />
                                  Rename
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => hapus(campaign.id, campaign.name)}
                                >
                                  <HugeiconsIcon icon={Delete01Icon} aria-hidden />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardFooter>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {campaigns.length === 0 ? (
              <AnalyticsKosong />
            ) : (
              <section className="grid gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatRingkas icon={EyeIcon} label="Total View" nilai={ringkasan.tampilan} />
                  <StatRingkas
                    icon={Download01Icon}
                    label="Total Download"
                    nilai={ringkasan.pemakaian}
                  />
                  <StatRingkas icon={Share01Icon} label="Total Share" nilai={ringkasan.share} />
                </div>

                <Terpopuler kampanye={campaigns} />

                <Card className="p-4">
                  <div className="mb-4">
                    <label
                      htmlFor="campaign-select"
                      className="mb-1 block text-sm text-muted-foreground"
                    >
                      Pilih kampanye
                    </label>
                    <Select
                      items={selectItems}
                      value={selectedCampaignId ?? ""}
                      onValueChange={(nilai) => setSelectedCampaignId(nilai || null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih kampanye" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {analyticsError ? (
                    <Alert variant="destructive" role="alert">
                      {analyticsError}
                    </Alert>
                  ) : analyticsLoading ? (
                    <SkeletonChart />
                  ) : dailyData.length > 0 ? (
                    <AnalyticsChart
                      data={dailyData}
                      xKey="date"
                      lines={[
                        { key: "views", color: "#3b82f6", name: "Views" },
                        { key: "downloads", color: "#22c55e", name: "Downloads" },
                        { key: "shares", color: "#f59e0b", name: "Shares" },
                      ]}
                    />
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada data analytics untuk kampanye ini.
                    </p>
                  )}
                </Card>
              </section>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kampanye?</DialogTitle>
            <DialogDescription>
              Hapus "{campaignToDelete?.name}"? Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmHapus}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah nama kampanye</DialogTitle>
            <DialogDescription>Beri nama baru untuk "{campaignToRename?.name}".</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setRenameLoading(true)
              confirmRename().finally(() => setRenameLoading(false))
            }}
            className="grid gap-4"
          >
            {renameError && (
              <Alert variant="destructive" role="alert">
                {renameError}
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="rename-input">Nama kampanye</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                required
                minLength={3}
                maxLength={80}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRenameDialogOpen(false)
                  setRenameError("")
                  setCampaignToRename(null)
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={renameLoading}
                disabled={renameLoading || renameValue.trim().length < 3}
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatRingkas({
  icon,
  label,
  nilai,
}: {
  icon: IconSvgElement
  label: string
  nilai: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 shadow-(--shadow-surface)">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={icon} aria-hidden className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-lg leading-tight font-bold tabular-nums tracking-[-0.03em]">
          {nilai.toLocaleString("id-ID")}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  )
}

function Kosong() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-primary/25 bg-card px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={Image01Icon} aria-hidden className="size-7" />
        </div>
        <h3 className="mt-5 font-heading text-xl font-bold">Mulai kampanye pertamamu</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Unggah frame PNG, atur area fotonya, lalu bagikan tautannya. Semua kampanyemu akan
          terkelola di sini.
        </p>
        <Link to="/buat" className={`${buttonVariants({})} mt-6`}>
          <HugeiconsIcon icon={Add01Icon} aria-hidden /> Bikin Kampanye
        </Link>
      </div>
    </div>
  )
}

function Terpopuler({ kampanye }: { kampanye: KampanyeRingkas[] }) {
  const teratas = [...kampanye].sort((a, b) => b.viewCount - a.viewCount).slice(0, 3)
  const puncak = teratas[0]?.viewCount ?? 0

  if (puncak === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Award01Icon} aria-hidden className="size-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-semibold">Campaign Terpopuler</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Belum ada data kunjungan.</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Award01Icon} aria-hidden className="size-4 text-muted-foreground" />
        <h3 className="font-heading text-sm font-semibold">Campaign Terpopuler</h3>
      </div>
      <ul className="grid gap-3">
        {teratas.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-3">
              <span className="w-4 shrink-0 font-heading text-sm text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="truncate text-sm font-medium">{c.name}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground tabular-nums">
              <HugeiconsIcon icon={EyeIcon} aria-hidden className="size-4" />
              {c.viewCount.toLocaleString("id-ID")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function AnalyticsKosong() {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <HugeiconsIcon icon={BarChartIcon} aria-hidden className="size-6" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold">Belum ada data analytics</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Buat kampanye dulu — statistik tampilan, unduhan, dan share akan muncul di sini.
      </p>
    </Card>
  )
}

function SkeletonChart() {
  return (
    <div className="py-2" role="status" aria-label="Memuat analytics">
      <div className="flex h-40 items-end gap-2">
        {["a", "b", "c", "d", "e", "f", "g"].map((k, i) => (
          <div
            key={k}
            className="flex-1 animate-pulse rounded-t bg-muted"
            style={{ height: `${40 + ((i * 13) % 45)}%` }}
          />
        ))}
      </div>
      <div className="mt-3 h-2 w-40 animate-pulse rounded bg-muted" />
    </div>
  )
}

function GridSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Memuat kampanye"
    >
      {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
        <div key={k} className="overflow-hidden rounded-xl border border-border/70">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
