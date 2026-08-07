import { publicLocaleQuerySchema } from '../../../../shared/schemas'

export default defineEventHandler(async (event) => {
  const parsed = publicLocaleQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Geçersiz dil seçimi.' })
  const post = await getPublicBlogPost(String(getRouterParam(event, 'slug')), parsed.data.locale)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Yazı bulunamadı.' })
  return ok(post)
})
