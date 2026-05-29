<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <h1 class="login-title">Iniciar Sesión</h1>
          <p class="login-subtitle">Ingresa tu nickname para comenzar a jugar</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="nickname">Nickname</label>
            <div class="input-wrapper">
              <input
                id="nickname"
                v-model="nickname"
                type="text"
                class="input"
                placeholder="Ej: Capitán Jack"
                maxlength="20"
                required
                autofocus
              />
              <div class="char-counter" :class="{ 'almost-full': nickname.length >= 15 }">
                {{ nickname.length }}/20
              </div>
            </div>
          </div>

          <div v-if="userStore.error" class="error-message">
            <span class="error-icon">⚠️</span>
            <span>{{ userStore.error }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary login-btn"
            :disabled="!nickname.trim() || userStore.loading"
          >
            <span v-if="userStore.loading" class="loading-spinner"></span>
            <span v-else class="btn-content">
              <span>Entrar al Juego</span>
              <span class="btn-icon">🎮</span>
            </span>
          </button>
        </form>

        <div class="login-footer">
          <p>¿Ya tienes cuenta? <strong>Tu nickname es tu identidad</strong></p>
          <p class="hint">Si el nickname ya está en uso, deberás elegir otro</p>
        </div>
      </div>
    </div>

    <div class="decor-ships">
      <div class="ship ship1">🚢</div>
      <div class="ship ship2">⚓</div>
      <div class="ship ship3">🌊</div>
      <div class="ship ship4">🎯</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const nickname = ref('')

async function handleLogin() {
  if (!nickname.value.trim()) return

  const success = await userStore.login(nickname.value.trim())
  
  if (success) {
    router.push('/lobby')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 1;
}

.login-card {
  text-align: center;
  padding: 48px;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  margin-bottom: 40px;
}

.login-title {
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
}

.login-subtitle {
  color: var(--light-dark);
  font-size: 1.15rem;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--light);
  font-size: 1.05rem;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .input {
  padding-right: 60px;
  font-size: 1.1rem;
}

.char-counter {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: var(--light-darker);
  font-weight: 600;
  transition: color 0.3s ease;
}

.char-counter.almost-full {
  color: var(--accent);
}

.error-message {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--secondary);
  border-radius: 12px;
  padding: 16px;
  color: var(--secondary-light);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 1.2rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.login-btn {
  width: 100%;
  padding: 18px;
  font-size: 1.15rem;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-icon {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.login-btn:hover:not(:disabled) .btn-icon {
  transform: scale(1.2);
}

.login-footer {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--light-dark);
  font-size: 0.95rem;
  line-height: 1.6;
}

.login-footer strong {
  color: var(--accent-light);
  font-weight: 600;
}

.hint {
  margin-top: 10px;
  font-size: 0.88rem;
  opacity: 0.8;
  color: var(--light-darker);
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.decor-ships {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.ship {
  position: absolute;
  font-size: 3.5rem;
  opacity: 0.12;
  animation: float 8s ease-in-out infinite;
}

.ship1 {
  top: 8%;
  left: 8%;
  animation-delay: 0s;
}

.ship2 {
  top: 65%;
  right: 12%;
  animation-delay: 2s;
  animation-duration: 10s;
}

.ship3 {
  bottom: 15%;
  left: 15%;
  animation-delay: 4s;
  animation-duration: 12s;
}

.ship4 {
  top: 25%;
  right: 20%;
  animation-delay: 3s;
  animation-duration: 9s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-25px) rotate(8deg);
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .login-title {
    font-size: 2.2rem;
  }

  .login-subtitle {
    font-size: 1rem;
  }

  .decor-ships {
    display: none;
  }
}
</style>
