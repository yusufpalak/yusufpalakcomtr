import argon2 from 'argon2'
import { eq } from 'drizzle-orm'
import { loginSchema } from '../../../shared/schemas'
import { adminUsers, auditLogs } from '../../database/schema'
import { createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  try {
    const body = loginSchema.parse(await readBody(event))
    const db = useDb()
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, body.email.toLowerCase())).limit(1)
    const unlocked = !!user && (!user.lockedUntil || user.lockedUntil < new Date())
    const valid = unlocked && await argon2.verify(user.passwordHash, body.password)
    if (!valid) {
      if (user) await db.update(adminUsers).set({ failedAttempts: user.failedAttempts + 1, lockedUntil: user.failedAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(adminUsers.id, user.id))
      await db.insert(auditLogs).values({ adminId: user?.id, action: 'login_failed', ipHash: createHash('sha256').update(ip).digest('hex') })
      throw createError({ statusCode: 401, statusMessage: 'E-posta veya parola hatalı.' })
    }
    await db.update(adminUsers).set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id))
    const secureCookie = getRequestProtocol(event, { xForwardedProto: true }) === 'https'
    await setUserSession(event, { user: { id: user.id, email: user.email } }, { maxAge: 60 * 60 * 8, cookie: { secure: secureCookie, httpOnly: true, sameSite: 'lax' } })
    await db.insert(auditLogs).values({ adminId: user.id, action: 'login_success' })
    return ok({ redirect: '/admin' })
  } catch (error) { validationError(error) }
})
