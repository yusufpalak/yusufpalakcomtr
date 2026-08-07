export default defineNuxtRouteMiddleware(async () => {
  const session = useUserSession()
  if (!session.loggedIn.value) await session.fetch()
  if (!session.loggedIn.value) return navigateTo('/admin/login')
})
