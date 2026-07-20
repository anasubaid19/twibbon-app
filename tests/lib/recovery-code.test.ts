import { describe, expect, test } from 'bun:test'
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from '@/lib/recovery-code'

describe('generateRecoveryCode', () => {
  test('menghasilkan 4 grup 8 heksadesimal huruf besar', () => {
    expect(generateRecoveryCode()).toMatch(/^[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}$/)
  })

  test('menghasilkan kode berbeda tiap panggilan', () => {
    const codes = new Set(Array.from({ length: 50 }, generateRecoveryCode))
    expect(codes.size).toBe(50)
  })
})

describe('hashRecoveryCode', () => {
  test('hash tidak sama dengan kode aslinya', async () => {
    const code = generateRecoveryCode()
    expect(await hashRecoveryCode(code)).not.toBe(code)
  })

  test('dua hash dari kode sama tetap berbeda karena salt', async () => {
    const code = generateRecoveryCode()
    expect(await hashRecoveryCode(code)).not.toBe(await hashRecoveryCode(code))
  })
})

describe('verifyRecoveryCode', () => {
  test('menerima kode yang benar', async () => {
    const code = generateRecoveryCode()
    expect(await verifyRecoveryCode(code, await hashRecoveryCode(code))).toBe(true)
  })

  test('menolak kode yang salah', async () => {
    const hash = await hashRecoveryCode(generateRecoveryCode())
    expect(await verifyRecoveryCode(generateRecoveryCode(), hash)).toBe(false)
  })

  test('mengabaikan spasi yang tidak sengaja tersalin', async () => {
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(await verifyRecoveryCode(`  ${code} `, hash)).toBe(true)
  })

  test('mengabaikan besar-kecil huruf', async () => {
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(await verifyRecoveryCode(code.toLowerCase(), hash)).toBe(true)
  })

  test('mengembalikan false untuk hash yang rusak, bukan melempar error', async () => {
    expect(await verifyRecoveryCode(generateRecoveryCode(), 'bukan-hash')).toBe(false)
  })
})
