<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  flights: {
    type: Array,
    default: () => [],
  },
  airport: {
    type: String,
    default: 'MMMZ',
  },
  now: {
    type: Number,
    default: () => Date.now(),
  },
})

// Coordenadas de referencia para simulación.
const AIRPORTS = {
  MMMZ: [23.1614, -106.2661],
}

const airportPosition = computed(() => {
  return AIRPORTS[String(props.airport).toUpperCase()] || null
})

const mapElement = ref(null)

let map = null
let flightLayer = null
let airportLayer = null

// Marcadores y líneas existentes.
const flightMarkers = new Map()

function etaMs(flight) {
  const raw = flight.eta_at || flight.eta

  if (!raw) return null

  const value = new Date(raw).getTime()

  return Number.isFinite(value) ? value : null
}

// Vuelos próximos a llegar en 30 minutos.
const upcoming = computed(() => {
  return props.flights.filter((flight) => {
    const state = String(flight.lifecycle || flight.status || '').toUpperCase()

    if (['ARRIVED', 'CANCELLED', 'CNL'].includes(state) || flight.arrived_at) {
      return false
    }

    const eta = etaMs(flight)

    return eta !== null && eta >= props.now && eta - props.now <= 30 * 60000
  })
})

// Rumbo ilustrativo estable para cada vuelo.
function stableBearing(value) {
  let hash = 0

  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return ((hash % 360) * Math.PI) / 180
}

// Calcula una posición aproximada.
function destinationPoint(origin, bearing, distanceKm) {
  const latOffset = (distanceKm / 111.32) * Math.cos(bearing)

  const lonOffset =
    (distanceKm / (111.32 * Math.cos((origin[0] * Math.PI) / 180))) * Math.sin(bearing)

  return [origin[0] + latOffset, origin[1] + lonOffset]
}

