import { randomUUID } from "node:crypto"
import { db } from "@/db"
import { account, user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

const username = "_anasubaid"
const password = "admin200019"

const [existing] = await db.select().from(user).where(eq(user.username, username)).limit(1)
if (existing) {
  await db.update(user).set({ role: "superadmin" }).where(eq(user.id, existing.id))
  console.log("Akun admin sudah ada; role diperbarui.")
  process.exit(0)
}

const ctx = await auth.$context
const hashed = await ctx.password.hash(password)
const id = randomUUID()
await db.insert(user).values({
  id,
  name: username,
  username,
  email: `${username}@openframe.local`,
  role: "superadmin",
})
await db.insert(account).values({
  id: randomUUID(),
  accountId: id,
  providerId: "credential",
  userId: id,
  password: hashed,
})
console.log("Akun super admin dibuat:", username)
process.exit(0)
