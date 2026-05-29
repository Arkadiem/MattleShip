<template>
  <div class="lobby-page">
    <header class="lobby-header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="logo" @click="router.push('/')">
            <span class="logo-ship">Mattle</span><span class="logo-ship accent">Ship</span>
          </h1>
        </div>
        <div class="user-info">
          <div class="user-badge">
            <span class="user-avatar">👤</span>
            <div class="user-details">
              <span class="user-name">{{ userStore.nickname }}</span>
              <span class="user-stats">{{ userStore.stats.wins }}V - {{ userStore.stats.losses }}D</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm icon-btn" @click="goToProfile" title="Estadísticas">
            📊
          </button>
          <button class="btn btn-secondary btn-sm icon-btn" @click="handleLogout" title="Cerrar sesión">
            🚪
          </button>
        </div>
      </div>
    </header>

    <main class="lobby-main">
      <div class="lobby-container">
        <div class="rooms-header">
          <div class="rooms-title-section">
            <h2>Salas Disponibles</h2>
            <p class="rooms-subtitle">Únete a una sala o crea la tuya para comenzar</p>
          </div>
          <button 
            class="btn btn-accent create-room-btn" 
            @click="handleCreateRoom"
            :disabled="gameStore.isInRoom"
          >
            <span class="btn-icon">➕</span>
            <span>Crear Sala</span>
          </button>
        </div>

        <div v-if="gameStore.isInRoom" class="current-room card">
          <div class="current-room-header">
            <div class="current-room-info">
              <span class="room-icon">🎮</span>
              <div>
                <h3>Estás en una sala</h3>
                <p class="room-name-text">{{ gameStore.currentRoom?.roomName }}</p>
              </div>
            </div>
            <div class="room-players-badge">
              <span class="players-count">{{ gameStore.currentRoom?.players?.length || 0 }}/2</span>
              <span class="players-label">jugadores</span>
            </div>
          </div>
          <div class="current-room-actions">
            <button class="btn btn-secondary" @click="showLeaveConfirm = true">
              🚪 Salir de la Sala
            </button>
          </div>
        </div>

        <div v-if="showLeaveConfirm" class="confirm-overlay" @click.self="showLeaveConfirm = false">
          <div class="confirm-dialog card">
            <div class="confirm-icon">⚠️</div>
            <h3>Cerrar Sala</h3>
            <p>Si sales de la sala, esta se cerrará y otros jugadores no podrán unirse. ¿Estás seguro?</p>
            <div class="confirm-actions">
              <button class="btn btn-secondary" @click="showLeaveConfirm = false">Cancelar</button>
              <button class="btn btn-primary" @click="confirmLeaveRoom">Salir</button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando salas...</p>
        </div>

        <div v-else-if="rooms.length === 0" class="empty-state">
          <div class="empty-icon">🚢</div>
          <h3>No hay salas disponibles</h3>
          <p>¡Sé el primero en crear una sala y desafía a otros jugadores!</p>
        </div>

        <div v-else class="rooms-grid">
          <div 
            v-for="room in rooms" 
            :key="room.roomId"
            class="room-card card"
            :class="{ 'is-playing': room.status === 'playing' }"
          >
            <div class="room-card-header">
              <h3 class="room-name">{{ room.roomName }}</h3>
              <span class="room-status-badge" :class="room.status">
                {{ getStatusText(room.status) }}
              </span>
            </div>
            
            <div class="room-card-body">
              <div class="room-info-row">
                <span class="info-icon">👤</span>
                <div class="info-content">
                  <span class="info-label">Host</span>
                  <span class="info-value">{{ room.hostName }}</span>
                </div>
              </div>
              <div class="room-info-row">
                <span class="info-icon">👥</span>
                <div class="info-content">
                  <span class="info-label">Jugadores</span>
                  <div class="players-indicator">
                    <span class="player-dot filled" v-for="i in room.players?.length" :key="'p'+i"></span>
                    <span class="player-dot" v-for="i in (2 - (room.players?.length || 0))" :key="'e'+i"></span>
                    <span class="players-text">{{ room.players?.length || 0 }}/2</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="room-card-footer">
              <button 
                v-if="room.status === 'waiting' && !isInThisRoom(room)"
                class="btn btn-primary btn-join"
                @click="handleJoinRoom(room)"
              >
                <span>Unirse</span>
                <span class="btn-icon">→</span>
              </button>
              <div v-else-if="room.status === 'playing'" class="room-playing-badge">
                <span class="playing-icon">⚔️</span>
                <span>En juego</span>
              </div>
              <div v-else-if="isInThisRoom(room)" class="room-current-badge">
                <span class="current-icon">✓</span>
                <span>Estás en esta sala</span>
              </div>
            </div>
          </div>
        </div>

        <transition name="slide-up">
          <div v-if="error" class="error-message">
            <span class="error-icon">⚠️</span>
            <span>{{ error }}</span>
          </div>
        </transition>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useGameStore } from '../stores/game'
