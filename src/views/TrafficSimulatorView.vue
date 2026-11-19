<script setup>
import { ref, onMounted } from 'vue'
import { API_URL } from '../config'

const API = `${API_URL}/traffic-simulator`

const message = ref(`(FPL-VOI1123-IS
-A20N/M-SDFGIRWYZ/SB1
-MMCL2200
-N0250F090 DCT
-MMMZ0030 MMCL
-DOF/261108 REG/XAVRJ PER/C)`)

const flights = ref([])
const loading = ref(false)
const refreshing = ref(false)
const notice = ref('')
const error = ref('')
const processingId = ref(null)

function getToken() {
  return localStorage.getItem('atcfpl_token')
}

async function request(path, options = {}) {
  const token = getToken()

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
  } catch (err) {
    console.error('Error de conexión Traffic Simulator:', err)

    throw new Error(`No fue posible conectar con el backend: ${API}`)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sesión no autorizada o JWT vencido. Inicia sesión nuevamente.')
    }

    if (response.status === 403) {
      throw new Error(data.error || data.message || 'El servidor rechazó el acceso al simulador.')
    }

    throw new Error(data.error || data.message || `Error HTTP ${response.status}`)
  }

  return data
}

async function loadFlights() {
  if (refreshing.value) return

  refreshing.value = true
  error.value = ''

  try {
    const data = await request('/flights')

    if (!Array.isArray(data.flights)) {
      throw new Error('El backend no devolvió una lista válida de vuelos.')
    }

    flights.value = data.flights
  } catch (err) {
    console.error('Error al actualizar vuelos:', err)
    error.value = err.message
  } finally {
    refreshing.value = false
  }
}

async function injectFpl() {
  if (loading.value) return

  const fpl = message.value.trim()

  if (!fpl) {
    error.value = 'Debes ingresar un mensaje FPL.'
    return
  }

  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    const data = await request('/fpl', {
      method: 'POST',
      body: JSON.stringify({
        message: fpl,
      }),
    })

    const callsign = data.flight?.callsign || 'sin identificador'

    await loadFlights()

    notice.value = `FPL ${callsign} registrado correctamente`
  } catch (err) {
    console.error('Error al inyectar FPL:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function sendEvent(flight, event) {
  if (!flight?._id || processingId.value) return

  processingId.value = flight._id
  error.value = ''
  notice.value = ''

  try {
    await request(`/${flight._id}/event`, {
      method: 'POST',
      body: JSON.stringify({ event }),
    })

    await loadFlights()

    notice.value = `Evento ${event} procesado correctamente para ${flight.callsign}`
  } catch (err) {
    error.value = err.message
  } finally {
    processingId.value = null
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

      <button type="button" :disabled="loading" @click="injectFpl">
        {{ loading ? 'Procesando...' : 'Inyectar FPL' }}
      </button>

      <p v-if="notice" class="success">
        {{ notice }}
      </p>

      <p v-if="error" class="error">
        {{ error }}
      </p>
    </section>

    <section class="sim-panel">
      <div class="section-header">
        <h2>Tráfico simulado</h2>
        <button type="button" class="refresh-button" :disabled="refreshing" @click="loadFlights">
          <span class="refresh-icon" :class="{ spinning: refreshing }">↻</span>
          <span>Actualizar</span>
        </button>
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
                <button
                  v-if="flight.lifecycle === 'SCHEDULED'"
                  :disabled="processingId !== null"
                  @click="sendEvent(flight, 'DEP')"
                >
                  DEP
                </button>

                <button
                  v-if="flight.lifecycle === 'DEPARTED'"
                  :disabled="processingId !== null"
                  @click="sendEvent(flight, 'ARR')"
                >
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

/* BOTÓN ACTUALIZAR */

.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-width: 135px;
  height: 39px;
  padding: 0 15px;
  margin-right: 0;
  background: #0877b9;
  color: #ffffff;
  border: 1px solid #168acb;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #0a8bd4;
}

.refresh-button:disabled {
  opacity: 0.8;
  cursor: wait;
}

.refresh-icon {
  display: inline-block;
  font-size: 21px;
  line-height: 1;
  transform-origin: center;
}

.refresh-icon.spinning {
  animation: refresh-spin 0.8s linear infinite;
}

@keyframes refresh-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* ENCABEZADO DE LA TABLA */

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin-bottom: 0;
}
</style>
