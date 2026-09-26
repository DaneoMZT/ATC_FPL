<template>
  <div class="routes-view">

    <!-- =====================================
         ENCABEZADO
    ====================================== -->

    <div class="title">
      <div>
        <h2>Rutas aéreas</h2>
        <span>Base de datos ATCFPL</span>
      </div>

      <div class="counter">
        {{ routes.length }} rutas
      </div>
    </div>


    <!-- =====================================
         BUSCADOR DE AEROVÍAS
    ====================================== -->

    <div class="search-container">

      <div class="search-box">

        <span class="search-icon">
          ⌕
        </span>

        <input
          v-model="searchRoute"
          type="text"
          placeholder="Buscar aerovía..."
          autocomplete="off"
        />

        <button
          v-if="searchRoute"
          class="clear-search"
          @click="clearSearch"
          title="Limpiar búsqueda"
        >
          ×
        </button>

      </div>

      <span class="search-result">
        {{ filteredRoutes.length }} aerovías encontradas
      </span>

    </div>


    <!-- =====================================
         CARGANDO
    ====================================== -->

    <div
      v-if="loading"
      class="message"
    >
      Cargando rutas...
    </div>


    <!-- =====================================
         ERROR
    ====================================== -->

    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>


    <!-- =====================================
         SIN RESULTADOS
    ====================================== -->

    <div
      v-else-if="filteredRoutes.length === 0"
      class="no-results"
    >
      <strong>No se encontraron aerovías</strong>

      <span>
        No existe ninguna ruta que coincida con
        "{{ searchRoute }}"
      </span>
    </div>


    <!-- =====================================
         TABLA DE RUTAS
    ====================================== -->

    <table v-else>

      <thead>
        <tr>
          <th>Ruta</th>
          <th>Puntos</th>
          <th></th>
        </tr>
      </thead>

      <tbody>

        <template
          v-for="route in filteredRoutes"
          :key="route._id"
        >

          <!-- =====================================
               FILA DE RUTA
          ====================================== -->

          <tr
            class="route-row"
            @click="toggleRoute(route._id)"
          >

            <td class="route-name">
              {{ route.route_name }}
            </td>

            <td>
              {{ route.points?.length || 0 }}
            </td>

            <td class="arrow">
              {{
                expandedRoute === route._id
                  ? '▲'
                  : '▼'
              }}
            </td>

          </tr>


          <!-- =====================================
               PUNTOS DE LA RUTA
          ====================================== -->

          <tr
            v-if="expandedRoute === route._id"
            class="points-row"
          >

            <td colspan="3">

              <div class="points-container">

                <div class="points-title">
                  PUNTOS DE LA RUTA
                  {{ route.route_name }}
                </div>


                <!-- SIN PUNTOS -->

                <div
                  v-if="
                    !route.points ||
                    route.points.length === 0
                  "
                  class="no-points"
                >
                  Esta ruta no contiene puntos.
                </div>


                <!-- LISTA DE PUNTOS -->

                <div
                  v-else
                  class="points-list"
                >

                  <button
                    v-for="(point, index) in route.points"
                    :key="index"
                    class="point"
                    @click.stop="selectPoint(point)"
                  >

                    <span class="point-number">
                      {{ index + 1 }}
                    </span>

                    <span class="point-name">
                      {{ getPointName(point) }}
                    </span>

                  </button>

                </div>

              </div>

            </td>

          </tr>

        </template>

      </tbody>

    </table>


    <!-- =====================================
         MODAL DEL PUNTO
    ====================================== -->

    <div
      v-if="selectedPoint || pointLoading"
      class="modal-overlay"
      @click="closePoint"
    >

      <div
        class="point-card"
        @click.stop
      >

        <!-- =====================================
             CARGANDO PUNTO
        ====================================== -->

        <div
          v-if="pointLoading"
          class="point-loading"
        >

          <div class="loading-circle"></div>

          <span>
            Consultando punto característico...
          </span>

        </div>


        <!-- =====================================
             INFORMACIÓN DEL PUNTO
        ====================================== -->

        <template v-else-if="selectedPoint">


          <!-- HEADER -->

          <div class="point-card-header">

            <div>

              <span class="card-label">
                PUNTO CARACTERÍSTICO
              </span>

              <h2>
                {{ getPointName(selectedPoint) }}
              </h2>

            </div>


            <button
              class="close-button"
              @click="closePoint"
              title="Cerrar"
            >
              ×
            </button>

          </div>


          <!-- =====================================
               POSICIÓN
          ====================================== -->

          <div class="coordinates">

            <div class="coordinate-main">

              <span>
                POSICIÓN
              </span>

              <strong>
                {{
                  selectedPoint.position?.raw ||
                  'N/D'
                }}
              </strong>

            </div>

          </div>


          <!-- =====================================
               INFORMACIÓN GENERAL
          ====================================== -->

          <div class="point-information">


            <!-- NOMBRE -->

            <div class="info-row">

              <span>
                Nombre
              </span>

              <strong>
                {{
                  selectedPoint.point_id ||
                  'N/D'
                }}
              </strong>

            </div>


            <!-- TIPO -->

            <div class="info-row">

              <span>
                Tipo
              </span>

              <strong>
                {{
                  selectedPoint.point_type ||
                  'N/D'
                }}
              </strong>

            </div>


            <!-- LATITUD -->

            <div class="info-row">

              <span>
                Latitud
              </span>

              <strong>
                {{
                  formatCoordinate(
                    selectedPoint.position?.latitude
                  )
                }}
              </strong>

            </div>


            <!-- LONGITUD -->

            <div class="info-row">

              <span>
                Longitud
              </span>

              <strong>
                {{
                  formatCoordinate(
                    selectedPoint.position?.longitude
                  )
                }}
              </strong>

            </div>


            <!-- AEROPUERTO -->

            <div class="info-row">

              <span>
                Aeropuerto asociado
              </span>

              <strong>
                {{
                  selectedPoint.airport_id ||
                  'N/D'
                }}
              </strong>

            </div>


            <!-- FIJO RELEVANTE -->

            <div class="info-row">

              <span>
                Fijo relevante
              </span>

              <strong
                :class="
                  selectedPoint.relevant_fix
                    ? 'yes'
                    : 'no'
                "
              >
                {{
                  selectedPoint.relevant_fix
                    ? 'SÍ'
                    : 'NO'
                }}
              </strong>

            </div>


            <!-- PIL DISPLAY -->

            <div class="info-row">

              <span>
                PIL Display
              </span>

              <strong
                :class="
                  selectedPoint.pil_display
                    ? 'yes'
                    : 'no'
                "
              >
                {{
                  selectedPoint.pil_display
                    ? 'SÍ'
                    : 'NO'
                }}
              </strong>

            </div>


            <!-- DTI -->

            <div class="info-row">

              <span>
                DTI
              </span>

              <strong
                :class="
                  selectedPoint.dti
                    ? 'yes'
                    : 'no'
                "
              >
                {{
                  selectedPoint.dti
                    ? 'SÍ'
                    : 'NO'
                }}
              </strong>

            </div>


            <!-- ID ALTERNATIVO -->

            <div
              v-if="selectedPoint.alternative_id"
              class="info-row"
            >

              <span>
                ID alternativo
              </span>

              <strong>
                {{ selectedPoint.alternative_id }}
              </strong>

            </div>

          </div>


          <!-- =====================================
               COMENTARIO
          ====================================== -->

          <div
            v-if="selectedPoint.comment"
            class="comment"
          >

            <span>
              COMENTARIO
            </span>

            <p>
              {{ selectedPoint.comment }}
            </p>

          </div>


          <!-- =====================================
               ESTADO
          ====================================== -->

          <div class="point-status">

            <span class="status-dot"></span>

            INFORMACIÓN DE BASE DE DATOS

          </div>

        </template>

      </div>

    </div>


    <!-- =====================================
         ERROR AL CONSULTAR PUNTO
    ====================================== -->

    <div
      v-if="pointError"
      class="notification-error"
    >

      {{ pointError }}

      <button
        @click="pointError = ''"
      >
        ×
      </button>

    </div>

  </div>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted
} from 'vue'


