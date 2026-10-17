<template>
  <div class="login-page" :style="{ backgroundImage: `url(${loginBackground})` }">
    <!-- Capa oscura -->
    <div class="background-overlay"></div>

    <!-- LOGIN -->
    <div class="login-card">
      <div class="brand">
        <h1>ATCFPL</h1>
        <p>Air Traffic Control Flight Plan</p>
      </div>

      <form @submit.prevent="login">
        <label>Usuario</label>

        <input v-model="username" type="text" placeholder="MZT" autocomplete="username" required />

        <label>Contraseña</label>

        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />

        <p v-if="error" class="error">
          {{ error }}
        </p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'VERIFICANDO...' : 'INICIAR SESIÓN' }}
        </button>
      </form>

      <div class="footer">Centro de Control Mazatlán · FIR MZT</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_URL } from '../config'

/* IMAGEN DE FONDO */
import loginBackground from '../assets/login_atcfpl.png'

const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const login = async () => {
  error.value = ''
  loading.value = true

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'No fue posible iniciar sesión')
    }

    localStorage.setItem('atcfpl_token', data.token)

    localStorage.setItem('atcfpl_user', JSON.stringify(data.user))

    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* =====================================
   PANTALLA LOGIN
===================================== */

.login-page {
  position: relative;

  width: 100%;
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;

  font-family: Inter, Arial, sans-serif;

  overflow: hidden;
}

/* =====================================
   OSCURECER BACKGROUND
===================================== */

.background-overlay {
  position: absolute;
  inset: 0;

  background: linear-gradient(rgba(3, 12, 22, 0.25), rgba(3, 12, 22, 0.45));

  z-index: 1;
}

/* =====================================
   TARJETA LOGIN
===================================== */

.login-card {
  position: relative;

  z-index: 2;

  width: 390px;

  padding: 42px;

  border-radius: 16px;

  background: rgba(7, 24, 38, 0.9);

  border: 1px solid rgba(83, 149, 190, 0.18);

  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.55);

  color: white;
}

/* =====================================
   MARCA
===================================== */

.brand {
  text-align: center;

  margin-bottom: 35px;
}

.brand h1 {
  margin: 0;

  font-size: 42px;

  letter-spacing: 5px;

  color: #ffffff;
}

.brand p {
  margin-top: 8px;

  color: #9fb2c3;
}

/* =====================================
   FORMULARIO
===================================== */

label {
  display: block;

  margin: 18px 0 7px;

  font-size: 14px;

  color: #cbd7e2;
}

input {
  box-sizing: border-box;

  width: 100%;

  padding: 14px;

  border: 1px solid #30485d;

  border-radius: 7px;

  background: rgba(5, 18, 29, 0.9);

  color: white;

  font-size: 16px;

  outline: none;

  transition: 0.2s;
}

input:focus {
  border-color: #00d9ff;

  box-shadow: 0 0 0 2px rgba(0, 217, 255, 0.1);
}

/* =====================================
   BOTÓN
===================================== */

button {
  width: 100%;

  margin-top: 28px;

  padding: 14px;

  border: 0;

  border-radius: 7px;

  background: #2878b5;

  color: white;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.2s;
}

button:hover {
  background: #3194d8;
}

button:disabled {
  opacity: 0.6;

  cursor: wait;
}

/* =====================================
   ERROR
===================================== */

.error {
  margin: 16px 0 0;

  padding: 10px;

  border-radius: 6px;

  background: rgba(190, 45, 45, 0.2);

  color: #ffaaaa;

  text-align: center;
}

/* =====================================
   FOOTER
===================================== */

.footer {
  margin-top: 32px;

  text-align: center;

  color: #71879a;

  font-size: 12px;
}

/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 600px) {
  .login-card {
    width: calc(100% - 60px);

    padding: 30px;
  }

  .brand h1 {
    font-size: 34px;
  }
}
</style>
