import { activeRooms } from './roomHandlers.js'
import { Room } from '../models/Room.js'

function generateShipPosition() {
  const row = Math.floor(Math.random() * 8)
  const col = Math.floor(Math.random() * 6)
  return [
    { row, col },
    { row, col: col + 1 },
    { row, col: col + 2 }
  ]
}

function initializeGameState(players) {
  const gameState = {
    players: {},
    currentTurn: null,
    status: 'playing',
    winner: null
  }

  for (const [socketId, player] of players) {
    const ships = generateShipPosition()
    const board = Array(8).fill(null).map(() => Array(8).fill('empty'))
    
    ships.forEach(ship => {
      board[ship.row][ship.col] = 'ship'
    })

    gameState.players[socketId] = {
      name: player.name,
      board,
      ships,
      hits: [],
      misses: []
    }
  }

  const playerIds = Object.keys(gameState.players)
  gameState.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)]

  return gameState
}

export function setupGameHandlers(io, socket) {
  socket.on('join-game', async ({ roomId }) => {
    const activeRoom = activeRooms.get(roomId)
    if (!activeRoom) {
      socket.emit('room-error', 'Sala no encontrada')
      return
    }

    if (!activeRoom.players.has(socket.id)) {
      socket.emit('room-error', 'No perteneces a esta sala')
      return
    }

    if (activeRoom.players.size === 2 && !activeRoom.gameState) {
      activeRoom.gameState = initializeGameState(activeRoom.players)
      
      io.to(roomId).emit('game-start', {
        gameState: activeRoom.gameState
      })
    } else if (activeRoom.gameState) {
      socket.emit('game-update', {
        gameState: activeRoom.gameState
      })
    }
  })

  socket.on('attack', async ({ roomId, row, col }) => {
    const activeRoom = activeRooms.get(roomId)
    if (!activeRoom || !activeRoom.gameState) {
      socket.emit('room-error', 'Juego no encontrado')
      return
    }

    const gameState = activeRoom.gameState

    if (gameState.currentTurn !== socket.id) {
      socket.emit('room-error', 'No es tu turno')
      return
    }

    if (gameState.status !== 'playing') {
      socket.emit('room-error', 'El juego ha terminado')
      return
    }

    const enemyId = Object.keys(gameState.players).find(id => id !== socket.id)
    const enemy = gameState.players[enemyId]
    const attacker = gameState.players[socket.id]

    const alreadyHit = attacker.hits?.some(h => h.row === row && h.col === col) ||
                       attacker.misses?.some(m => m.row === row && m.col === col)

    if (alreadyHit) {
      socket.emit('room-error', 'Ya atacaste esta posición')
      return
    }

    const isHit = enemy.ships.some(ship => ship.row === row && ship.col === col)

    if (isHit) {
      attacker.hits = [...(attacker.hits || []), { row, col }]
      
      const allShipCells = enemy.ships
      const allHits = attacker.hits
      const shipSunk = allShipCells.every(cell => 
        allHits.some(hit => hit.row === cell.row && hit.col === cell.col)
      )

      if (shipSunk) {
        gameState.status = 'finished'
        gameState.winner = socket.id

        try {
          const room = await Room.findOne({ roomId })
          if (room) {
            room.status = 'finished'
            room.winner = gameState.players[socket.id].name
            room.finishedAt = new Date()
            await room.save()
          }
        } catch (err) {
          console.error('Error updating room on game-over:', err)
        }

        io.to(roomId).emit('game-over', {
          gameState,
          winner: socket.id
        })

        try {
          const turso = (await import('../config/turso.js')).getTurso()
          const winnerName = gameState.players[socket.id].name
          const loserName = gameState.players[enemyId].name
          
          await turso.execute({
            sql: 'UPDATE users SET wins = wins + 1 WHERE nickname = ?',
            args: [winnerName]
          })
          await turso.execute({
            sql: 'UPDATE users SET losses = losses + 1 WHERE nickname = ?',
            args: [loserName]
          })
        } catch (err) {
          console.error('Error updating stats:', err)
        }

        return
      }
    } else {
      attacker.misses = [...(attacker.misses || []), { row, col }]
    }

    gameState.currentTurn = enemyId

    io.to(roomId).emit('attack-result', {
      gameState,
      attacker: socket.id,
      row,
      col,
      hit: isHit
    })
  })

  socket.on('rematch', async ({ roomId }) => {
    const activeRoom = activeRooms.get(roomId)
    if (!activeRoom) {
      socket.emit('room-error', 'Sala no encontrada')
      return
    }

    if (activeRoom.players.size !== 2) {
      socket.emit('room-error', 'Se necesitan 2 jugadores para la revancha')
      return
    }

    activeRoom.gameState = initializeGameState(activeRoom.players)

    io.to(roomId).emit('game-start', {
      gameState: activeRoom.gameState
    })
  })

  socket.on('leave-game', async ({ roomId }) => {
    const activeRoom = activeRooms.get(roomId)
    if (!activeRoom) return

    const enemyId = [...activeRoom.players.keys()].find(id => id !== socket.id)
    
    if (enemyId && activeRoom.gameState && activeRoom.gameState.status !== 'finished') {
      activeRoom.gameState.status = 'finished'
      activeRoom.gameState.winner = enemyId

      try {
        const room = await Room.findOne({ roomId })
        if (room && room.status === 'playing') {
          room.status = 'finished'
          room.winner = activeRoom.players.get(enemyId)?.name
          room.finishedAt = new Date()
          await room.save()
        }
      } catch (err) {
        console.error('Error updating room:', err)
      }

      io.to(roomId).emit('player-left', {
        playerName: activeRoom.players.get(socket.id)?.name,
        winner: enemyId
      })

      try {
        const turso = (await import('../config/turso.js')).getTurso()
        const winnerName = activeRoom.players.get(enemyId)?.name
        const loserName = activeRoom.players.get(socket.id)?.name
        
        if (winnerName) {
          await turso.execute({
            sql: 'UPDATE users SET wins = wins + 1 WHERE nickname = ?',
            args: [winnerName]
          })
        }
        if (loserName) {
          await turso.execute({
            sql: 'UPDATE users SET losses = losses + 1 WHERE nickname = ?',
            args: [loserName]
          })
        }
      } catch (err) {
        console.error('Error updating stats:', err)
      }
    }

    activeRoom.players.delete(socket.id)
    if (activeRoom.players.size === 0) {
      activeRooms.delete(roomId)
    }
  })
}
