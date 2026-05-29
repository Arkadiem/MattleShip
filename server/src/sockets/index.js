import { setupRoomHandlers } from './roomHandlers.js'
import { setupGameHandlers } from './gameHandlers.js'

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id}`)

    setupRoomHandlers(io, socket)
    setupGameHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`🔌 Player disconnected: ${socket.id}`)
    })
  })
}
