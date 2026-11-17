<script setup>
import { API_BASE } from '../config'
import { ref, computed, onMounted, onUnmounted } from 'vue'

import FlightPlanModal from '../components/FlightPlanModal.vue'
import ArrivalSimulationMap from '../components/ArrivalSimulationMap.vue'

// =====================================

// ESTADO GENERAL

// =====================================

const showNewFlight = ref(false)

const departureMode = ref('manual')

const now = ref(Date.now())

const flights = ref([])

const arrivals = ref([])
const currentUser = ref(null)
const dashboardUsers = ref([])
const selectedUsername = ref('')
const dashboardAirportCode = ref('')
const isRoot = computed(() => currentUser.value?.role === 'ROOT')

const events = ref([])

const loading = ref(false)

const saving = ref(false)

const apiError = ref('')

const apiOnline = ref(false)

let clockTimer

let refreshTimer

function addFlightMarker(map, flight, lat, lng) {
  const callsign = String(flight.callsign || 'SIN ID')
  const departure = String(flight.departure || '----')
  const destination = String(flight.destination || '----')

  const etaValue = flight.eta_at || flight.eta
  const eta = etaValue ? new Date(etaValue) : null

  const etaValid = eta && !Number.isNaN(eta.getTime())

  const etaUtc = etaValid ? eta.toISOString().slice(11, 16) : '--:--'

  const remaining = etaValid ? Math.max(0, Math.ceil((eta.getTime() - Date.now()) / 60000)) : null

  const flightLevel = String(flight.fl || flight.flight_level || '---')

  const marker = L.marker([lat, lng]).addTo(map)

  const label = `
    <div class="flight-label">
      <div class="flight-label-title">${callsign}</div>
      <div>${departure} → ${destination}</div>
      <div>FL${flightLevel} · ETA ${etaUtc} UTC</div>
      <div class="flight-label-time">
        ${remaining === null ? 'ETA no disponible' : remaining + ' min restantes'}
      </div>
    </div>
  `

  marker.bindTooltip(label, {
    permanent: true,
    direction: 'top',
    offset: [0, -12],
    opacity: 1,
    className: 'atcfpl-flight-tooltip',
  })

  return marker
}

// =====================================

// CONEXIÓN API

