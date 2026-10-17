<template>
  <div class="airports-page">
    <!-- =====================================
         ENCABEZADO
    ====================================== -->

    <div class="page-header">
      <div>
        <h1>Aeropuertos</h1>
        <p>Procedimientos SID / STAR</p>
      </div>

      <!-- SELECTOR SOLO ROOT / ADMIN -->

      <div v-if="canViewAllAirports" class="admin-airport-selector">
        <label>AEROPUERTO</label>

        <select v-model="selectedAirport" @change="changeAirport">
          <option v-for="airport in airports" :key="airport.airport_id" :value="airport.airport_id">
            {{ airport.airport_id }}
            {{ airport.name || airport.airport_name || airport.city || '' }}
          </option>
        </select>
      </div>

      <div class="airport-badge">
        <span>
          {{ canViewAllAirports ? sessionUser.role : userAirport || '---' }}
        </span>

        <strong>{{ airportId || '---' }}</strong>
      </div>
    </div>

    <!-- =====================================
         WORKSPACE
    ====================================== -->

    <div class="workspace">
      <!-- =====================================
           PANEL IZQUIERDO
      ====================================== -->

      <aside class="procedure-panel">
        <div class="airport-info">
          <span class="airport-label"> AEROPUERTO </span>

          <h2>
            {{ airportId || '---' }}
          </h2>

          <p>
            {{ canViewAllAirports ? selectedAirportName : userAirport || 'Aeropuerto' }}
          </p>
        </div>

        <!-- =====================================
             PISTAS
        ====================================== -->

        <div class="runways">
          <span>PISTAS</span>

          <div class="runway-buttons">
            <button
              v-for="runway in airportData?.runways || []"
              :key="runway.runway"
              :class="{
                active: selectedRunway === String(runway.runway),
              }"
              @click="selectRunway(runway.runway)"
            >
              RWY {{ runway.runway }}
            </button>
          </div>
        </div>

        <!-- =====================================
             SID / STAR
        ====================================== -->

        <div class="procedure-tabs">
          <button
            :class="{
              active: selectedProcedureType === 'SID',
            }"
            @click="changeProcedureType('SID')"
          >
            SID ({{ airportData?.counts?.sids || 0 }})
          </button>

          <button
            :class="{
              active: selectedProcedureType === 'STAR',
            }"
            :disabled="stars.length === 0"
            @click="changeProcedureType('STAR')"
          >
            STAR ({{ airportData?.counts?.stars || 0 }})
          </button>
        </div>

        <!-- =====================================
             PROCEDIMIENTOS
        ====================================== -->

        <div class="procedures">
          <span class="section-title">
            {{ selectedProcedureType }}
            · RWY {{ selectedRunway || '---' }}
          </span>

          <button
            v-for="procedure in filteredProcedures"
            :key="procedure.procedure_name"
            class="procedure-item"
            :class="{
              active: selectedProcedure === procedure.procedure_name,
            }"
            @click="loadProcedure(procedure)"
          >
            <div>
              <strong>
                {{ procedure.procedure_name }}
              </strong>

              <span>
                RWY {{ procedure.runway }}
                ·
                {{ procedure.points?.length || 0 }}
                puntos
              </span>
            </div>

            <span class="arrow"> › </span>
          </button>

          <div v-if="filteredProcedures.length === 0" class="empty-procedures">
            No existen
            {{ selectedProcedureType }}
            para RWY
            {{ selectedRunway || '---' }}
          </div>
        </div>
      </aside>

      <!-- =====================================
           MAPA
      ====================================== -->

      <section class="map-section">
        <div v-if="selectedProcedure" class="procedure-header">
          <div>
            <span class="procedure-type">
              {{ selectedProcedureType }}
            </span>

            <strong>
              {{ selectedProcedure }}
            </strong>

            <span> RWY {{ procedureRunway }} </span>
          </div>

          <div class="procedure-stats">
            <span> {{ procedurePoints }} puntos </span>

            <span>
              CAT
              {{ performanceCategories.join(' / ') }}
            </span>
          </div>
        </div>

        <div ref="mapElement" class="map"></div>

        <div v-if="loading" class="map-message">Cargando procedimientos...</div>

        <div v-if="error" class="map-error">
          {{ error }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

import { API_URL } from '../config'

// ======================================================
// VARIABLES
// ======================================================

const mapElement = ref(null)

const airportData = ref(null)

const airports = ref([])

const sids = ref([])

const stars = ref([])

const selectedAirport = ref('')

const selectedRunway = ref('')

const selectedProcedureType = ref('SID')

const selectedProcedure = ref('')

const procedureRunway = ref('')

const procedurePoints = ref(0)

const performanceCategories = ref([])

const loading = ref(false)

const error = ref('')

let map = null

let procedureLayer = null

// ======================================================
// MAPA USUARIO LOCAL -> ICAO
// ======================================================

const AIRPORT_MAP = {
  MZT: 'MMMZ',

  CUL: 'MMCL',

  SJD: 'MMSD',

  TIJ: 'MMTJ',

  HMO: 'MMHO',

  LAP: 'MMLP',

  CEN: 'MMCN',

  MXL: 'MMML',

  CSL: 'MMSL',

  DGO: 'MMDO',

  LMM: 'MMLM',

  GYM: 'MMGM',

  LTO: 'MMLT',

  PPE: 'MMPE',
}

// ======================================================
// SESIÓN
// ======================================================

const sessionUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('atcfpl_user') || '{}')
  } catch {
    return {}
  }
})

