import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import UserDashboard from '../views/UserDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import { getRoleFromToken, isTokenValid } from '../utils/jwt'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
  { path: '/app', name: 'user-app', component: UserDashboard, meta: { requiresAuth: true, roles: ['user', 'admin'] } },
  { path: '/admin', name: 'admin-app', component: AdminDashboard, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const hasToken = isTokenValid()
  const role = getRoleFromToken()

  if (to.meta.guestOnly && hasToken) {
    // Already logged in -> route to appropriate home
    if (role === 'admin') return next({ name: 'admin-app' })
    return next({ name: 'user-app' })
  }

  if (to.meta.requiresAuth) {
    if (!hasToken) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
    if (to.meta.roles && !to.meta.roles.includes(role)) {
      // Not authorized for this route -> send to their home
      if (role === 'admin') return next({ name: 'admin-app' })
      return next({ name: 'user-app' })
    }
  }

  return next()
})

export default router