// =====================================

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,

    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('atcfpl_token')
        ? { Authorization: `Bearer ${localStorage.getItem('atcfpl_token')}` }
        : {}),

      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Error HTTP ${response.status}`)
  }

  return data
}

// =====================================

// FUNCIONES UTC

// =====================================

function formatUTC(value) {
  const raw = String(value ?? '').trim()

  if (/^\d{4}$/.test(raw)) {
    const formatted = `${raw.slice(0, 2)}:${raw.slice(2)}`

    return /^([01]\d|2[0-3]):[0-5]\d$/.test(formatted) ? formatted : '--:--'
  }

  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    return raw
  }

  return '--:--'
}

function formatEET(value) {
  const raw = String(value ?? '').trim()

  const match = /^(\d{1,3}):?([0-5]\d)$/.exec(raw)

  if (!match) return '--:--'

  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

function utcTimeNow() {
  return new Date().toISOString().slice(11, 16) + ' UTC'
}

function formatETA(value) {
  if (!value) return '--:--'

  const raw = String(value).trim()

  if (/^\d{4}$/.test(raw) || /^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    return `${formatUTC(raw)} UTC`
  }

  const date = new Date(raw)

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(11, 16) + ' UTC'
  }

  return '--:--'
}

// =====================================

// NORMALIZAR PLANES

// =====================================

function normalizeFlight(flight) {
  return {
    ...flight,

    id: String(flight._id || flight.id || ''),

    departure: String(flight.departure || '')
      .trim()
      .toUpperCase(),

    destination: String(flight.destination || '')
      .trim()
      .toUpperCase(),

    simulated: flight.simulated === true,

    lifecycle:
      flight.lifecycle ||
      (['CNL', 'CANCELLED'].includes(flight.status) ? 'CANCELLED' : 'SCHEDULED'),
  }
}

// =====================================

// CONSULTAR MONGODB

// =====================================

async function initializeDashboard() {
  try {
    const raw = localStorage.getItem('atcfpl_user')
    currentUser.value = raw ? JSON.parse(raw) : null
    if (!currentUser.value) throw new Error('Inicia sesión nuevamente')
    if (isRoot.value) {
      dashboardUsers.value = await apiRequest('/api/dashboard/users')
      if (!Array.isArray(dashboardUsers.value)) dashboardUsers.value = []
      selectedUsername.value = dashboardUsers.value[0]?.username || ''
    }
    await loadFlights()
  } catch (error) {
    apiError.value = error.message
    apiOnline.value = false
  }
}
async function loadFlights(silent = false) {
  if (!silent) loading.value = true
  try {
    if (!currentUser.value) return
    const query = isRoot.value ? `?username=${encodeURIComponent(selectedUsername.value)}` : ''
    const response = await apiRequest(`/api/dashboard/flight-plans${query}`)
    if (!Array.isArray(response?.flights)) throw new Error('La API no devolvió una lista de planes')
    dashboardAirportCode.value = response.airport || ''
    flights.value = response.flights.map(normalizeFlight)
    apiOnline.value = true
    apiError.value = ''
  } catch (error) {
    apiOnline.value = false
    apiError.value = `No se pudieron consultar los planes: ${error.message}`
  } finally {
    loading.value = false
  }
}

// =====================================

// EOBT EN UTC

// =====================================

function eobtTimestamp(flight) {
  const fullDate = flight.eobt_at || flight.eobtDateTime

  if (fullDate) {
    const timestamp = new Date(fullDate).getTime()

    return Number.isFinite(timestamp) ? timestamp : null
  }

  const formatted = formatUTC(flight.eobt)

  if (formatted === '--:--') return null

  const [hours, minutes] = formatted.split(':').map(Number)

  const dof = String(flight.dof || flight.icao?.dof || '').trim()

  if (/^\d{6}$/.test(dof)) {
    const year = 2000 + Number(dof.slice(0, 2))

    const month = Number(dof.slice(2, 4)) - 1

    const day = Number(dof.slice(4, 6))

    const timestamp = Date.UTC(year, month, day, hours, minutes)

    const parsed = new Date(timestamp)

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month ||
      parsed.getUTCDate() !== day
    ) {
      return null
    }

    return timestamp
  }

  // Compatibilidad con registros antiguos sin DOF.

  const current = new Date(now.value)

  let timestamp = Date.UTC(
    current.getUTCFullYear(),

    current.getUTCMonth(),

    current.getUTCDate(),

    hours,

    minutes,
  )

  if (timestamp - now.value > 12 * 3600000) {
    timestamp -= 86400000
  }

  if (now.value - timestamp > 12 * 3600000) {
    timestamp += 86400000
  }

  return timestamp
}

// =====================================

// TIEMPO RESTANTE

// =====================================

function minutesRemaining(flight) {
  const timestamp = eobtTimestamp(flight)

  return timestamp === null ? null : Math.ceil((timestamp - now.value) / 60000)
}

function remainingLabel(flight) {
  const minutes = minutesRemaining(flight)

  if (minutes === null) return 'SIN EOBT'

  return minutes < 0 ? `T+${Math.abs(minutes)} min` : `T-${minutes} min`
}

// =====================================

// ESTADO DEL PLAN

// =====================================

function stage(flight) {
  if (flight.lifecycle === 'CANCELLED' || ['CNL', 'CANCELLED'].includes(flight.status)) {
    return 'CANCELLED'
  }

  if (flight.lifecycle === 'ARRIVED' || flight.arrived_at) {
    return 'ARRIVED'
  }

  if (flight.lifecycle === 'DEPARTED' || flight.departed_at) {
    return 'DEPARTED'
  }

  const remaining = minutesRemaining(flight)
  if (remaining === null) return 'UNCOORDINATED'
  if (remaining < 5) return 'DEPARTURE'
  if (remaining <= 10) return 'PREACTIVE'
  return 'UNCOORDINATED'
}

// =====================================

// CLASIFICACIÓN DE PLANES

// =====================================

const localDepartures = computed(() =>
  flights.value.filter(
    (flight) =>
      String(flight.departure || '').toUpperCase() === dashboardAirportCode.value &&
      stage(flight) !== 'CANCELLED',
  ),
)
const uncoordinated = computed(() =>
  localDepartures.value.filter((flight) => stage(flight) === 'UNCOORDINATED'),
)
const preactive = computed(() =>
  localDepartures.value.filter((flight) => stage(flight) === 'PREACTIVE'),
)

const departure = computed(() =>
  localDepartures.value.filter((flight) => {
    const currentStage = stage(flight)

    return (
      currentStage === 'DEPARTURE' || (flight.simulated === true && currentStage === 'DEPARTED')
    )
  }),
)
const departedCount = computed(
  () => localDepartures.value.filter((flight) => stage(flight) === 'DEPARTED').length,
)

const arrivalQueue = computed(() =>
  flights.value
    .filter((flight) => {
      const destination = String(flight.destination || '')
        .trim()
        .toUpperCase()

      const currentStage = stage(flight)

      return destination === dashboardAirportCode.value && currentStage !== 'CANCELLED'
    })
    .sort((a, b) => {
      const etaA = arrivalEtaTimestamp(a) ?? Infinity
      const etaB = arrivalEtaTimestamp(b) ?? Infinity

      return etaA - etaB
    }),
)

// =====================================
// ARRIVE - CLASIFICACIÓN POR ETA UTC
// =====================================

function arrivalEtaTimestamp(flight) {
  const value = flight.eta_at || flight.eta
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const arrivalGroups = computed(() => {
  const groups = { critical: [], warning: [], normal: [], overdue: [], arrived: [], withoutEta: [] }

  for (const flight of arrivalQueue.value) {
    const lifecycle = String(flight.lifecycle || '').toUpperCase()
    const status = String(flight.status || '').toUpperCase()
    if (lifecycle === 'CANCELLED' || status === 'CNL' || status === 'CANCELLED') continue
    if (lifecycle === 'ARRIVED' || flight.arrived_at) {
      groups.arrived.push(flight)
      continue
    }
    const timestamp = arrivalEtaTimestamp(flight)
    if (timestamp === null) {
      groups.withoutEta.push(flight)
      continue
    }
    const remaining = (timestamp - now.value) / 60000
    if (remaining < 0) groups.overdue.push(flight)
    else if (remaining <= 10) groups.critical.push(flight)
    else if (remaining <= 20) groups.warning.push(flight)
    else groups.normal.push(flight)
  }

  return groups
})

const pendingArrivalsCount = computed(
  () =>
    arrivalGroups.value.critical.length +
    arrivalGroups.value.warning.length +
    arrivalGroups.value.normal.length +
    arrivalGroups.value.overdue.length +
    arrivalGroups.value.withoutEta.length,
)

function arrivalCountdown(flight) {
  const timestamp = arrivalEtaTimestamp(flight)
  if (timestamp === null) return '--:--'
  const total = Math.max(0, Math.ceil((timestamp - now.value) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return hours ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}` : `${minutes}:${seconds}`
}

function arrivalEtaUTC(flight) {
  const timestamp = arrivalEtaTimestamp(flight)
  return timestamp === null ? '--:--' : new Date(timestamp).toISOString().slice(11, 19)
}

const arrivalRows = computed(() => [
  ...arrivalGroups.value.critical.map((flight) => ({
    flight,
    group: 'critical',
    label: 'PRÓXIMA LLEGADA',
  })),
  ...arrivalGroups.value.warning.map((flight) => ({
    flight,
    group: 'warning',
    label: 'EN SEGUIMIENTO',
  })),
  ...arrivalGroups.value.normal.map((flight) => ({ flight, group: 'normal', label: 'PREVISTA' })),
  ...arrivalGroups.value.overdue.map((flight) => ({
    flight,
    group: 'overdue',
    label: 'ETA VENCIDA',
  })),
  ...arrivalGroups.value.withoutEta.map((flight) => ({
    flight,
    group: 'withoutEta',
    label: 'SIN ETA VÁLIDA',
  })),
  ...arrivalGroups.value.arrived.map((flight) => ({
    flight,
    group: 'arrived',
    label: flight.simulated ? 'LLEGADA SIMULADA' : 'ARRIVED',
  })),
])

