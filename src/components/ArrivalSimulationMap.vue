<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { API_URL } from '../config'

const props = defineProps({
  flights: { type: Array, default: () => [] },
  airport: { type: String, default: 'MMMZ' },
  now: { type: Number, default: () => Date.now() },
})
watch(
  () => props.flights,
  (flights) => {
    console.log('ATCFPL - Vuelos recibidos por el mapa:', flights)
    console.log('ATCFPL - Cantidad:', flights.length)
  },
  { immediate: true, deep: true },
)
const airportPosition = ref(null)
const airportLoading = ref(false)
const airportError = ref('')

let airportRequestId = 0

async function loadAirportPosition() {
  const requestId = ++airportRequestId

  const icao = String(props.airport || '')
    .trim()
    .toUpperCase()

  airportPosition.value = null
  airportError.value = ''

  if (!/^[A-Z]{4}$/.test(icao)) {
    airportLoading.value = false
    airportError.value = 'Selecciona un aeropuerto válido'
    return
  }

  airportLoading.value = true

  try {
    const token = localStorage.getItem('atcfpl_token')

    if (!token) {
      throw new Error('No existe una sesión activa')
    }

    const response = await fetch(`${API_URL}/airports/${encodeURIComponent(icao)}/position`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    const latitude = Number(data.latitude)
    const longitude = Number(data.longitude)

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      throw new Error('Coordenadas del aeropuerto inválidas')
    }

    if (requestId !== airportRequestId || destroyed) return

    airportPosition.value = [latitude, longitude]
  } catch (error) {
    if (requestId !== airportRequestId || destroyed) return

    airportError.value = error.message
    console.error('Error consultando aeropuerto:', error)
  } finally {
    if (requestId === airportRequestId && !destroyed) {
      airportLoading.value = false
    }
  }
}
const mapElement = ref(null)
const pathErrors = ref({})
let map = null
let flightLayer = null
let airportLayer = null
let destroyed = false
let hasFittedTraffic = false
const flightMarkers = new Map()
const flightPaths = new Map()
const loadingPaths = new Set()
const selectedFlightId = ref(null)

function etaMs(flight) {
  const value = new Date(flight.eta_at || flight.eta || '').getTime()
  return Number.isFinite(value) ? value : null
}

const activeFlights = computed(() =>
  props.flights.filter((flight) => {
    const state = String(flight.lifecycle || flight.status || '').toUpperCase()
    if (['ARRIVED', 'CANCELLED', 'CNL'].includes(state) || flight.arrived_at) return false
    const eta = etaMs(flight)
    return eta !== null && eta >= props.now && Boolean(flight.departed_at)
  }),
)

const upcoming = computed(() =>
  activeFlights.value.filter((flight) => etaMs(flight) - props.now <= 30 * 60000),
)

function flightId(flight) {
  return String(flight._id || flight.id || '')
}

