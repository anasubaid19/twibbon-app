import {
  Add01Icon,
  Camera01Icon,
  FileUploadIcon,
  Logout01Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  DropdownMenuLabel,
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
import { authClient } from "@/lib/auth-client"
import { pesanError } from "@/lib/pesan-error"
import { changePassword, uploadAvatar } from "@/server/auth"
import { deleteCampaign, getDailyAnalytics, listMyCampaigns } from "@/server/campaigns"
import { getSession } from "@/server/session"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: "/login" })
    return { username: session.user.username, userImage: session.user.image ?? null }
  },
  loader: () => listMyCampaigns(),
  component: DashboardPage,
})

function DashboardPage() {
  const { username, userImage } = Route.useRouteContext()
  const campaigns = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [logoutError, setLogoutError] = useState("")
  const [tersalin, setTersalin] = useState("")
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

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // Avatar upload state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userImage)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Select items for campaign dropdown
  const selectItems = campaigns.map((c) => ({ value: c.id, label: c.name }))

  useEffect(() => {
    const selectedStillExists = selectedCampaignId
      ? campaigns.some((campaign) => campaign.id === selectedCampaignId)
      : false
    const nextId = selectedStillExists ? selectedCampaignId : (campaigns[0]?.id ?? null)

    if (nextId !== selectedCampaignId) {
      setSelectedCampaignId(nextId)
      setDailyData([])
      setAnalyticsError("")
      return
    }

    if (!nextId) {
      setDailyData([])
      setAnalyticsLoading(false)
      return
    }

    let cancel = false
    setDailyData([])
    setAnalyticsError("")
    setAnalyticsLoading(true)
    getDailyAnalytics({ data: { id: nextId } })
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
  }, [campaigns, selectedCampaignId])

  async function salin(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/twibbon/${slug}`)
      setTersalin(slug)
      setTimeout(() => setTersalin(""), 2000)
    } catch {
      setLogoutError("Gagal menyalin. Buka halaman kampanyenya lalu salin dari bilah alamat.")
    }
  }

  async function hapus(id: string, nama: string) {
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
      setLogoutError(pesanError(err))
    }
  }

  async function handleLogout() {
    setLogoutError("")
    try {
      await authClient.signOut()
      navigate({ to: "/login" })
    } catch (err) {
      setLogoutError(pesanError(err))
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")
    setPasswordLoading(true)
    try {
      await changePassword({
        data: {
          currentPassword,
          newPassword,
        },
      })
      setPasswordSuccess("Password berhasil diubah!")
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => setPasswordDialogOpen(false), 1500)
    } catch (err) {
      setPasswordError(pesanError(err))
    } finally {
      setPasswordLoading(false)
    }
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Ukuran gambar maksimal 5MB")
      return
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarError("Format gambar harus PNG, JPG, atau WebP")
      return
    }
    setAvatarFile(file)
    setAvatarError("")
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return
    setAvatarError("")
    setAvatarLoading(true)
    try {
      const ext = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      }[avatarFile.type as "image/png" | "image/jpeg" | "image/webp"]
      if (!ext) {
        setAvatarError("Format gambar harus PNG, JPG, atau WebP")
        return
      }
      const reader = new FileReader()
      const data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(avatarFile)
      })
      const result = await uploadAvatar({
        data: { data, ext },
      })
      setAvatarPreview(result.image)
      setAvatarFile(null)
      setAvatarDialogOpen(false)
      await router.invalidate()
    } catch (err) {
      setAvatarError(pesanError(err))
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
        <h1 className="font-heading text-2xl">Kampanye Saya</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Akun"
                  className="bg-muted"
                />
              }
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="size-4 rounded-full object-cover" />
              ) : (
                <HugeiconsIcon icon={UserIcon} aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{username}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setAvatarDialogOpen(true)}>
                  <HugeiconsIcon icon={Camera01Icon} aria-hidden />
                  Ganti Foto Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                  <HugeiconsIcon icon={Settings01Icon} aria-hidden />
                  Ganti Password
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <HugeiconsIcon icon={Logout01Icon} aria-hidden />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {logoutError && (
        <Alert variant="destructive" role="alert" className="mb-4">
          {logoutError}
        </Alert>
      )}

      <Link to="/buat" className={`mb-6 ${buttonVariants({})}`}>
        <HugeiconsIcon icon={Add01Icon} aria-hidden /> Bikin Kampanye
      </Link>

      {campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Belum ada kampanye. Unggah frame PNG-mu, gambar area fotonya, lalu bagikan tautannya.
        </p>
      ) : (
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Kampanye</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="campaigns">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Card className="overflow-hidden transition-[border-color,transform] motion-safe:hover:-translate-y-[3px] hover:border-primary">
                    <Link to="/edit/$id" params={{ id: campaign.id }} className="block">
                      <img
                        src={`/api/frame/${campaign.id}`}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full bg-muted object-contain"
                      />
                      <div className="px-4 pt-4">
                        <h2 className="mb-1.5 truncate font-heading text-base">{campaign.name}</h2>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="netral">{campaign.slotCount} area</Badge>
                          <Badge variant={campaign.isPublic ? "publik" : "privat"}>
                            {campaign.isPublic ? "Publik" : "Privat"}
                          </Badge>
                          <Badge variant="netral">{campaign.useCount}x dipakai</Badge>
                          <Badge variant="netral">{campaign.viewCount} lihat</Badge>
                          <Badge variant="netral">{campaign.shareCount} share</Badge>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-wrap gap-1.5 p-4">
                      <Link
                        to="/twibbon/$slug"
                        params={{ slug: campaign.slug }}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Lihat
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => salin(campaign.slug)}>
                        {tersalin === campaign.slug ? "Tersalin!" : "Salin tautan"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => hapus(campaign.id, campaign.name)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="analytics">
            <section>
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
                    onValueChange={(value) => setSelectedCampaignId(value || null)}
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
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Memuat analytics…
                  </p>
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
          </TabsContent>
        </Tabs>
      )}

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

      {/* Password change dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Password</DialogTitle>
            <DialogDescription>Masukkan password lama dan password baru kamu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="grid gap-4">
            {passwordError && (
              <Alert variant="destructive" role="alert">
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && <Alert role="alert">{passwordSuccess}</Alert>}
            <div className="grid gap-2">
              <Label htmlFor="current-password">Password saat ini</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false)
                  setPasswordError("")
                  setPasswordSuccess("")
                  setCurrentPassword("")
                  setNewPassword("")
                }}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={passwordLoading} disabled={passwordLoading}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Avatar upload dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Foto Profil</DialogTitle>
            <DialogDescription>Pilih foto baru (PNG, JPG, atau WebP, maks 5MB).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {avatarError && (
              <Alert variant="destructive" role="alert">
                {avatarError}
              </Alert>
            )}
            {avatarPreview && (
              <div className="flex justify-center">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="size-24 rounded-full border-2 border-border object-cover"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvatarDialogOpen(false)
                  setAvatarFile(null)
                  setAvatarError("")
                  setAvatarPreview(userImage)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                Batal
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <HugeiconsIcon icon={FileUploadIcon} aria-hidden />
                Pilih Foto
              </Button>
              <Button
                type="button"
                isLoading={avatarLoading}
                disabled={!avatarFile || avatarLoading}
                onClick={handleAvatarUpload}
              >
                Simpan
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
