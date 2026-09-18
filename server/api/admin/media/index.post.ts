import { auditLogs } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const length = Number(getHeader(event, 'content-length') || 0)
  if (length > 13 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'Dosya çok büyük.' })
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  const altPart = parts?.find(part => part.name === 'altText')
  if (!file?.data || !file.filename) throw createError({ statusCode: 422, statusMessage: 'Bir dosya seçin.' })
  try {
    const media = await saveMediaFile(file.data, file.filename, altPart?.data.toString('utf8'))
    await useDb().insert(auditLogs).values({ adminId: user.id, action: 'create', entity: 'media', entityId: media.id })
    return ok({ id: media.id, url: `/api/public/media/${media.id}` })
  }
  catch (error) { validationError(error) }
})
