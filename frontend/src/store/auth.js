import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null
  }),
  actions: {
    setUser(userData) {
      this.user = userData
    },
    logout() {
      this.user = null
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
    loadUser() {
        const saved = localStorage.getItem('user')
        if (saved) {
            this.user = JSON.parse(saved)
            return this.user
        }
        return null
    }
  }
})