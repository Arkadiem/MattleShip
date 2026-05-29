import { io } from 'socket.io-client'

const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id)
      this.connected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      this.connected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.connected = false
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  getSocket() {
    return this.socket
  }

  isConnected() {
    return this.connected
  }
}

export default new SocketService()
