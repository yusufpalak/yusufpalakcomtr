import { auditLogs } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  try {
    const id = String(getRouterParam(event, 'id'))
    const removed = await removeMediaFile(id)
    if (!removed) throw createError({ statusCode: 404, statusMessage: 'Dosya bulunamadı.' })
    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'delete', entity: 'media', entityId: id })
    return ok({ removed })
  }
  catch (error) { validationError(error) }
})
