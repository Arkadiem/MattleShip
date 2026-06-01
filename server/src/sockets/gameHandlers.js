import { activeRooms } from './roomHandlers.js'
import { Room } from '../models/Room.js'
import { getTurso } from '../config/turso.js'

function generateFleet() {
  const fleet = []
  const flatShips = []
  const sizes = [4, 3, 3, 2, 2]
  const boardSize = 8
  const occupied = new Set()

  for (const size of sizes) {
    let placed = false
    let attempts = 0
    while (!placed && attempts < 100) {
      attempts++
      const isHorizontal = Math.random() < 0.5
      const row = Math.floor(Math.random() * boardSize)
      const col = Math.floor(Math.random() * boardSize)
      
      const currentShip = []
      let isValid = true

      for (let i = 0; i < size; i++) {
        const r = row + (isHorizontal ? 0 : i)
        const c = col + (isHorizontal ? i : 0)

        if (r >= boardSize || c >= boardSize || occupied.has(`${r},${c}`)) {
          isValid = false
          break
        }
        currentShip.push({ row: r, col: c })
      }

      if (isValid) {
        currentShip.forEach(cell => {
          occupied.add(`${cell.row},${cell.col}`)
          flatShips.push({ row: cell.row, col: cell.col })
        })
        fleet.push(currentShip)
        placed = true
      }
    }
  }
  return { fleet, flatShips }
}

function initializeGameState(players) {
  const gameState = {
    players: {},
    currentTurn: null,
    status: 'playing',
    winner: null
  }

  for (const [socketId, player] of players) {
    const { fleet, flatShips } = generateFleet()
    const board = Array(8).fill(null).map(() => Array(8).fill('empty'))
    
    flatShips.forEach(ship => {
      board[ship.row][ship.col] = 'ship'
    })

    gameState.players[socketId] = {
      name: player.name,
      board,
      fleet,
      ships: flatShips,
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
    if (typeof row !== 'number' || typeof col !== 'number' ||
        row < 0 || row > 7 || col < 0 || col > 7) {
      socket.emit('room-error', 'Coordenadas de ataque inválidas')
      return
    }

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
    let sunkShip = false

    if (isHit) {
      attacker.hits = [...(attacker.hits || []), { row, col }]
      
      const allHits = attacker.hits
      
      for (const ship of enemy.fleet) {
        if (ship.some(cell => cell.row === row && cell.col === col)) {
          const isSunk = ship.every(cell => 
            allHits.some(hit => hit.row === cell.row && hit.col === cell.col)
          )
          if (isSunk) sunkShip = true
          break
        }
      }

      const allShipsSunk = enemy.fleet.every(shipCells => 
        shipCells.every(cell => 
          allHits.some(hit => hit.row === cell.row && hit.col === cell.col)
        )
      )

      if (allShipsSunk) {
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
          const turso = getTurso()
          if (turso) {
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
          }
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
      hit: isHit,
      sunk: sunkShip
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
        const turso = getTurso()
        if (turso) {
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
