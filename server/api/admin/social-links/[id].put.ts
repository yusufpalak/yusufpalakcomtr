import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { socialLinkSchema } from '../../../../shared/schemas'
import { auditLogs, socialLinks } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)

  try {
    const id = z.uuid().parse(getRouterParam(event, 'id'))
    const body = socialLinkSchema.parse(await readBody(event))
    const [updated] = await useDb()
      .update(socialLinks)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(socialLinks.id, id))
      .returning()

    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Sosyal bağlantı bulunamadı.' })

    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'update', entity: 'social_link', entityId: updated.id })
    return ok(updated)
  }
  catch (error) {
    validationError(error)
  }
})
