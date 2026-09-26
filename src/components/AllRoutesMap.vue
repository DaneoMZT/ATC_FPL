<template>
  <div class="map-system">

    <!-- =====================================
         MODO DE BÚSQUEDA
    ====================================== -->

    <div class="search-mode">
      <button
        class="mode-button"
        :class="{ active: searchMode === 'route' }"
        @click="setSearchMode('route')"
      >
        AEROVÍA
      </button>

      <button
        class="mode-button"
        :class="{ active: searchMode === 'point' }"
        @click="setSearchMode('point')"
      >
        FIJO
      </button>
    </div>


 <!-- =====================================
     BUSCADOR
====================================== -->
<div class="map-toolbar">

  <div class="search-box">

    <span class="search-icon">
      ⌕
    </span>

    <input
      v-model="search"
      type="text"
      :placeholder="searchPlaceholder"
      autocomplete="off"
      @keyup.enter="executeSearch"
    />

    <button
      v-if="search"
      class="clear-search"
      @click="clearSearch"
    >
      ×
    </button>

    <button
      v-if="searchMode === 'point'"
      class="search-button"
      :disabled="pointLoading || !search.trim()"
      @click="searchPoint"
    >
      {{ pointLoading ? 'BUSCANDO...' : 'BUSCAR' }}
    </button>

  </div>

  <div class="route-counter">

    <!-- MODO AEROVÍA -->
    <template v-if="searchMode === 'route'">

      <strong>
        {{ filteredRoutes.length }}
      </strong>

      <span v-if="search">
        resultados
      </span>

      <span v-else-if="selectedGroup">
        aerovías del grupo
      </span>

      <span v-else>
        selecciona un grupo
      </span>

    </template>

    <!-- MODO FIJO -->
    <template v-else>

      <strong>
        {{ pointRoutes.length }}
      </strong>

      <span>
        aerovías del fijo
      </span>

    </template>

  </div>

</div>
<!-- =====================================
    MODIFICAR FIJO
====================================== -->

<div
  v-if="editPointVisible"
  class="edit-point-overlay"
  @click.self="closeEditPoint"
>

  <div class="edit-point-modal">

    <!-- ENCABEZADO -->

    <div class="edit-point-header">

      <div>
        <span>
          EDICIÓN ATC
        </span>

        <h2>
          MODIFICAR FIJO
        </h2>
      </div>

      <button
        class="edit-point-close"
        @click="closeEditPoint"
      >
        ×
      </button>

    </div>


    <!-- CAMPOS -->

    <div class="edit-point-grid">

      <label>

        <span>
          IDENTIFICADOR
        </span>

        <input
          v-model="editPoint.point_id"
          maxlength="10"
        />

      </label>


      <label>

        <span>
          TIPO
        </span>

        <input
          v-model="editPoint.point_type"
        />

      </label>


      <label class="full-field">

        <span>
          POSICIÓN DMS
        </span>

        <input
          v-model="editPoint.raw"
          placeholder="173902N0890945W"
        />

      </label>


      <label>

        <span>
          LATITUD
        </span>

        <input
          v-model="editPoint.latitude"
          type="number"
          step="0.00000001"
        />

      </label>


      <label>

        <span>
          LONGITUD
        </span>

        <input
          v-model="editPoint.longitude"
          type="number"
          step="0.00000001"
        />

      </label>


      <label>

        <span>
          AEROPUERTO
        </span>

        <input
          v-model="editPoint.airport_id"
        />

      </label>


      <label class="checkbox-field">

        <input
          v-model="editPoint.relevant_fix"
          type="checkbox"
        />

        <span>
          FIJO RELEVANTE
        </span>

      </label>


      <label class="full-field">

        <span>
          COMENTARIO
        </span>

        <textarea
          v-model="editPoint.comment"
          rows="3"
        ></textarea>

      </label>

    </div>


    <!-- AEROVÍAS AFECTADAS -->

    <div class="affected-routes">

      <span class="affected-title">
        AEROVÍAS AFECTADAS
      </span>

      <div
        v-if="pointRoutes.length"
        class="affected-list"
      >

        <span
          v-for="route in pointRoutes"
          :key="route._id"
        >
          {{ route.route_name }}
        </span>

      </div>

      <small v-else>
        Este fijo no pertenece a ninguna aerovía.
      </small>

    </div>


    <!-- ERROR -->

    <div
      v-if="editPointError"
      class="edit-point-error"
    >
      {{ editPointError }}
    </div>


    <!-- CORRECTO -->

    <div
      v-if="editPointSuccess"
      class="edit-point-success"
    >
      {{ editPointSuccess }}
    </div>


    <!-- BOTONES -->

    <div class="edit-point-actions">

      <button
        class="cancel-edit-button"
        :disabled="editPointSaving"
        @click="closeEditPoint"
      >
        CANCELAR
      </button>


      <button
        class="save-edit-button"
        :disabled="editPointSaving"
        @click="saveEditPoint"
      >

        {{
          editPointSaving
            ? 'GUARDANDO...'
            : 'GUARDAR CAMBIOS'
        }}

      </button>

    </div>
  </div>
</div>

    <!-- =====================================
      GRUPOS DE AEROVÍAS
      SOLO MODO AEROVÍA
    ====================================== -->

    <div
      v-if="searchMode === 'route'"
      class="groups-section"
    >

      <div class="groups-title">
        GRUPOS DE AEROVÍAS
      </div>

      <div
        v-if="groups.length"
        class="groups"
      >

        <button
          v-for="group in groups"
          :key="group.group"
          class="group-button"
          :class="{
            active:
              selectedGroup === group.group
          }"
          @click="selectGroup(group.group)"
        >

          <strong>
            {{ group.group }}
          </strong>

          <span>
            {{ group.total }}
          </span>

        </button>

      </div>

      <div
        v-else-if="!loading"
        class="no-groups"
      >
        No se encontraron grupos.
      </div>

    </div>


    <!-- =====================================
        INFORMACIÓN DEL FIJO
    ====================================== -->

    <div
      v-if="
        searchMode === 'point' &&
        selectedPoint
      "
      class="point-information"
    >

      <div class="point-information-main">

        <div class="point-symbol">
          +
        </div>

        <div>

          <span class="point-caption">
            FIJO SELECCIONADO
          </span>

          <strong class="point-title">
            {{ selectedPoint.point_id }}
          </strong>

        </div>
      </div>
      <button
  class="edit-point-button"
  @click="openEditPoint"
>
  ✎ MODIFICAR FIJO
