<template>
  <div class="landing">
    <div class="hero">
      <div class="hero-content">
        <div class="title-container">
          <h1 class="title">
            <span class="title-ship">Mattle</span><span class="title-ship accent">Ship</span>
          </h1>
          <div class="title-glow"></div>
        </div>
        <p class="subtitle">¡Prepárate para la batalla naval definitiva!</p>
        
        <div class="description card">
          <h2>¿Cómo Jugar?</h2>
          <ul>
            <li>🎮 <strong>Desafía a otros jugadores</strong> en tiempo real</li>
            <li>🚢 <strong>Coloca tu barco</strong> estratégicamente en el tablero 8x8</li>
            <li>🎯 <strong>Ataca las casillas</strong> del oponente para encontrar su barco</li>
            <li>💥 <strong>Hunde el barco enemigo</strong> para ganar la partida</li>
            <li>📊 <strong>Compite por el ranking</strong> y demuestra tu habilidad</li>
          </ul>
          
          <div class="features">
            <div class="feature feature-card">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">⚡</span>
              </div>
              <div class="feature-content">
                <h3>Partidas rápidas</h3>
                <p>Juegos de 5-10 minutos</p>
              </div>
            </div>
            <div class="feature feature-card">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">🌐</span>
              </div>
              <div class="feature-content">
                <h3>Juego online</h3>
                <p>Conecta con amigos</p>
              </div>
            </div>
            <div class="feature feature-card">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">🏆</span>
              </div>
              <div class="feature-content">
                <h3>Sistema de ranking</h3>
                <p>Compite y sube de nivel</p>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary start-btn" @click="startGame">
          <span class="btn-text">Iniciar Juego</span>
          <span class="btn-icon">🚀</span>
        </button>
      </div>
    </div>

    <div class="waves">
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function startGame() {
  const nickname = localStorage.getItem('nickname')
  if (nickname) {
    router.push('/lobby')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  position: relative;
  z-index: 1;
}

.hero-content {
  text-align: center;
  max-width: 900px;
  width: 100%;
}

.title-container {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.title {
  font-size: 5rem;
  font-weight: 900;
  margin-bottom: 0;
  text-shadow: 0 4px 30px rgba(59, 130, 246, 0.5);
  letter-spacing: -2px;
  position: relative;
  z-index: 2;
}

.title-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 1;
}

.title-ship {
  color: var(--light);
  background: linear-gradient(135deg, var(--light) 0%, var(--light-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-ship.accent {
  color: var(--accent);
  background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.6rem;
  color: var(--light-dark);
  margin-bottom: 50px;
  font-weight: 300;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.description {
  text-align: left;
  margin-bottom: 50px;
}

.description h2 {
  font-size: 2rem;
  margin-bottom: 24px;
  color: var(--accent);
  text-align: center;
  font-weight: 700;
}

.description ul {
  list-style: none;
  padding: 0;
  margin-bottom: 40px;
}

.description li {
  padding: 16px 0;
  font-size: 1.15rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease;
}

.description li:hover {
  transform: translateX(8px);
}

.description li:last-child {
  border-bottom: none;
}

.description li strong {
  color: var(--accent-light);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
}

.feature-icon-wrapper {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

.feature-icon {
  font-size: 2.5rem;
}

.feature-content {
  text-align: center;
}

.feature-content h3 {
  font-size: 1.2rem;
  margin-bottom: 4px;
  color: var(--light);
}

.feature-content p {
  font-size: 0.9rem;
  color: var(--light-dark);
}

.start-btn {
  font-size: 1.4rem;
  padding: 20px 60px;
  margin-top: 30px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
}

.start-btn:hover {
  box-shadow: 0 15px 50px rgba(59, 130, 246, 0.6);
}

.btn-text {
  font-weight: 700;
}

.btn-icon {
  font-size: 1.6rem;
  transition: transform 0.3s ease;
}

.start-btn:hover .btn-icon {
  transform: translateX(4px);
}

.waves {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%231e40af' fill-opacity='0.3' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x;
  animation: wave 7s linear infinite;
}

.wave1 {
  opacity: 0.4;
  animation-duration: 7s;
}

.wave2 {
  opacity: 0.3;
  animation-duration: 10s;
  animation-delay: -2s;
  bottom: 10px;
}

.wave3 {
  opacity: 0.2;
  animation-duration: 13s;
  animation-delay: -4s;
  bottom: 20px;
}

@keyframes wave {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .start-btn {
    font-size: 1.2rem;
    padding: 16px 40px;
  }
}
</style>
