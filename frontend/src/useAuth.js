import { ref, computed } from 'vue'
import axios from 'axios'

const user = ref(null)
const notifications = ref([])
let _fetchPromise = null

export function useAuth() {
  const unreadCount = computed(() => notifications.value.length)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const loadUser = () => {
    if (user.value !== null) return Promise.resolve()
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = Promise.all([
      axios.get('/user'),
      axios.get('/notifications')
    ]).then(([userRes, notifRes]) => {
      user.value = userRes.data
      notifications.value = notifRes.data
    }).catch((e) => {
      if (e.response?.status === 401) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }).finally(() => {
      _fetchPromise = null
    })

    return _fetchPromise
  }

  const refreshNotifications = async () => {
    try {
      const res = await axios.get('/notifications')
      notifications.value = res.data
    } catch (e) {}
  }

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`)
      notifications.value = notifications.value.filter(n => n.id !== id)
    } catch (e) {}
  }

  const markAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all')
      notifications.value = []
    } catch (e) {}
  }

  const logout = async () => {
    try { await axios.post('/logout') } catch (e) {}
    user.value = null
    notifications.value = []
    _fetchPromise = null
    localStorage.clear()
    window.location.href = '/login'
  }

  return {
    user,
    notifications,
    unreadCount,
    isAdmin,
    loadUser,
    refreshNotifications,
    markAsRead,
    markAllRead,
    logout
  }
}
