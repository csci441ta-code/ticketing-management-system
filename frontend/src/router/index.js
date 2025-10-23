import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import UserDashboard from '../views/UserDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import { getRoleFromToken, isTokenValid } from '../utils/jwt'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: Register, meta: { guestOnly: true } },
  { path: '/app', name: 'user-app', component: UserDashboard, meta: { requiresAuth: true, roles: ['user', 'admin'] } },
  { path: '/admin', name: 'admin-app', component: AdminDashboard, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  //const hasToken = isTokenValid()
  //const role = getRoleFromToken() || 'user'
  const hasToken = isTokenValid() 
  const rawRole = getRoleFromToken()
  const role = rawRole ? String(rawRole).toLowerCase() : 'user'

  // helper: only redirect if target !== current destination
  const sameTarget = (loc) => {
    const a = typeof loc === 'string' ? router.resolve(loc) : router.resolve(loc)
    const b = router.resolve(to)
    return a.fullPath === b.fullPath
  }

  if (to.meta.guestOnly && hasToken) {
    // Already logged in -> route to appropriate home
    const target = role === 'admin' ? { name: 'admin-app' } : { name: 'user-app' }
    return sameTarget(target) ? next() : next(target)
  }

  if (to.meta.requiresAuth) {
    if (!hasToken) {
      const target = { name: 'login', query: { redirect: to.fullPath } }
      return sameTarget(target) ? next() : next(target)
    }
    if (to.meta.roles && !to.meta.roles.includes(role)) {
      // Not authorized for this route -> send to their home
      const target = role === 'admin' ? { name: 'admin-app' } : { name: 'user-app' }
      return sameTarget(target) ? next() : next(target)
    }
  }

  return next()
})

export default router
