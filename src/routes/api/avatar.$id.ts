import { readdirSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { createFileRoute } from "@tanstack/react-router"

function tidakDitemukan(): Response {
  return new Response("Tidak ditemukan", { status: 404 })
}

const AVATAR_ROOT = resolve(process.env.UPLOAD_DIR ?? "uploads", "avatars")

export const Route = createFileRoute("/api/avatar/$id")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { id: string } }) => {
        const userId = params.id
        const dir = resolve(AVATAR_ROOT, userId)
        try {
          const files = readdirSync(dir)
          if (files.length === 0) return tidakDitemukan()
          const sorted = files.sort()
          const latest = sorted[sorted.length - 1]
          const bytes = await readFile(resolve(dir, latest))
          const ext = latest.split(".").pop() ?? "png"
          const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`
          return new Response(new Uint8Array(bytes), {
            headers: {
              "Content-Type": mime,
              "Cache-Control": "public, max-age=300, must-revalidate",
            },
          })
        } catch {
          return tidakDitemukan()
        }
      },
    },
  },
})