function callsignOf(flight) {
  return String(flight.callsign || 'SIN ID')
    .trim()
    .toUpperCase()
    .replace(/[&<>"']/g, '')
}

function flightProgress(flight) {
  const departure = new Date(flight.departed_at || '').getTime()
  const arrival = etaMs(flight)
  if (!Number.isFinite(departure) || arrival === null || arrival <= departure) return null
  return Math.max(0, Math.min(1, (props.now - departure) / (arrival - departure)))
}

function positionAlongPath(coordinates, progress) {
  if (coordinates.length < 2) return null
  const lengths = []
  let total = 0
  for (let i = 1; i < coordinates.length; i++) {
    const length = L.latLng(coordinates[i - 1]).distanceTo(L.latLng(coordinates[i]))
    lengths.push(length)
    total += length
  }
  if (total <= 0) return null
  let remaining = progress * total
  for (let i = 0; i < lengths.length; i++) {
    const length = lengths[i]
    if (remaining <= length || i === lengths.length - 1) {
      const fraction = length ? Math.max(0, Math.min(1, remaining / length)) : 0
      const start = coordinates[i]
      const end = coordinates[i + 1]
      return {
        position: [
          start[0] + (end[0] - start[0]) * fraction,
          start[1] + (end[1] - start[1]) * fraction,
        ],
        start,
        end,
      }
    }
    remaining -= length
  }
  return null
}

function segmentBearing(start, end) {
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const a = toRad(start[0])
  const b = toRad(end[0])
  const delta = toRad(end[1] - start[1])
  const y = Math.sin(delta) * Math.cos(b)
  const x = Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(delta)
  return Math.atan2(y, x)
}

function createAircraftIcon(color, bearing) {
  const rotation = (bearing * 180) / Math.PI + 135
  return L.divIcon({
    className: 'sim-aircraft-marker',
    html: `<div style="color:${color};font-size:25px;line-height:28px;text-align:center;text-shadow:0 1px 6px #00101e;transform:rotate(${rotation}deg)">✈</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

async function loadFlightPath(flight) {
  const id = flightId(flight)
  if (
    !/^[a-f\d]{24}$/i.test(id) ||
    flightPaths.has(id) ||
    loadingPaths.has(id) ||
    pathErrors.value[id]
  )
    return
  loadingPaths.add(id)
  try {
    const token = localStorage.getItem('atcfpl_token')
    if (!token) throw new Error('Inicia sesión para consultar las trayectorias')
    const response = await fetch(`${API_URL}/flight-path/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
    if (data.status !== 'VALID')
      throw new Error((data.errors || []).join('; ') || 'Ruta FPL inválida')
    const coordinates = (data.trajectory || []).map((point) => [
      Number(point.latitude),
      Number(point.longitude),
    ])
    if (
      coordinates.length < 2 ||
      coordinates.some(
        ([lat, lon]) =>
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180,
      )
    ) {
      throw new Error('Trayectoria incompleta o sin coordenadas válidas')
    }
    flightPaths.set(id, coordinates)
    const updated = { ...pathErrors.value }
    delete updated[id]
    pathErrors.value = updated
    if (!destroyed) renderFlights()
  } catch (error) {
    pathErrors.value = { ...pathErrors.value, [id]: `${callsignOf(flight)}: ${error.message}` }
    console.warn('Trayectoria FPL no disponible:', id, error)
  } finally {
    loadingPaths.delete(id)
  }
}

function removeFlight(id) {
  const entry = flightMarkers.get(id)
  if (!entry || !flightLayer) return
  flightLayer.removeLayer(entry.marker)
  flightLayer.removeLayer(entry.line)
  flightMarkers.delete(id)
}

function renderFlights() {
  if (!map || !flightLayer) return
  const activeKeys = new Set()
  for (const flight of activeFlights.value) {
    const id = flightId(flight)
    if (!/^[a-f\d]{24}$/i.test(id)) {
      console.warn('Vuelo sin identificador MongoDB válido:', flight.callsign)
      continue
    }
    const coordinates = flightPaths.get(id)
    if (!coordinates) {
      loadFlightPath(flight)
      continue
    }
    const progress = flightProgress(flight)
    if (progress === null) continue
    const location = positionAlongPath(coordinates, progress)
    if (!location) continue
    activeKeys.add(id)
    const remainingMinutes = Math.max(0, (etaMs(flight) - props.now) / 60000)
    const color =
      remainingMinutes <= 10 ? '#ff6174' : remainingMinutes <= 20 ? '#ffcc63' : '#59d6a1'
    const bearing = segmentBearing(location.start, location.end)
    const callsign = callsignOf(flight)
    const icon = createAircraftIcon(color, bearing)
    const existing = flightMarkers.get(id)
    if (existing) {
      existing.marker.setLatLng(location.position)
      existing.marker.setIcon(icon)
      existing.line.setStyle({
        color: '#00e5ff',
      })
      if (existing.callsign !== callsign) existing.marker.setTooltipContent(callsign)
      existing.callsign = callsign
    } else {
      const line = L.polyline(coordinates, {
        color: '#00e5ff',
        weight: 3,
        opacity: 0.9,
        dashArray: '8, 5',
      })

      if (selectedFlightId.value === id) {
        line.addTo(flightLayer)
      }
      const marker = L.marker(location.position, {
        icon,
        zIndexOffset: 1000,
      }).addTo(flightLayer)
      marker.on('click', () => {
        if (selectedFlightId.value === id) {
          selectedFlightId.value = null
        } else {
          selectedFlightId.value = id
        }
        if (!hasFittedTraffic) {
          map.fitBounds(line.getBounds(), { padding: [30, 30], maxZoom: 10 })
          hasFittedTraffic = true
        }

        for (const [flightId, entry] of flightMarkers.entries()) {
          if (selectedFlightId.value === flightId) {
            if (!flightLayer.hasLayer(entry.line)) {
              entry.line.addTo(flightLayer)
            }
          } else {
            if (flightLayer.hasLayer(entry.line)) {
              flightLayer.removeLayer(entry.line)
            }
          }
        }
      })
      marker.bindTooltip(callsign, {
        permanent: true,
        direction: 'top',
        offset: [0, -15],
        opacity: 1,
        className: 'aircraft-callsign',
        interactive: false,
      })
      flightMarkers.set(id, { marker, line, callsign })
      // Ajustar el mapa una sola vez al recibir la primera trayectoria.
    }
  }
  for (const id of [...flightMarkers.keys()]) {
    if (!activeKeys.has(id)) removeFlight(id)
  }
}

function initMap() {
  if (map || !mapElement.value || !airportPosition.value) return
  map = L.map(mapElement.value, { zoomControl: true, attributionControl: true })
  map.setView(airportPosition.value, 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  airportLayer = L.layerGroup().addTo(map)
  flightLayer = L.layerGroup().addTo(map)
  L.circleMarker(airportPosition.value, {
    radius: 7,
    color: '#21dcff',
    fillColor: '#21dcff',
    fillOpacity: 1,
  })
    .bindTooltip(`${props.airport} · Destino simulado`)
    .addTo(airportLayer)
  renderFlights()
  nextTick(() => {
    if (map) {
      map.invalidateSize()
      setTimeout(() => map?.invalidateSize(), 250)
    }
  })
}

function resetMap() {
  if (map) map.remove()
  map = null
  flightLayer = null
  airportLayer = null
  flightMarkers.clear()
}

onMounted(() => {
  destroyed = false
  initMap()
})
watch([activeFlights, () => props.now], renderFlights)
onMounted(() => {
  destroyed = false
  loadAirportPosition()
})

watch(
  () => props.airport,
  () => {
    resetMap()
    loadAirportPosition()
  },
)

watch(airportPosition, async (position) => {
  if (!position) return

  resetMap()

  await nextTick()

  if (!destroyed) {
    initMap()
  }
})
onUnmounted(() => {
  destroyed = true
  airportRequestId++
  resetMap()
})
</script>

<template>
  <div class="arrival-map-panel">
    <div class="arrival-map-heading">
      <div>
        <strong>MAPA DE APROXIMACIÓN SIMULADA</strong>
        <p>Trayectorias obtenidas del FPL y MongoDB · No son datos radar ni ADS-B</p>
      </div>
      <span
        >{{ activeFlights.length }} en vuelo · {{ upcoming.length }} en los próximos 30 min</span
      >
    </div>
    <div v-if="airportPosition" ref="mapElement" class="arrival-map-canvas"></div>
    <div v-else class="arrival-map-unavailable">
      <span v-if="airportLoading"> Consultando coordenadas de {{ airport }}... </span>

      <span v-else-if="airportError">
        {{ airportError }}
      </span>

      <span v-else> No hay coordenadas disponibles para {{ airport }}. </span>
    </div>
    <div v-if="!activeFlights.length" class="arrival-map-errors">
      No hay vuelos simulados en estado activo con ETA futura y hora de salida registrada.
    </div>
    <div v-if="Object.keys(pathErrors).length" class="arrival-map-errors">
      <div v-for="(error, id) in pathErrors" :key="id">{{ error }}</div>
    </div>
    <div class="arrival-map-legend">
      <span class="legend-red">● 0–10 min</span>
      <span class="legend-yellow">● 10–20 min</span>
      <span class="legend-green">● 20–30 min</span>
      <span>✈ Movimiento sobre ruta FPL</span>
    </div>
  </div>
</template>

<style scoped>
.arrival-map-panel {
  margin: 18px 0;
  border: 1px solid #29445c;
  border-radius: 10px;
  overflow: hidden;
  background: #0b1c2b;
}
.arrival-map-heading {
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #e5f4ff;
}
.arrival-map-heading strong {
  font-size: 13px;
}
.arrival-map-heading p {
  color: #91a8b9;
  font-size: 11px;
  margin: 5px 0 0;
}
.arrival-map-heading > span {
  font-size: 11px;
  color: #7cddf0;
  white-space: nowrap;
}
.arrival-map-canvas {
  width: 100%;
  height: 370px;
  z-index: 0;
}
.arrival-map-unavailable {
  padding: 50px 16px;
  text-align: center;
  color: #9fb2c3;
}
.arrival-map-errors {
  padding: 8px 15px;
  color: #ff9aa5;
  font-size: 12px;
}
.arrival-map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 15px;
  font-size: 11px;
  color: #9fb2c3;
}
.legend-red {
  color: #ff6174;
}
.legend-yellow {
  color: #ffcc63;
}
.legend-green {
  color: #59d6a1;
}
:deep(.leaflet-tooltip.aircraft-callsign) {
  background: rgba(8, 26, 43, 0.95) !important;
  color: #00e5ff !important;
  border: 1px solid #00e5ff !important;
  border-radius: 5px !important;
  padding: 4px 8px !important;
  font-family: monospace !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  white-space: nowrap;
  opacity: 1 !important;
  visibility: visible !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
:deep(.leaflet-tooltip-top.aircraft-callsign::before) {
  border-top-color: #00e5ff !important;
}
:deep(.sim-aircraft-marker) {
  background: transparent;
  border: none;
}
@media (max-width: 700px) {
  .arrival-map-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .arrival-map-canvas {
    height: 300px;
  }
}
</style>