</button>


      <div class="point-data">

        <div>
          <span>TIPO</span>

          <strong>
            {{ selectedPoint.point_type || 'N/D' }}
          </strong>
        </div>

        <div>
          <span>POSICIÓN</span>

          <strong>
            {{ selectedPoint.position?.raw || 'N/D' }}
          </strong>
        </div>

        <div>
          <span>LATITUD</span>

          <strong>
            {{ formatCoordinate(
              selectedPoint.position?.latitude
            ) }}
          </strong>
        </div>

        <div>
          <span>LONGITUD</span>

          <strong>
            {{ formatCoordinate(
              selectedPoint.position?.longitude
            ) }}
          </strong>
        </div>

        <div>
          <span>AEROVÍAS</span>

          <strong class="cyan">
            {{ pointRoutes.length }}
          </strong>
        </div>

      </div>

    </div>


    <!-- =====================================
         ERROR DE BÚSQUEDA DE FIJO
    ====================================== -->

    <div
      v-if="
        searchMode === 'point' &&
        pointError
      "
      class="point-search-error"
    >
      {{ pointError }}
    </div>


    <!-- =====================================
         MAPA + PANEL
    ====================================== -->

    <div class="map-layout">

      <!-- =================================
           MAPA
      ================================== -->

      <div class="map-container">

        <div
          ref="mapElement"
          class="map"
        ></div>


        <!-- CARGANDO -->

        <div
          v-if="routeLoading"
          class="loading"
        >
          Cargando {{ selectedRoute }}...
        </div>


        <!-- RUTA SELECCIONADA -->

        <div
          v-if="
            selectedRoute &&
            !routeLoading
          "
          class="selected-route-card"
        >

          <span>
            AEROVÍA
          </span>

          <strong>
            {{ selectedRoute }}
          </strong>

          <small>
            {{ selectedRoutePoints }}
            puntos
          </small>

        </div>


        <!-- FIJO SELECCIONADO -->

        <div
          v-if="
            searchMode === 'point' &&
            selectedPoint
          "
          class="selected-point-card"
        >

          <span>
            FIJO
          </span>

          <strong>
            {{ selectedPoint.point_id }}
          </strong>

          <small>
            {{ pointRoutes.length }}
            aerovías
          </small>

        </div>


        <!-- LIMPIAR MAPA -->

        <button
          v-if="
            selectedRoute ||
            selectedPoint
          "
          class="clear-map-button"
          @click="clearMap"
        >
          × LIMPIAR MAPA
        </button>


        <!-- ESTADO -->

        <div class="map-status">

          <div>
            RED ATCFPL
          </div>

          <template v-if="selectedRoute">

            <strong>
              {{ selectedRoute }}
            </strong>

            <span>
              {{ selectedRoutePoints }}
              puntos
            </span>

          </template>

          <template v-else-if="selectedPoint">

            <strong>
              {{ selectedPoint.point_id }}
            </strong>

            <span>
              {{ pointRoutes.length }}
              aerovías
            </span>

          </template>

          <template v-else>

            <strong>
              0
            </strong>

            <span>
              aerovías
            </span>

          </template>

        </div>


        <!-- ERROR MAPA -->

        <div
          v-if="routeError"
          class="map-error"
        >
          {{ routeError }}
        </div>

      </div>


      <!-- =================================
           PANEL DERECHO
      ================================== -->

      <aside class="route-panel">

        <!-- MODO AEROVÍA -->

        <template v-if="searchMode === 'route'">

          <div class="panel-header">

            <div>
              <span>
                AEROVÍAS
              </span>

              <strong v-if="selectedGroup">
                {{ selectedGroup }}
              </strong>
            </div>

            <strong class="panel-count">
              {{ filteredRoutes.length }}
            </strong>

          </div>


          <div
            v-if="loading"
            class="panel-message"
          >
            Cargando aerovías...
          </div>


          <div
            v-else-if="loadError"
            class="panel-error"
          >
            {{ loadError }}
          </div>


          <div
            v-else-if="
              !selectedGroup &&
              !search
            "
            class="panel-message"
          >
            <span class="arrow-up">
              ↑
            </span>

            Selecciona un grupo.
          </div>


          <div
            v-else-if="
              filteredRoutes.length === 0
            "
            class="panel-message"
          >
            No se encontraron aerovías.
          </div>


          <div
            v-else
            class="route-list"
          >

            <button
              v-for="route in filteredRoutes"
              :key="route._id"
              class="route-item"
              :class="{
                selected:
                  selectedRoute ===
                  route.route_name
              }"
              @click="selectRoute(route)"
            >

              <div>
                <strong>
                  {{ route.route_name }}
                </strong>

                <span>
                  {{ route.total_points }}
                  puntos
                </span>
              </div>

              <span class="group-badge">
                {{ route.group }}
              </span>

            </button>

          </div>

        </template>


        <!-- =================================
             MODO FIJO
        ================================== -->

        <template v-else>

          <div class="panel-header">

            <div>
              <span>
                AEROVÍAS DEL FIJO
              </span>

              <strong v-if="selectedPoint">
                {{ selectedPoint.point_id }}
              </strong>
            </div>

            <strong class="panel-count">
              {{ pointRoutes.length }}
            </strong>

          </div>


          <div
            v-if="pointLoading"
            class="panel-message"
          >
            Buscando fijo...
          </div>


          <div
            v-else-if="pointError"
            class="panel-error"
          >
            {{ pointError }}
          </div>


          <div
            v-else-if="!selectedPoint"
            class="panel-message"
          >

            <span class="point-search-symbol">
              +
            </span>

            Escribe el nombre de un fijo.

            <small>
              Ejemplo: KINAL
            </small>

          </div>


          <div
            v-else-if="pointRoutes.length === 0"
            class="panel-message"
          >

            El fijo no pertenece a ninguna
            aerovía.

          </div>


          <div
            v-else
            class="route-list"
          >

            <button
              v-for="route in pointRoutes"
              :key="route._id"
              class="route-item"
              :class="{
                selected:
                  selectedRoute ===
                  route.route_name
              }"
              @click="selectPointRoute(route)"
            >

              <div>

                <strong>
                  {{ route.route_name }}
                </strong>

                <span>
                  {{ route.total_points }}
                  puntos
                </span>

              </div>

              <span class="group-badge">
                {{ route.group }}
              </span>

            </button>

          </div>

        </template>

      </aside>

    </div>

  </div>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick
} from 'vue'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'


// =====================================
// API
// =====================================

const API =
  'http://localhost:3000/api'


// =====================================
// VARIABLES GENERALES
// =====================================

const mapElement =
  ref(null)

const routes =
  ref([])

const groups =
  ref([])

const search =
  ref('')

const searchMode =
  ref('route')

const selectedGroup =
  ref('')

const selectedRoute =
  ref('')

const selectedRoutePoints =
  ref(0)

const loading =
  ref(true)

const routeLoading =
  ref(false)

const loadError =
  ref('')

const routeError =
  ref('')


// =====================================
// VARIABLES PARA FIJOS
// =====================================

const selectedPoint =
  ref(null)

const pointRoutes =
  ref([])

const pointLoading =
  ref(false)

const pointError =
  ref('')

// =====================================
// EDICIÓN DE FIJO
// =====================================

