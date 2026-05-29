import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomName: {
    type: String,
    required: true
  },
  hostId: {
    type: String,
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  players: [{
    socketId: String,
    playerName: String,
    joinedAt: Date
  }],
  winner: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  finishedAt: {
    type: Date,
    default: null
  }
})

roomSchema.index({ status: 1 })
roomSchema.index({ createdAt: -1 })

export const Room = mongoose.model('Room', roomSchema)
