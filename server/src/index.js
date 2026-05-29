import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { connectDB } from './config/mongodb.js'
import { initTurso } from './config/turso.js'
import authRoutes from './routes/auth.js'
import { setupSocketHandlers } from './sockets/index.js'

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

app.use('/api', authRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

setupSocketHandlers(io)

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await connectDB()
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed, continuing without DB:', error.message)
  }

  try {
    await initTurso()
  } catch (error) {
    console.warn('⚠️ Turso connection failed, continuing without DB:', error.message)
  }

  server.listen(PORT, () => {
    console.log(`🚢 MattleShip server running on port ${PORT}`)
    console.log(`📡 WebSocket server ready`)
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()

export { io }
