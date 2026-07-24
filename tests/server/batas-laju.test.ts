import { describe, expect, test } from "bun:test"
import { jendelaBaru } from "@/server/batas-laju"

describe("jendelaBaru", () => {
  const mulai = new Date("2026-07-22T10:00:00Z")

  test("masih di dalam jendela", () => {
    expect(jendelaBaru(mulai, 60, new Date("2026-07-22T10:00:30Z"))).toBe(false)
  })

  test("tepat di batas masih dianggap jendela yang sama", () => {
    expect(jendelaBaru(mulai, 60, new Date("2026-07-22T10:01:00Z"))).toBe(false)
  })

  test("lewat sedikit dari batas sudah jendela baru", () => {
    expect(jendelaBaru(mulai, 60, new Date("2026-07-22T10:01:01Z"))).toBe(true)
  })

  test("jam yang mundur tidak membuka kuota gratis", () => {
    // Jam server bisa mundur karena NTP. Kalau itu dianggap jendela baru,
    // siapa pun yang bisa memicunya dapat kuota tanpa batas.
    expect(jendelaBaru(mulai, 60, new Date("2026-07-22T09:59:00Z"))).toBe(false)
  })
})
