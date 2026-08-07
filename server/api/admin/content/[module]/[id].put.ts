import { auditLogs } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const module = String(getRouterParam(event, 'module'))
  const id = String(getRouterParam(event, 'id'))
  try {
    const record = await updateAdminContentRecord(module, id, await readBody(event))
    if (!record) throw createError({ statusCode: 404, statusMessage: 'İçerik kaydı bulunamadı.' })
    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'update', entity: module, entityId: record.id })
    return ok(record)
  }
  catch (error) {
    contentDatabaseError(error)
  }
})