// =====================================
// VARIABLES
// =====================================

const routes = ref([])

const searchRoute = ref('')

const loading = ref(true)

const error = ref('')

const expandedRoute = ref(null)

const selectedPoint = ref(null)

const pointLoading = ref(false)

const pointError = ref('')


// =====================================
// FILTRAR AEROVÍAS
// =====================================

const filteredRoutes = computed(() => {

  const search = searchRoute.value
    .trim()
    .toUpperCase()

  if (!search) {
    return routes.value
  }

  return routes.value.filter((route) => {

    const routeName = String(
      route.route_name || ''
    ).toUpperCase()

    return routeName.includes(search)

  })

})


// =====================================
// LIMPIAR BUSCADOR
// =====================================

const clearSearch = () => {

  searchRoute.value = ''

  expandedRoute.value = null

}


// =====================================
// CARGAR RUTAS
// =====================================

const loadRoutes = async () => {

  try {

    loading.value = true

    error.value = ''

    const response = await fetch(
      'http://localhost:3000/api/routes'
    )

    if (!response.ok) {

      throw new Error(
        'Error consultando la API'
      )

    }

    routes.value = await response.json()

  } catch (err) {

    console.error(
      'Error cargando rutas:',
      err
    )

    error.value =
      'No se pudieron cargar las rutas'

  } finally {

    loading.value = false

  }

}


