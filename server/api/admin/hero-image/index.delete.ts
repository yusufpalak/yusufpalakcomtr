import { auditLogs } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const current = await getHeroImage()
  const removed = await deleteHeroImage()
  await useDb().insert(auditLogs).values({ adminId: user.id, action: 'delete', entity: 'hero_image', entityId: current?.id })
  return ok({ removed })
})
