import { getRequestHeaders } from "@tanstack/react-start/server"

function headerPertama(headers: Headers, name: string): string {
  return headers.get(name)?.split(",")[0].trim() ?? ""
}

export function asalUrl(): string {
  const configured = process.env.BETTER_AUTH_URL?.trim().replace(/\/+$/, "")
  if (configured && !/localhost|127\.0\.0\.1|::1/i.test(configured)) return configured

  const headers = getRequestHeaders()
  const host = headerPertama(headers, "x-forwarded-host") || headerPertama(headers, "host")
  if (!host) return configured ?? ""

  const forwardedProto = headerPertama(headers, "x-forwarded-proto")
  const proto =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : /^(localhost|127\.|\[::1\])/.test(host)
        ? "http"
        : "https"

  return `${proto}://${host}`
}