// ======================================================
// TOKEN
// ======================================================

const token = computed(() => {
  return localStorage.getItem('atcfpl_token') || localStorage.getItem('token') || ''
})

// ======================================================
// AEROPUERTO DEL USUARIO
// ======================================================

const userAirport = computed(() =>
  String(sessionUser.value.airport || sessionUser.value.username || '')
    .trim()
    .toUpperCase(),
)

// ======================================================
// ROLES
// ======================================================

const userRole = computed(() =>
  String(sessionUser.value.role || '')
    .trim()
    .toUpperCase(),
)

const isRoot = computed(() => {
  return userRole.value === 'ROOT'
})

const isAdmin = computed(() => {
  return userRole.value === 'ADMIN'
})

// ROOT y ADMIN pueden utilizar el selector.
// ROOT tendrá acceso a todos los aeropuertos.
const canViewAllAirports = computed(() => {
  return isRoot.value || isAdmin.value
})

// ======================================================
// AEROPUERTO ACTUAL
// ======================================================

const airportId = computed(() => {
  if (canViewAllAirports.value) {
    return selectedAirport.value
  }

  return AIRPORT_MAP[userAirport.value] || userAirport.value
})

// ======================================================
// NOMBRE AEROPUERTO SELECCIONADO
// ======================================================

const selectedAirportName = computed(() => {
  const airport = airports.value.find((item) => item.airport_id === selectedAirport.value)

  if (!airport) {
    return 'Aeropuerto'
  }

  return airport.name || airport.airport_name || airport.city || 'Aeropuerto'
})

// ======================================================
// PROCEDIMIENTOS FILTRADOS
// ======================================================

const filteredProcedures = computed(() => {
  const source = selectedProcedureType.value === 'STAR' ? stars.value : sids.value

  return source.filter((procedure) => String(procedure.runway) === String(selectedRunway.value))
})

// ======================================================
// INICIALIZAR MAPA
// ======================================================

const initializeMap = () => {
  if (!mapElement.value) return

  map = L.map(mapElement.value, {
    zoomControl: true,

    preferCanvas: true,
  })

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

    {
      maxZoom: 19,

      attribution: '&copy; OpenStreetMap',
    },
  ).addTo(map)

  map.setView(
    [23.25, -106.3],

    9,
  )

  procedureLayer = L.layerGroup().addTo(map)
}

// ======================================================
// LIMPIAR PROCEDIMIENTO
// ======================================================

const clearProcedure = () => {
  if (procedureLayer) {
    procedureLayer.clearLayers()
  }

  selectedProcedure.value = ''

  procedureRunway.value = ''

  procedurePoints.value = 0

  performanceCategories.value = []
}

// ======================================================
// CARGAR LISTA DE AEROPUERTOS
// ROOT / ADMIN
// ======================================================

const loadAirports = async () => {
  try {
    const response = await fetch(`${API_URL}/airports`, {
      headers: token.value
        ? {
            Authorization: `Bearer ${token.value}`,
          }
        : {},
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'No fue posible cargar los aeropuertos')
    }

    airports.value = Array.isArray(data) ? data : []

    if (airports.value.length > 0 && !selectedAirport.value) {
      // =====================================
      // ROOT
      // Puede consultar cualquier aeropuerto
      // =====================================

      if (isRoot.value) {
        selectedAirport.value = airports.value[0].airport_id

        return
      }

      // =====================================
      // ADMIN
      // Seleccionar aeropuerto asignado
      // =====================================

      if (isAdmin.value) {
        const assignedAirport = AIRPORT_MAP[userAirport.value] || userAirport.value

        const exists = airports.value.some((airport) => airport.airport_id === assignedAirport)

        selectedAirport.value = exists ? assignedAirport : airports.value[0].airport_id
      }
    }
  } catch (err) {
    console.error('Error cargando aeropuertos:', err)

    throw err
  }
}

