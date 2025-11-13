export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/login') {
    return
  }

  if (import.meta.server) {
    const sessionCookie = useCookie('sb-access-token')
    if (sessionCookie.value) {
      return navigateTo('/', { replace: true })
    }
    return
  }

  const { user } = useSupabaseAuth()
  if (user.value) {
    return navigateTo('/', { replace: true })
  }
})
