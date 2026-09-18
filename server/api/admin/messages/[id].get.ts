import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { contactMessages } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const id = z.uuid().parse(getRouterParam(event, 'id'))
    const [message] = await useDb().select({
      id: contactMessages.id,
      name: contactMessages.name,
      email: contactMessages.email,
      subject: contactMessages.subject,
      message: contactMessages.message,
      status: contactMessages.status,
      createdAt: contactMessages.createdAt,
    }).from(contactMessages).where(and(eq(contactMessages.id, id), isNull(contactMessages.deletedAt))).limit(1)
    if (!message) throw createError({ statusCode: 404, statusMessage: 'Mesaj bulunamadı.' })
    return ok(message)
  }
  catch (error) { validationError(error) }
})