// ======================================================
// CAMBIAR AEROPUERTO
// ======================================================

const changeAirport = async () => {
  loading.value = true

  error.value = ''

  try {
    clearProcedure()

    airportData.value = null

    sids.value = []

    stars.value = []

    selectedRunway.value = ''

    selectedProcedureType.value = 'SID'

    await loadAirportProcedures()
  } catch (err) {
    console.error('Error cambiando aeropuerto:', err)

    error.value = err.message
  } finally {
    loading.value = false
  }
}

// ======================================================
// SELECCIONAR PISTA
// ======================================================

const selectRunway = async (runway) => {
  selectedRunway.value = String(runway)

  clearProcedure()

  await nextTick()

  const first = filteredProcedures.value[0]

  if (first) {
    await loadProcedure(first)
  }
}

// ======================================================
// CAMBIAR SID / STAR
// ======================================================

const changeProcedureType = async (type) => {
  if (type === 'STAR' && stars.value.length === 0) {
    return
  }

  selectedProcedureType.value = type

  clearProcedure()

  await nextTick()

  const first = filteredProcedures.value[0]

  if (first) {
    await loadProcedure(first)
  }
}

// ======================================================
// CARGAR PROCEDIMIENTOS DEL AEROPUERTO
// ======================================================

const loadAirportProcedures = async () => {
  if (!airportId.value) {
    throw new Error('No existe aeropuerto seleccionado')
  }

  const response = await fetch(
    `${API_URL}/airports/${encodeURIComponent(airportId.value)}/procedures`,
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `No fue posible cargar el aeropuerto ${airportId.value}`)
  }

  airportData.value = data

  sids.value = Array.isArray(data.sids) ? data.sids : []

  stars.value = Array.isArray(data.stars) ? data.stars : []

  // =====================================
  // PISTAS DESDE MongoDB
  // =====================================

  const defaultRunway = data.runways?.find((runway) => runway.default)

  const firstRunway = defaultRunway || data.runways?.[0]

  selectedRunway.value = firstRunway?.runway ? String(firstRunway.runway) : ''

  selectedProcedureType.value = 'SID'

  clearProcedure()

  await nextTick()

  const firstSid = filteredProcedures.value[0]

  if (firstSid) {
    await loadProcedure(firstSid)
  }
}

// ======================================================
// CARGAR SID / STAR
// ======================================================

const loadProcedure = async (procedure) => {
  const type = selectedProcedureType.value.toLowerCase()

  const collectionPath = type === 'star' ? 'stars' : 'sids'

  loading.value = true

  error.value = ''

  if (procedureLayer) {
    procedureLayer.clearLayers()
  }

  try {
    const response = await fetch(
      `${API_URL}/${collectionPath}/${encodeURIComponent(procedure.procedure_name)}/map`,
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `No fue posible cargar ${procedure.procedure_name}`)
    }

    selectedProcedure.value = data.procedure_name

    procedureRunway.value = data.runway

    performanceCategories.value = data.performance_categories || []

    const points = Array.isArray(data.points)
      ? data.points.filter(
          (point) =>
            point.found && Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
        )
      : []

    procedurePoints.value = points.length

    drawProcedure(
      data.procedure_name,

      points,
    )
  } catch (err) {
    console.error(
      'Error cargando procedimiento:',

      err,
    )

    error.value = err.message
  } finally {
    loading.value = false
  }
}

// ======================================================
// DIBUJAR PROCEDIMIENTO
// ======================================================