import socketService from '../services/socket'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const rooms = ref([])
const loading = ref(true)
const error = ref('')
const showLeaveConfirm = ref(false)

onMounted(() => {
  gameStore.leaveRoom()
  
  const socket = socketService.connect()
  
  socket.on('rooms-list', (data) => {
    rooms.value = data
    loading.value = false
  })

  socket.on('room-created', (room) => {
    gameStore.setRoom(room)
    router.push(`/game/${room.roomId}`)
  })

  socket.on('room-joined', (room) => {
    gameStore.setRoom(room)
    router.push(`/game/${room.roomId}`)
  })

  socket.on('room-error', (message) => {
    error.value = message
    setTimeout(() => error.value = '', 3000)
  })

  socket.emit('get-rooms')
})

onUnmounted(() => {
  const socket = socketService.getSocket()
  if (socket) {
    socket.off('rooms-list')
    socket.off('room-created')
    socket.off('room-joined')
    socket.off('room-error')
  }
})

function getStatusText(status) {
  const statusMap = {
    waiting: 'Esperando',
    playing: 'En juego',
    finished: 'Terminado'
  }
  return statusMap[status] || status
}

function isInThisRoom(room) {
  if (!gameStore.isInRoom) return false
  return gameStore.currentRoom?.roomId === room.roomId
}

function handleCreateRoom() {
  if (gameStore.isInRoom) return
  
  const socket = socketService.getSocket()
  if (socket && socket.connected) {
    socket.emit('create-room', {
      playerName: userStore.nickname
    })
  } else {
    error.value = 'No conectado al servidor. Intenta recargar.'
    setTimeout(() => error.value = '', 3000)
  }
}

function handleJoinRoom(room) {
  if (gameStore.isInRoom) return
  
  const socket = socketService.getSocket()
  if (socket && socket.connected) {
    socket.emit('join-room', {
      roomId: room.roomId,
      playerName: userStore.nickname
    })
  } else {
    error.value = 'No conectado al servidor. Intenta recargar.'
    setTimeout(() => error.value = '', 3000)
  }
}

function handleLeaveRoom() {
  const socket = socketService.getSocket()
  if (socket && gameStore.currentRoom) {
    socket.emit('leave-room', { roomId: gameStore.currentRoom.roomId })
    gameStore.leaveRoom()
  }
}

function confirmLeaveRoom() {
  showLeaveConfirm.value = false
  handleLeaveRoom()
}

function goToProfile() {
  router.push('/profile')
}

function handleLogout() {
  handleLeaveRoom()
  userStore.logout()
  socketService.disconnect()
  router.push('/')
}
</script>

<style scoped>
.lobby-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--dark) 0%, var(--dark-light) 100%);
}

.lobby-header {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 2rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.3s ease;
  letter-spacing: -0.5px;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-ship {
  color: var(--light);
}

.logo-ship.accent {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
}

.user-avatar {
  font-size: 2rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 700;
  color: var(--light);
  font-size: 1rem;
}

.user-stats {
  font-size: 0.85rem;
  color: var(--light-dark);
  font-weight: 600;
}

.icon-btn {
  font-size: 1.3rem;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.lobby-main {
  flex: 1;
  padding: 48px 24px;
}

.lobby-container {
  max-width: 1400px;
  margin: 0 auto;
}

.rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 24px;
  flex-wrap: wrap;
}

.rooms-title-section {
  flex: 1;
  min-width: 280px;
}

.rooms-header h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--light);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.rooms-subtitle {
  color: var(--light-dark);
  font-size: 1.05rem;
}

