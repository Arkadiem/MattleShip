import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  const nickname = ref(localStorage.getItem('nickname') || '')
  const stats = ref({ wins: 0, losses: 0 })
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!nickname.value)

  async function login(newNickname) {
    loading.value = true
    error.value = ''
    
    try {
      const response = await axios.post('/api/login', { nickname: newNickname })
      
      if (response.data.success) {
        nickname.value = newNickname
        localStorage.setItem('nickname', newNickname)
        await fetchStats()
        return true
      } else {
        error.value = response.data.message || 'Error al iniciar sesión'
        return false
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    if (!nickname.value) return
    
    try {
      const response = await axios.get(`/api/stats/${nickname.value}`)
      if (response.data.success) {
        stats.value = response.data.stats
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  function logout() {
    nickname.value = ''
    stats.value = { wins: 0, losses: 0 }
    localStorage.removeItem('nickname')
  }

  return {
    nickname,
    stats,
    loading,
    error,
    isLoggedIn,
    login,
    fetchStats,
    logout
  }
})