const sections = computed(() => [
  {
    key: 'UNCOORDINATED',

    title: 'UNCOORDINATED',

    subtitle: 'Planes pendientes de coordinación',

    items: uncoordinated.value,
  },

  {
    key: 'PREACTIVE',

    title: 'PREACTIVE',

    subtitle: 'Planes próximos a su hora de salida',

    items: preactive.value,
  },

  {
    key: 'DEPARTURE',

    title: 'DEPARTURE',

    subtitle: 'Planes en ventana de salida; despegue aún no confirmado',

    items: departure.value,
  },
])

// =====================================

// GUARDAR NUEVO FPL

// =====================================

async function addFlight(flight) {
  if (saving.value) return

  saving.value = true

  apiError.value = ''

  try {
    await apiRequest('/api/flight-plans', {
      method: 'POST',

      body: JSON.stringify({
        ...flight,

        lifecycle: 'SCHEDULED',
      }),
    })

    await loadFlights(true)

    if (!apiOnline.value) {
      throw new Error('Se guardó el plan, pero no se pudo verificar su recuperación')
    }

    showNewFlight.value = false

    events.value.unshift({
      type: 'FPL',

      callsign: flight.callsign || 'SIN ID',

      detail: 'Guardado mediante API. No se transmitió mensaje AFTN.',

      time: utcTimeNow(),
    })
  } catch (error) {
    apiError.value = `No se pudo completar el guardado: ${error.message}`

    window.alert(apiError.value)
  } finally {
    saving.value = false
  }
}

// =====================================

// CONFIRMAR DESPEGUE (DEP)

// =====================================

async function confirmDeparture(flight) {
  if (stage(flight) !== 'DEPARTURE' || departureMode.value !== 'manual') {
    return
  }

  const confirmed = window.confirm(
    `¿Confirmar despegue SIMULADO de ${flight.callsign}?\n` + 'No se enviará ningún mensaje TCP.',
  )

  if (!confirmed) return

  try {
    await apiRequest(`/api/flight-plans/${encodeURIComponent(flight.id)}`, {
      method: 'PUT',

      body: JSON.stringify({
        lifecycle: 'DEPARTED',

        departed_at: new Date().toISOString(),
      }),
    })

    await loadFlights(true)

    events.value.unshift({
      type: 'DEP',

      callsign: flight.callsign,

      detail: 'Salida de prueba registrada mediante API. Mensaje TCP no enviado.',

      time: utcTimeNow(),
    })
  } catch (error) {
    apiError.value = `No se pudo registrar la salida: ${error.message}`

    window.alert(apiError.value)
  }
}

// =====================================

// CANCELAR PLAN (CNL)

// =====================================

async function cancelFlight(flight) {
  if (!flight.id || ['CANCELLED', 'DEPARTED', 'ARRIVED'].includes(stage(flight))) {
    window.alert('Este plan no puede cancelarse en su estado actual.')

    return
  }

  const confirmed = window.confirm(
    `¿Cancelar el plan de vuelo ${flight.callsign}?\n` +
      'El registro se conservará en MongoDB.\n' +
      'No se transmitirá ningún mensaje AFTN.',
  )

  if (!confirmed) return

  try {
    apiError.value = ''

    await apiRequest(`/api/flight-plans/${encodeURIComponent(flight.id)}/cancel`, {
      method: 'PUT',

      body: JSON.stringify({}),
    })

    await loadFlights(true)

    if (!apiOnline.value) {
      throw new Error('No se pudo verificar la actualización')
    }

    events.value.unshift({
      type: 'CNL',

      callsign: flight.callsign,

      detail: 'Cancelación registrada en MongoDB. Mensaje AFTN no enviado.',

      time: utcTimeNow(),
    })
  } catch (error) {
    apiError.value = `No se pudo cancelar el plan: ${error.message}`

    window.alert(apiError.value)
  }
}

// =====================================

// MODIFICACIÓN CHG

// =====================================

const showCHG = ref(false)

const selectedCHGFlight = ref(null)

const chgEobt = ref('')

const chgEet = ref('')

const chgRoute = ref('')

const savingCHG = ref(false)

function openCHG(flight) {
  if (!flight.id) {
    window.alert('No se encontró el identificador del plan.')

    return
  }

  if (['CANCELLED', 'DEPARTED', 'ARRIVED'].includes(stage(flight))) {
    window.alert('Este plan no puede modificarse en su estado actual.')

    return
  }

  selectedCHGFlight.value = flight

  // Cargar valores actuales sin los dos puntos

  chgEobt.value = String(flight.eobt ?? '')
    .replace(':', '')

    .trim()

  chgEet.value = String(flight.eet ?? '')
    .replace(':', '')

    .trim()

  chgRoute.value = String(flight.route ?? '')

  showCHG.value = true
}

function closeCHG() {
  if (savingCHG.value) return

  showCHG.value = false

  selectedCHGFlight.value = null
}

