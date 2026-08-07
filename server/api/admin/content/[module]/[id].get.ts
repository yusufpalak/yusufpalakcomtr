export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const record = await getAdminContentRecord(String(getRouterParam(event, 'module')), String(getRouterParam(event, 'id')))
  if (!record) throw createError({ statusCode: 404, statusMessage: 'İçerik kaydı bulunamadı.' })
  return ok(record)
})
