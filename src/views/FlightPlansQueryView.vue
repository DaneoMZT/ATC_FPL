<template>
  <main class="flight-query">
    <header class="page-header">
      <div>
        <h1>Consulta de Planes de Vuelo</h1>
        <p>Consulta de registros almacenados en MongoDB</p>
      </div>
      <button @click="search" :disabled="loading">Actualizar</button>
    </header>

    <section class="filters">
      <div class="filter">
        <label>Tipo de mensaje</label>
        <select v-model="filters.type">
          <option value="">Todos</option>
          <option v-for="type in messageTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      <div class="filter">
        <label>Callsign</label><input v-model="filters.callsign" placeholder="Ej. AMX123" />
      </div>
      <div class="filter">
        <label>Fecha UTC de registro</label><input v-model="filters.date" type="date" />
      </div>
      <div class="filter">
        <label>Departure</label
        ><input v-model="filters.departure" placeholder="Ej. MMMZ" maxlength="4" />
      </div>
      <div class="filter">
        <label>Arrival</label
        ><input v-model="filters.arrival" placeholder="Ej. MMMX" maxlength="4" />
      </div>
      <div class="filter">
        <label>Estado</label>
        <select v-model="filters.status">
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="DEPARTED">Despegado</option>
          <option value="ARRIVED">Arribado</option>
          <option value="PENDIENTE">Pendiente</option>
        </select>
      </div>
      <div class="filter-actions">
        <button @click="search" :disabled="loading">
          {{ loading ? 'Consultando...' : 'Buscar' }}
        </button>
        <button class="secondary" @click="clearFilters">Limpiar</button>
      </div>
    </section>

    <section class="results">
      <div class="results-header">
        <h2>Planes de vuelo registrados</h2>
        <span>{{ total }} registros</span>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>CALLSIGN</th>
              <th>TIPO</th>
              <th>FECHA</th>
              <th>AERONAVE</th>
              <th>DEP</th>
              <th>DEST</th>
              <th>EOBT UTC</th>
              <th>EET</th>
              <th>FL</th>
              <th>RUTA</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="flight in flights" :key="flight._id">
              <td>{{ flight.callsign || '—' }}</td>
              <td>{{ flight.message_type || flight.type || 'FPL' }}</td>
              <td>{{ formatDate(flight.created_at) }}</td>
              <td>{{ flight.aircraft || '—' }}</td>
              <td>{{ flight.departure || '—' }}</td>
              <td>{{ flight.destination || '—' }}</td>
              <td>{{ formatHHMM(flight.eobt) }}</td>
              <td>{{ formatHHMM(flight.icao?.eet ?? flight.eet) }}</td>
              <td>{{ flight.level || '—' }}</td>
              <td class="route" :title="flight.route || ''">{{ flight.route || '—' }}</td>
              <td>{{ flight.status || flight.lifecycle || '—' }}</td>
              <td><button class="detail-btn" @click="selected = flight">Ver</button></td>
            </tr>
            <tr v-if="!loading && flights.length === 0">
              <td colspan="12" class="empty">No se encontraron planes de vuelo.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="secondary" :disabled="page <= 1 || loading" @click="changePage(page - 1)">
          Anterior
        </button>
        <span>Página {{ page }} de {{ totalPages || 1 }}</span>
        <button
          class="secondary"
          :disabled="page >= totalPages || loading"
          @click="changePage(page + 1)"
        >
          Siguiente
        </button>
      </div>
    </section>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <section
        class="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-detail-title"
      >
        <header class="detail-header">
          <div>
            <span class="eyebrow">ATCFPL · Detalle de registro</span>
            <h2 id="flight-detail-title">{{ selected.callsign || 'Sin identificación' }}</h2>
            <span class="status-pill">{{
              selected.status || selected.lifecycle || 'SIN ESTADO'
            }}</span>
          </div>
          <button class="secondary" @click="selected = null">Cerrar</button>
        </header>

        <div class="detail-section">
          <h3>Datos del vuelo</h3>
          <div class="detail-grid">
            <div class="detail-field">
              <span>Tipo de mensaje</span
              ><strong>{{ selected.message_type || selected.type || 'FPL' }}</strong>
            </div>
            <div class="detail-field">
              <span>Identificación (Ítem 7)</span><strong>{{ selected.callsign || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>Reglas / tipo de vuelo (Ítem 8)</span><strong>{{ item8(selected) }}</strong>
            </div>
            <div class="detail-field">
              <span>Aeronave (Ítem 9)</span><strong>{{ selected.aircraft || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>Equipo (Ítem 10)</span><strong>{{ equipment(selected) }}</strong>
            </div>
            <div class="detail-field">
              <span>Salida (Ítem 13)</span><strong>{{ selected.departure || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>EOBT (UTC)</span><strong>{{ formatHHMM(selected.eobt) }}</strong>
            </div>
            <div class="detail-field">
              <span>Destino (Ítem 16)</span><strong>{{ selected.destination || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>EET (Ítem 16)</span
              ><strong>{{ formatHHMM(selected.icao?.eet ?? selected.eet) }}</strong>
            </div>
            <div class="detail-field">
              <span>Nivel de vuelo (Ítem 15)</span><strong>{{ selected.level || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>Velocidad (Ítem 15)</span
              ><strong>{{ selected.speed || selected.icao?.speed || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>Fecha de salida</span><strong>{{ formatDate(selected.eobt_at) }}</strong>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Ruta (Ítem 15)</h3>
          <p class="route-full">{{ selected.route || 'Sin ruta registrada' }}</p>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <h3>Mensaje ATS almacenado</h3>
            <button v-if="storedMessage(selected)" class="secondary small" @click="copyMessage">
              Copiar
            </button>
          </div>
          <pre v-if="storedMessage(selected)" class="ats-message">{{
            storedMessage(selected)
          }}</pre>
          <p v-else class="muted">
            Este registro no contiene un mensaje ATS original almacenado. Los campos anteriores se
            muestran sin reconstruir ni validar un mensaje OACI.
          </p>
        </div>

        <div class="detail-section">
          <h3>Información del registro</h3>
          <div class="detail-grid">
            <div class="detail-field">
              <span>ID MongoDB</span><strong class="break-word">{{ selected._id || '—' }}</strong>
            </div>
            <div class="detail-field">
              <span>Creado (UTC)</span><strong>{{ formatUTC(selected.created_at) }}</strong>
            </div>
            <div class="detail-field">
              <span>Actualizado (UTC)</span><strong>{{ formatUTC(selected.updated_at) }}</strong>
            </div>
          </div>
        </div>
        <details class="raw-details">
          <summary>Ver documento JSON original</summary>
          <pre>{{ JSON.stringify(selected, null, 2) }}</pre>
        </details>
      </section>
    </div>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const messageTypes = [
  'FPL',
  'CPL',
  'ABI',
  'CLN',
  'CHG',
  'DLA',
  'CNL',
  'DEP',
  'ARR',
  'EST',
  'ACT',
  'REV',
]
const filters = reactive({
  type: '',
  callsign: '',
  date: '',
  departure: '',
  arrival: '',
  status: '',
})
const flights = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const selected = ref(null)

function formatHHMM(value) {
  if (value === null || value === undefined || value === '') return '—'
  const text = String(value).trim()
  if (/^\d{4}$/.test(text)) return text
  if (/^\d{2}:\d{2}$/.test(text)) return text.replace(':', '')
  return text
}
function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10)
}
function formatUTC(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}
function item8(flight) {
  const rules = flight.icao?.flight_rules ?? flight.flight_rules
  const type = flight.icao?.flight_type ?? flight.flight_type
  return rules || type ? `${rules || ''}${type || ''}` : '—'
}
function equipment(flight) {
  return flight.icao?.equipment ?? flight.equipment ?? '—'
}
function storedMessage(flight) {
  // Solo mostrar texto efectivamente almacenado; no fabricar un mensaje ICAO.
  const candidates = [
    flight.icao_message,
    flight.ats_message,
    flight.raw_message,
    flight.message,
    flight.icao?.message,
  ]
  return candidates.find((value) => typeof value === 'string' && value.trim()) || ''
}
async function copyMessage() {
  if (!selected.value || !storedMessage(selected.value)) return
  try {
    await navigator.clipboard.writeText(storedMessage(selected.value))
  } catch (err) {
    error.value = 'No fue posible copiar el mensaje.'
  }
}
async function loadFlights() {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('atcfpl_token')
    if (!token) throw new Error('Sesión no encontrada. Inicia sesión nuevamente.')
    const params = new URLSearchParams({ page: String(page.value), limit: '25' })
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value.trim())
    }
    const response = await fetch(`${API_BASE}/flight-plans/search?${params.toString()}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      if (response.status === 401)
        throw new Error('Sesión inválida o expirada. Inicia sesión nuevamente.')
      throw new Error(`Error HTTP ${response.status}`)
    }
    const result = await response.json()
    if (!result.success) throw new Error(result.message || 'Error de consulta')
    flights.value = result.data || []
    total.value = result.total || 0
    totalPages.value = result.totalPages || 1
  } catch (err) {
    error.value = err.message
    flights.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}
function search() {
  page.value = 1
  loadFlights()
}
function changePage(nextPage) {
  page.value = nextPage
  loadFlights()
}
function clearFilters() {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
  search()
}
onMounted(loadFlights)
</script>

<style scoped>
.flight-query {
  padding: 28px;
  min-height: 100%;
  color: #e8f2ff;
}
.page-header,
.results-header,
.pagination,
.detail-header,
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.page-header {
  margin-bottom: 24px;
}
h1 {
  font-size: 28px;
  margin: 0 0 8px;
}
h2 {
  font-size: 18px;
  margin: 0;
}
h3 {
  font-size: 16px;
  margin: 0 0 16px;
  color: #8dcaff;
}
p {
  color: #94a9c5;
}
.filters,
.results {
  background: #101d32;
  border: 1px solid #263b57;
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 24px;
}
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  align-items: end;
}
.filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
label {
  color: #b7c9e2;
  font-size: 13px;
}
input,
select {
  width: 100%;
  box-sizing: border-box;
  background: #0b1728;
  color: #e8f2ff;
  border: 1px solid #35506e;
  border-radius: 8px;
  padding: 11px;
  font-size: 14px;
}
button {
  background: #1686dc;
  border: none;
  color: white;
  padding: 11px 16px;
  border-radius: 8px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.secondary {
  background: #263b57;
}
.small {
  padding: 7px 12px;
  font-size: 12px;
}
.filter-actions {
  display: flex;
  gap: 10px;
}
.results-header {
  margin-bottom: 18px;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  background: #172942;
  color: #8dcaff;
  text-align: left;
  padding: 14px 12px;
  white-space: nowrap;
}
td {
  padding: 13px 12px;
  border-bottom: 1px solid #263b57;
  white-space: nowrap;
}
tbody tr:hover {
  background: #172942;
}
.route {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-btn {
  padding: 7px 12px;
}
.empty {
  text-align: center;
  padding: 30px;
}
.pagination {
  margin-top: 20px;
}
.error {
  color: #ff8080;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #000b;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
.detail-modal {
  background: #101d32;
  border: 1px solid #35506e;
  border-radius: 14px;
  padding: 24px;
  width: min(900px, 100%);
  max-height: 85vh;
  overflow: auto;
  box-sizing: border-box;
}
.detail-header {
  padding-bottom: 18px;
  border-bottom: 1px solid #263b57;
  margin-bottom: 20px;
}
.detail-header h2 {
  font-size: 26px;
  margin: 6px 0;
}
.eyebrow {
  color: #8dcaff;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.status-pill {
  display: inline-block;
  background: #263b57;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
}
.detail-section {
  margin-bottom: 22px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.detail-field {
  background: #0b1728;
  border: 1px solid #263b57;
  border-radius: 9px;
  padding: 12px;
  min-width: 0;
}
.detail-field span {
  display: block;
  font-size: 12px;
  color: #94a9c5;
  margin-bottom: 6px;
}
.detail-field strong {
  font-size: 14px;
  color: #e8f2ff;
  font-weight: 600;
}
.route-full,
.ats-message {
  background: #0b1728;
  border: 1px solid #263b57;
  border-radius: 9px;
  padding: 16px;
  color: #e8f2ff;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  line-height: 1.65;
}
.ats-message {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.muted {
  font-size: 13px;
}
.break-word {
  overflow-wrap: anywhere;
}
.raw-details {
  border-top: 1px solid #263b57;
  padding-top: 15px;
}
.raw-details summary {
  cursor: pointer;
  color: #8dcaff;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.6;
}
@media (max-width: 600px) {
  .flight-query {
    padding: 14px;
  }
  .detail-modal {
    padding: 16px;
  }
  .detail-header {
    align-items: flex-start;
  }
}
</style>
