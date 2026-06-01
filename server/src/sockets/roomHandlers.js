import { Room } from '../models/Room.js'
import { getTurso } from '../config/turso.js'

const activeRooms = new Map()

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function setupRoomHandlers(io, socket) {
  socket.on('get-rooms', async () => {
    try {
      const rooms = await Room.find({ 
        status: { $in: ['waiting', 'playing'] } 
      }).sort({ createdAt: -1 })
      
      socket.emit('rooms-list', rooms)
    } catch (error) {
      console.error('Error getting rooms:', error)
      socket.emit('rooms-list', [])
    }
  })

  socket.on('create-room', async ({ playerName }) => {
    try {
      const existingPlayerRoom = await Room.findOne({
        'players.socketId': socket.id,
        status: { $in: ['waiting', 'playing'] }
      })

      if (existingPlayerRoom) {
        socket.emit('room-error', 'Ya estás en una sala')
        return
      }

      const roomId = generateRoomId()
      const roomName = `Sala de ${playerName}`

      const room = new Room({
        roomId,
        roomName,
        hostId: socket.id,
        hostName: playerName,
        players: [{
          socketId: socket.id,
          playerName,
          joinedAt: new Date()
        }]
      })

      await room.save()
      activeRooms.set(roomId, {
        gameState: null,
        players: new Map([[socket.id, { 
          name: playerName, 
          board: null, 
          ships: [], 
          hits: [], 
          misses: [] 
        }]])
      })

      socket.join(roomId)
      socket.roomId = roomId
      socket.playerName = playerName

      socket.emit('room-created', room)
      
      io.emit('rooms-list', await Room.find({ 
        status: { $in: ['waiting', 'playing'] } 
      }).sort({ createdAt: -1 }))
    } catch (error) {
      console.error('Error creating room:', error)
      socket.emit('room-error', 'Error al crear la sala')
    }
  })

  socket.on('join-room', async ({ roomId, playerName }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'waiting' })

      if (!room) {
        socket.emit('room-error', 'Sala no encontrada o ya está en juego')
        return
      }

      const alreadyInThisRoom = room.players.some(p => p.socketId === socket.id)
      if (alreadyInThisRoom) {
        socket.emit('room-error', 'Ya estás en esta sala')
        return
      }

      if (room.players.length >= 2) {
        socket.emit('room-error', 'La sala está llena')
        return
      }

      const existingOtherRoom = await Room.findOne({
        'players.socketId': socket.id,
        roomId: { $ne: roomId },
        status: { $in: ['waiting', 'playing'] }
      })

      if (existingOtherRoom) {
        socket.emit('room-error', 'Ya estás en otra sala')
        return
      }

      room.players.push({
        socketId: socket.id,
        playerName,
        joinedAt: new Date()
      })

      if (room.players.length === 2) {
        room.status = 'playing'
      }

      await room.save()

      const activeRoom = activeRooms.get(roomId) || {
        gameState: null,
        players: new Map()
      }
      activeRoom.players.set(socket.id, { 
        name: playerName, 
        board: null, 
        ships: [], 
        hits: [], 
        misses: [] 
      })
      activeRooms.set(roomId, activeRoom)

      socket.join(roomId)
      socket.roomId = roomId
      socket.playerName = playerName

      socket.emit('room-joined', room)
      socket.to(roomId).emit('player-joined', {
        playerName,
        playerCount: room.players.length
      })

      io.emit('rooms-list', await Room.find({ 
        status: { $in: ['waiting', 'playing'] } 
      }).sort({ createdAt: -1 }))
    } catch (error) {
      console.error('Error joining room:', error)
      socket.emit('room-error', 'Error al unirse a la sala')
    }
  })

  socket.on('leave-room', async ({ roomId }) => {
    await handlePlayerLeave(io, socket, roomId)
  })

  socket.on('disconnect', async () => {
    if (socket.roomId) {
      await handlePlayerLeave(io, socket, socket.roomId)
    }
  })
}

async function handlePlayerLeave(io, socket, roomId) {
  try {
    const room = await Room.findOne({ roomId })

    if (!room) return

    room.players = room.players.filter(p => p.socketId !== socket.id)

    if (room.players.length === 0) {
      await Room.deleteOne({ roomId })
      activeRooms.delete(roomId)
    } else {
      const activeRoom = activeRooms.get(roomId)
      const alreadyFinished = activeRoom?.gameState?.status === 'finished' || room.status === 'finished'

      if (room.status === 'playing' && !alreadyFinished) {
        const winner = room.players[0]
        room.status = 'finished'
        room.winner = winner.playerName
        room.finishedAt = new Date()
        await room.save()

        if (activeRoom) {
          activeRoom.gameState = {
            ...activeRoom.gameState,
            status: 'finished',
            winner: winner.socketId
          }
        }

        io.to(roomId).emit('player-left', {
          playerName: socket.playerName,
          winner: winner.socketId
        })

        try {
          const turso = getTurso()
          if (turso) {
            await turso.execute({
              sql: 'UPDATE users SET wins = wins + 1 WHERE nickname = ?',
              args: [winner.playerName]
            })
            await turso.execute({
              sql: 'UPDATE users SET losses = losses + 1 WHERE nickname = ?',
              args: [socket.playerName]
            })
          }
        } catch (err) {
          console.error('Error updating stats:', err)
        }
      } else {
        if (room.status !== 'finished') {
          room.hostId = room.players[0].socketId
          room.hostName = room.players[0].playerName
          await room.save()
        }
      }

      socket.to(roomId).emit('room-updated', room)
    }

    socket.leave(roomId)
    socket.roomId = null

    io.emit('rooms-list', await Room.find({ 
      status: { $in: ['waiting', 'playing'] } 
    }).sort({ createdAt: -1 }))
  } catch (error) {
    console.error('Error handling player leave:', error)
  }
}

export { activeRooms }
