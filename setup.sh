#!/bin/bash
set -e

echo "=== OpenFrame - Setup Project ==="

# Hapus folder lama
echo "[1/3] Membersihkan project lama..."
rm -rf backend frontend

# Init TanStack Start
echo "[2/3] Inisialisasi TanStack Start..."
echo "Jalankan perintah berikut secara manual:"
echo ""
echo "  npx create-tanstack-app@latest . --template react"
echo ""
echo "Atau gunakan template existing. Setelah itu:"
echo ""
echo "  npm install"
echo "  npm install better-auth @better-auth/drizzle"
echo "  npm install drizzle-orm postgres drizzle-kit -D"
echo "  npm install sharp"
echo "  npm install fabric"
echo "  npm install @tanstack/react-query"
echo "  npm install @biomejs/biome -D"
echo "  npx shadcn@latest init"
echo ""

echo "[3/3] Setup selesai. Jalankan prompt ke Claude Code dengan isi dari SETUP_PROMPT.md"