// =====================================
// ABRIR / CERRAR RUTA
// =====================================

const toggleRoute = (routeId) => {

  if (expandedRoute.value === routeId) {

    expandedRoute.value = null

  } else {

    expandedRoute.value = routeId

  }

}


// =====================================
// SELECCIONAR PUNTO
// =====================================

const selectPoint = async (point) => {

  const pointId =
    point.point_id ||
    point.route_point ||
    point.raw

  if (!pointId) {

    pointError.value =
      'El punto no tiene un identificador válido'

    return

  }


  try {

    pointError.value = ''

    selectedPoint.value = null

    pointLoading.value = true


    const response = await fetch(
      `http://localhost:3000/api/characteristic-points/${encodeURIComponent(pointId)}`
    )


    if (!response.ok) {

      if (response.status === 404) {

        throw new Error(
          `El punto ${pointId} no existe en characteristic_points`
        )

      }

      throw new Error(
        'Error consultando el punto'
      )

    }


    selectedPoint.value =
      await response.json()


  } catch (err) {

    console.error(
      'Error obteniendo punto característico:',
      err
    )

    pointError.value = err.message


  } finally {

    pointLoading.value = false

  }

}


// =====================================
// CERRAR MODAL
// =====================================

const closePoint = () => {

  selectedPoint.value = null

  pointLoading.value = false

}


// =====================================
// NOMBRE DEL PUNTO
// =====================================

const getPointName = (point) => {

  if (!point) {

    return 'SIN NOMBRE'

  }

  return (
    point.point_id ||
    point.route_point ||
    point.raw ||
    'SIN NOMBRE'
  )

}


// =====================================
// FORMATO DE COORDENADAS
// =====================================

const formatCoordinate = (coordinate) => {

  if (
    coordinate === null ||
    coordinate === undefined
  ) {

    return 'N/D'

  }

  const number = Number(coordinate)

  if (Number.isNaN(number)) {

    return 'N/D'

  }

  return number.toFixed(8)

}


// =====================================
// INICIAR
// =====================================

onMounted(() => {

  loadRoutes()

})

</script>


<style scoped>

/* =====================================
   CONTENEDOR
===================================== */

.routes-view {
  padding: 30px;

  color: #dce7f1;
}


/* =====================================
   ENCABEZADO
===================================== */

.title {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 20px;
}


.title h2 {
  margin: 0 0 5px;

  color: #00e5ff;
}


.title span {
  color: #71869b;

  font-size: 12px;
}


.counter {
  background: #123847;

  color: #5bd6dd;

  padding: 8px 14px;

  border-radius: 8px;

  font-size: 12px;
}


/* =====================================
   BUSCADOR
===================================== */

.search-container {
  display: flex;

  align-items: center;

  gap: 15px;

  margin-bottom: 20px;
}


