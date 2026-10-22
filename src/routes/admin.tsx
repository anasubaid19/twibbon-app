import { Delete01Icon, Shield01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Alert } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { pesanError } from "@/lib/pesan-error"
import { deleteCampaignAdmin, listAllCampaigns } from "@/server/campaigns"
import { getSession } from "@/server/session"

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: "/login" })
    if (session.user.role !== "superadmin") throw redirect({ to: "/", search: { q: "", hal: 1 } })
  },
  loader: () => listAllCampaigns(),
  component: AdminPage,
})

function AdminPage() {
  const campaigns = Route.useLoaderData()
  const router = useRouter()
  const [error, setError] = useState("")
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)
  const [open, setOpen] = useState(false)

  async function confirmHapus() {
    if (!toDelete) return
    try {
      await deleteCampaignAdmin({ data: { id: toDelete.id } })
      setOpen(false)
      setToDelete(null)
      await router.invalidate()
    } catch (err) {
      setError(pesanError(err))
    }
  }

  return (
    <>
      <Navbar username="admin" />
      <main className="mx-auto max-w-7xl p-6">
        <header className="flex flex-wrap items-end justify-between gap-3 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Shield01Icon} aria-hidden className="size-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl">CMS Super Admin</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola seluruh kampanye, termasuk yang dibuat tanpa akun.
              </p>
            </div>
          </div>
          <Link
            to="/"
            search={{ q: "", hal: 1 }}
            className={buttonVariants({ variant: "outline" })}
          >
            Kembali
          </Link>
        </header>

        {error && (
          <Alert variant="destructive" role="alert" className="mb-4">
            {error}
          </Alert>
        )}

        {campaigns.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">Belum ada kampanye.</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Pemilik</th>
                  <th className="px-4 py-3 font-semibold">Visibilitas</th>
                  <th className="px-4 py-3 font-semibold">Pakai</th>
                  <th className="px-4 py-3 font-semibold">Dibuat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.owner}</td>
                    <td className="px-4 py-3">{c.isPublic ? "Publik" : "Privat"}</td>
                    <td className="px-4 py-3 tabular-nums">{c.useCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setToDelete({ id: c.id, name: c.name })
                          setOpen(true)
                        }}
                      >
                        <HugeiconsIcon icon={Delete01Icon} aria-hidden />
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus kampanye?</DialogTitle>
              <DialogDescription>
                Hapus "{toDelete?.name}"? Tindakan ini tidak bisa dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={confirmHapus}>
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
