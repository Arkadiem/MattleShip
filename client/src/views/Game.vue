<template>
  <div class="game-page">
    <header class="game-header">
      <div class="header-content">
        <button class="btn btn-secondary btn-sm" @click="handleLeaveGame">
          Abandonar Partida
        </button>
        <h1 class="game-title" @click="handleLogoClick">
          <span class="title-ship">Mattle</span><span class="title-ship accent">Ship</span>
        </h1>
        <div v-if="gameStarted && !gameStore.isGameFinished" class="game-timer">
          {{ formattedTime }}
        </div>
      </div>
    </header>

    <div v-if="gameStarted && !gameStore.isGameFinished" class="turn-bar" :class="{ 'my-turn': gameStore.isMyTurn }">
      {{ gameStore.isMyTurn ? '🎯 Tu turno' : '⏳ Turno del oponente' }}
    </div>

    <div v-if="gameStarted && !gameStore.isGameFinished" class="status-bars">
      <div class="status-player">
        <span class="status-name">Tus Barcos</span>
        <div class="health-bar">
          <div class="health-fill my-health" :style="{ width: myHealthPercent + '%' }"></div>
        </div>
      </div>
      <div class="status-player">
        <span class="status-name">Barcos Enemigos</span>
        <div class="health-bar">
          <div class="health-fill enemy-health" :style="{ width: enemyHealthPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <div v-if="showConfirmDialog" class="confirm-overlay">
      <div class="confirm-dialog card">
        <h3>⚠️ Abandonar Partida</h3>
        <p v-if="!gameStarted">Si sales ahora, la sala se cerrará. ¿Estás seguro?</p>
        <p v-else>Si abandonas ahora, perderás automáticamente. ¿Estás seguro?</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showConfirmDialog = false">Cancelar</button>
          <button class="btn btn-primary" @click="confirmLeave">Abandonar</button>
        </div>
      </div>
    </div>

    <main class="game-main">
      <div class="game-container">
        <div v-if="!gameStarted" class="waiting-state card">
          <h2>Esperando Jugadores</h2>
          <p>Sala: <strong>{{ gameStore.currentRoom?.roomName }}</strong></p>
          <p>Jugadores: {{ playerCount }}/2</p>
          <div class="waiting-spinner"></div>
          <p class="waiting-text">Esperando que se una otro jugador...</p>
        </div>

        <div v-else-if="gameStore.isGameFinished" class="game-finished card">
          <h2 :class="{ 'winner': isWinner, 'loser': !isWinner }">
            {{ isWinner ? '🎉 ¡Victoria!' : '😢 Derrota' }}
          </h2>
          <p>{{ isWinner ? '¡Has hundido el barco enemigo!' : 'Tu barco ha sido hundido' }}</p>
          <p class="finish-time">Tiempo: {{ formattedTime }}</p>
          <div class="finished-actions">
            <button class="btn btn-accent" @click="handleRematch">
              🔄 Revancha
            </button>
            <button class="btn btn-secondary" @click="leaveToLobby">
              🚪 Salir
            </button>
          </div>
        </div>

        <div v-else class="game-boards">
          <div class="board-section enemy-section">
            <h3 class="board-title">Tablero Enemigo</h3>
            <div class="board-wrapper">
              <div class="board-coords-top">
                <div class="coord-corner"></div>
                <div v-for="col in 8" :key="'col-'+col" class="coord-label">{{ col }}</div>
              </div>
              <div class="board-with-side-coords">
                <div class="board-coords-side">
                  <div v-for="row in 8" :key="'row-'+row" class="coord-label">{{ String.fromCharCode(64 + row) }}</div>
                </div>
                <div :class="['board', 'enemy-board', { shake: boardShake }]">
                  <div 
                    v-for="(row, rowIndex) in 8" 
                    :key="'enemy-' + rowIndex"
                    class="board-row"
                  >
                    <div 
                      v-for="(col, colIndex) in 8" 
                      :key="'enemy-' + rowIndex + '-' + colIndex"
                      class="cell"
                      :class="getEnemyCellClass(rowIndex, colIndex)"
                      @click="handleAttack(rowIndex, colIndex)"
                    >
                      <span v-if="getEnemyCellContent(rowIndex, colIndex)">
                        {{ getEnemyCellContent(rowIndex, colIndex) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="board-section my-section">
            <h3 class="board-title">Tu Tablero</h3>
            <div class="board-wrapper">
              <div class="board-coords-top">
                <div class="coord-corner"></div>
                <div v-for="col in 8" :key="'col-'+col" class="coord-label">{{ col }}</div>
              </div>
              <div class="board-with-side-coords">
                <div class="board-coords-side">
                  <div v-for="row in 8" :key="'row-'+row" class="coord-label">{{ String.fromCharCode(64 + row) }}</div>
                </div>
                <div class="board my-board">
                  <div 
                    v-for="(row, rowIndex) in 8" 
                    :key="'my-' + rowIndex"
                    class="board-row"
                  >
                    <div 
                      v-for="(col, colIndex) in 8" 
                      :key="'my-' + rowIndex + '-' + colIndex"
                      class="cell"
                      :class="getMyCellClass(rowIndex, colIndex)"
                    >
                      <span v-if="getMyCellContent(rowIndex, colIndex)">
                        {{ getMyCellContent(rowIndex, colIndex) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="gameMessage" class="game-message" :class="gameMessageType">
          {{ gameMessage }}
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useGameStore } from '../stores/game'
import socketService from '../services/socket'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const gameStore = useGameStore()

const gameStarted = ref(false)
const playerCount = ref(1)
const gameMessage = ref('')
const gameMessageType = ref('')
const showConfirmDialog = ref(false)
const elapsedSeconds = ref(0)
const boardShake = ref(false)
let timerInterval = null

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startTimer() {
  elapsedSeconds.value = 0
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const isWinner = computed(() => {
  if (!gameStore.winner || !socketService.getSocket()) return false
  return gameStore.winner === socketService.getSocket().id
})

const totalShipCells = 14 // 4 + 3 + 3 + 2 + 2
const myHealthPercent = computed(() => {
  const hitsTaken = gameStore.enemyHits.length
  return Math.max(0, ((totalShipCells - hitsTaken) / totalShipCells) * 100)
})

const enemyHealthPercent = computed(() => {
  const hitsGiven = gameStore.myHits.length
  return Math.max(0, ((totalShipCells - hitsGiven) / totalShipCells) * 100)
})

const myHitsSet = computed(() => new Set(gameStore.myHits.map(h => `${h.row},${h.col}`)))
const myMissesSet = computed(() => new Set(gameStore.myMisses.map(m => `${m.row},${m.col}`)))
const enemyHitsSet = computed(() => new Set(gameStore.enemyHits.map(h => `${h.row},${h.col}`)))
const enemyMissesSet = computed(() => new Set(gameStore.enemyMisses.map(m => `${m.row},${m.col}`)))
const myShipsSet = computed(() => new Set(gameStore.myShips.map(s => `${s.row},${s.col}`)))

onMounted(() => {
  const socket = socketService.getSocket()
  if (!socket) {
    router.push('/lobby')
    return
  }

  socket.on('game-start', (data) => {
    gameStarted.value = true
    gameStore.updateGameState(data.gameState)
    startTimer()
    gameMessage.value = '¡El juego ha comenzado!'
    gameMessageType.value = 'success'
    setTimeout(() => gameMessage.value = '', 3000)
  })

  socket.on('game-update', (data) => {
    gameStore.updateGameState(data.gameState)
    if (data.gameState?.status === 'playing') {
      startTimer()
    }
  })

  socket.on('attack-result', (data) => {
    gameStore.updateGameState(data.gameState)
    
    if (data.hit) {
      if (data.sunk) {
        gameMessage.value = data.attacker === socket.id ? '¡Hundiste un barco enemigo! 🚢💥' : '¡Hundieron uno de tus barcos! 😱'
      } else {
        gameMessage.value = data.attacker === socket.id ? '¡Impacto! 🔥' : '¡Tu barco fue impactado! ⚠️'
      }
      gameMessageType.value = data.attacker === socket.id ? 'success' : 'danger'
      if (data.attacker !== socket.id) {
        boardShake.value = true
        setTimeout(() => { boardShake.value = false }, 500)
      }
    } else {
      gameMessage.value = data.attacker === socket.id ? 'Agua... 💦' : 'El oponente falló 😌'
      gameMessageType.value = 'info'
    }
    
    setTimeout(() => { gameMessage.value = '' }, 2500)
  })

  socket.on('game-over', (data) => {
    gameStore.updateGameState(data.gameState)
    stopTimer()
    gameMessage.value = data.winner === socket.id ? '¡Victoria!' : 'Derrota...'
    gameMessageType.value = data.winner === socket.id ? 'success' : 'danger'
  })

  socket.on('player-joined', (data) => {
    playerCount.value = data.playerCount
    gameMessage.value = `${data.playerName} se ha unido`
    gameMessageType.value = 'info'
    setTimeout(() => gameMessage.value = '', 3000)
  })

  socket.on('player-left', (data) => {
    stopTimer()
    gameStore.updateGameState(data.gameState || { ...gameStore.gameState, status: 'finished', winner: data.winner })
    gameMessage.value = 'El oponente ha abandonado. ¡Victoria!'
    gameMessageType.value = 'success'
    setTimeout(() => {
      socket.emit('leave-room', { roomId: route.params.roomId })
      gameStore.leaveRoom()
      router.push('/lobby')
    }, 3000)
  })

  socket.on('room-error', (message) => {
    gameMessage.value = message
    gameMessageType.value = 'danger'
    setTimeout(() => gameMessage.value = '', 3000)
  })

  socket.emit('join-game', { roomId: route.params.roomId })
})

onUnmounted(() => {
  stopTimer()
  const socket = socketService.getSocket()
  if (socket) {
    socket.off('game-start')
    socket.off('game-update')
    socket.off('attack-result')
    socket.off('game-over')
    socket.off('player-joined')
    socket.off('player-left')
    socket.off('room-error')
  }
})

function getEnemyCellClass(row, col) {
  const key = `${row},${col}`
  const isHit = myHitsSet.value.has(key)
  const isMiss = myMissesSet.value.has(key)
  
  return {
    'cell-hit': isHit,
    'cell-miss': isMiss,
    'cell-attackable': gameStore.isMyTurn && !isHit && !isMiss
  }
}

function getMyCellClass(row, col) {
  const key = `${row},${col}`
  const isShip = myShipsSet.value.has(key)
  const isHit = enemyHitsSet.value.has(key)
  const isMiss = enemyMissesSet.value.has(key)
  
  return {
    'cell-ship': isShip && !isHit,
    'cell-hit': isHit,
    'cell-miss': isMiss
  }
}

function getEnemyCellContent(row, col) {
  const key = `${row},${col}`
  if (myHitsSet.value.has(key)) return '💥'
  if (myMissesSet.value.has(key)) return '🌊'
  return ''
}

function getMyCellContent(row, col) {
  const key = `${row},${col}`
  if (enemyHitsSet.value.has(key)) return '💥'
  if (enemyMissesSet.value.has(key)) return '🌊'
  if (myShipsSet.value.has(key)) return '🚢'
  return ''
}

function handleAttack(row, col) {
  if (!gameStore.isMyTurn) return
  
  const key = `${row},${col}`
  if (myHitsSet.value.has(key) || myMissesSet.value.has(key)) return

  const socket = socketService.getSocket()
  if (socket) {
    socket.emit('attack', {
      roomId: route.params.roomId,
      row,
      col
    })
  }
}

function handleRematch() {
  const socket = socketService.getSocket()
  if (socket) {
    socket.emit('rematch', { roomId: route.params.roomId })
  }
}

function handleLogoClick() {
  if (gameStarted.value && !gameStore.isGameFinished) {
    showConfirmDialog.value = true
  } else {
    leaveToLobby()
  }
}

function handleLeaveGame() {
  showConfirmDialog.value = true
}

function confirmLeave() {
  showConfirmDialog.value = false
  leaveToLobby()
}

function leaveToLobby() {
  stopTimer()
  const socket = socketService.getSocket()
  if (socket) {
    socket.emit('leave-game', { roomId: route.params.roomId })
    socket.emit('leave-room', { roomId: route.params.roomId })
  }
  gameStore.leaveRoom()
  router.push('/lobby')
}
</script>

<style scoped>
.game-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.game-header {
  background: rgba(26, 42, 74, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-title {
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.game-title:hover {
  transform: scale(1.05);
}

.title-ship {
  color: var(--light);
}

.title-ship.accent {
  color: var(--accent);
}

.game-timer {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  background: rgba(149, 165, 166, 0.2);
  color: var(--light-dark);
  border: 1px solid var(--light-dark);
}

.turn-bar {
  text-align: center;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 0.95rem;
  background: rgba(149, 165, 166, 0.15);
  color: var(--light-dark);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.turn-bar.my-turn {
  background: rgba(46, 204, 113, 0.2);
  color: var(--accent);
  border-bottom-color: rgba(46, 204, 113, 0.3);
}

.status-bars {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 24px;
  background: rgba(10, 22, 40, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.status-player {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 200px;
}

.status-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--light);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.health-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.my-health {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

.enemy-health {
  background: var(--secondary);
  box-shadow: 0 0 8px var(--secondary);
}

.game-main {
  flex: 1;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-container {
  max-width: 1200px;
  width: 100%;
}

.waiting-state {
  text-align: center;
  padding: 60px;
}

.waiting-state h2 {
  color: var(--accent);
  margin-bottom: 20px;
}

.waiting-state p {
  margin-bottom: 12px;
  color: var(--light);
}

.waiting-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
  margin: 30px auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.waiting-text {
  color: var(--light-dark);
  font-style: italic;
}

.game-finished {
  text-align: center;
  padding: 60px;
}

.game-finished h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.game-finished h2.winner {
  color: var(--accent);
}

.game-finished h2.loser {
  color: var(--secondary);
}

.game-finished p {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: var(--light);
}

.finish-time {
  font-family: 'Courier New', monospace;
  color: var(--light-dark) !important;
  font-size: 1rem !important;
  margin-bottom: 30px !important;
}

.finished-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.game-boards {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
}

.board-section {
  text-align: center;
}

.board-title {
  font-size: 1.3rem;
  margin-bottom: 16px;
  color: var(--light);
}

.board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.board-coords-top {
  display: flex;
  margin-bottom: 4px;
}

.coord-corner {
  width: 30px;
  height: 30px;
}

.board-with-side-coords {
  display: flex;
}

.board-coords-side {
  display: flex;
  flex-direction: column;
  margin-right: 4px;
}

.coord-label {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--light-dark);
  font-weight: 600;
  font-size: 0.9rem;
}

.board-coords-top .coord-label {
  width: 50px;
  height: 30px;
}

.board-coords-side .coord-label {
  width: 30px;
  height: 50px;
}

.board {
  display: inline-grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  background: rgba(10, 22, 40, 0.8);
  padding: 12px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.board-row {
  display: contents;
}

.cell {
  width: 50px;
  height: 50px;
  background: var(--water);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  cursor: default;
}

.cell-attackable {
  cursor: pointer;
}

.cell-attackable:hover {
  background: var(--water-dark);
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
}

.cell-ship {
  background: var(--ship);
  position: relative;
}
.cell-ship::after {
  content: '';
  position: absolute;
  top: 10%;
  left: 10%;
  right: 10%;
  bottom: 10%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  pointer-events: none;
}

.cell-hit {
  background: var(--hit);
  animation: hit 0.3s ease;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
}

.cell-miss {
  background: var(--miss);
  opacity: 0.7;
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  100% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
}

@keyframes hit {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.game-message {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 1000;
  animation: slideUp 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.game-message.success {
  background: rgba(46, 204, 113, 0.95);
  color: white;
}

.game-message.danger {
  background: rgba(231, 76, 60, 0.95);
  color: white;
}

.game-message.info {
  background: rgba(52, 152, 219, 0.95);
  color: white;
}

.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  max-width: 420px;
  width: 90%;
  text-align: center;
  padding: 32px;
}

.confirm-dialog h3 {
  font-size: 1.4rem;
  color: var(--secondary);
  margin-bottom: 16px;
}

.confirm-dialog p {
  color: var(--light);
  margin-bottom: 24px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.confirm-actions .btn {
  min-width: 120px;
}

@media (max-width: 768px) {
  .cell {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .board-coords-top .coord-label {
    width: 35px;
    height: 25px;
  }

  .board-coords-side .coord-label {
    width: 25px;
    height: 35px;
  }

  .coord-corner {
    width: 25px;
    height: 25px;
  }

  .header-content {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
}
</style>