const drawProcedure = (
  procedureName,

  points,
) => {
  if (!map || !procedureLayer || points.length === 0) {
    return
  }

  const coordinates = []

  points.forEach((point, index) => {
    const latitude = point.latitude

    const longitude = point.longitude

    coordinates.push([latitude, longitude])

    const marker = L.circleMarker(
      [latitude, longitude],

      {
        radius: index === 0 || index === points.length - 1 ? 7 : 5,

        weight: 2,

        fillOpacity: 1,
      },
    )

    marker.bindTooltip(
      point.point_id,

      {
        permanent: true,

        direction: 'top',

        offset: [0, -7],

        className: 'sid-tooltip',
      },
    )

    marker.bindPopup(`

        <div class="sid-popup">

          <strong>
            ${point.point_id}
          </strong>

          <br>

          Secuencia:
          ${point.sequence}

          <br>

          Tipo:
          ${point.point_type || '-'}

          <br><br>

          Lat:
          ${latitude.toFixed(6)}

          <br>

          Lon:
          ${longitude.toFixed(6)}

        </div>

      `)

    marker.addTo(procedureLayer)
  })

  if (coordinates.length > 1) {
    L.polyline(
      coordinates,

      {
        weight: 4,

        opacity: 0.9,
      },
    ).addTo(procedureLayer)
  }

  map.fitBounds(
    L.latLngBounds(coordinates),

    {
      padding: [50, 50],
    },
  )

  console.log(
    `${selectedProcedureType.value} ${procedureName} dibujada`,

    points,
  )
}

// ======================================================
// MOUNT
// ======================================================

onMounted(async () => {
  await nextTick()

  initializeMap()

  try {
    loading.value = true

    error.value = ''

    // ROOT / ADMIN

    if (canViewAllAirports.value) {
      await loadAirports()

      if (selectedAirport.value) {
        await loadAirportProcedures()
      }
    }

    // USER NORMAL
    else {
      await loadAirportProcedures()
    }
  } catch (err) {
    console.error(
      'Error cargando aeropuerto:',

      err,
    )

    error.value = err.message
  } finally {
    loading.value = false
  }
})

// ======================================================
// UNMOUNT
// ======================================================

onUnmounted(() => {
  if (map) {
    map.remove()

    map = null
  }
})
</script>

<style scoped>
/* =====================================
   PÁGINA
===================================== */

.airports-page {
  min-height: 100%;

  padding: 25px;

  box-sizing: border-box;

  background: #07111b;

  color: white;
}

/* =====================================
   ENCABEZADO
===================================== */

.page-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;

  color: #00e5ff;

  font-size: 27px;
}

.page-header p {
  margin: 5px 0 0;

  color: #71869b;

  font-size: 13px;
}

/* =====================================
   SELECTOR ADMIN / ROOT
===================================== */

.admin-airport-selector {
  display: flex;

  flex-direction: column;

  gap: 5px;

  min-width: 220px;
}

.admin-airport-selector label {
  color: #61778c;

  font-size: 9px;

  letter-spacing: 1.5px;
}

.admin-airport-selector select {
  width: 100%;

  padding: 9px 12px;

  border: 1px solid #29445c;

  border-radius: 6px;

  outline: none;

  background: #0c1b29;

  color: #ffffff;

  font-size: 12px;

  cursor: pointer;
}

.admin-airport-selector select:hover {
  border-color: #00b7ca;
}

.admin-airport-selector select:focus {
  border-color: #00e5ff;
}

/* =====================================
   BADGE
===================================== */

.airport-badge {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 8px 14px;

  background: #0d1d2c;

  border: 1px solid #1e3b50;

  border-radius: 7px;
}

.airport-badge span {
  color: #5bd6dd;

  font-weight: 700;
}

.airport-badge strong {
  color: #ffffff;

  font-size: 12px;
}

/* =====================================
   WORKSPACE
===================================== */

.workspace {
  height: calc(100vh - 180px);

  min-height: 600px;

  display: grid;

  grid-template-columns: 280px 1fr;

  overflow: hidden;

  border: 1px solid #17283a;

  border-radius: 10px;

  background: #091522;
}

/* =====================================
   PANEL IZQUIERDO
===================================== */

.procedure-panel {
  padding: 20px;

  overflow-y: auto;

  border-right: 1px solid #17283a;

  background: #091522;
}

.airport-label,
.section-title {
  color: #61778c;

  font-size: 9px;

  letter-spacing: 1.5px;
}

.airport-info h2 {
  margin: 6px 0 0;

  color: #00e5ff;

  font-size: 25px;
}

.airport-info p {
  margin: 3px 0 20px;

  color: #91a4b8;

  font-size: 12px;
}

/* =====================================
   PISTAS
===================================== */

.runways > span {
  color: #61778c;

  font-size: 9px;

  letter-spacing: 1px;
}

