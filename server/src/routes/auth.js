import { Router } from 'express'
import { getTurso } from '../config/turso.js'

const router = Router()

function safeGetTurso() {
  try {
    return getTurso()
  } catch {
    return null
  }
}

router.post('/login', async (req, res) => {
  try {
    const { nickname } = req.body

    if (!nickname || nickname.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nickname es requerido'
      })
    }

    if (nickname.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'El nickname no puede tener más de 20 caracteres'
      })
    }

    const turso = safeGetTurso()
    
    if (!turso) {
      return res.json({
        success: true,
        message: 'Login exitoso (modo offline)',
        user: { nickname: nickname.trim(), wins: 0, losses: 0 }
      })
    }

    const existing = await turso.execute({
      sql: 'SELECT * FROM users WHERE nickname = ?',
      args: [nickname.trim()]
    })

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Login exitoso',
        user: existing.rows[0]
      })
    }

    await turso.execute({
      sql: 'INSERT INTO users (nickname) VALUES (?)',
      args: [nickname.trim()]
    })

    const newUser = await turso.execute({
      sql: 'SELECT * FROM users WHERE nickname = ?',
      args: [nickname.trim()]
    })

    res.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser.rows[0]
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    })
  }
})

router.get('/stats/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params
    const turso = safeGetTurso()

    if (!turso) {
      return res.json({
        success: true,
        stats: { wins: 0, losses: 0 }
      })
    }

    const result = await turso.execute({
      sql: 'SELECT wins, losses FROM users WHERE nickname = ?',
      args: [nickname]
    })

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      stats: result.rows[0]
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    })
  }
})

router.post('/stats/:nickname/win', async (req, res) => {
  try {
    const { nickname } = req.params
    const turso = safeGetTurso()

    if (!turso) {
      return res.json({ success: true })
    }

    await turso.execute({
      sql: 'UPDATE users SET wins = wins + 1 WHERE nickname = ?',
      args: [nickname]
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Update win error:', error)
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    })
  }
})

router.post('/stats/:nickname/loss', async (req, res) => {
  try {
    const { nickname } = req.params
    const turso = safeGetTurso()

    if (!turso) {
      return res.json({ success: true })
    }

    await turso.execute({
      sql: 'UPDATE users SET losses = losses + 1 WHERE nickname = ?',
      args: [nickname]
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Update loss error:', error)
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    })
  }
})

export default router
