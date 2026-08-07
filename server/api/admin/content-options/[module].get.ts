export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return ok(await getContentRelationOptions(String(getRouterParam(event, 'module'))))
})
