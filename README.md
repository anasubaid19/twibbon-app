# OpenFrame

Bikin twibbon multi-slot. Gratis, tanpa email, tanpa nomor telepon.

Creator mengunggah frame PNG, menggambar area foto di atasnya, lalu membagikan
tautan. Partisipan mengisi area itu dengan fotonya dan mengunduh hasilnya.

## Status

**Fase 0–7 selesai.** Alurnya utuh dari ujung ke ujung: daftar tanpa email,
buat kampanye dengan mengunggah frame PNG dan menggambar area fotonya,
bagikan tautannya, lalu siapa pun bisa mengisi area itu dengan fotonya dan
mengunduh hasilnya sebagai PNG beralpha pada 1×, 2×, atau 3×.

Foto partisipan **tidak pernah dikirim ke server** — seluruh compositing
terjadi di browser.

Penyajian produksi sudah tersambung, dan pendaftaran maupun reset password
dibatasi lajunya lewat penghitung di database — statusnya bertahan melewati
restart.

## Jalankan lokal

Butuh [Bun](https://bun.sh) dan PostgreSQL.

```bash
bun install
createdb openframe

{
  echo "DATABASE_URL=postgres://localhost:5432/openframe"
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
  echo "BETTER_AUTH_URL=http://localhost:3000"
  echo "UPLOAD_DIR=./uploads"
} > .env

bun run db:migrate
bun dev
```

Buka http://localhost:3000

Untuk menjalankan versi produksinya:

```bash
bun run build
bun run start
```

Di belakang reverse proxy, header `x-forwarded-for` **wajib** diteruskan.
Tanpa itu semua pengunjung berbagi satu ember pembatas laju.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `bun dev` | Server pengembangan di port 3000 |
| `bun test` | Jalankan test |
| `bun run check` | Lint + format (Biome) |
| `bun run typecheck` | Cek tipe TypeScript |
| `bun run build` | Build produksi (keluaran di `dist/`) |
| `bun run start` | Jalankan hasil build (butuh `bun run build` lebih dulu) |
| `bun run db:generate` | Buat berkas migrasi dari perubahan skema |
| `bun run db:migrate` | Terapkan migrasi |

## Privasi

OpenFrame tidak pernah meminta email maupun nomor telepon. Reset password
memakai recovery code yang diberikan sekali saat mendaftar — hanya hash-nya
yang tersimpan. Sesi memakai cookie HTTP-only, bukan token di `localStorage`.
Foto partisipan (saat fitur twibbon sudah ada) diproses sepenuhnya di browser
dan tidak pernah dikirim ke server.

## Stack

TanStack Start (React 19) · Vite · Bun · PostgreSQL + Drizzle ORM · Better Auth
(plugin username) · Tailwind CSS v4 · Biome.

## Dokumen

- Spesifikasi desain: `docs/superpowers/specs/`
- Rencana implementasi: `docs/superpowers/plans/`
- Persyaratan produk: `PRD.md`