async function saveCHG() {
  if (!selectedCHGFlight.value || savingCHG.value) return

  const flight = selectedCHGFlight.value

  const normalizeHHMM = (value) =>
    String(value ?? '')
      .replace(':', '')

      .trim()

  const original = {
    eobt: normalizeHHMM(flight.eobt),

    eet: normalizeHHMM(flight.eet),

    route: String(flight.route ?? '')
      .trim()

      .toUpperCase(),
  }

  const edited = {
    eobt: normalizeHHMM(chgEobt.value),

    eet: normalizeHHMM(chgEet.value),

    route: String(chgRoute.value ?? '')
      .trim()

      .toUpperCase(),
  }

  const changes = {}

  // Solo actualizar EOBT si fue modificado

  if (edited.eobt !== original.eobt) {
    if (!/^([01]\d|2[0-3])[0-5]\d$/.test(edited.eobt)) {
      window.alert('EOBT inválido. Utilice HHMM UTC.')

      return
    }

    changes.eobt = edited.eobt
  }

  // Solo actualizar EET si fue modificado

  if (edited.eet !== original.eet) {
    if (!/^\d{2}[0-5]\d$/.test(edited.eet) || edited.eet === '0000') {
      window.alert('EET inválido. Utilice HHMM.')

      return
    }

    changes.eet = edited.eet
  }

  // Solo actualizar RUTA si fue modificada

  if (edited.route !== original.route) {
    if (!edited.route || edited.route.length > 2000 || !/^[A-Z0-9 /.-]+$/.test(edited.route)) {
      window.alert('La ruta no es válida.')

      return
    }

    changes.route = edited.route
  }

  if (Object.keys(changes).length === 0) {
    window.alert('No se realizaron modificaciones.')

    return
  }

  const confirmed = window.confirm(
    `¿Guardar modificaciones del vuelo ${flight.callsign}?\n` +
      `Campos modificados: ${Object.keys(changes).join(', ').toUpperCase()}`,
  )

  if (!confirmed) return

  savingCHG.value = true

  apiError.value = ''

  try {
    await apiRequest(`/api/flight-plans/${encodeURIComponent(flight.id)}/chg`, {
      method: 'PUT',

      body: JSON.stringify(changes),
    })

    await loadFlights(true)

    events.value.unshift({
      type: 'CHG',

      callsign: flight.callsign,

      detail: 'Modificación registrada en MongoDB.',

      time: utcTimeNow(),
    })

    showCHG.value = false

    selectedCHGFlight.value = null

    window.alert('Plan de vuelo modificado correctamente.')
  } catch (error) {
    apiError.value = `Error CHG: ${error.message}`

    window.alert(apiError.value)
  } finally {
    savingCHG.value = false
  }
}

// =====================================

// CICLO DE VIDA

// =====================================

onMounted(() => {
  initializeDashboard()

  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)

  refreshTimer = window.setInterval(() => {
    loadFlights(true)
  }, 15000)
})

onUnmounted(() => {
  window.clearInterval(clockTimer)

  window.clearInterval(refreshTimer)
})
</script>

