import { auditLogs } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const module = String(getRouterParam(event, 'module'))
  const id = String(getRouterParam(event, 'id'))
  try {
    const deletedId = await deleteAdminContentRecord(module, id)
    if (!deletedId) throw createError({ statusCode: 404, statusMessage: 'İçerik kaydı bulunamadı.' })
    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'delete', entity: module, entityId: deletedId })
    return ok({ id: deletedId })
  }
  catch (error) {
    contentDatabaseError(error)
  }
})
