import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth' 
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
  const auth = useAuthStore()
  const tokenValid = isTokenValid()
  const user = auth.loadUser()

  if (to.meta.guestOnly) {
    if (tokenValid && user) {
      // If already logged in, redirect to appropriate dashboard
      const role = getRoleFromToken()?.toLowerCase()
      if (role === 'admin') return next('/admin')
      else return next('/app')
    }
    return next()
  }

  if (to.meta.requiresAuth) {
    if (!tokenValid || !user || !user.email) {
      console.warn('No valid session, redirecting to /login')
      auth.logout()
      return next('/login')
    }

    const role = getRoleFromToken()?.toLowerCase()
    if (to.meta.roles && !to.meta.roles.includes(role)) {
      console.warn('Unauthorized role, redirecting to /login')
      return next('/login')
    }

    return next()
  }

  return next()
})


export default router