const editPointVisible = ref(false)
const editPointSaving = ref(false)
const editPointError = ref('')
const editPointSuccess = ref('')

const editPoint = ref({
  original_point_id: '',
  point_id: '',
  raw: '',
  latitude: '',
  longitude: '',
  point_type: '',
  relevant_fix: false,
  airport_id: '',
  comment: ''
})



// =====================================
// LEAFLET
// =====================================

let map = null

let routeLayer = null

let pointLayer = null


// =====================================
// PLACEHOLDER
// =====================================

const searchPlaceholder =
  computed(() => {

    if (
      searchMode.value ===
      'point'
    ) {

      return 'Buscar fijo: KINAL, CUL, MZT...'

    }

    return 'Buscar aerovía: A552, J13, UJ...'

  })


// =====================================
// FILTRAR RUTAS
// =====================================

const filteredRoutes =
  computed(() => {

    if (
      searchMode.value !==
      'route'
    ) {

      return []

    }

    const text =
      search.value
        .trim()
        .toUpperCase()


    // BUSCADOR GLOBAL

    if (text) {

      return routes.value.filter(
        (route) => {

          const name =
            String(
              route.route_name || ''
            )
              .toUpperCase()

          return name.includes(text)

        }
      )

    }


    // SIN GRUPO

    if (!selectedGroup.value) {

      return []

    }
//

    // GRUPO SELECCIONADO

    return routes.value.filter(
      (route) => {

        return (
          route.group ===
          selectedGroup.value
        )

      }
    )

  })


// =====================================
// CAMBIAR MODO DE BÚSQUEDA
// =====================================

const setSearchMode =
  (mode) => {

    if (
      searchMode.value === mode
    ) {

      return

    }

    searchMode.value = mode

    search.value = ''

    selectedGroup.value = ''

    selectedRoute.value = ''

    selectedRoutePoints.value = 0

    selectedPoint.value = null

    pointRoutes.value = []

    pointError.value = ''

    routeError.value = ''

    clearRouteLayer()

    clearPointLayer()

    resetMap()

  }


// =====================================
// EJECUTAR BÚSQUEDA ENTER
// =====================================

const executeSearch =
  () => {

    if (
      searchMode.value ===
      'point'
    ) {

      searchPoint()

    }

  }


// =====================================
// CREAR MAPA
// =====================================

const createMap =
  async () => {

    await nextTick()

    if (!mapElement.value) {

      return

    }

    map =
      L.map(
        mapElement.value,
        {
          preferCanvas: true,
          zoomControl: true,

          // México, USA, Centroamérica y Cuba
          maxBounds: [
            [5, -130],
            [52, -55]
          ],

          maxBoundsViscosity: 0.8
        }
      )
        .setView(
          [
            23.6345,
            -102.5528
          ],
          5
        )


    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap'
      }
    )
      .addTo(map)

  }


// =====================================
// CARGAR RUTAS
// =====================================

const loadRoutes =
  async () => {

    try {

      loading.value = true

      loadError.value = ''

      const response =
        await fetch(
          `${API}/routes`
        )

      if (!response.ok) {

        throw new Error(
          'No se pudieron cargar las aerovías'
        )

      }

      const data =
        await response.json()

      routes.value =
        Array.isArray(data)
          ? data
          : []

    } catch (error) {

      console.error(error)

      loadError.value =
        'No se pudieron cargar las aerovías.'

    } finally {

      loading.value = false

    }

  }


// =====================================
// CARGAR GRUPOS
// =====================================

const loadGroups =
  async () => {

    try {

      const response =
        await fetch(
          `${API}/routes/groups`
        )

      if (!response.ok) {

        throw new Error(
          'No se pudieron cargar los grupos'
        )

      }

      const data =
        await response.json()

      groups.value =
        Array.isArray(data)
          ? data
          : []

    } catch (error) {

      console.error(
        'Error cargando grupos:',
        error
      )

    }

  }


// =====================================
// SELECCIONAR GRUPO
// =====================================

const selectGroup =
  (group) => {

    selectedGroup.value =
      group

    search.value =
      ''

  }


// =====================================
// LIMPIAR BÚSQUEDA
// =====================================

const clearSearch =
  () => {

    search.value = ''

    pointError.value = ''

    if (
      searchMode.value ===
      'point'
    ) {

      selectedPoint.value = null

      pointRoutes.value = []

      selectedRoute.value = ''

      selectedRoutePoints.value = 0

      clearRouteLayer()

      clearPointLayer()

      resetMap()

    }

  }


// =====================================
// BUSCAR FIJO
// =====================================

const searchPoint =
  async () => {

    const pointId =
      search.value
        .trim()
        .toUpperCase()

    if (!pointId) {

      return

    }

    try {

      pointLoading.value = true

      pointError.value = ''

      selectedPoint.value = null

      pointRoutes.value = []

      selectedRoute.value = ''

      selectedRoutePoints.value = 0

      clearRouteLayer()

      clearPointLayer()


      const response =
        await fetch(
          `${API}/characteristic-points/${encodeURIComponent(pointId)}/routes`
        )


      const data =
        await response
          .json()
          .catch(
            () => ({})
          )


      if (!response.ok) {

        throw new Error(
          data.error ||
          `No se encontró el fijo ${pointId}`
        )

      }


      selectedPoint.value =
        data.point || null


      pointRoutes.value =
        Array.isArray(data.routes)
          ? data.routes
          : []


      if (
        selectedPoint.value
      ) {

        drawSelectedPoint(
          selectedPoint.value
        )

      }

    } catch (error) {

      console.error(
        'Error buscando fijo:',
        error
      )

      pointError.value =
        error.message

    } finally {

      pointLoading.value = false

    }

  }


// =====================================
// DIBUJAR FIJO SELECCIONADO
// =====================================

