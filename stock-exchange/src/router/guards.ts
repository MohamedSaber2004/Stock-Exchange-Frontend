import type { Router } from 'vue-router'
import { coreServices } from '@/di'

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    const tokenStore = coreServices.tokenStore
    const isAuthenticated = tokenStore.hasValidToken()

    // Dynamic document title
    const appName = 'FinWise Admin'
    document.title = to.meta.title ? `${String(to.meta.title)} | ${appName}` : appName

    // If route requires authentication and user is not logged in -> redirect to /login
    if (to.meta.requiresAuth && !isAuthenticated) {
      if (to.path !== '/login') {
        return next('/login')
      }
    }

    // If route is guest only (e.g. login) and user is already logged in -> redirect to dashboard /
    if (to.meta.guestOnly && isAuthenticated) {
      if (to.path !== '/') {
        return next('/')
      }
    }

    next()
  })
}
