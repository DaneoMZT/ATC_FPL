<script setup>
import { ref, onMounted } from 'vue'

const API = 'http://127.0.0.1:3000/api/traffic-simulator'

const message = ref(`(FPL-VOI1123-IS
-A20N/M-SDFGIRWYZ/SB1
-MMCL2200
-N0250F090 DCT
-MMMZ0030 MMCL
-DOF/261108 REG/XAVRJ PER/C)`)

const flights = ref([])
const loading = ref(false)
const notice = ref('')
const error = ref('')

function getToken() {
  return localStorage.getItem('atcfpl_token')
}

async function request(path, options = {}) {
  const token = getToken()

  console.log('JWT encontrado:', Boolean(token))
  console.log('Longitud JWT:', token?.length ?? 0)

  if (!token) {
    throw new Error('No se encontró el JWT de ATCFPL. Inicia sesión nuevamente.')
  }

  let response
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
  } catch {
    throw new Error('No fue posible conectar con el backend en el puerto 3000.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sesión no autorizada o JWT vencido.')
    }
    if (response.status === 403) {
      throw new Error(data.error || data.message || 'El servidor rechazó el acceso al simulador.')
    }
    throw new Error(data.error || data.message || `Error HTTP ${response.status}`)
  }

  return data
}

async function loadFlights() {
  try {
    const data = await request('/flights')
    flights.value = Array.isArray(data.flights) ? data.flights : []
    error.value = ''
  } catch (err) {
    error.value = err.message
  }
}

async function injectFpl() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    const data = await request('/fpl', {
      method: 'POST',
      body: JSON.stringify({
        message: message.value.trim(),
      }),
    })

    const callsign = data.flight?.callsign || 'sin identificador'

    await loadFlights()

    notice.value = `FPL ${callsign} registrado correctamente`
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(loadFlights)
</script>

<template>
  <main class="traffic-simulator">
    <header>
      <h1>ATCFPL Traffic Simulator</h1>
      <p>Generación e inyección de tráfico ATS en laboratorio</p>
    </header>

    <section class="sim-panel">
      <h2>Inyectar plan de vuelo FPL</h2>
      <textarea
        v-model="message"
        rows="9"
        spellcheck="false"
        placeholder="Pega un mensaje (FPL-...)"
      />
      <button :disabled="loading" @click="injectFpl">
        {{ loading ? 'Procesando...' : 'Inyectar FPL' }}
      </button>
      <p v-if="notice" class="success">{{ notice }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <section class="sim-panel">
      <div class="section-header">
        <h2>Tráfico simulado</h2>
        <button @click="loadFlights">Actualizar</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Callsign</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="flight in flights" :key="flight._id">
              <td>{{ flight.callsign }}</td>
              <td>{{ flight.departure }}</td>
              <td>{{ flight.destination }}</td>
              <td>{{ flight.lifecycle }}</td>
              <td>
                <button v-if="flight.lifecycle === 'SCHEDULED'" @click="sendEvent(flight, 'DEP')">
                  DEP
                </button>
                <button v-if="flight.lifecycle === 'DEPARTED'" @click="sendEvent(flight, 'ARR')">
                  ARR
                </button>
              </td>
            </tr>
            <tr v-if="!flights.length">
              <td colspan="5">Sin vuelos simulados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.traffic-simulator {
  padding: 28px;
  color: #e6edf7;
}
header {
  margin-bottom: 25px;
}
header h1 {
  font-size: 28px;
}
header p {
  color: #9caec4;
}
.sim-panel {
  background: #10243b;
  border: 1px solid #29435d;
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 20px;
}
h2 {
  font-size: 19px;
  margin-bottom: 16px;
}
textarea {
  width: 100%;
  box-sizing: border-box;
  background: #07182a;
  color: #e6edf7;
  border: 1px solid #3b5873;
  border-radius: 8px;
  padding: 14px;
  font: 14px monospace;
  margin-bottom: 14px;
}
button {
  background: #0877b9;
  color: white;
  border: 0;
  border-radius: 7px;
  padding: 9px 15px;
  cursor: pointer;
  margin-right: 7px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #29435d;
}
.success {
  color: #65d6a3;
}
.error {
  color: #ff8585;
}
</style>