const drawSelectedPoint =
  (point) => {

    if (!map || !point) {

      return

    }


    clearPointLayer()


    const latitude =
      Number(
        point.position?.latitude
      )

    const longitude =
      Number(
        point.position?.longitude
      )


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      pointError.value =
        'El fijo no tiene coordenadas válidas.'

      return

    }


    pointLayer =
      L.layerGroup()
        .addTo(map)


    // CÍRCULO EXTERIOR

    L.circleMarker(
      [
        latitude,
        longitude
      ],
      {
        radius: 13,
        color: '#ffd54f',
        weight: 2,
        fillColor: '#ffd54f',
        fillOpacity: 0.08,
        opacity: 0.8
      }
    )
      .addTo(pointLayer)


    // PUNTO CENTRAL

    const marker =
      L.circleMarker(
        [
          latitude,
          longitude
        ],
        {
          radius: 6,
          color: '#ffd54f',
          weight: 3,
          fillColor: '#07131f',
          fillOpacity: 1,
          opacity: 1
        }
      )


    marker.bindTooltip(
      point.point_id,
      {
        permanent: true,
        direction: 'top',
        offset: [0, -9],
        className:
          'selected-point-label'
      }
    )


    marker.bindPopup(`
      <div class="atc-popup">

        <div class="popup-type">
          FIJO SELECCIONADO
        </div>

        <div class="popup-name point-popup-name">
          ${point.point_id}
        </div>



        <div class="popup-row">
          <span>Tipo</span>
          <strong>
            ${point.point_type || 'N/D'}
          </strong>
        </div>

        <div class="popup-row">
          <span>Posición</span>
          <strong>
            ${point.position?.raw || 'N/D'}
          </strong>
        </div>

        <div class="popup-row">
          <span>Latitud</span>
          <strong>
            ${latitude.toFixed(8)}
          </strong>
        </div>

        <div class="popup-row">
          <span>Longitud</span>
          <strong>
            ${longitude.toFixed(8)}
          </strong>
        </div>

        <div class="popup-row">
          <span>Aerovías</span>
          <strong>
            ${pointRoutes.value.length}
          </strong>
        </div>

      </div>
    `)


    marker.addTo(
      pointLayer
    )


    map.setView(
      [
        latitude,
        longitude
      ],
      7
    )

  }


// =====================================
// SELECCIONAR RUTA NORMAL
// =====================================

const selectRoute =
  async (route) => {

    const routeName =
      String(
        route.route_name || ''
      )
        .trim()
        .toUpperCase()

    if (!routeName) {

      return

    }

    selectedRoute.value =
      routeName

    await loadRoute(
      routeName
    )

  }


// =====================================
// SELECCIONAR RUTA DESDE FIJO
// =====================================

const selectPointRoute =
  async (route) => {

    const routeName =
      String(
        route.route_name || ''
      )
        .trim()
        .toUpperCase()

    if (!routeName) {

      return

    }


    selectedRoute.value =
      routeName


    await loadRoute(
      routeName
    )


    // Volvemos a colocar el fijo por encima
    // de la aerovía.

    if (
      selectedPoint.value
    ) {

      drawSelectedPointWithoutZoom(
        selectedPoint.value
      )

    }

  }


// =====================================
// CARGAR UNA SOLA AEROVÍA
// =====================================

const loadRoute =
  async (routeName) => {

    try {

      routeLoading.value =
        true

      routeError.value =
        ''

      selectedRoutePoints.value =
        0

      clearRouteLayer()


      const response =
        await fetch(
          `${API}/routes/${encodeURIComponent(routeName)}/map`
        )


      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(
              () => ({})
            )

        throw new Error(
          errorData.error ||
          `No se pudo cargar ${routeName}`
        )

      }


      const data =
        await response.json()


      const points =
        Array.isArray(
          data.points
        )
          ? data.points
          : []


      selectedRoutePoints.value =
        points.length


      drawRoute(
        routeName,
        points
      )


      if (
        data.missing_points?.length
      ) {

        console.warn(
          'Puntos sin coordenadas:',
          data.missing_points
        )

      }

    } catch (error) {

      console.error(error)

      routeError.value =
        error.message

    } finally {

      routeLoading.value =
        false

    }

  }


// =====================================
// BORRAR CAPA DE RUTA
// =====================================

const clearRouteLayer =
  () => {

    if (
      map &&
      routeLayer
    ) {

      map.removeLayer(
        routeLayer
      )

      routeLayer = null

    }

  }


// =====================================
// BORRAR CAPA DEL FIJO
// =====================================

const clearPointLayer =
  () => {

    if (
      map &&
      pointLayer
    ) {

      map.removeLayer(
        pointLayer
      )

      pointLayer = null

    }

  }


// =====================================
// DIBUJAR FIJO SIN CAMBIAR ZOOM
// =====================================

const drawSelectedPointWithoutZoom =
  (point) => {

    if (!map || !point) {

      return

    }


    clearPointLayer()


    const latitude =
      Number(
        point.position?.latitude
      )

    const longitude =
      Number(
        point.position?.longitude
      )


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      return

    }


    pointLayer =
      L.layerGroup()
        .addTo(map)


    L.circleMarker(
      [
        latitude,
        longitude
      ],
      {
        radius: 14,
        color: '#ffd54f',
        weight: 2,
        fillColor: '#ffd54f',
        fillOpacity: 0.08,
        opacity: 0.9
      }
    )
      .addTo(pointLayer)


    const marker =
      L.circleMarker(
        [
          latitude,
          longitude
        ],
        {
          radius: 6,
          color: '#ffd54f',
          weight: 3,
          fillColor: '#07131f',
          fillOpacity: 1
        }
      )


    marker.bindTooltip(
      point.point_id,
      {
        permanent: true,
        direction: 'top',
        offset: [0, -9],
        className:
          'selected-point-label'
      }
    )


    marker.addTo(
      pointLayer
    )

  }


// =====================================
// DIBUJAR UNA SOLA AEROVÍA
// =====================================

const drawRoute =
  (
    routeName,
    points
  ) => {

    if (!map) {

      return

    }


    clearRouteLayer()


    routeLayer =
      L.layerGroup()
        .addTo(map)


    const coordinates = []


    points.forEach(
      (point, index) => {

        const latitude =
          Number(
            point.latitude ??
            point.position?.latitude
          )


        const longitude =
          Number(
            point.longitude ??
            point.position?.longitude
          )


        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {

          return

        }


        coordinates.push([
          latitude,
          longitude
        ])


        // =============================
        // PUNTO
        // =============================

        const marker =
          L.circleMarker(
            [
              latitude,
              longitude
            ],
            {
              radius: 5,
              color: '#00e5ff',
              weight: 2,
              fillColor: '#06131d',
              fillOpacity: 1,
              opacity: 1
            }
          )


        // =============================
        // NOMBRE
        // =============================

        marker.bindTooltip(
          point.point_id,
          {
            permanent: true,
            direction: 'top',
            offset: [0, -7],
            className:
              'point-label'
          }
        )


        // =============================
        // INFORMACIÓN
        // =============================

        marker.bindPopup(`
          <div class="atc-popup">

            <div class="popup-type">
              PUNTO ${index + 1}
            </div>

            <div class="popup-name">
              ${point.point_id}
            </div>

            <div class="popup-row">
              <span>Aerovía</span>
              <strong>
                ${routeName}
              </strong>
            </div>

            <div class="popup-row">
              <span>Tipo</span>
              <strong>
                ${point.point_type || 'N/D'}
              </strong>
            </div>

            <div class="popup-row">
              <span>Posición</span>
              <strong>
                ${point.position?.raw || 'N/D'}
              </strong>
            </div>

            <div class="popup-row">
              <span>Latitud</span>
              <strong>
                ${latitude.toFixed(6)}
              </strong>
            </div>

            <div class="popup-row">
              <span>Longitud</span>
              <strong>
                ${longitude.toFixed(6)}
              </strong>
            </div>

          </div>
        `)


        marker.addTo(
          routeLayer
        )

      }
    )


    // =================================
    // LÍNEA
    // =================================

    if (
      coordinates.length > 1
    ) {

      // RESPLANDOR

      L.polyline(
        coordinates,
        {
          color: '#00e5ff',
          weight: 7,
          opacity: 0.12,
          interactive: false
        }
      )
        .addTo(
          routeLayer
        )


      // LÍNEA PRINCIPAL

      const line =
        L.polyline(
          coordinates,
          {
            color: '#00e5ff',
            weight: 3,
            opacity: 1
          }
        )


      line.bindTooltip(
        routeName,
        {
          sticky: true,
          className:
            'route-tooltip'
        }
      )


      line.addTo(
        routeLayer
      )


      // =================================
      // NOMBRE DE AEROVÍA
      // =================================

      const middleIndex =
        Math.floor(
          coordinates.length / 2
        )


      const middle =
        coordinates[
          middleIndex
        ]


      L.marker(
        middle,
        {
          interactive: false,

          icon:
            L.divIcon({
              className:
                'airway-label',

              html:
                `<span>${routeName}</span>`,

              iconSize: null
            })
        }
      )
        .addTo(
          routeLayer
        )


      // =================================
      // ZOOM
      // =================================

      map.fitBounds(
        line.getBounds(),
        {
          padding:
            [70, 70],

          maxZoom: 9
        }
      )

    }

    else if (
      coordinates.length === 1
    ) {

      map.setView(
        coordinates[0],
        8
      )

    }

    else {

      routeError.value =
        `${routeName} no tiene puntos con coordenadas.`

    }

  }


