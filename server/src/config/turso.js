import { createClient } from '@libsql/client'

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'file:local.db'
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

let tursoClient = null

export async function initTurso() {
  try {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN
    })

    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT UNIQUE NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Connected to Turso/SQLite')
    return tursoClient
  } catch (error) {
    console.error('❌ Turso connection error:', error.message)
    tursoClient = null
    throw error
  }
}

export function getTurso() {
  if (!tursoClient) {
    throw new Error('Turso not initialized. Call initTurso() first.')
  }
  return tursoClient
}
