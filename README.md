# OpenFrame

Bikin twibbon multi-slot. Gratis, tanpa email, tanpa nomor telepon.

Creator mengunggah frame PNG, menggambar area foto di atasnya, lalu membagikan
tautan. Partisipan mengisi area itu dengan fotonya dan mengunduh hasilnya.

## Status

Repositori ini sedang dibangun bertahap. **Yang sudah jadi (Fase 0–1):**
fondasi aplikasi dan autentikasi penuh — daftar, masuk, keluar, dan reset
password lewat recovery code, semuanya tanpa email maupun nomor telepon.

Fitur twibbon yang dijelaskan di atas — unggah frame, gambar area, isi slot,
unduh — adalah arah produknya dan **belum** dibangun. Rinciannya ada di
`docs/superpowers/plans/`. Sampai fase itu mendarat, aplikasi dijalankan
lewat `bun dev`; penyajian produksi (`bun run start`) belum disambungkan.

## Jalankan lokal

Butuh [Bun](https://bun.sh) dan PostgreSQL.

```bash
bun install
createdb openframe

{
  echo "DATABASE_URL=postgres://localhost:5432/openframe"
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
  echo "BETTER_AUTH_URL=http://localhost:3000"
} > .env

bun run db:migrate
bun dev
```

Buka http://localhost:3000

## Perintah

| Perintah | Kegunaan |
|---|---|
| `bun dev` | Server pengembangan di port 3000 |
| `bun test` | Jalankan test |
| `bun run check` | Lint + format (Biome) |
| `bun run typecheck` | Cek tipe TypeScript |
| `bun run build` | Build produksi (keluaran di `dist/`) |
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
