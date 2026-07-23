import { ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Footer } from '@/components/footer'
import { Logo } from '@/components/logo'
import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { listPublic } from '@/server/campaigns'

export const Route = createFileRoute('/')({
  /*
   * `.catch()` dipakai, bukan `.default()`: search param datang dari URL yang
   * bisa diketik siapa saja. `?hal=abc` harus jatuh ke halaman 1, bukan
   * menjatuhkan seluruh halaman.
   */
  validateSearch: z.object({
    q: z.string().catch(''),
    hal: z.number().int().min(1).catch(1),
  }),
  loaderDeps: ({ search }) => ({ q: search.q, hal: search.hal }),
  loader: ({ deps }) => listPublic({ data: deps }),
  component: Beranda,
})

function Beranda() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()

  const adaPencarian = search.q.trim().length > 0

  return (
    <>
      <Navbar />

      <section className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        {/* Dekoratif: judul di bawahnya sudah menyampaikan isinya. */}
        <Logo className="fade-up h-24 w-24" />
        <h1 className="fade-up font-heading text-4xl tracking-[-0.02em] sm:text-5xl">
          Bikin twibbon <span className="text-primary">multi-slot</span>
        </h1>
        <p className="fade-up-2 max-w-md text-muted-foreground">
          Unggah frame-mu, gambar area fotonya, lalu bagikan tautannya. Gratis, tanpa email, tanpa
          nomor telepon.
        </p>
        <Link to="/buat" className={`fade-up-3 ${buttonVariants({})} px-8`}>
          Bikin punyamu <ArrowRight aria-hidden />
        </Link>
      </section>

      <main className="mx-auto max-w-[1140px] px-6 pb-16">
        <h2 className="mb-4 text-center font-heading text-2xl">Kampanye terbaru</h2>

        {/* ponytail: form yang disubmit, bukan filter hidup per ketikan. Tanpa
            debounce, tanpa dependensi, dan tiap pencarian menghasilkan satu URL
            yang bisa dibagikan. */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const q = new FormData(event.currentTarget).get('q')?.toString() ?? ''
            navigate({ to: '/', search: { q, hal: 1 } })
          }}
          className="mx-auto mb-6 flex max-w-md gap-2"
        >
          <Input
            name="q"
            defaultValue={search.q}
            placeholder="Cari nama kampanye…"
            aria-label="Cari nama kampanye"
          />
          <Button type="submit">Cari</Button>
          {adaPencarian && (
            <Link
              to="/"
              search={{ q: '', hal: 1 }}
              className={buttonVariants({ variant: 'outline' })}
            >
              Hapus
            </Link>
          )}
        </form>

        {data.rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            {adaPencarian ? (
              <>
                Tidak ada kampanye yang cocok dengan <strong>{search.q}</strong>. Coba kata lain.
              </>
            ) : (
              'Belum ada kampanye publik. Jadilah yang pertama!'
            )}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.rows.map((campaign) => (
              <li key={campaign.id}>
                <Link to="/twibbon/$slug" params={{ slug: campaign.slug }} className="block">
                  <Card className="overflow-hidden transition-all hover:-translate-y-[3px] hover:border-primary hover:shadow-[0_8px_32px_#00000040]">
                    <img
                      src={`/api/frame/${campaign.id}`}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full bg-muted object-contain"
                    />
                    <div className="p-4">
                      <h3 className="mb-1.5 truncate font-heading text-base">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                          {campaign.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
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

        {data.totalHal > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginasi">
            {data.hal > 1 ? (
              <Link
                to="/"
                search={{ q: search.q, hal: data.hal - 1 }}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <CaretLeft aria-hidden /> Sebelumnya
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground opacity-45">
                <CaretLeft aria-hidden /> Sebelumnya
              </span>
            )}

            <span className="text-sm text-muted-foreground">
              Halaman {data.hal} dari {data.totalHal}
            </span>

            {data.hal < data.totalHal ? (
              <Link
                to="/"
                search={{ q: search.q, hal: data.hal + 1 }}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Berikutnya <CaretRight aria-hidden />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground opacity-45">
                Berikutnya <CaretRight aria-hidden />
              </span>
            )}
          </nav>
        )}
      </main>
      <Footer />
    </>
  )
}