// =====================================
// FORMATEAR COORDENADA
// =====================================

const formatCoordinate =
  (value) => {

    const number =
      Number(value)

    if (
      !Number.isFinite(number)
    ) {

      return 'N/D'

    }

    return number.toFixed(8)

  }


// =====================================
// REINICIAR MAPA
// =====================================

const resetMap =
  () => {

    if (!map) {

      return

    }

    map.setView(
      [
        23.6345,
        -102.5528
      ],
      5
    )

  }


// =====================================
// LIMPIAR MAPA
// =====================================

const clearMap =
  () => {

    clearRouteLayer()

    clearPointLayer()

    selectedRoute.value = ''

    selectedRoutePoints.value = 0

    routeError.value = ''


    if (
      searchMode.value ===
      'point'
    ) {

      selectedPoint.value = null

      pointRoutes.value = []

      search.value = ''

      pointError.value = ''

    }


    resetMap()

  }

// =====================================
// ABRIR MODIFICACIÓN DE FIJO
// =====================================

const openEditPoint = () => {
  if (!selectedPoint.value) {
    return
  }

  const point = selectedPoint.value

  editPoint.value = {
    original_point_id:
      point.point_id || '',

    point_id:
      point.point_id || '',

    raw:
      point.position?.raw || '',

    latitude:
      point.position?.latitude ?? '',

    longitude:
      point.position?.longitude ?? '',

    point_type:
      point.point_type || '',

    relevant_fix:
      Boolean(point.relevant_fix),

    airport_id:
      point.airport_id || '',

    comment:
      point.comment || ''
  }

  editPointError.value = ''
  editPointSuccess.value = ''
  editPointVisible.value = true
}


// =====================================
// CERRAR MODIFICACIÓN
// =====================================

const closeEditPoint = () => {
  if (editPointSaving.value) {
    return
  }

  editPointVisible.value = false
  editPointError.value = ''
  editPointSuccess.value = ''
}


// =====================================
// GUARDAR MODIFICACIÓN
// =====================================

