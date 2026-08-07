export default defineEventHandler(async (event) => {
  const project = await getPublicProject(String(getRouterParam(event, 'slug')))
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Proje bulunamadı.' })
  return ok(project)
})