<template>
  <div class="dashboard">
    <div v-if="apiError" class="api-alert">
      {{ apiError }}
    </div>

    <div v-if="loading" class="api-info">Consultando planes de vuelo...</div>

    <div v-if="saving" class="api-info">Guardando plan de vuelo...</div>

    <!-- ENCABEZADO -->

    <div class="title-row">
      <div class="title">
        <h1>Dashboard</h1>

        <p>Gestión operacional de planes de vuelo · Entorno de demostración · Horarios UTC</p>
      </div>

      <button class="new-flight" @click="showNewFlight = true">＋ NUEVO PLAN DE VUELO</button>
    </div>

    <div v-if="isRoot" class="settings-row">
      <div>
        <strong>Supervisar usuario</strong>
        <p>ROOT: seleccionar la cuenta para consultar su aeropuerto.</p>
      </div>
      <select v-model="selectedUsername" aria-label="Seleccionar usuario" @change="loadFlights()">
        <option v-for="user in dashboardUsers" :key="user.username" :value="user.username">
          {{ user.username }} · {{ user.airport }}
        </option>
      </select>
    </div>
    <div class="api-info">
      Usuario: {{ isRoot ? selectedUsername : currentUser?.username }} · Aeropuerto:
      {{ dashboardAirportCode || 'SIN ASIGNAR' }}
    </div>

    <!-- TARJETAS -->

    <div class="cards">
      <div class="card card-uncoordinated">
        <span>UNCOORDINATED</span>

        <strong>{{ uncoordinated.length }}</strong>

        <small>Más de 10 minutos</small>
      </div>

      <div class="card card-preactive">
        <span>PREACTIVE</span>

        <strong>{{ preactive.length }}</strong>

        <small>De 5 a 10 minutos</small>
      </div>

      <div class="card card-departure">
        <span>DEPARTURE</span>

        <strong>{{ departure.length }}</strong>

        <small>Menos de 5 minutos</small>
      </div>

      <div class="card card-arrive">
        <span>ARRIVE</span>

        <strong>{{ arrivalQueue.length }}</strong>

        <small>Planes con destino al aeropuerto</small>
      </div>
    </div>

    <!-- CONFIGURACIÓN -->

    <div class="settings-row">
      <div>
        <strong>Modo de despegue</strong>

        <p>La confirmación automática requiere integración segura con el backend.</p>
      </div>

      <select v-model="departureMode" aria-label="Modo de despegue">
        <option value="manual">Manual (demo)</option>

        <option value="automatic" disabled>Automático (pendiente de backend)</option>
      </select>
    </div>

    <!-- TABLAS DE PLANES -->

    <section v-for="section in sections" :key="section.key" class="panel">
      <div class="panel-header" :class="`header-${section.key.toLowerCase()}`">
        <div>
          <h2>{{ section.title }}</h2>

          <p>{{ section.subtitle }}</p>
        </div>

        <span class="count"> {{ section.items.length }} planes </span>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>CALLSIGN</th>

              <th>AERONAVE</th>

              <th>DEP</th>

              <th>DEST</th>

              <th>EOBT (UTC)</th>

              <th>EET</th>

              <th>FL</th>

              <th>TIEMPO RESTANTE</th>

              <th>RUTA</th>

              <th>ACCIONES</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="flight in section.items" :key="flight.id">
              <td class="callsign">
                {{ flight.callsign }}

                <span v-if="flight.simulated" class="simulated-badge"> SIMULADO </span>

                <span
                  v-if="flight.simulated && stage(flight) === 'DEPARTED'"
                  class="departed-badge"
                >
                  DEPARTED
                </span>
              </td>

              <td>
                {{ flight.aircraft }}
              </td>

              <td>
                {{ flight.departure }}
              </td>

              <td>
                {{ flight.destination }}
              </td>

              <td>{{ formatUTC(flight.eobt).replace(':', '') }} UTC</td>

              <td>
                {{ formatEET(flight.eet).replace(':', '') }}
              </td>

              <td>
                {{ flight.level }}
              </td>

              <td>
                <span class="time-chip">
                  {{ remainingLabel(flight) }}
                </span>
              </td>

              <td class="route-cell">
                {{ flight.route }}
              </td>

              <td>
                <div class="actions">
                  <button @click="openCHG(flight)">CHG</button>

                  <button @click="cancelFlight(flight)">CNL</button>

                  <button
                    v-if="section.key === 'DEPARTURE' && stage(flight) === 'DEPARTURE'"
                    :disabled="departureMode !== 'manual'"
                    class="dep-button"
                    @click="confirmDeparture(flight)"
                  >
                    DEP
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!section.items.length">
              <td colspan="10" class="empty">No hay planes en esta sección.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- LLEGADAS: CLASIFICACIÓN AUTOMÁTICA POR ETA -->
    <section class="panel arrive-panel">
      <div class="panel-header header-arrive">
        <div>
          <h2>ARRIVE</h2>
          <p>Seguimiento de llegadas por ETA UTC · Entorno de simulación</p>
        </div>
        <span class="count">{{ pendingArrivalsCount }} pendientes</span>
      </div>

      <div class="arrival-blocks">
        <div class="arrival-block arrival-critical">
          <div class="arrival-block-title">● 0–10 MIN</div>
          <div class="arrival-block-count">{{ arrivalGroups.critical.length }}</div>
          <div class="arrival-block-description">Llegada próxima</div>
        </div>
        <div class="arrival-block arrival-warning">
          <div class="arrival-block-title">● MÁS DE 10–20 MIN</div>
          <div class="arrival-block-count">{{ arrivalGroups.warning.length }}</div>
          <div class="arrival-block-description">En seguimiento</div>
        </div>
        <div class="arrival-block arrival-normal">
          <div class="arrival-block-title">● MÁS DE 20 MIN</div>
          <div class="arrival-block-count">{{ arrivalGroups.normal.length }}</div>
          <div class="arrival-block-description">Llegadas previstas</div>
        </div>
      </div>

      <div v-if="arrivalGroups.critical.length" class="arrival-alert" role="status">
        ⚠ {{ arrivalGroups.critical.length }} vuelo(s) con ETA de 10 minutos o menos.
      </div>

      <div v-if="arrivalGroups.overdue.length" class="arrival-overdue-note">
        {{ arrivalGroups.overdue.length }} vuelo(s) con ETA vencida, sin llegada confirmada.
      </div>

      <ArrivalSimulationMap :flights="arrivalQueue" :airport="dashboardAirportCode" :now="now" />

      <div class="table-scroll">
        <table class="arrival-table">
          <thead>
            <tr>
              <th>CALLSIGN</th>
              <th>ORIGEN</th>
              <th>DESTINO</th>
              <th>ETA (UTC)</th>
              <th>RESTANTE</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in arrivalRows"
              :key="item.flight.id || `${item.flight.callsign}-${index}`"
              :class="{ 'arrival-row-critical': item.group === 'critical' }"
            >
              <td class="callsign">
                {{ item.flight.callsign }}
                <span v-if="item.flight.simulated" class="simulated-badge"> SIMULADO </span>
              </td>
              <td>{{ item.flight.departure }}</td>
              <td>{{ item.flight.destination }}</td>
              <td>{{ arrivalEtaUTC(item.flight) }}</td>
              <td :class="`arrival-time-${item.group}`">
                {{
                  item.group === 'overdue'
                    ? 'VENCIDA'
                    : item.group === 'arrived'
                      ? 'FINALIZADA'
                      : arrivalCountdown(item.flight)
                }}
              </td>
              <td>
                <span class="arrival-status" :class="`status-${item.group}`">
                  {{ item.label }}
                </span>
              </td>
            </tr>
            <tr v-if="!arrivalRows.length">
              <td colspan="6" class="empty">No hay vuelos de llegada para este aeropuerto.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- PANELES INFERIORES -->

    <div class="bottom-grid">
      <!-- EVENTOS -->

      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Mensajes AFTN</h2>

            <p>Eventos locales de demostración · UTC</p>
          </div>

          <span class="offline"> NO CONECTADO </span>
        </div>

        <div v-if="!events.length" class="empty">Todavía no hay eventos locales.</div>

        <div v-for="(event, index) in events.slice(0, 5)" :key="index" class="event">
          <span class="event-type">
            {{ event.type }}
          </span>

          <div>
            <strong>{{ event.callsign }}</strong>

            <p>{{ event.detail }}</p>
          </div>

          <small>{{ event.time }}</small>
        </div>
      </section>

      <!-- ESTADO DEL SISTEMA -->

      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Estado del sistema</h2>

            <p>Estado de integración de esta vista</p>
          </div>

          <span class="offline">
            {{ apiOnline ? 'API DISPONIBLE' : 'SIN CONEXIÓN' }}
          </span>
        </div>

        <div class="service">
          <strong>MongoDB</strong>

          <span>
            {{ apiOnline ? 'Planes consultados mediante API' : 'Sin conexión verificada' }}
          </span>
        </div>

        <div class="service">
          <strong>API Server</strong>

          <span>
            {{ apiOnline ? 'Conectado' : 'Sin conexión verificada' }}
          </span>
        </div>

        <div class="service">
          <strong>Simulador TCP</strong>

          <span>No conectado</span>
        </div>

        <div class="service">
          <strong>Salidas confirmadas (prueba)</strong>

          <span>{{ departedCount }}</span>
        </div>
      </section>
    </div>

    <!-- FORMULARIO FPL -->

    <FlightPlanModal v-if="showNewFlight" @close="showNewFlight = false" @save="addFlight" />

    <!-- VENTANA CHG -->

    <div v-if="showCHG" class="chg-overlay" @click.self="closeCHG">
      <div class="chg-modal" role="dialog" aria-modal="true" aria-labelledby="chg-title">
        <div class="chg-header">
          <div>
            <h2 id="chg-title">CHG | Modificación de plan de vuelo</h2>

            <p>Actualización de datos aeronáuticos</p>
          </div>

          <button type="button" :disabled="savingCHG" @click="closeCHG">✕</button>
        </div>

        <div class="chg-body">
          <div class="chg-flight-info">
            <span>IDENTIFICACIÓN</span>

            <strong>
              {{ selectedCHGFlight?.callsign }}
            </strong>

            <small>
              {{ selectedCHGFlight?.departure }}

              →

              {{ selectedCHGFlight?.destination }}
            </small>
          </div>

          <div class="chg-fields">
            <div>
              <label for="chg-eobt">EOBT (UTC) | HHMM</label>

              <div class="utc-input">
                <input
                  id="chg-eobt"
                  v-model="chgEobt"
                  type="text"
                  inputmode="numeric"
                  placeholder="1820"
                  maxlength="4"
                  autocomplete="off"
                />

                <span class="utc-label">UTC</span>
              </div>
            </div>

            <div>
              <label for="chg-eet">EET | Duración (HHMM)</label>

              <input
                id="chg-eet"
                v-model="chgEet"
                type="text"
                inputmode="numeric"
                placeholder="0100"
                maxlength="4"
                autocomplete="off"
              />
            </div>
          </div>

          <label for="chg-route"> RUTA | Nueva ruta de vuelo </label>

          <textarea
            id="chg-route"
            v-model="chgRoute"
            rows="4"
            maxlength="2000"
            placeholder="Ingrese la ruta modificada"
          ></textarea>

          <p class="chg-note">
            Los cambios se registrarán en MongoDB. Esta operación no transmite mensajes AFTN. EOBT
            se interpreta en UTC y EET como duración.
          </p>
        </div>

        <div class="chg-footer">
          <button type="button" class="chg-cancel" :disabled="savingCHG" @click="closeCHG">
            Cancelar
          </button>

          <button type="button" class="chg-save" :disabled="savingCHG" @click="saveCHG">
            {{ savingCHG ? 'Guardando...' : 'Guardar CHG' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =====================================

   DASHBOARD

===================================== */

.dashboard {
  width: 100%;

  box-sizing: border-box;

  padding: 30px;

  color: #dce7f1;
}

.api-alert {
  padding: 12px 16px;

  margin-bottom: 15px;

  background: #50232a;

  color: #ffd6d6;

  border-radius: 7px;
}

.api-info {
  padding: 10px 16px;

  margin-bottom: 15px;

  color: #9bd6e4;
}

/* =====================================

   ENCABEZADO

===================================== */

.title-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 25px;
}

.title h1 {
  margin: 0;

  color: #00e5ff;

  font-size: 27px;
}

.title p {
  margin: 5px 0 0;

  color: #8296aa;

  font-size: 13px;
}

.new-flight {
  background: #07818b;

  color: white;

  border: 0;

  border-radius: 7px;

  padding: 13px 18px;

  font-size: 11px;

  font-weight: 700;

  cursor: pointer;
}

.new-flight:hover {
  background: #0797a3;
}

/* =====================================

   TARJETAS

===================================== */

.cards {
  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr));

  gap: 18px;

  margin-bottom: 20px;
}

