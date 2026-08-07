import { publicLocaleQuerySchema } from '../../../shared/schemas'

export default defineEventHandler(async (event) => {
  const parsed = publicLocaleQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Geçersiz dil seçimi.' })
  return ok(await getPublicSiteContent(parsed.data.locale))
})