.search-box {
  width: 350px;

  height: 42px;

  display: flex;

  align-items: center;

  background: #0a1725;

  border: 1px solid #17283a;

  border-radius: 8px;

  padding: 0 12px;

  box-sizing: border-box;

  transition: 0.2s;
}


.search-box:focus-within {
  border-color: #00e5ff;

  box-shadow:
    0 0 0 2px rgba(0, 229, 255, 0.08);
}


.search-icon {
  color: #60758b;

  font-size: 20px;

  margin-right: 10px;
}


.search-box input {
  flex: 1;

  min-width: 0;

  border: none;

  outline: none;

  background: transparent;

  color: #dce7f1;

  font-family: 'JetBrains Mono', monospace;

  font-size: 13px;

  text-transform: uppercase;
}


.search-box input::placeholder {
  color: #52677b;

  text-transform: none;
}


.clear-search {
  border: none;

  background: transparent;

  color: #60758b;

  font-size: 20px;

  cursor: pointer;

  padding: 0 4px;
}


.clear-search:hover {
  color: #ffffff;
}


.search-result {
  color: #71869b;

  font-size: 11px;
}


/* =====================================
   SIN RESULTADOS
===================================== */

.no-results {
  min-height: 150px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 7px;

  background: #0a1725;

  border: 1px solid #17283a;

  border-radius: 8px;

  color: #71869b;
}


.no-results strong {
  color: #dce7f1;

  font-size: 13px;
}


.no-results span {
  font-size: 11px;
}


/* =====================================
   TABLA
===================================== */

table {
  width: 100%;

  border-collapse: collapse;

  background: #0a1725;

  border: 1px solid #17283a;

  border-radius: 8px;

  overflow: hidden;
}


th {
  text-align: left;

  padding: 13px 16px;

  background: #0d1d2c;

  color: #71869b;

  font-size: 11px;

  letter-spacing: 0.5px;
}


td {
  padding: 13px 16px;

  border-top: 1px solid #17283a;
}


/* =====================================
   RUTA
===================================== */

.route-row {
  cursor: pointer;

  transition: 0.2s;
}


.route-row:hover {
  background: #102334;
}


.route-name {
  color: #5bd6dd;

  font-weight: bold;

  font-family: 'JetBrains Mono', monospace;

  font-size: 14px;
}


.arrow {
  width: 40px;

  text-align: center;

  color: #71869b;

  font-size: 10px;
}


/* =====================================
   PUNTOS DE LA RUTA
===================================== */

.points-row {
  background: #07121d;
}


.points-row td {
  padding: 0;
}


.points-container {
  padding: 20px 30px;
}


.points-title {
  color: #71869b;

  font-size: 10px;

  margin-bottom: 15px;

  letter-spacing: 1px;
}


.points-list {
  display: flex;

  flex-wrap: wrap;

  align-items: center;

  gap: 8px;
}


.point {
  display: flex;

  align-items: center;

  gap: 7px;

  background: #102334;

  border: 1px solid #1b3548;

  padding: 8px 12px;

  border-radius: 6px;

  cursor: pointer;

  transition: 0.2s;
}


.point:hover {
  background: #123847;

  border-color: #00e5ff;

  transform: translateY(-1px);
}


.point-number {
  display: flex;

  align-items: center;

  justify-content: center;

  width: 20px;

  height: 20px;

  border-radius: 50%;

  background: #123847;

  color: #5bd6dd;

  font-size: 10px;
}


.point-name {
  color: #dce7f1;

  font-family: 'JetBrains Mono', monospace;

  font-size: 13px;

  font-weight: bold;
}


.no-points {
  color: #71869b;

  font-size: 12px;
}


/* =====================================
   MODAL
===================================== */

.modal-overlay {
  position: fixed;

  top: 0;

  left: 0;

  width: 100%;

  height: 100%;

  background: rgba(2, 8, 15, 0.78);

  backdrop-filter: blur(3px);

  display: flex;

  align-items: center;

  justify-content: center;

  z-index: 5000;
}


/* =====================================
   TARJETA DEL PUNTO
===================================== */