.card {
  min-height: 100px;

  display: flex;

  flex-direction: column;

  gap: 9px;

  padding: 20px;

  background: #0c1a29;

  border: 1px solid #172b3e;

  border-top: 3px solid;

  border-radius: 9px;
}

.card span {
  font-size: 11px;

  font-weight: 700;
}

.card strong {
  font:
    700 29px 'JetBrains Mono',
    monospace;
}

.card small {
  font-size: 11px;

  color: #8296aa;
}

.blue {
  border-top-color: #60a5fa;
}

.yellow {
  border-top-color: #fbbf24;
}

.green {
  border-top-color: #34d399;
}

.purple {
  border-top-color: #a78bfa;
}

/* =====================================

   CONFIGURACIÓN

===================================== */

.settings-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  padding: 15px 20px;

  margin-bottom: 20px;

  background: #0c1a29;

  border: 1px solid #172b3e;

  border-radius: 9px;
}

.settings-row strong {
  font-size: 13px;
}

.settings-row p {
  font-size: 11px;

  color: #8296aa;

  margin: 5px 0 0;
}

.settings-row select {
  background: #10283b;

  color: #dce7f1;

  border: 1px solid #27506a;

  border-radius: 6px;

  padding: 9px;

  max-width: 100%;
}

/* =====================================

   PANELES

===================================== */

.panel {
  background: #0c1a29;

  border: 1px solid #172b3e;

  border-radius: 9px;

  overflow: hidden;

  margin-bottom: 20px;
}

.panel-header {
  min-height: 65px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 12px;

  padding: 15px 20px;

  border-bottom: 1px solid #172b3e;
}

.panel-header h2 {
  margin: 0;

  font-size: 17px;
}

.panel-header p {
  margin: 5px 0 0;

  font-size: 11px;

  color: #8296aa;
}

.count {
  font-size: 11px;

  color: #54ced7;

  white-space: nowrap;
}

/* =====================================

   TABLAS

===================================== */

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;

  border-collapse: collapse;

  text-align: left;

  font-size: 12px;
}

th {
  color: #8296aa;

  font-size: 10px;

  letter-spacing: 0.04em;

  font-weight: 700;
}