const saveEditPoint = async () => {
  const originalId =
    editPoint.value.original_point_id
      .trim()
      .toUpperCase()

  const newId =
    editPoint.value.point_id
      .trim()
      .toUpperCase()

  const latitude =
    Number(editPoint.value.latitude)

  const longitude =
    Number(editPoint.value.longitude)

  if (!originalId || !newId) {
    editPointError.value =
      'El identificador del fijo es obligatorio.'

    return
  }

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    editPointError.value =
      'La latitud no es válida.'

    return
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    editPointError.value =
      'La longitud no es válida.'

    return
  }

  try {
    editPointSaving.value = true
    editPointError.value = ''
    editPointSuccess.value = ''

    const response = await fetch(
      `${API}/characteristic-points/${encodeURIComponent(originalId)}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          point_id: newId,

          position: {
            raw:
              editPoint.value.raw
                .trim()
                .toUpperCase(),

            latitude,
            longitude
          },

          point_type:
            editPoint.value.point_type
              .trim()
              .toUpperCase(),

          relevant_fix:
            editPoint.value.relevant_fix,

          airport_id:
            editPoint.value.airport_id
              .trim() || null,

          comment:
            editPoint.value.comment
              .trim() || null
        })
      }
    )

    const data =
      await response
        .json()
        .catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data.error ||
        'No se pudo modificar el fijo.'
      )
    }

    editPointSuccess.value =
      'Fijo actualizado correctamente.'

    // Por si cambiaste el nombre del fijo
    search.value = newId

    // Volver a consultar MongoDB
    await searchPoint()

    setTimeout(() => {
      editPointVisible.value = false
      editPointSuccess.value = ''
    }, 700)

  } catch (error) {
    console.error(
      'Error modificando fijo:',
      error
    )

    editPointError.value =
      error.message

  } finally {
    editPointSaving.value = false
  }
}
// =====================================
// INICIAR
// =====================================

onMounted(
  async () => {

    await createMap()

    await Promise.all([
      loadRoutes(),
      loadGroups()
    ])

  }
)


// =====================================
// DESTRUIR
// =====================================

onUnmounted(
  () => {

    if (map) {

      map.remove()

      map = null

    }

  }
)

</script>


<style scoped>

/* =====================================
   SISTEMA
===================================== */

.map-system {
  width: 100%;
}


/* =====================================
   MODOS DE BÚSQUEDA
===================================== */

.search-mode {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-button {
  min-width: 125px;
  padding: 10px 18px;

  background: #07131f;

  border:
    1px solid #1c3a4d;

  border-radius: 7px;

  color: #71869b;

  font-size: 12px;
  font-weight: 700;

  letter-spacing: 0.7px;

  cursor: pointer;

  transition: 0.2s;
}

.mode-button:hover {
  color: white;

  border-color:
    #00a8c0;
}

.mode-button.active {
  background:
    #103342;

  border-color:
    #00e5ff;

  color:
    #00e5ff;

  box-shadow:
    0 0 12px
    rgba(0, 229, 255, 0.1);
}


/* =====================================
   TOOLBAR
===================================== */

.map-toolbar {
  display: flex;

  justify-content:
    space-between;

  align-items: center;

  gap: 20px;

  margin-bottom: 15px;
}


/* =====================================
   BUSCADOR
===================================== */

.search-box {
  width: 520px;
  height: 46px;

  display: flex;
  align-items: center;

  box-sizing:
    border-box;

  padding:
    0 8px 0 14px;

  background:
    #07131f;

  border:
    1px solid #1c3a4d;

  border-radius:
    8px;
}

.search-box:focus-within {
  border-color:
    #00e5ff;

  box-shadow:
    0 0 0 2px
    rgba(0, 229, 255, 0.08);
}

.search-icon {
  margin-right: 10px;

  color:
    #00e5ff;

  font-size: 20px;
}

.search-box input {
  flex: 1;

  min-width: 0;

  border: none;

  outline: none;

  background:
    transparent;

  color: white;

  font-family:
    inherit;

  font-size: 14px;

  text-transform:
    uppercase;
}

.search-box input::placeholder {
  color:
    #60758b;

  text-transform:
    none;
}

.clear-search {
  border: none;

  background:
    transparent;

  color:
    #71869b;

  cursor: pointer;

  font-size: 20px;
}

.search-button {
  margin-left: 7px;

  padding:
    8px 13px;

  background:
    #0c6873;

  border:
    1px solid #00a8c0;

  border-radius:
    5px;

  color: white;

  font-size: 10px;
  font-weight: 700;

  cursor: pointer;
}

.search-button:hover {
  background:
    #0b8490;
}

.search-button:disabled {
  opacity: 0.45;

  cursor:
    not-allowed;
}


/* =====================================
   CONTADOR
===================================== */

.route-counter {
  display: flex;

  align-items: center;

  gap: 6px;

  color:
    #71869b;

  font-size: 11px;
}

.route-counter strong {
  color:
    #00e5ff;

  font-size: 16px;
}


/* =====================================
   GRUPOS
===================================== */

.groups-section {
  margin-bottom:
    15px;
}

.groups-title {
  margin-bottom:
    8px;

  color:
    #71869b;

  font-size: 10px;

  letter-spacing:
    1.2px;
}

.groups {
  display: flex;

  flex-wrap: wrap;

  gap: 8px;

  padding: 11px;

  background:
    #07131f;

  border:
    1px solid #17283a;

  border-radius:
    8px;
}

.group-button {
  min-width: 64px;

  display: flex;

  flex-direction:
    column;

  align-items:
    center;

  gap: 3px;

  padding:
    7px 12px;

  background:
    #0b1b29;

  border:
    1px solid #172f42;

  border-radius:
    6px;

  color:
    #91a4b8;

  cursor:
    pointer;

  transition:
    0.2s;
}

.group-button:hover {
  border-color:
    #00e5ff;

  color: white;
}

.group-button.active {
  background:
    #103342;

  border-color:
    #00e5ff;

  color:
    #00e5ff;
}

.group-button strong {
  font-size:
    14px;
}

.group-button span {
  min-width: 22px;

  padding:
    2px 5px;

  background:
    #050e16;

  border-radius:
    4px;

  color:
    #71869b;

  font-size:
    9px;

  text-align:
    center;
}

.no-groups {
  padding: 10px;

  color:
    #71869b;

  font-size:
    10px;
}


/* =====================================
   INFORMACIÓN DEL FIJO
===================================== */

.point-information {
  display: flex;

  justify-content:
    space-between;

  align-items: center;

  gap: 25px;

  margin-bottom:
    15px;

  padding:
    14px 18px;

  background:
    #07131f;

  border:
    1px solid #3c3a27;

  border-radius:
    8px;
}

.point-information-main {
  display: flex;

  align-items:
    center;

  gap: 12px;
}

.point-symbol {
  width: 35px;
  height: 35px;

  display: flex;

  align-items:
    center;

  justify-content:
    center;

  border:
    2px solid #ffd54f;

  border-radius:
    50%;

  color:
    #ffd54f;

  font-size:
    22px;
}

.point-information-main > div:last-child {
  display: flex;

  flex-direction:
    column;
}

.point-caption {
  color:
    #71869b;

  font-size:
    9px;
}

.point-title {
  color:
    #ffd54f;

  font-size:
    20px;
}

.point-data {
  display: flex;

  align-items:
    center;

  gap: 28px;
}

.point-data > div {
  display: flex;

  flex-direction:
    column;

  gap: 3px;
}

.point-data span {
  color:
    #60758b;

  font-size:
    8px;
}

.point-data strong {
  color:
    #dce7f1;

  font-size:
    11px;
}

.point-data .cyan {
  color:
    #00e5ff;

  font-size:
    15px;
}

.point-search-error {
  margin-bottom:
    15px;

  padding:
    10px 14px;

  background:
    #29151b;

  border:
    1px solid #713442;

  border-radius:
    6px;

  color:
    #ff8795;

  font-size:
    11px;
}


/* =====================================
   MAPA + PANEL
===================================== */

.map-layout {
  height: 720px;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    270px;

  background:
    #03080d;

  border:
    1px solid #17283a;

  border-radius:
    10px;

  overflow:
    hidden;
}

.map-container {
  position: relative;

  min-width: 0;

  background:
    #03080d;
}

.map {
  width: 100%;
  height: 100%;

  background:
    #0b1824;
}


/* =====================================
   MAPA OSCURO
===================================== */

.map :deep(.leaflet-tile-pane) {
  filter:
    invert(100%)
    hue-rotate(180deg)
    brightness(85%)
    contrast(90%)
    saturate(65%);
}

.map :deep(.leaflet-tile) {
  filter: none;
}


/* =====================================
   CONTROLES LEAFLET
===================================== */

.map :deep(.leaflet-control-zoom a) {
  background:
    #07131f;

  border-color:
    #1c3a4d;

  color:
    #00e5ff;
}

.map :deep(.leaflet-control-zoom a:hover) {
  background:
    #102a3a;

  color: white;
}

.map :deep(.leaflet-control-attribution) {
  background:
    rgba(3, 8, 13, 0.75);

  color:
    #60758b;
}

.map :deep(.leaflet-control-attribution a) {
  color:
    #00a8c0;
}


/* =====================================
   CARGANDO
===================================== */

.loading {
  position:
    absolute;

  z-index: 1000;

  top: 15px;
  left: 50%;

  transform:
    translateX(-50%);

  padding:
    9px 14px;

  background:
    rgba(7, 19, 31, 0.96);

  border:
    1px solid #1c3a4d;

  border-radius:
    6px;

  color:
    #00e5ff;

  font-size:
    10px;
}


/* =====================================
   TARJETA RUTA
===================================== */

.selected-route-card {
  position:
    absolute;

  z-index: 1000;

  top: 15px;
  left: 50px;

  min-width: 130px;

  display: flex;

  flex-direction:
    column;

  padding:
    10px 13px;

  background:
    rgba(5, 15, 24, 0.95);

  border:
    1px solid #1c3a4d;

  border-radius:
    7px;
}

.selected-route-card span,
.selected-point-card span {
  color:
    #71869b;

  font-size:
    8px;
}

.selected-route-card strong {
  color:
    #00e5ff;

  font-size:
    19px;
}

.selected-route-card small,
.selected-point-card small {
  color:
    #91a4b8;

  font-size:
    9px;
}


/* =====================================
   TARJETA FIJO
===================================== */

.selected-point-card {
  position:
    absolute;

  z-index: 1000;

  top: 15px;
  left: 190px;

  min-width: 110px;

  display: flex;

  flex-direction:
    column;

  padding:
    10px 13px;

  background:
    rgba(5, 15, 24, 0.95);

  border:
    1px solid #5b5428;

  border-radius:
    7px;
}

.selected-point-card strong {
  color:
    #ffd54f;

  font-size:
    17px;
}


/* =====================================
   LIMPIAR
===================================== */

.clear-map-button {
  position:
    absolute;

  z-index: 1000;

  top: 15px;
  right: 15px;

  padding:
    8px 10px;

  background:
    rgba(5, 15, 24, 0.95);

  border:
    1px solid #1c3a4d;

  border-radius:
    6px;

  color:
    #91a4b8;

  font-size:
    9px;

  cursor:
    pointer;
}

.clear-map-button:hover {
  border-color:
    #00e5ff;

  color:
    #00e5ff;
}


/* =====================================
   ESTADO
===================================== */

.map-status {
  position:
    absolute;

  z-index: 1000;

  bottom: 15px;
  left: 15px;

  padding:
    10px 13px;

  background:
    rgba(5, 15, 24, 0.95);

  border:
    1px solid #1c3a4d;

  border-radius:
    7px;
}

.map-status div {
  color:
    #71869b;

  font-size:
    8px;
}

.map-status strong {
  margin-right:
    5px;

  color:
    #00e5ff;
}

.map-status span {
  color:
    #91a4b8;

  font-size:
    9px;
}


/* =====================================
   ERROR
===================================== */

.map-error {
  position:
    absolute;

  z-index: 1000;

  bottom: 15px;
  left: 50%;

  transform:
    translateX(-50%);

  padding:
    9px 13px;

  background:
    #29151b;

  border:
    1px solid #713442;

  border-radius:
    6px;

  color:
    #ff8795;

  font-size:
    10px;
}


/* =====================================
   PANEL DERECHO
===================================== */

.route-panel {
  display: flex;

  flex-direction:
    column;

  min-height: 0;

  background:
    #06111b;

  border-left:
    1px solid #17283a;
}

.panel-header {
  display: flex;

  justify-content:
    space-between;

  align-items:
    center;

  min-height: 55px;

  box-sizing:
    border-box;

  padding:
    12px 14px;

  border-bottom:
    1px solid #17283a;
}

.panel-header div {
  display: flex;

  align-items:
    center;

  gap: 8px;
}

.panel-header span {
  color:
    #71869b;

  font-size:
    9px;
}

.panel-header div strong {
  color:
    #00e5ff;

  font-size:
    15px;
}

.panel-count {
  color:
    #00e5ff;

  font-size:
    13px;
}


/* =====================================
   LISTA
===================================== */

.route-list {
  flex: 1;

  min-height: 0;

  overflow-y:
    auto;
}

.route-list::-webkit-scrollbar {
  width: 6px;
}

.route-list::-webkit-scrollbar-track {
  background:
    #050e16;
}

.route-list::-webkit-scrollbar-thumb {
  background:
    #1b3b4e;

  border-radius:
    4px;
}

.route-item {
  width: 100%;

  display: flex;

  justify-content:
    space-between;

  align-items:
    center;

  padding:
    12px 13px;

  background:
    transparent;

  border: none;

  border-bottom:
    1px solid #102231;

  cursor:
    pointer;

  text-align:
    left;
}

.route-item:hover {
  background:
    #0d2231;
}

.route-item.selected {
  background:
    #103342;

  box-shadow:
    inset 3px 0 0
    #00e5ff;
}

.route-item div {
  display: flex;

  flex-direction:
    column;

  gap: 3px;
}

.route-item strong {
  color:
    #5bd6dd;

  font-size:
    13px;
}

.route-item.selected strong {
  color:
    #00e5ff;
}

.route-item span {
  color:
    #71869b;

  font-size:
    9px;
}

.group-badge {
  padding:
    3px 6px;

  background:
    #102334;

  border-radius:
    4px;

  color:
    #5bd6dd !important;
}


/* =====================================
   MENSAJES
===================================== */

.panel-message {
  display: flex;

  flex-direction:
    column;

  align-items:
    center;

  gap: 8px;

  padding:
    30px 15px;

  color:
    #71869b;

  font-size:
    11px;

  text-align:
    center;
}

.panel-message small {
  color:
    #53677a;
}

.arrow-up {
  color:
    #00e5ff;

  font-size:
    20px;
}

.point-search-symbol {
  width: 34px;
  height: 34px;

  display: flex;

  align-items:
    center;

  justify-content:
    center;

  border:
    1px solid #ffd54f;

  border-radius:
    50%;

  color:
    #ffd54f;

  font-size:
    20px;
}

.panel-error {
  padding:
    20px 15px;

  color:
    #ff8795;

  font-size:
    10px;

  text-align:
    center;
}


/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 900px) {

  .map-toolbar {
    align-items:
      stretch;

    flex-direction:
      column;
  }

  .search-box {
    width: 100%;
  }

  .point-information {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .point-data {
    flex-wrap:
      wrap;
  }

  .map-layout {
    height: auto;

    grid-template-columns:
      1fr;
  }

  .map-container {
    height: 600px;
  }

  .route-panel {
    height: 300px;

    border-left:
      none;

    border-top:
      1px solid #17283a;
  }

}

</style>


<!-- ===================================
     ESTILOS LEAFLET GLOBALES
=================================== -->

<style>

/* =====================================
   NOMBRE PUNTO NORMAL
===================================== */

.point-label {
  background:
    rgba(
      5,
      15,
      24,
      0.96
    ) !important;

  border:
    1px solid
    rgba(
      0,
      229,
      255,
      0.65
    ) !important;

  border-radius:
    3px !important;

  padding:
    2px 5px !important;

  color:
    #00e5ff !important;

  font-family:
    inherit !important;

  font-size:
    9px !important;

  font-weight:
    bold !important;

  box-shadow:
    0 0 7px
    rgba(
      0,
      229,
      255,
      0.12
    ) !important;
}

.point-label::before {
  display:
    none !important;
}


/* =====================================
   FIJO BUSCADO
===================================== */

.selected-point-label {
  background:
    rgba(
      20,
      18,
      5,
      0.96
    ) !important;

  border:
    1px solid
    #ffd54f !important;

  border-radius:
    4px !important;

  padding:
    3px 7px !important;

  color:
    #ffd54f !important;

  font-family:
    inherit !important;

  font-size:
    11px !important;

  font-weight:
    700 !important;

  box-shadow:
    0 0 12px
    rgba(
      255,
      213,
      79,
      0.25
    ) !important;
}

.selected-point-label::before {
  display:
    none !important;
}


/* =====================================
   NOMBRE AEROVÍA
===================================== */

.airway-label {
  background:
    transparent !important;

  border:
    none !important;
}

.airway-label span {
  display:
    inline-block;

  padding:
    4px 8px;

  background:
    #00e5ff;

  border:
    1px solid #67f3ff;

  border-radius:
    4px;

  color:
    #031018;

  font-family:
    inherit;

  font-size:
    11px;

  font-weight:
    bold;

  white-space:
    nowrap;

  box-shadow:
    0 0 12px
    rgba(
      0,
      229,
      255,
      0.35
    );
}


/* =====================================
   TOOLTIP AEROVÍA
===================================== */

.route-tooltip {
  background:
    #051018 !important;

  border:
    1px solid
    #00e5ff !important;

  color:
    #00e5ff !important;

  font-family:
    inherit !important;

  font-weight:
    bold !important;

  box-shadow:
    0 0 10px
    rgba(
      0,
      229,
      255,
      0.15
    ) !important;
}

.route-tooltip::before {
  border-top-color:
    #00e5ff !important;
}


/* =====================================
   POPUP
===================================== */

.leaflet-popup-content-wrapper {
  background:
    #06111b;

  color:
    #dce7f1;

  border:
    1px solid #1c3a4d;

  box-shadow:
    0 5px 25px
    rgba(
      0,
      0,
      0,
      0.6
    );
}

.leaflet-popup-tip {
  background:
    #06111b;
}

.leaflet-popup-close-button {
  color:
    #71869b !important;
}

.leaflet-popup-close-button:hover {
  color:
    #00e5ff !important;
}

.atc-popup {
  min-width:
    190px;
}

.popup-type {
  color:
    #71869b;

  font-size:
    8px;
}

.popup-name {
  margin:
    3px 0 10px;

  color:
    #00e5ff;

  font-size:
    18px;

  font-weight:
    bold;
}

.point-popup-name {
  color:
    #ffd54f;
}

.popup-row {
  display: flex;

  justify-content:
    space-between;

  gap: 15px;

  padding:
    5px 0;

  border-top:
    1px solid #17283a;

  font-size:
    10px;
}

.popup-row span {
  color:
    #71869b;
}

.popup-row strong {
  color:
    #dce7f1;
}

/* =====================================
   BOTÓN MODIFICAR FIJO
===================================== */

.edit-point-button {
  margin-top: 12px;
  padding: 10px 16px;

  background: #102d35;
  border: 1px solid #00e5ff;
  border-radius: 6px;

  color: #00e5ff;

  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;

  cursor: pointer;
}

.edit-point-button:hover {
  background: #16414b;
  color: #ffffff;
}


/* =====================================
   FONDO DEL MODAL
===================================== */

.edit-point-overlay {
  position: fixed;
  inset: 0;

  z-index: 99999;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 30px;

  background: rgba(0, 0, 0, 0.72);

  backdrop-filter: blur(4px);
}


/* =====================================
   VENTANA
===================================== */

.edit-point-modal {
  width: min(700px, 95vw);

  max-height: 90vh;
  overflow-y: auto;

  padding: 24px;

  background: #07131f;

  border: 1px solid #1d5365;
  border-radius: 12px;

  box-shadow:
    0 25px 80px
    rgba(0, 0, 0, 0.55);
}


/* =====================================
   ENCABEZADO
===================================== */

.edit-point-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 24px;
}

.edit-point-header span {
  color: #71869b;

  font-size: 11px;

  letter-spacing: 1px;
}

.edit-point-header h2 {
  margin: 4px 0 0;

  color: #00e5ff;

  font-size: 22px;
}

.edit-point-close {
  border: none;

  background: transparent;

  color: #91a4b8;

  font-size: 28px;

  cursor: pointer;
}

.edit-point-close:hover {
  color: #ffffff;
}


/* =====================================
   FORMULARIO
===================================== */

.edit-point-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 18px;
}

.edit-point-grid label {
  display: flex;

  flex-direction: column;

  gap: 7px;
}

.edit-point-grid label > span {
  color: #71869b;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 0.7px;
}

.edit-point-grid input,
.edit-point-grid textarea {
  box-sizing: border-box;

  width: 100%;

  padding: 12px;

  background: #050e16;

  border: 1px solid #1c3a4d;

  border-radius: 6px;

  outline: none;

  color: #e3edf5;

  font-family: inherit;

  font-size: 14px;
}

.edit-point-grid input:focus,
.edit-point-grid textarea:focus {
  border-color: #00e5ff;

  box-shadow:
    0 0 0 2px
    rgba(0, 229, 255, 0.08);
}

.full-field {
  grid-column: 1 / -1;
}

.checkbox-field {
  flex-direction: row !important;

  align-items: center;

  justify-content: flex-start;
}

.checkbox-field input {
  width: 18px;
  height: 18px;
}


/* =====================================
   AEROVÍAS AFECTADAS
===================================== */

.affected-routes {
  margin-top: 22px;

  padding: 14px;

  background: #050e16;

  border: 1px solid #17283a;

  border-radius: 7px;
}

.affected-title {
  display: block;

  margin-bottom: 10px;

  color: #71869b;

  font-size: 11px;

  font-weight: 700;
}

.affected-list {
  display: flex;

  flex-wrap: wrap;

  gap: 7px;
}

.affected-list span {
  padding: 6px 10px;

  background: #103342;

  border: 1px solid #00a8c0;

  border-radius: 5px;

  color: #00e5ff;

  font-size: 12px;

  font-weight: 700;
}


/* =====================================
   MENSAJES
===================================== */

.edit-point-error,
.edit-point-success {
  margin-top: 16px;

  padding: 11px 13px;

  border-radius: 6px;

  font-size: 13px;
}

.edit-point-error {
  background: #29151b;

  border: 1px solid #713442;

  color: #ff8795;
}

.edit-point-success {
  background: #10281e;

  border: 1px solid #286344;

  color: #72e6a5;
}


/* =====================================
   BOTONES
===================================== */

.edit-point-actions {
  display: flex;

  justify-content: flex-end;

  gap: 10px;

  margin-top: 22px;
}

.cancel-edit-button,
.save-edit-button {
  padding: 11px 17px;

  border-radius: 6px;

  font-family: inherit;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;
}

.cancel-edit-button {
  background: #0b1b29;

  border: 1px solid #294156;

  color: #91a4b8;
}

.save-edit-button {
  background: #0c6873;

  border: 1px solid #00e5ff;

  color: #ffffff;
}

.save-edit-button:hover {
  background: #0b8490;
}

.save-edit-button:disabled,
.cancel-edit-button:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}

</style>