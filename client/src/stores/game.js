import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import socketService from '../services/socket'

export const useGameStore = defineStore('game', () => {
  const currentRoom = ref(null)
  const gameState = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isInRoom = computed(() => !!currentRoom.value)
  
  const socketId = computed(() => socketService.getSocket()?.id || null)
  
  const myPlayer = computed(() => {
    if (!gameState.value || !socketId.value) return null
    return gameState.value.players[socketId.value] || null
  })
  
  const enemyPlayer = computed(() => {
    if (!gameState.value || !socketId.value) return null
    const enemyId = Object.keys(gameState.value.players).find(id => id !== socketId.value)
    return enemyId ? gameState.value.players[enemyId] : null
  })
  
  const isMyTurn = computed(() => {
    if (!gameState.value || !socketId.value) return false
    return gameState.value.currentTurn === socketId.value
  })

  const myBoard = computed(() => myPlayer.value?.board || null)
  const enemyBoard = computed(() => enemyPlayer.value?.board || null)
  const myShips = computed(() => myPlayer.value?.ships || [])
  const enemyShips = computed(() => enemyPlayer.value?.ships || [])
  const myHits = computed(() => myPlayer.value?.hits || [])
  const myMisses = computed(() => myPlayer.value?.misses || [])
  const enemyHits = computed(() => enemyPlayer.value?.hits || [])
  const enemyMisses = computed(() => enemyPlayer.value?.misses || [])

  const winner = computed(() => gameState.value?.winner || null)
  const isGameFinished = computed(() => gameState.value?.status === 'finished')

  function setRoom(room) {
    currentRoom.value = room
  }

  function updateGameState(state) {
    gameState.value = state
  }

  function resetGame() {
    gameState.value = null
  }

  function leaveRoom() {
    currentRoom.value = null
    gameState.value = null
  }

  return {
    currentRoom,
    gameState,
    loading,
    error,
    isInRoom,
    isMyTurn,
    myBoard,
    enemyBoard,
    myShips,
    enemyShips,
    myHits,
    myMisses,
    enemyHits,
    enemyMisses,
    winner,
    isGameFinished,
    setRoom,
    updateGameState,
    resetGame,
    leaveRoom
  }
})