.point-card {
  width: 430px;

  max-width: calc(100% - 40px);

  max-height: 90vh;

  overflow-y: auto;

  background: #091522;

  border: 1px solid #1c3a4d;

  border-radius: 12px;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5);
}


/* =====================================
   HEADER DE LA TARJETA
===================================== */

.point-card-header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 22px 25px;

  border-bottom: 1px solid #17283a;
}


.card-label {
  color: #60758b;

  font-size: 9px;

  letter-spacing: 1.5px;
}


.point-card-header h2 {
  margin: 4px 0 0;

  color: #00e5ff;

  font-family: 'JetBrains Mono', monospace;

  font-size: 25px;
}


.close-button {
  border: none;

  background: transparent;

  color: #71869b;

  font-size: 26px;

  cursor: pointer;
}


.close-button:hover {
  color: #ffffff;
}


/* =====================================
   POSICIÓN
===================================== */

.coordinates {
  padding: 18px 25px;

  background: #07121d;

  border-bottom: 1px solid #17283a;
}


.coordinate-main {
  display: flex;

  flex-direction: column;

  gap: 5px;
}


.coordinate-main span {
  color: #60758b;

  font-size: 9px;

  letter-spacing: 1px;
}


.coordinate-main strong {
  color: #dce7f1;

  font-family: 'JetBrains Mono', monospace;

  font-size: 17px;

  letter-spacing: 1px;
}


/* =====================================
   INFORMACIÓN DEL PUNTO
===================================== */

.point-information {
  padding: 15px 25px;
}


.info-row {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;

  padding: 10px 0;

  border-bottom: 1px solid #122536;
}


.info-row:last-child {
  border-bottom: none;
}


.info-row span {
  color: #71869b;

  font-size: 11px;
}


.info-row strong {
  color: #dce7f1;

  font-family: 'JetBrains Mono', monospace;

  font-size: 12px;

  text-align: right;
}


.info-row .yes {
  color: #4fd68a;
}


.info-row .no {
  color: #71869b;
}


/* =====================================
   COMENTARIO
===================================== */

.comment {
  margin: 0 25px 20px;

  padding: 12px;

  background: #102334;

  border: 1px solid #172f42;

  border-radius: 6px;
}


.comment span {
  color: #60758b;

  font-size: 9px;

  letter-spacing: 1px;
}


.comment p {
  margin: 6px 0 0;

  color: #dce7f1;

  font-size: 12px;

  line-height: 1.5;
}


/* =====================================
   ESTADO
===================================== */

.point-status {
  display: flex;

  align-items: center;

  gap: 7px;

  padding: 14px 25px;

  border-top: 1px solid #17283a;

  color: #4fd68a;

  font-size: 9px;

  letter-spacing: 1px;
}


.status-dot {
  width: 6px;

  height: 6px;

  border-radius: 50%;

  background: #4fd68a;

  box-shadow: 0 0 7px #4fd68a;
}


/* =====================================
   CARGANDO PUNTO
===================================== */

.point-loading {
  min-height: 180px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  gap: 15px;

  color: #71869b;

  font-size: 12px;
}


.loading-circle {
  width: 25px;

  height: 25px;

  border: 3px solid #17283a;

  border-top-color: #00e5ff;

  border-radius: 50%;

  animation: spin 0.8s linear infinite;
}


@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* =====================================
   ERROR DEL PUNTO
===================================== */

.notification-error {
  position: fixed;

  right: 25px;

  bottom: 25px;

  background: #29151b;

  border: 1px solid #713442;

  color: #ff8795;

  padding: 12px 15px;

  border-radius: 7px;

  font-size: 12px;

  z-index: 6000;
}


.notification-error button {
  margin-left: 15px;

  border: none;

  background: transparent;

  color: #ff8795;

  cursor: pointer;

  font-size: 16px;
}


/* =====================================
   MENSAJES
===================================== */

.message {
  color: #71869b;
}


.error {
  color: #ff6b6b;
}


/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 700px) {

  .search-container {
    flex-direction: column;

    align-items: stretch;
  }


  .search-box {
    width: 100%;
  }


  .search-result {
    padding-left: 3px;
  }

}

</style>