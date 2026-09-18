import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { adminMessageStatusSchema } from '../../../../shared/schemas'
import { auditLogs, contactMessages } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  try {
    const id = z.uuid().parse(getRouterParam(event, 'id'))
    const { status } = adminMessageStatusSchema.parse(await readBody(event))
    const [updated] = await useDb().update(contactMessages)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(contactMessages.id, id), isNull(contactMessages.deletedAt)))
      .returning({ id: contactMessages.id, status: contactMessages.status })
    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Mesaj bulunamadı.' })
    await useDb().insert(auditLogs).values({ adminId: admin.id, action: 'update', entity: 'contact_message', entityId: id, metadata: { status } })
    return ok(updated)
  }
  catch (error) { validationError(error) }
})
