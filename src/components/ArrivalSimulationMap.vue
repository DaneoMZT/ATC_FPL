<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  flights: { type: Array, default: () => [] },
  airport: { type: String, default: 'MMMZ' },
  now: { type: Number, default: () => Date.now() },
})

// Aeropuerto de referencia: coordenadas aproximadas, solo para demostración.
const AIRPORTS = {
  MMMZ: [23.1614, -106.2661],
}
const airportPosition = computed(() => AIRPORTS[String(props.airport).toUpperCase()] || null)
const mapElement = ref(null)
let map = null
let flightLayer = null
let airportLayer = null

function etaMs(flight) {
  const raw = flight.eta_at || flight.eta
  if (!raw) return null
  const value = new Date(raw).getTime()
  return Number.isFinite(value) ? value : null
}

const upcoming = computed(() =>
  props.flights.filter((flight) => {
    const state = String(flight.lifecycle || flight.status || '').toUpperCase()
    if (['ARRIVED', 'CANCELLED', 'CNL'].includes(state) || flight.arrived_at) return false
    const eta = etaMs(flight)
    return eta !== null && eta >= props.now && eta - props.now <= 30 * 60000
  }),
)

function stableBearing(value) {
  let hash = 0
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return ((hash % 360) * Math.PI) / 180
}

function destinationPoint(origin, bearing, distanceKm) {
  const latOffset = (distanceKm / 111.32) * Math.cos(bearing)
  const lonOffset =
    (distanceKm / (111.32 * Math.cos((origin[0] * Math.PI) / 180))) * Math.sin(bearing)
  return [origin[0] + latOffset, origin[1] + lonOffset]
}

function renderFlights() {
  if (!map || !flightLayer || !airportPosition.value) return

  flightLayer.clearLayers()

  const origin = airportPosition.value

  upcoming.value.forEach((flight, index) => {
    const minutes = Math.max(0, (etaMs(flight) - props.now) / 60000)

    // Posición ilustrativa: 2 km por minuto restante.
    const distanceKm = Math.max(0.4, minutes * 2)

    const bearing = stableBearing(
      `${flight.callsign || flight.id || index}-${flight.departure || ''}`,
    )

    const position = destinationPoint(origin, bearing, distanceKm)

    const color = minutes <= 10 ? '#ff6174' : minutes <= 20 ? '#ffcc63' : '#59d6a1'

    // Línea ilustrativa hacia el aeropuerto.
    L.polyline([position, origin], {
      color,
      weight: 1.5,
      opacity: 0.35,
      dashArray: '5 7',
    }).addTo(flightLayer)

    // Símbolo de aeronave.
    const icon = L.divIcon({
      className: 'sim-aircraft-marker',
      html: `
        <div style="
          color:${color};
          font-size:25px;
          text-shadow:0 1px 6px #00101e;
          transform:rotate(${(bearing * 180) / Math.PI + 135}deg);
        ">✈</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    const marker = L.marker(position, {
      icon,
      zIndexOffset: 1000,
    }).addTo(flightLayer)

    // Mostrar únicamente el CALLSIGN.
    const callsign = String(flight.callsign || 'SIN ID')
      .trim()
      .toUpperCase()
      .replace(/[&<>"']/g, '')

    marker.bindTooltip(callsign, {
      permanent: true,
      direction: 'top',
      offset: [0, -15],
      opacity: 1,
      className: 'aircraft-callsign',
      interactive: false,
    })

    marker.openTooltip()
  })
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
    .bindTooltip(`${props.airport} · Destino simulado`, { permanent: false })
    .addTo(airportLayer)
  renderFlights()
  nextTick(() => map?.invalidateSize())
}

onMounted(initMap)
watch([upcoming, () => props.now], renderFlights)
watch(airportPosition, async () => {
  if (map) {
    map.remove()
    map = null
    flightLayer = null
    airportLayer = null
  }
  await nextTick()
  initMap()
})
onUnmounted(() => {
  if (map) map.remove()
  map = null
})
</script>

<template>
  <div class="arrival-map-panel">
    <div class="arrival-map-heading">
      <div>
        <strong>MAPA DE APROXIMACIÓN SIMULADA</strong>
        <p>Posiciones ilustrativas calculadas con la ETA · No son datos radar ni ADS-B</p>
      </div>
      <span>{{ upcoming.length }} en los próximos 30 min</span>
    </div>
    <div v-if="airportPosition" ref="mapElement" class="arrival-map-canvas"></div>
    <div v-else class="arrival-map-unavailable">
      No hay coordenadas de referencia configuradas para {{ airport }}.
    </div>
    <div class="arrival-map-legend">
      <span class="legend-red">● 0–10 min</span>
      <span class="legend-yellow">● 10–20 min</span>
      <span class="legend-green">● 20–30 min</span>
      <span>✈ Movimiento ilustrativo</span>
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
@media (max-width: 700px) {
  .arrival-map-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .arrival-map-canvas {
    height: 300px;
  }
}
/* CALLSIGN VISIBLE SOBRE CADA AERONAVE */

:deep(.aircraft-callsign) {
  background: rgba(8, 26, 43, 0.95);
  color: #00e5ff;
  border: 1px solid #00e5ff;
  border-radius: 5px;
  padding: 4px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

:deep(.aircraft-callsign::before) {
  border-top-color: #00e5ff;
}
:deep(.leaflet-tooltip.aircraft-callsign) {
  opacity: 1 !important;
  visibility: visible !important;
  z-index: 1000;
}

:deep(.sim-aircraft-marker) {
  background: transparent;
  border: none;
}
</style>
