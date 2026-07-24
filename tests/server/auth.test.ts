import { describe, expect, test } from "bun:test"
import { syntheticEmail } from "@/server/auth"

describe("syntheticEmail", () => {
  test("membentuk alamat di domain openframe.local", () => {
    expect(syntheticEmail("budi")).toBe("budi@openframe.local")
  })

  test("menurunkan huruf besar agar alamat selalu konsisten", () => {
    expect(syntheticEmail("BudiSantoso")).toBe("budisantoso@openframe.local")
  })

  test("username berbeda menghasilkan alamat berbeda", () => {
    expect(syntheticEmail("budi")).not.toBe(syntheticEmail("budi2"))
  })
})
