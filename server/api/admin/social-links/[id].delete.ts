import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auditLogs, socialLinks } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)

  try {
    const id = z.uuid().parse(getRouterParam(event, 'id'))
    const [deleted] = await useDb().delete(socialLinks).where(eq(socialLinks.id, id)).returning({ id: socialLinks.id })

    if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Sosyal bağlantı bulunamadı.' })

    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'delete', entity: 'social_link', entityId: deleted.id })
    return ok({ id: deleted.id })
  }
  catch (error) {
    validationError(error)
  }
})