// Crea el icono de la aeronave.
function createAircraftIcon(color, bearing) {
  const rotation = (bearing * 180) / Math.PI + 135

  return L.divIcon({
    className: 'sim-aircraft-marker',

    html: `
      <div
        style="
          color: ${color};
          font-size: 25px;
          line-height: 28px;
          text-align: center;
          text-shadow: 0 1px 6px #00101e;
          transform: rotate(${rotation}deg);
        "
      >✈</div>
    `,

    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

// Actualiza aeronaves sin recrearlas constantemente.
function renderFlights() {
  if (!map || !flightLayer || !airportPosition.value) {
    return
  }

  const origin = airportPosition.value
  const activeKeys = new Set()

  upcoming.value.forEach((flight, index) => {
    const callsign = String(flight.callsign || flight.id || 'SIN ID')
      .trim()
      .toUpperCase()
      .replace(/[&<>"']/g, '')

    const key = String(
      flight._id ||
        flight.id ||
        `${callsign}-${flight.departure || ''}-${flight.eta_at || flight.eta || index}`,
    )

    activeKeys.add(key)

    const eta = etaMs(flight)

    if (eta === null) return

    const minutes = Math.max(0, (eta - props.now) / 60000)

    // Posición ilustrativa: 2 km por minuto.
    const distanceKm = Math.max(0.4, minutes * 2)

    const bearing = stableBearing(`${callsign}-${flight.departure || ''}`)

    const position = destinationPoint(origin, bearing, distanceKm)

    // Color según el tiempo restante.
    const color = minutes <= 10 ? '#ff6174' : minutes <= 20 ? '#ffcc63' : '#59d6a1'

    const icon = createAircraftIcon(color, bearing)

    const existing = flightMarkers.get(key)

    if (existing) {
      // Actualizar posición del avión.
      existing.marker.setLatLng(position)

      // Actualizar icono y color.
      if (existing.color !== color) {
        existing.marker.setIcon(icon)
        existing.line.setStyle({ color })
        existing.color = color
      }

      // Actualizar línea de aproximación.
      existing.line.setLatLngs([position, origin])

      // Mantener el callsign actualizado.
      if (existing.callsign !== callsign) {
        existing.marker.setTooltipContent(callsign)
        existing.callsign = callsign
      }
    } else {
      // Crear línea de aproximación.
      const line = L.polyline([position, origin], {
        color,
        weight: 1.5,
        opacity: 0.35,
        dashArray: '5 7',
      }).addTo(flightLayer)

      // Crear aeronave.
      const marker = L.marker(position, {
        icon,
        zIndexOffset: 1000,
      }).addTo(flightLayer)

      // CALLSIGN SIEMPRE VISIBLE.
      marker.bindTooltip(callsign, {
        permanent: true,
        direction: 'top',
        offset: [0, -15],
        opacity: 1,
        className: 'aircraft-callsign',
        interactive: false,
      })

      flightMarkers.set(key, {
        marker,
        line,
        color,
        callsign,
      })
    }
  })

  // Eliminar únicamente vuelos que ya no estén activos.
  for (const [key, entry] of flightMarkers) {
    if (!activeKeys.has(key)) {
      flightLayer.removeLayer(entry.marker)
      flightLayer.removeLayer(entry.line)
      flightMarkers.delete(key)
    }
  }
}

// Inicializar mapa Leaflet.
function initMap() {
  if (map || !mapElement.value || !airportPosition.value) {
    return
  }

  map = L.map(mapElement.value, {
    zoomControl: true,
    attributionControl: true,
  })

  map.setView(airportPosition.value, 9)
  // PRUEBA TEMPORAL DE CALLSIGN
  L.marker(airportPosition.value, {
    icon: L.divIcon({
      className: '',
      html: '<div style="font-size:28px;color:red">✈</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
  })
    .addTo(map)
    .bindTooltip('PRUEBA123', {
      permanent: true,
      direction: 'top',
      offset: [0, -15],
      opacity: 1,
    })

  // Mapa OpenStreetMap.
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  airportLayer = L.layerGroup().addTo(map)
  flightLayer = L.layerGroup().addTo(map)

  // Aeropuerto de destino.
  L.circleMarker(airportPosition.value, {
    radius: 7,
    color: '#21dcff',
    fillColor: '#21dcff',
    fillOpacity: 1,
  })
    .bindTooltip(`${props.airport} · Destino simulado`, { permanent: false })
    .addTo(airportLayer)

  renderFlights()

  nextTick(() => {
    map?.invalidateSize()
  })
}

// Ciclo de vida.
onMounted(() => {
  initMap()
})

// Actualización de posiciones.
watch([upcoming, () => props.now], () => {
  renderFlights()
})

// Cambio de aeropuerto.
watch(airportPosition, async () => {
  if (map) {
    map.remove()
    map = null
    flightLayer = null
    airportLayer = null
  }

  flightMarkers.clear()

  await nextTick()

  initMap()
})

// Liberar recursos.
onUnmounted(() => {
  if (map) {
    map.remove()
  }

  map = null
  flightLayer = null
  airportLayer = null

  flightMarkers.clear()
})
</script>

<template>
  <div class="arrival-map-panel">
    <div class="arrival-map-heading">
      <div>
        <strong> MAPA DE APROXIMACIÓN SIMULADA </strong>

        <p>Posiciones ilustrativas calculadas con la ETA · No son datos radar ni ADS-B</p>
      </div>

      <span> {{ upcoming.length }} en los próximos 30 min </span>
    </div>

    <div v-if="airportPosition" ref="mapElement" class="arrival-map-canvas"></div>

    <div v-else class="arrival-map-unavailable">
      No hay coordenadas de referencia configuradas para
      {{ airport }}.
    </div>

    <div class="arrival-map-legend">
      <span class="legend-red"> ● 0–10 min </span>

      <span class="legend-yellow"> ● 10–20 min </span>

      <span class="legend-green"> ● 20–30 min </span>

      <span> ✈ Movimiento ilustrativo </span>
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

/* CALLSIGN PERMANENTE */

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
