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

      <!-- USUARIO -->
      <div class="user">

        <div class="avatar">
          DR
        </div>

        <div>
          <strong>Daniel Ruiz</strong>
          <span>Administrador</span>
        </div>

      </div>

    </div>

  </header>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const utcTime = ref('00:00:00')

let timer = null

const updateUTCTime = () => {
  const now = new Date()

  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')

  utcTime.value = `${hours}:${minutes}:${seconds}`
}

onMounted(() => {
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

  gap: 30px;
}


/* ===============================
   RELOJ UTC
================================ */

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


/* ===============================
   CONEXIÓN
================================ */

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


/* ===============================
   USUARIO
================================ */

.user {
  display: flex;
  align-items: center;

  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;

  border-radius: 50%;

  background: #144355;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #60dbe2;
}

.user div:last-child {
  display: flex;
  flex-direction: column;
}

.user strong {
  font-size: 12px;
}

.user span {
  color: #71869b;

  font-size: 10px;
}
</style>