export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return ok(await listAdminContent(String(getRouterParam(event, 'module'))))
})
