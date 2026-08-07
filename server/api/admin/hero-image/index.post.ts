import { auditLogs } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  const altPart = parts?.find(part => part.name === 'altText')
  if (!file?.data || !file.filename) throw createError({ statusCode: 422, statusMessage: 'Bir görsel seçin.' })
  const image = await saveHeroImage(file.data, file.filename, altPart?.data.toString('utf8'))
  await useDb().insert(auditLogs).values({ adminId: user.id, action: 'update', entity: 'hero_image', entityId: image?.id })
  return ok(image)
})
