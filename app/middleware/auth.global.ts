import type { RouteLocationNormalized } from 'vue-router'
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useSupabaseAuth } from '~/composables/useSupabaseAuth'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  if (import.meta.server) {
    return
  }

  const requiresAuth = Boolean(to.meta.requiresAuth)
  if (!requiresAuth) {
    return
  }

  const { user, refreshSession } = useSupabaseAuth()

  if (!user.value) {
    await refreshSession()
  }

  if (user.value) {
    return
  }

  const redirectParam = to.fullPath ? encodeURIComponent(to.fullPath) : ''
  const redirectTarget = redirectParam ? `/login?redirect=${redirectParam}` : '/login'

  return navigateTo(redirectTarget)
})
