import { auditLogs } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const module = String(getRouterParam(event, 'module'))
  try {
    const record = await createAdminContentRecord(module, await readBody(event))
    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'create', entity: module, entityId: record?.id })
    return ok(record)
  }
  catch (error) {
    contentDatabaseError(error)
  }
})