.runway-buttons {
  display: flex;

  gap: 7px;

  margin-top: 8px;

  flex-wrap: wrap;
}

.runway-buttons button {
  flex: 1;

  min-width: 65px;

  padding: 8px;

  border: 1px solid #29445c;

  border-radius: 5px;

  background: #0c1b29;

  color: #8297aa;

  cursor: pointer;
}

.runway-buttons button.active {
  color: #5bd6dd;

  border-color: #00b7ca;

  background: #10303d;
}

/* =====================================
   SID / STAR
===================================== */

.procedure-tabs {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 6px;

  margin: 20px 0;
}

.procedure-tabs button {
  padding: 9px;

  border: 1px solid #29445c;

  border-radius: 5px;

  background: #0c1b29;

  color: #71869b;

  cursor: pointer;
}

.procedure-tabs button.active {
  color: #00e5ff;

  border-color: #00b7ca;

  background: #10303d;
}

.procedure-tabs button:disabled {
  opacity: 0.35;

  cursor: not-allowed;
}

/* =====================================
   PROCEDIMIENTOS
===================================== */

.procedures {
  margin-top: 20px;
}

.procedure-item {
  width: 100%;

  margin-top: 10px;

  padding: 12px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  border: 1px solid #1d3447;

  border-radius: 7px;

  background: #0c1b29;

  color: white;

  text-align: left;

  cursor: pointer;
}

.procedure-item:hover,
.procedure-item.active {
  border-color: #00b7ca;

  background: #102b38;
}

.procedure-item div {
  display: flex;

  flex-direction: column;

  gap: 4px;
}

.procedure-item strong {
  color: #ffffff;

  font-size: 13px;
}

.procedure-item span {
  color: #71869b;

  font-size: 10px;
}

.procedure-item .arrow {
  color: #00e5ff;

  font-size: 22px;
}

.empty-procedures {
  margin-top: 12px;

  padding: 12px;

  border: 1px dashed #29445c;

  border-radius: 6px;

  color: #71869b;

  font-size: 11px;

  text-align: center;
}

/* =====================================
   MAPA
===================================== */

.map-section {
  position: relative;

  min-width: 0;

  background: #08131e;
}

.map {
  width: 100%;

  height: 100%;

  min-height: 600px;

  z-index: 1;
}

/* =====================================
   INFORMACIÓN SUPERIOR
===================================== */

.procedure-header {
  position: absolute;

  top: 15px;

  left: 50%;

  transform: translateX(-50%);

  z-index: 1000;

  min-width: 390px;

  padding: 10px 16px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;

  background: rgba(7, 20, 31, 0.94);

  border: 1px solid #24465d;

  border-radius: 8px;

  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
}

.procedure-header > div {
  display: flex;

  align-items: center;

  gap: 9px;
}

.procedure-type {
  padding: 3px 7px;

  border-radius: 4px;

  background: #0b7280;

  color: white;

  font-size: 9px;

  font-weight: 700;
}

.procedure-header strong {
  color: #ffffff;

  font-size: 14px;
}

.procedure-header span {
  color: #91a4b8;

  font-size: 10px;
}

.procedure-stats {
  color: #71869b;
}

/* =====================================
   MENSAJES
===================================== */

.map-message,
.map-error {
  position: absolute;

  left: 50%;

  bottom: 25px;

  transform: translateX(-50%);

  z-index: 1100;

  padding: 10px 18px;

  border-radius: 6px;

  background: rgba(7, 20, 31, 0.95);
}

.map-message {
  color: #5bd6dd;
}

.map-error {
  color: #ff9292;
}

/* =====================================
   LEAFLET
===================================== */

.map :deep(.leaflet-tile-pane) {
  filter: brightness(0.72) saturate(0.75);
}

.map :deep(.sid-tooltip) {
  padding: 2px 5px;

  border: 1px solid #27516a;

  border-radius: 3px;

  background: rgba(5, 17, 27, 0.92);

  color: #ffffff;

  box-shadow: none;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;

  font-weight: 600;
}

/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 220px 1fr;
  }
}

@media (max-width: 700px) {
  .page-header {
    align-items: stretch;

    flex-direction: column;
  }

  .admin-airport-selector {
    width: 100%;
  }

  .workspace {
    height: auto;

    grid-template-columns: 1fr;
  }

  .procedure-panel {
    border-right: none;

    border-bottom: 1px solid #17283a;
  }

  .map {
    height: 600px;
  }
}
</style>
