<template>
  <header class="header">
    <div>
      <h2>Centro de Control Mazatlán</h2>
      <span>MMZT · FIR MAZATLÁN</span>
    </div>

    <div class="header-right">
      <!-- RELOJ UTC -->
      <div class="utc">
        <span>UTC</span>
        <strong>{{ utcTime }}</strong>
      </div>

      <!-- CONEXIÓN -->
      <div class="connection">
        <span class="dot"></span>
        CONECTADO
      </div>

      <!-- USUARIO CONECTADO -->
      <div class="user">
        <div class="avatar">
          {{ initials }}
        </div>

        <div class="user-info">
          <strong>{{ user.username }}</strong>

          <span>
            {{ roleName }}
            <template v-if="user.airport"> · {{ user.airport }} </template>
          </span>
        </div>
      </div>

      <!-- CERRAR SESIÓN -->
      <button class="logout-button" type="button" @click="logout">Salir</button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

import { useRouter } from 'vue-router'

const router = useRouter()

const utcTime = ref('00:00:00')

const user = ref({
  username: '',
  role: '',
  airport: null,
})

let timer = null

// =====================================
// USUARIO CONECTADO
// =====================================

const loadUser = () => {
  try {
    const storedUser = localStorage.getItem('atcfpl_user')

    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
  } catch (error) {
    console.error('Error cargando usuario:', error)
  }
}

// =====================================
// NOMBRE DEL ROL
// =====================================

const roleName = computed(() => {
  switch (user.value.role) {
    case 'ROOT':
      return 'Root'

    case 'ADMIN':
      return 'Administrador'

    case 'USER':
      return 'Usuario'

    default:
      return ''
  }
})

// =====================================
// INICIALES
// =====================================

const initials = computed(() => {
  if (!user.value.username) {
    return '--'
  }

  if (user.value.role === 'ADMIN') {
    return 'AD'
  }

  if (user.value.role === 'ROOT') {
    return 'RT'
  }

  return user.value.username.toUpperCase().substring(0, 3)
})

// =====================================
// CERRAR SESIÓN
// =====================================

const logout = () => {
  localStorage.removeItem('atcfpl_token')

  localStorage.removeItem('atcfpl_user')

  router.replace('/login')
}

// =====================================
// RELOJ UTC
// =====================================

const updateUTCTime = () => {
  const now = new Date()

  const hours = String(now.getUTCHours()).padStart(2, '0')

  const minutes = String(now.getUTCMinutes()).padStart(2, '0')

  const seconds = String(now.getUTCSeconds()).padStart(2, '0')

  utcTime.value = `${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  loadUser()

  updateUTCTime()

  timer = setInterval(updateUTCTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.header {
  width: 100%;
  height: 78px;
  min-height: 78px;

  box-sizing: border-box;

  background: #0a1725;

  border-bottom: 1px solid #17283a;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 30px;
}

.header h2 {
  margin: 0 0 4px;

  color: #00e5ff;

  font-size: 18px;
}

.header > div > span {
  color: #71869b;

  font-size: 11px;
}

.header-right {
  display: flex;
  align-items: center;

  gap: 25px;
}

/* RELOJ UTC */

.utc {
  display: flex;
  flex-direction: column;
}

.utc span {
  color: #60758b;

  font-size: 10px;
}

.utc strong {
  font-family: 'JetBrains Mono', monospace;

  font-size: 17px;

  color: #ffffff;
}

/* CONEXIÓN */

.connection {
  color: #4fd68a;

  font-size: 11px;

  display: flex;
  align-items: center;

  gap: 7px;
}

.dot {
  width: 7px;
  height: 7px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow: 0 0 7px #4fd68a;
}

/* USUARIO */

.user {
  display: flex;
  align-items: center;

  gap: 10px;
}

.avatar {
  min-width: 36px;
  height: 36px;

  padding: 0 6px;

  box-sizing: border-box;

  border-radius: 50%;

  background: #144355;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #60dbe2;

  font-size: 11px;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user strong {
  color: white;

  font-size: 12px;
}

.user span {
  color: #71869b;

  font-size: 10px;
}

/* BOTÓN SALIR */

.logout-button {
  padding: 9px 15px;

  border: 1px solid #29445c;

  border-radius: 6px;

  background: transparent;

  color: #9fb2c3;

  font-size: 11px;

  cursor: pointer;

  transition: 0.2s;
}

.logout-button:hover {
  color: #ffffff;

  border-color: #00e5ff;

  background: #13283a;
}
</style>
