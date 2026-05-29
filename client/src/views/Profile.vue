<template>
  <div class="profile-page">
    <header class="profile-header">
      <div class="header-content">
        <button class="btn btn-secondary btn-sm" @click="router.push('/lobby')">
          <span class="btn-icon">←</span>
          <span>Volver al Lobby</span>
        </button>
        <h1 class="page-title">
          <span class="title-icon">📊</span>
          <span>Mi Perfil</span>
        </h1>
        <div></div>
      </div>
    </header>

    <main class="profile-main">
      <div class="profile-container">
        <div class="profile-card card">
          <div class="profile-avatar">
            <span class="avatar-icon">👤</span>
            <div class="avatar-ring"></div>
          </div>
          <h2 class="profile-name">{{ userStore.nickname }}</h2>
          <div class="profile-badge">
            <span class="badge-icon">{{ rankIcon }}</span>
            <span class="badge-text">{{ rankName }}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card card wins">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">🏆</span>
              </div>
              <span class="stat-trend positive">▲</span>
            </div>
            <div class="stat-value">{{ userStore.stats.wins }}</div>
            <div class="stat-label">Victorias</div>
          </div>

          <div class="stat-card card losses">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">💀</span>
              </div>
              <span class="stat-trend negative">▼</span>
            </div>
            <div class="stat-value">{{ userStore.stats.losses }}</div>
            <div class="stat-label">Derrotas</div>
          </div>

          <div class="stat-card card winrate">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">📊</span>
              </div>
            </div>
            <div class="stat-value">{{ winRate }}<span class="stat-unit">%</span></div>
            <div class="stat-label">Tasa de Victoria</div>
          </div>

          <div class="stat-card card games">
            <div class="stat-header">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">🎮</span>
              </div>
            </div>
            <div class="stat-value">{{ totalGames }}</div>
            <div class="stat-label">Partidas Jugadas</div>
          </div>
        </div>

        <div class="rank-section card">
          <div class="rank-header">
            <h3>Rango Actual</h3>
            <div class="rank-level">Nivel {{ rankLevel }}</div>
          </div>
          <div class="rank-display">
            <div class="rank-icon-wrapper">
              <span class="rank-icon">{{ rankIcon }}</span>
            </div>
            <div class="rank-info">
              <span class="rank-name">{{ rankName }}</span>
              <p class="rank-description">{{ rankDescription }}</p>
            </div>
          </div>
        </div>

        <div class="progress-section card">
          <div class="progress-header">
            <h3>Progreso al Siguiente Rango</h3>
            <span class="progress-percent">{{ Math.round(progressPercent) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            <div class="progress-glow" :style="{ left: progressPercent + '%' }"></div>
          </div>
          <div class="progress-stats">
            <span class="progress-current">{{ userStore.stats.wins }} victorias</span>
            <span class="progress-separator">/</span>
            <span class="progress-target">{{ nextRankWins }} necesarias</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  userStore.fetchStats()
})

const totalGames = computed(() => {
  return userStore.stats.wins + userStore.stats.losses
})

const winRate = computed(() => {
  if (totalGames.value === 0) return 0
  return Math.round((userStore.stats.wins / totalGames.value) * 100)
})

const rankIcon = computed(() => {
  const wins = userStore.stats.wins
  if (wins >= 100) return '👑'
  if (wins >= 50) return '⭐'
  if (wins >= 20) return '🎖️'
  if (wins >= 10) return '🏅'
  if (wins >= 5) return '🔰'
  return '🌱'
})

const rankName = computed(() => {
  const wins = userStore.stats.wins
  if (wins >= 100) return 'Almirante Legendario'
  if (wins >= 50) return 'Capitán de Flota'
  if (wins >= 20) return 'Capitán'
  if (wins >= 10) return 'Teniente'
  if (wins >= 5) return 'Marinero'
  return 'Recluta'
})

const rankDescription = computed(() => {
  const wins = userStore.stats.wins
  if (wins >= 100) return 'Has alcanzado el máximo rango. ¡Eres una leyenda!'
  if (wins >= 50) return 'Comandas una flota entera. Impresionante.'
  if (wins >= 20) return 'Tu experiencia te ha convertido en un líder.'
  if (wins >= 10) return 'Estás subiendo de rango. ¡Sigue así!'
  if (wins >= 5) return 'Has demostrado tu valía en el mar.'
  return '¡Comienza tu aventura naval!'
})

const nextRankWins = computed(() => {
  const wins = userStore.stats.wins
  if (wins >= 100) return 100
  if (wins >= 50) return 100
  if (wins >= 20) return 50
  if (wins >= 10) return 20
  if (wins >= 5) return 10
  return 5
})

const progressPercent = computed(() => {
  const wins = userStore.stats.wins
  const next = nextRankWins.value
  return Math.min((wins / next) * 100, 100)
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.profile-header {
  background: rgba(26, 42, 74, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  color: var(--light);
}

.profile-main {
  flex: 1;
  padding: 40px 24px;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  text-align: center;
  padding: 40px;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.avatar-icon {
  font-size: 3rem;
}

.profile-name {
  font-size: 2rem;
  color: var(--light);
  margin-bottom: 8px;
}

.profile-join {
  color: var(--light-dark);
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 24px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 8px;
}

.stat-label {
  color: var(--light-dark);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rank-section {
  text-align: center;
  padding: 30px;
}

.rank-section h3 {
  color: var(--light-dark);
  margin-bottom: 20px;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rank-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.rank-icon {
  font-size: 3rem;
}

.rank-name {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent);
}

.rank-description {
  color: var(--light-dark);
  font-size: 0.95rem;
  max-width: 400px;
  margin: 0 auto;
}

.progress-section {
  padding: 24px;
}

.progress-section h3 {
  color: var(--light-dark);
  margin-bottom: 16px;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-text {
  color: var(--light-dark);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    gap: 12px;
  }

  .rank-name {
    font-size: 1.4rem;
  }
}
</style>