th,
td {
  padding: 13px 15px;

  border-bottom: 1px solid #172b3e;

  white-space: nowrap;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.callsign {
  color: #54ced7;

  font-weight: 700;
}

.time-chip {
  color: #fbbf24;

  font-weight: 700;
}

.route-cell {
  max-width: 340px;

  overflow: hidden;

  text-overflow: ellipsis;
}

/* =====================================

   ACCIONES

===================================== */

.actions {
  display: flex;

  gap: 6px;
}

.actions button {
  background: #123847;

  color: #54ced7;

  border: 1px solid #24506a;

  border-radius: 5px;

  padding: 6px 9px;

  cursor: pointer;

  font-size: 10px;
}

.actions .dep-button {
  background: #14553e;

  color: #8ff0bd;
}

.actions button:disabled {
  opacity: 0.4;

  cursor: not-allowed;
}

.empty {
  padding: 22px;

  color: #8296aa;

  text-align: center;

  font-size: 12px;

  white-space: normal;
}

/* =====================================

   PANELES INFERIORES

===================================== */

.bottom-grid {
  display: grid;

  grid-template-columns: 1.4fr 1fr;

  gap: 20px;
}

.bottom-grid .panel {
  margin-bottom: 0;
}

.offline {
  font-size: 10px;

  color: #fbbf24;

  white-space: nowrap;
}

.event {
  display: grid;

  grid-template-columns: 45px 1fr auto;

  align-items: center;

  gap: 12px;

  padding: 14px 20px;

  border-bottom: 1px solid #172b3e;
}

.event-type {
  background: #123847;

  color: #54ced7;

  border-radius: 5px;

  padding: 8px;

  text-align: center;

  font-size: 10px;
}

.event strong {
  font-size: 11px;
}

.event p {
  margin: 3px 0 0;

  color: #8296aa;

  font-size: 10px;
}

.event small {
  color: #8296aa;
}

.service {
  display: flex;

  justify-content: space-between;

  gap: 10px;

  padding: 14px 20px;

  border-bottom: 1px solid #172b3e;

  font-size: 11px;
}

.service span {
  color: #8296aa;
}

/* =====================================

   VENTANA CHG

===================================== */

.chg-overlay {
  position: fixed;

  inset: 0;

  z-index: 9999;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20px;

  background: rgba(0, 8, 20, 0.82);
}

.chg-modal {
  width: min(100%, 580px);

  max-height: 90vh;

  overflow-y: auto;

  background: #0c1a29;

  border: 1px solid #27506a;

  border-radius: 12px;

  color: #dce7f1;

  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
}

.chg-header {
  display: flex;

  align-items: flex-start;

  justify-content: space-between;

  gap: 15px;

  padding: 22px 25px;

  border-bottom: 1px solid #172b3e;
}

.chg-header h2 {
  margin: 0;

  font-size: 18px;

  color: #54ced7;
}

.chg-header p {
  margin: 6px 0 0;

  color: #8296aa;

  font-size: 12px;
}

.chg-header button {
  border: none;

  background: transparent;

  color: #dce7f1;

  font-size: 20px;

  cursor: pointer;
}

.chg-body {
  padding: 25px;
}

.chg-flight-info {
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 12px;

  padding: 15px;

  margin-bottom: 22px;

  border: 1px solid #24506a;

  border-radius: 8px;

  background: #10283b;
}

.chg-flight-info span {
  color: #8296aa;

  font-size: 10px;
}

.chg-flight-info strong {
  color: #54ced7;

  font-size: 17px;
}

.chg-flight-info small {
  color: #dce7f1;
}

.chg-fields {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 16px;
}

.chg-body label {
  display: block;

  margin: 0 0 9px;

  font-size: 12px;

  font-weight: 600;

  color: #a9c5da;
}

.chg-body input,
.chg-body textarea {
  width: 100%;

  box-sizing: border-box;

  padding: 12px;

  margin-bottom: 20px;

  background: #071321;

  border: 1px solid #31516c;

  border-radius: 6px;

  color: #ffffff;

  font-family: inherit;

  font-size: 14px;
}

.chg-body input:focus,
.chg-body textarea:focus {
  outline: none;

  border-color: #54ced7;
}

.chg-note {
  margin: 0;

  color: #8296aa;

  font-size: 12px;

  line-height: 1.6;
}

.chg-footer {
  display: flex;

  justify-content: flex-end;

  gap: 12px;

  padding: 18px 25px;

  border-top: 1px solid #172b3e;
}

.chg-footer button {
  padding: 11px 18px;

  border: none;

  border-radius: 6px;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;
}

.chg-cancel {
  background: #253a4e;

  color: #ffffff;
}

.chg-save {
  background: #07818b;

  color: #ffffff;
}

.chg-save:hover {
  background: #0797a3;
}

.chg-footer button:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}

/* =====================================

   RESPONSIVE

===================================== */