.create-room-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  font-size: 1.05rem;
  font-weight: 700;
}

.create-room-btn .btn-icon {
  font-size: 1.3rem;
}

.current-room {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1));
  border: 2px solid var(--accent);
  margin-bottom: 32px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
}

.current-room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.current-room-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-icon {
  font-size: 2.5rem;
}

.current-room-info h3 {
  color: var(--accent-light);
  margin-bottom: 4px;
  font-size: 1.3rem;
  font-weight: 700;
}

.room-name-text {
  color: var(--light);
  font-weight: 600;
  font-size: 1.1rem;
}

.room-players-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.players-count {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}

.players-label {
  font-size: 0.85rem;
  color: var(--light-dark);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-room-actions {
  display: flex;
  gap: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: var(--light-dark);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 80px;
  color: var(--light-dark);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.8rem;
  margin-bottom: 12px;
  color: var(--light);
  font-weight: 700;
}

.empty-state p {
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.room-card {
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.room-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3);
}

.room-card:hover::before {
  transform: scaleX(1);
}

.room-card.is-playing {
  opacity: 0.7;
}

.room-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
}

.room-name {
  font-size: 1.4rem;
  color: var(--light);
  font-weight: 700;
  flex: 1;
}

.room-status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.room-status-badge.waiting {
  background: rgba(16, 185, 129, 0.2);
  color: var(--accent-light);
  border: 1px solid var(--accent);
}

.room-status-badge.playing {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-light);
  border: 1px solid var(--primary);
}

.room-status-badge.finished {
  background: rgba(148, 163, 184, 0.2);
  color: var(--light-dark);
  border: 1px solid var(--light-darker);
}

.room-card-body {
  margin-bottom: 20px;
}

.room-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 8px;
}

.info-icon {
  font-size: 1.5rem;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.info-label {
  font-size: 0.85rem;
  color: var(--light-darker);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-value {
  font-size: 1rem;
  color: var(--light);
  font-weight: 600;
}

.players-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
  border: 2px solid rgba(148, 163, 184, 0.5);
  transition: all 0.3s ease;
}

.player-dot.filled {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.players-text {
  font-size: 1rem;
  color: var(--light);
  font-weight: 700;
  margin-left: auto;
}

.room-card-footer {
  display: flex;
  justify-content: center;
}

.btn-join {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  font-size: 1.05rem;
  font-weight: 700;
}

.btn-join .btn-icon {
  transition: transform 0.3s ease;
}

.btn-join:hover .btn-icon {
  transform: translateX(4px);
}

.room-playing-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  width: 100%;
  color: var(--primary-light);
  font-weight: 600;
}

.playing-icon {
  font-size: 1.2rem;
}

.room-current-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  width: 100%;
  color: var(--accent-light);
  font-weight: 600;
}

.current-icon {
  font-size: 1.2rem;
  font-weight: 800;
}

.error-message {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.error-icon {
  font-size: 1.3rem;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-dialog {
  max-width: 460px;
  width: 90%;
  text-align: center;
  padding: 40px;
}

.confirm-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.confirm-dialog h3 {
  font-size: 1.8rem;
  color: var(--secondary);
  margin-bottom: 16px;
  font-weight: 800;
}

.confirm-dialog p {
  color: var(--light-dark);
  margin-bottom: 32px;
  line-height: 1.6;
  font-size: 1.05rem;
}

.confirm-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.confirm-actions .btn {
  min-width: 130px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .user-info {
    width: 100%;
    justify-content: center;
  }

  .rooms-header {
    flex-direction: column;
    text-align: center;
  }

  .rooms-title-section {
    text-align: center;
  }

  .create-room-btn {
    width: 100%;
    justify-content: center;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
  }

  .current-room-header {
    flex-direction: column;
    text-align: center;
  }

  .current-room-info {
    flex-direction: column;
  }
}
</style>