@media (max-width: 1100px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .dashboard {
    padding: 18px;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .title-row,
  .settings-row {
    align-items: flex-start;

    flex-direction: column;
  }

  .panel-header {
    align-items: flex-start;

    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .chg-fields {
    grid-template-columns: 1fr;

    gap: 0;
  }

  .chg-header,
  .chg-body,
  .chg-footer {
    padding: 18px;
  }
}

/* =====================================

   EOBT EN FORMATO UTC 24 HORAS

===================================== */

.utc-input {
  position: relative;

  width: 100%;
}

.utc-input input {
  width: 100%;

  padding-right: 65px;

  font-family: 'JetBrains Mono', monospace;

  font-size: 15px;

  font-weight: 600;

  letter-spacing: 1px;
}

.utc-label {
  position: absolute;

  top: 12px;

  right: 12px;

  color: #54ced7;

  font-size: 12px;

  font-weight: 700;

  pointer-events: none;
}

/* =====================================================

   DISEÑO OPERACIONAL — SOLO PRESENTACIÓN

   \===================================================== */

.dashboard {
  --dashboard-muted: #a0b3c6;

  --dashboard-border: #20374a;

  --dashboard-surface: #0e1c2c;

  padding: clamp(16px, 2vw, 30px);
}

.title-row {
  margin-bottom: 22px;
}

.title h1 {
  font-size: clamp(27px, 2.2vw, 34px);

  letter-spacing: -0.025em;
}

.title p {
  font-size: 13px;

  color: var(--dashboard-muted);

  line-height: 1.5;
}

.new-flight {
  font-size: 12px;

  padding: 13px 19px;

  box-shadow: 0 6px 20px rgba(0, 151, 163, 0.12);
}

.cards {
  gap: 14px;

  margin-bottom: 18px;
}

.card {
  --accent: #808080;

  min-height: 120px;

  padding: 18px 20px;

  gap: 9px;

  background: linear-gradient(145deg, #112336, #0b1929);

  border: 1px solid var(--dashboard-border);

  border-top: 3px solid var(--accent);

  border-radius: 10px;

  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.09);
}

.card span {
  color: var(--accent);

  font-size: 12px;

  letter-spacing: 0.04em;
}

.card strong {
  color: #f2f7ff;

  font-size: 33px;

  line-height: 1.15;
}

.card small {
  color: var(--dashboard-muted);

  font-size: 12px;
}

.card-uncoordinated {
  --accent: #a1a1aa;
}

.card-preactive {
  --accent: #fb923c;
}

.card-departure {
  --accent: #4ade80;
}

.card-arrive {
  --accent: #facc15;
}

.settings-row {
  border-color: var(--dashboard-border);

  padding: 17px 20px;
}

.settings-row strong {
  font-size: 13px;
}

.settings-row p {
  font-size: 12px;

  color: var(--dashboard-muted);
}

.settings-row select {
  min-width: 175px;

  font-size: 12px;
}

.panel {
  border-color: var(--dashboard-border);

  border-radius: 10px;

  background: var(--dashboard-surface);
}

.panel-header {
  --section-accent: #4bafcb;

  min-height: 70px;

  padding: 16px 20px;

  background: linear-gradient(90deg, rgba(19, 46, 64, 0.9), rgba(13, 30, 46, 0.95));

  border-bottom: 1px solid var(--dashboard-border);

  border-left: 4px solid var(--section-accent);
}

.panel-header h2 {
  color: #e8f2fc;

  font-size: 18px;

  letter-spacing: 0.015em;
}

.panel-header p {
  color: var(--dashboard-muted);

  font-size: 12px;

  line-height: 1.5;
}

.panel-header .count {
  color: #d9e7f5;

  background: rgba(255, 255, 255, 0.065);

  border: 1px solid rgba(255, 255, 255, 0.11);

  padding: 7px 11px;

  border-radius: 999px;

  font-size: 11px;

  font-weight: 700;
}

.panel-header.header-uncoordinated {
  --section-accent: #a1a1aa;

  background: linear-gradient(90deg, #29323e, #182535);
}

.panel-header.header-preactive {
  --section-accent: #f97316;

  background: linear-gradient(90deg, #3b291e, #1b2633);
}

.panel-header.header-departure {
  --section-accent: #22c55e;

  background: linear-gradient(90deg, #193b2e, #172a32);
}

.panel-header.header-arrive {
  --section-accent: #facc15;

  background: linear-gradient(90deg, #3a351b, #1b2932);
}

.table-scroll {
  scrollbar-color: #36516b #0c1a29;
}

table {
  font-size: 12px;
}

th {
  color: #a9bed0;

  font-size: 11px;

  letter-spacing: 0.045em;

  background: #0c1928;
}

th,
td {
  padding: 15px 14px;

  border-bottom-color: #203247;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: rgba(69, 143, 177, 0.08);
}

.callsign {
  color: #6fe0e6;
}

.time-chip {
  display: inline-block;

  padding: 5px 9px;

  border-radius: 6px;

  background: rgba(251, 191, 36, 0.08);
}

.empty {
  color: #a3b5c8;

  font-size: 13px;

  padding: 23px;
}

.actions button {
  font-size: 11px;

  padding: 7px 10px;
}

.bottom-grid {
  gap: 16px;
}

.service {
  font-size: 12px;
}

.event p {
  font-size: 11px;
}

@media (max-width: 700px) {
  .panel-header {
    padding: 15px;

    align-items: flex-start;
  }

  .panel-header h2 {
    font-size: 16px;
  }

  .panel-header .count {
    font-size: 10px;
  }

  .card {
    min-height: 110px;
  }

  .settings-row select {
    width: 100%;
  }
}

/* ARRIVE - CLASIFICACIÓN DE LLEGADAS */
.arrive-panel {
  width: 100%;
}
.arrival-blocks {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}
.arrival-block {
  padding: 18px;
  border-radius: 10px;
  border: 1px solid;
  min-width: 0;
}
.arrival-block-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.arrival-block-count {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 10px 0 5px;
}
.arrival-block-description {
  font-size: 12px;
}
.arrival-critical {
  background: #351b25;
  border-color: #a93d50;
}
.arrival-critical .arrival-block-title,
.arrival-critical .arrival-block-description {
  color: #ff8796;
}
.arrival-warning {
  background: #382d19;
  border-color: #a9822e;
}
.arrival-warning .arrival-block-title,
.arrival-warning .arrival-block-description {
  color: #ffce68;
}
.arrival-normal {
  background: #17362f;
  border-color: #287f61;
}
.arrival-normal .arrival-block-title,
.arrival-normal .arrival-block-description {
  color: #70d7a8;
}
.arrival-alert {
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #411d28;
  border: 1px solid #b5485e;
  border-radius: 8px;
  color: #ff9eaa;
  font-size: 13px;
  font-weight: 700;
}
.arrival-overdue-note {
  padding: 10px 16px;
  margin-bottom: 16px;
  border: 1px solid #a9822e;
  border-radius: 8px;
  color: #ffce68;
  font-size: 12px;
}
.arrival-table {
  width: 100%;
  border-collapse: collapse;
}
.arrival-table th,
.arrival-table td {
  padding: 12px 14px;
  text-align: left;
}
.arrival-table th {
  white-space: nowrap;
}
.arrival-row-critical {
  background: rgba(209, 67, 72, 0.08);
}
.arrival-time-critical,
.arrival-time-overdue {
  color: #ff6677;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.arrival-time-warning {
  color: #ffca64;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.arrival-time-normal {
  color: #65dba3;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.arrival-status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.status-critical,
.status-overdue {
  background: #55212e;
  color: #ff8a9a;
}
.status-warning {
  background: #4b391b;
  color: #ffd174;
}
.status-normal {
  background: #1b4939;
  color: #83e2b5;
}
.status-arrived {
  background: #18394c;
  color: #8cd8ff;
}
.status-withoutEta {
  background: #273849;
  color: #c4d2df;
}
@media (max-width: 900px) {
  .arrival-blocks {
    grid-template-columns: 1fr;
  }
  .arrival-block-count {
    font-size: 26px;
  }
}

/* =====================================
   IDENTIFICACIÓN DE VUELOS SIMULADOS
===================================== */

.simulated-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 7px;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 5px;
  color: #00e5ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.departed-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 4px 7px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 5px;
  color: #4ade80;
  font-size: 10px;
  font-weight: 700;
}

:deep(.atcfpl-flight-tooltip) {
  background: rgba(5, 24, 43, 0.95);
  border: 1px solid #00d4ff;
  border-radius: 7px;
  color: #ffffff;
  padding: 0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

:deep(.atcfpl-flight-tooltip::before) {
  border-top-color: #00d4ff;
}

.flight-label {
  padding: 8px 12px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
}

.flight-label-title {
  color: #00d4ff;
  font-size: 15px;
  font-weight: 700;
}

.flight-label-time {
  color: #ffcc33;
  font-weight: 700;
}
</style>
