<template>
  <div class="settings-page">
    <!-- =====================================
         ENCABEZADO
    ====================================== -->
    <div class="page-header">
      <div>
        <h1>Configuración</h1>
        <p>Administración del sistema ATCFPL</p>
      </div>

      <div class="root-badge">ROOT</div>
    </div>

    <!-- =====================================
         MENSAJES
    ====================================== -->
    <div v-if="error" class="error-box">
      {{ error }}
    </div>

    <div v-if="successMessage" class="success-box">
      {{ successMessage }}
    </div>

    <!-- =====================================
         ESTADO MONGODB
    ====================================== -->
    <section class="database-card">
      <div class="card-header">
        <div>
          <h2>Base de datos</h2>
          <p>Explorador y administración de MongoDB</p>
        </div>

        <button class="refresh-button" @click="loadDatabase" :disabled="loading">
          ↻ Actualizar
        </button>
      </div>

      <div class="database-status">
        <span class="status-dot" :class="{ offline: !databaseStatus.connected }"></span>

        <div class="status-text">
          <strong>MongoDB</strong>

          <span v-if="loading"> Consultando... </span>

          <span v-else-if="databaseStatus.connected">
            CONECTADO · {{ databaseStatus.database }}
          </span>

          <span v-else> SIN CONEXIÓN </span>
        </div>

        <div v-if="databaseStatus.connected" class="database-info">
          {{ databaseStatus.collections }} colecciones
        </div>
      </div>
    </section>

    <!-- =====================================
         EXPLORADOR
    ====================================== -->
    <section v-if="databaseStatus.connected" class="explorer">
      <!-- PANEL COLECCIONES -->
      <div class="collections-panel">
        <div class="panel-title">
          <div>
            <h3>Colecciones</h3>
            <span> {{ collections.length }} disponibles </span>
          </div>
        </div>

        <div class="collection-list">
          <button
            v-for="collection in collections"
            :key="collection.name"
            class="collection-item"
            :class="{
              active: selectedCollection === collection.name,
            }"
            @click="selectCollection(collection.name)"
          >
            <div class="collection-name">
              <span class="collection-icon">▣</span>
              {{ collection.name }}
            </div>

            <span class="collection-count">
              {{ collection.documents }}
            </span>
          </button>
        </div>
      </div>

      <!-- PANEL DOCUMENTOS -->
      <div class="documents-panel">
        <div v-if="!selectedCollection" class="empty-state">
          <div class="empty-icon">▣</div>
          <h3>Explorador MongoDB</h3>
          <p>Selecciona una colección para visualizar sus documentos.</p>
        </div>

        <template v-else>
          <!-- =================================
               BUSCADOR CHARACTERISTIC POINTS
          ================================== -->
          <div v-if="selectedCollection === 'characteristic_points'" class="database-search">
            <div class="search-header">
              <div>
                <h3>Administrar puntos característicos</h3>

                <span> Busca, agrega, modifica o elimina puntos de navegación </span>
              </div>

              <div class="search-header-actions">
                <div class="root-edit-badge">ROOT · EDICIÓN</div>

                <button class="add-button" @click="openAddPoint">+ Agregar punto</button>
              </div>
            </div>

            <div class="search-controls">
              <input
                v-model="searchText"
                type="text"
                placeholder="Ejemplo: KINAL, REPORT, MMMZ..."
                @keyup.enter="searchDatabase"
              />

              <button @click="searchDatabase" :disabled="searchLoading">
                {{ searchLoading ? 'Buscando...' : '⌕ Buscar' }}
              </button>
            </div>

            <div v-if="searchPerformed" class="search-results">
              <div class="search-results-header">
                {{ searchResults.length }}
                resultado(s)
              </div>

              <div v-if="searchResults.length === 0 && !searchLoading" class="search-empty">
                No se encontraron puntos.
              </div>

              <div v-for="point in searchResults" :key="point._id" class="search-result">
                <div class="result-main">
                  <strong>
                    {{ point.point_id }}
                  </strong>

                  <span>
                    {{ point.point_type || 'SIN TIPO' }}
                  </span>
                </div>

                <div class="result-position">
                  <span>
                    LAT:
                    {{ point.position?.latitude ?? '-' }}
                  </span>

                  <span>
                    LON:
                    {{ point.position?.longitude ?? '-' }}
                  </span>
                </div>

                <div class="result-airport">
                  {{ point.airport_id || 'Sin aeropuerto' }}
                </div>

                <button class="edit-button" @click="editPoint(point)">Editar</button>
              </div>
            </div>
          </div>

          <!-- =================================
               EDITOR
          ================================== -->
          <div v-if="editingPoint || addingPoint" class="edit-panel">
            <div class="edit-header">
              <div>
                <h3>
                  {{ addingPoint ? 'Agregar nuevo punto' : 'Editar punto característico' }}
                </h3>

                <span v-if="!addingPoint">
                  Registro original:
                  {{ editForm.original_point_id }}
                </span>

                <span v-else> Nuevo registro en characteristic_points </span>
              </div>

              <button class="close-edit" @click="cancelEdit" title="Cerrar">×</button>
            </div>

            <div class="edit-grid">
              <!-- ID -->
              <label>
                <span>Identificador</span>

                <input v-model="editForm.point_id" type="text" placeholder="KINAL" />
              </label>

              <!-- TIPO -->
              <label>
                <span>Tipo</span>

                <input v-model="editForm.point_type" type="text" placeholder="REPORT" />
              </label>

              <!-- LATITUD -->
              <label>
                <span>Latitud</span>

                <input
                  v-model="editForm.latitude"
                  type="number"
                  step="any"
                  placeholder="Ej. 17.65055556"
                  @input="updatePositionRaw"
                />
              </label>

              <!-- LONGITUD -->
              <label>
                <span>Longitud</span>

                <input
                  v-model="editForm.longitude"
                  type="number"
                  step="any"
                  placeholder="Ej. -89.1625"
                  @input="updatePositionRaw"
                />
              </label>

              <!-- RAW -->
              <label class="full-field">
                <span>Posición RAW / DMS</span>

                <input
                  v-model="editForm.position_raw"
                  type="text"
                  placeholder="Ej. 173902N0890945W"
                  maxlength="15"
                  @input="updateCoordinatesFromRaw"
                />
              </label>

              <!-- AEROPUERTO -->
              <label>
                <span>Aeropuerto</span>

                <input v-model="editForm.airport_id" type="text" placeholder="Ej. MMMZ" />
              </label>

              <!-- RELEVANT FIX -->
              <label class="checkbox-field">
                <input v-model="editForm.relevant_fix" type="checkbox" />

                <span>Relevant Fix</span>
              </label>

              <!-- COMENTARIO -->
              <label class="full-field">
                <span>Comentario</span>

                <textarea
                  v-model="editForm.comment"
                  rows="3"
                  placeholder="Comentario del punto..."
                ></textarea>
              </label>
            </div>

            <div class="edit-actions">
              <button class="cancel-button" @click="cancelEdit">Cancelar</button>

              <button
                v-if="!addingPoint"
                class="delete-button"
                @click="deletePoint"
                :disabled="deletingPoint"
              >
                {{ deletingPoint ? 'Eliminando...' : 'Eliminar' }}
              </button>

              <button
                v-if="!addingPoint"
                class="save-button"
                @click="savePoint"
                :disabled="savingPoint"
              >
                {{ savingPoint ? 'Actualizando...' : 'Actualizar' }}
              </button>

              <button
                v-if="addingPoint"
                class="save-button"
                @click="createPoint"
                :disabled="creatingPoint"
              >
                {{ creatingPoint ? 'Creando...' : 'Crear punto' }}
              </button>
            </div>
          </div>

          <!-- CABECERA DOCUMENTOS -->
          <div class="documents-header">
            <div>
              <h3>
                {{ selectedCollection }}
              </h3>

              <span>
                {{ totalDocuments }}
                documentos
              </span>
            </div>

            <div class="page-info">
              Página
              {{ currentPage }}
              de
              {{ totalPages }}
            </div>
          </div>

          <div v-if="documentsLoading" class="loading">Consultando documentos...</div>

          <div v-else-if="documents.length === 0" class="empty-state">
            No existen documentos en esta colección.
          </div>

          <div v-else class="documents-list">
            <div
              v-for="(document, index) in documents"
              :key="document._id || index"
              class="document-card"
            >
              <div class="document-header">
                <span>
                  Documento
                  {{ (currentPage - 1) * pageLimit + index + 1 }}
                </span>

                <span class="document-id">
                  {{ document._id || 'Sin _id' }}
                </span>
              </div>

              <pre>{{ formatDocument(document) }}</pre>
            </div>
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1">
              ← Anterior
            </button>

            <span>
              {{ currentPage }}
              /
              {{ totalPages }}
            </span>

            <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages">
              Siguiente →
            </button>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// =====================================
// API
// =====================================

const API_URL = 'http://localhost:3000'

// =====================================
// ESTADO GENERAL
// =====================================

const loading = ref(false)
const documentsLoading = ref(false)

const error = ref('')
const successMessage = ref('')

// =====================================
// ESTADO MONGODB
// =====================================

const databaseStatus = ref({
  connected: false,
  database: '',
  collections: 0,
})

// =====================================
// COLECCIONES
// =====================================

const collections = ref([])
const selectedCollection = ref('')

// =====================================
// DOCUMENTOS
// =====================================

const documents = ref([])

const currentPage = ref(1)
const totalPages = ref(1)
const totalDocuments = ref(0)

const pageLimit = 20

// =====================================
// BÚSQUEDA
// =====================================

const searchText = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchPerformed = ref(false)

// =====================================
// EDICIÓN / ALTA
// =====================================

const editingPoint = ref(null)
const addingPoint = ref(false)

const savingPoint = ref(false)
const deletingPoint = ref(false)
const creatingPoint = ref(false)

const editForm = ref({
  original_point_id: '',
  point_id: '',
  point_type: '',
  latitude: '',
  longitude: '',
  position_raw: '',
  relevant_fix: false,
  airport_id: '',
  comment: '',
})

// =====================================
// TOKEN
// =====================================

function getToken() {
  return localStorage.getItem('atcfpl_token')
}

// =====================================
// PETICIÓN API
// =====================================

async function apiRequest(url, options = {}) {
  const token = getToken()

  if (!token) {
    throw new Error('No existe una sesión válida. Cierra sesión e inicia nuevamente como ROOT.')
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,

    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(data.error || 'Sesión no autorizada. Inicia nuevamente como ROOT.')
    }

    if (response.status === 403) {
      throw new Error(data.error || 'Esta operación está disponible únicamente para ROOT.')
    }

    throw new Error(data.error || `Error HTTP ${response.status} consultando el servidor.`)
  }

  return data
}

// =====================================
// ESTADO BASE DE DATOS
// =====================================

async function loadDatabaseStatus() {
  const data = await apiRequest('/api/admin/database/status')

  databaseStatus.value = data
}

// =====================================
// COLECCIONES
// =====================================

async function loadCollections() {
  const data = await apiRequest('/api/admin/database/collections')

  collections.value = data.collections || []
}

// =====================================
// DOCUMENTOS
// =====================================

async function loadDocuments() {
  if (!selectedCollection.value) {
    return
  }

  try {
    documentsLoading.value = true
    error.value = ''

    const data = await apiRequest(
      `/api/admin/database/collections/${encodeURIComponent(
        selectedCollection.value,
      )}?page=${currentPage.value}&limit=${pageLimit}`,
    )

    documents.value = data.documents || []

    totalDocuments.value = data.total || 0

    totalPages.value = data.pages || 1
  } catch (err) {
    console.error(err)

    error.value = err.message

    documents.value = []
    totalDocuments.value = 0
    totalPages.value = 1
  } finally {
    documentsLoading.value = false
  }
}

// =====================================
// SELECCIONAR COLECCIÓN
// =====================================

async function selectCollection(name) {
  selectedCollection.value = name

  currentPage.value = 1

  error.value = ''
  successMessage.value = ''

  searchText.value = ''
  searchResults.value = []
  searchPerformed.value = false

  cancelEdit()

  await loadDocuments()
}

// =====================================
// PAGINACIÓN
// =====================================

async function changePage(page) {
  if (page < 1 || page > totalPages.value) {
    return
  }

  currentPage.value = page

  await loadDocuments()
}

// =====================================
// FORMATO JSON
// =====================================

function formatDocument(document) {
  return JSON.stringify(document, null, 2)
}

// =====================================
// BUSCAR PUNTOS
// =====================================

async function searchDatabase() {
  const value = searchText.value.trim()

  if (!value) {
    searchResults.value = []
    searchPerformed.value = false
    return
  }

  if (selectedCollection.value !== 'characteristic_points') {
    return
  }

  try {
    searchLoading.value = true
    searchPerformed.value = true

    error.value = ''
    successMessage.value = ''

    const data = await apiRequest(
      `/api/admin/database/search?collection=characteristic_points&q=${encodeURIComponent(value)}`,
    )

    searchResults.value = data.documents || []
  } catch (err) {
    console.error(err)

    error.value = err.message
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// =====================================
// ABRIR FORMULARIO NUEVO PUNTO
// =====================================

function openAddPoint() {
  editingPoint.value = null
  addingPoint.value = true

  editForm.value = {
    original_point_id: '',
    point_id: '',
    point_type: '',
    latitude: '',
    longitude: '',
    position_raw: '',
    relevant_fix: false,
    airport_id: '',
    comment: '',
  }

  error.value = ''
  successMessage.value = ''
}

// =====================================
// ABRIR EDITOR
// =====================================

function editPoint(point) {
  addingPoint.value = false
  editingPoint.value = point

  editForm.value = {
    original_point_id: point.point_id || '',

    point_id: point.point_id || '',

    point_type: point.point_type || '',

    latitude: point.position?.latitude ?? '',

    longitude: point.position?.longitude ?? '',

    position_raw: point.position?.raw || '',

    relevant_fix: Boolean(point.relevant_fix),

    airport_id: point.airport_id || '',

    comment: point.comment || '',
  }

  error.value = ''
  successMessage.value = ''
}

// =====================================
// CANCELAR EDICIÓN / ALTA
// =====================================

function cancelEdit() {
  editingPoint.value = null
  addingPoint.value = false

  editForm.value = {
    original_point_id: '',
    point_id: '',
    point_type: '',
    latitude: '',
    longitude: '',
    position_raw: '',
    relevant_fix: false,
    airport_id: '',
    comment: '',
  }
}

// =====================================
// VALIDAR FORMULARIO
// =====================================

function validatePointForm() {
  const pointId = editForm.value.point_id.trim().toUpperCase()

  if (!pointId) {
    throw new Error('El identificador del punto es obligatorio.')
  }

  if (editForm.value.latitude === '' || editForm.value.latitude === null) {
    throw new Error('La latitud es obligatoria.')
  }

  if (editForm.value.longitude === '' || editForm.value.longitude === null) {
    throw new Error('La longitud es obligatoria.')
  }

  const latitude = Number(editForm.value.latitude)

  const longitude = Number(editForm.value.longitude)

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('La latitud debe estar entre -90 y 90.')
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('La longitud debe estar entre -180 y 180.')
  }

  return {
    pointId,
    latitude,
    longitude,
  }
}

// =====================================
// CREAR NUEVO PUNTO - SOLO ROOT
// =====================================

async function createPoint() {
  try {
    creatingPoint.value = true

    error.value = ''
    successMessage.value = ''

    const { pointId, latitude, longitude } = validatePointForm()

    const payload = {
      point_id: pointId,

      point_type: editForm.value.point_type.trim().toUpperCase(),

      latitude,

      longitude,

      position_raw: editForm.value.position_raw.trim(),

      relevant_fix: Boolean(editForm.value.relevant_fix),

      airport_id: editForm.value.airport_id.trim()
        ? editForm.value.airport_id.trim().toUpperCase()
        : null,

      comment: editForm.value.comment.trim() || null,
    }

    const data = await apiRequest('/api/admin/database/characteristic-points', {
      method: 'POST',

      body: JSON.stringify(payload),
    })

    const message = data.message || `Punto ${pointId} creado correctamente.`

    cancelEdit()

    searchText.value = pointId

    await searchDatabase()

    currentPage.value = 1
    await loadDocuments()

    await loadCollections()

    await loadDatabaseStatus()

    successMessage.value = message
  } catch (err) {
    console.error(err)

    error.value = err.message
  } finally {
    creatingPoint.value = false
  }
}

// =====================================
// ACTUALIZAR PUNTO - SOLO ROOT
// =====================================

async function savePoint() {
  try {
    savingPoint.value = true

    error.value = ''
    successMessage.value = ''

    const { pointId, latitude, longitude } = validatePointForm()

    const originalId = editForm.value.original_point_id

    if (!originalId) {
      throw new Error('No existe un identificador original para actualizar.')
    }

    const payload = {
      point_id: pointId,

      point_type: editForm.value.point_type.trim().toUpperCase(),

      latitude,

      longitude,

      position_raw: editForm.value.position_raw.trim(),

      relevant_fix: Boolean(editForm.value.relevant_fix),

      airport_id: editForm.value.airport_id.trim()
        ? editForm.value.airport_id.trim().toUpperCase()
        : null,

      comment: editForm.value.comment.trim() || null,
    }

    const data = await apiRequest(
      `/api/admin/database/characteristic-points/${encodeURIComponent(originalId)}`,
      {
        method: 'PUT',

        body: JSON.stringify(payload),
      },
    )

    const message = data.message || `Punto ${pointId} actualizado correctamente.`

    cancelEdit()

    searchText.value = pointId

    await searchDatabase()

    if (selectedCollection.value === 'characteristic_points') {
      await loadDocuments()
    }

    await loadCollections()

    successMessage.value = message
  } catch (err) {
    console.error(err)

    error.value = err.message
  } finally {
    savingPoint.value = false
  }
}

// =====================================
// ELIMINAR PUNTO - SOLO ROOT
// =====================================

async function deletePoint() {
  const pointId = editForm.value.original_point_id

  if (!pointId) {
    error.value = 'No hay un punto seleccionado.'

    return
  }

  const confirmed = window.confirm(
    `¿Está seguro de eliminar el punto ${pointId}?\n\n` +
      `Esta operación modificará directamente MongoDB.\n\n` +
      `Si el punto está siendo utilizado por una aerovía, SID o STAR, ` +
      `el servidor puede bloquear la eliminación.`,
  )

  if (!confirmed) {
    return
  }

  try {
    deletingPoint.value = true

    error.value = ''
    successMessage.value = ''

    const data = await apiRequest(
      `/api/admin/database/characteristic-points/${encodeURIComponent(pointId)}`,
      {
        method: 'DELETE',
      },
    )

    const message = data.message || `Punto ${pointId} eliminado correctamente.`

    cancelEdit()

    searchResults.value = []
    searchPerformed.value = false
    searchText.value = ''

    currentPage.value = 1
    await loadDocuments()

    await loadCollections()
    await loadDatabaseStatus()

    successMessage.value = message
  } catch (err) {
    console.error(err)

    error.value = err.message
  } finally {
    deletingPoint.value = false
  }
}

// =====================================
// CARGA GENERAL
// =====================================

async function loadDatabase() {
  try {
    loading.value = true

    error.value = ''
    successMessage.value = ''

    await loadDatabaseStatus()

    if (databaseStatus.value.connected) {
      await loadCollections()
    }
  } catch (err) {
    console.error(err)

    databaseStatus.value.connected = false

    error.value = err.message

    collections.value = []
  } finally {
    loading.value = false
  }
}

// =====================================
// DECIMAL → DMS
// Ejemplo:
// 17.65055556, -89.1625
// -> 173902N0890945W
// =====================================

function decimalToDMS(value, type) {
  const decimal = Number(value)

  if (!Number.isFinite(decimal)) {
    return ''
  }

  const absolute = Math.abs(decimal)

  let degrees = Math.floor(absolute)

  const minutesDecimal = (absolute - degrees) * 60

  let minutes = Math.floor(minutesDecimal)

  let seconds = Math.round((minutesDecimal - minutes) * 60)

  if (seconds === 60) {
    seconds = 0
    minutes += 1
  }

  if (minutes === 60) {
    minutes = 0
    degrees += 1
  }

  if (type === 'lat') {
    const hemisphere = decimal >= 0 ? 'N' : 'S'

    return (
      String(degrees).padStart(2, '0') +
      String(minutes).padStart(2, '0') +
      String(seconds).padStart(2, '0') +
      hemisphere
    )
  }

  const hemisphere = decimal >= 0 ? 'E' : 'W'

  return (
    String(degrees).padStart(3, '0') +
    String(minutes).padStart(2, '0') +
    String(seconds).padStart(2, '0') +
    hemisphere
  )
}

// =====================================
// LAT/LON → POSITION_RAW
// =====================================

function updatePositionRaw() {
  if (editForm.value.latitude === '' || editForm.value.longitude === '') {
    return
  }

  const latitude = Number(editForm.value.latitude)

  const longitude = Number(editForm.value.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return
  }

  const latDMS = decimalToDMS(latitude, 'lat')

  const lonDMS = decimalToDMS(longitude, 'lon')

  editForm.value.position_raw = `${latDMS}${lonDMS}`
}

// =====================================
// DMS → DECIMAL
// =====================================

function dmsToDecimal(degrees, minutes, seconds, hemisphere) {
  let decimal = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600

  if (hemisphere === 'S' || hemisphere === 'W') {
    decimal *= -1
  }

  return decimal
}

// =====================================
// POSITION_RAW → LAT/LON
//
// Formato:
// DDMMSSNDDDMMSSW
// Ejemplo:
// 173902N0890945W
// =====================================

function updateCoordinatesFromRaw() {
  const raw = String(editForm.value.position_raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

  editForm.value.position_raw = raw

  const pattern = /^(\d{2})(\d{2})(\d{2})([NS])(\d{3})(\d{2})(\d{2})([EW])$/

  const match = raw.match(pattern)

  if (!match) {
    return
  }

  const latDegrees = Number(match[1])

  const latMinutes = Number(match[2])

  const latSeconds = Number(match[3])

  const latHemisphere = match[4]

  const lonDegrees = Number(match[5])

  const lonMinutes = Number(match[6])

  const lonSeconds = Number(match[7])

  const lonHemisphere = match[8]

  if (
    latDegrees > 90 ||
    lonDegrees > 180 ||
    latMinutes > 59 ||
    lonMinutes > 59 ||
    latSeconds > 59 ||
    lonSeconds > 59
  ) {
    return
  }

  const latitude = dmsToDecimal(latDegrees, latMinutes, latSeconds, latHemisphere)

  const longitude = dmsToDecimal(lonDegrees, lonMinutes, lonSeconds, lonHemisphere)

  editForm.value.latitude = Number(latitude.toFixed(8))

  editForm.value.longitude = Number(longitude.toFixed(8))
}

// =====================================
// INICIO
// =====================================

onMounted(() => {
  loadDatabase()
})
</script>

<style scoped>
.settings-page {
  min-height: 100%;
  padding: 25px;
  box-sizing: border-box;
  background: #07111b;
  color: white;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.page-header h1 {
  margin: 0;
  color: #00e5ff;
  font-size: 27px;
}

.page-header p {
  margin: 6px 0 0;
  color: #71869b;
  font-size: 13px;
}

.root-badge {
  padding: 7px 14px;
  border: 1px solid #00e5ff;
  border-radius: 6px;
  color: #00e5ff;
  font-size: 11px;
  font-weight: bold;
}

.error-box {
  margin-bottom: 15px;
  padding: 12px 15px;
  border: 1px solid #8e3b45;
  border-radius: 6px;
  background: #341b20;
  color: #ff9da8;
}

.success-box {
  margin-bottom: 15px;
  padding: 12px 15px;
  border: 1px solid #24785d;
  border-radius: 6px;
  background: #102d25;
  color: #72e6bd;
}

.database-card {
  margin-bottom: 20px;
  padding: 18px;
  border: 1px solid #1d3447;
  border-radius: 8px;
  background: #0a1723;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 18px;
}

.card-header h2 {
  margin: 0;
  color: white;
  font-size: 17px;
}

.card-header p {
  margin: 5px 0 0;
  color: #71869b;
  font-size: 11px;
}

.refresh-button {
  padding: 8px 13px;
  border: 1px solid #29445c;
  border-radius: 5px;
  background: #102130;
  color: #91a4b8;
  cursor: pointer;
}

.refresh-button:hover {
  border-color: #00e5ff;
  color: #00e5ff;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.database-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #44d69c;
  box-shadow: 0 0 8px rgba(68, 214, 156, 0.55);
}

.status-dot.offline {
  background: #e25a69;
  box-shadow: none;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.status-text strong {
  font-size: 12px;
}

.status-text span {
  color: #71869b;
  font-size: 10px;
}

.database-info {
  margin-left: auto;
  color: #71869b;
  font-size: 11px;
}

.explorer {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 600px;
  border: 1px solid #1d3447;
  border-radius: 8px;
  overflow: hidden;
  background: #091522;
}

.collections-panel {
  border-right: 1px solid #1d3447;
  background: #08131e;
}

.panel-title {
  padding: 16px;
  border-bottom: 1px solid #1d3447;
}

.panel-title h3 {
  margin: 0;
  color: white;
  font-size: 13px;
}

.panel-title span {
  display: block;
  margin-top: 4px;
  color: #71869b;
  font-size: 10px;
}

.collection-list {
  padding: 8px;
}

.collection-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: #91a4b8;
  text-align: left;
  cursor: pointer;
}

.collection-item:hover {
  background: #0d1e2d;
  color: white;
}

.collection-item.active {
  border-color: #1c6471;
  background: #10303d;
  color: #00e5ff;
}

.collection-name {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-wrap: anywhere;
}

.collection-icon {
  color: #00e5ff;
}

.collection-count {
  min-width: 30px;
  padding: 2px 6px;
  border-radius: 10px;
  background: #132637;
  color: #71869b;
  font-size: 9px;
  text-align: center;
}

.documents-panel {
  min-width: 0;
  padding: 18px;
}

.documents-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 15px;
}

.documents-header h3 {
  margin: 0;
  color: #00e5ff;
  font-size: 14px;
}

.documents-header span {
  display: block;
  margin-top: 4px;
  color: #71869b;
  font-size: 10px;
}

.page-info {
  color: #71869b;
  font-size: 10px;
}

.loading {
  padding: 30px;
  color: #71869b;
  text-align: center;
}

.empty-state {
  padding: 60px 20px;
  color: #71869b;
  text-align: center;
}

.empty-state h3 {
  color: #91a4b8;
}

.empty-icon {
  margin-bottom: 10px;
  color: #29445c;
  font-size: 30px;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-card {
  overflow: hidden;
  border: 1px solid #1d3447;
  border-radius: 6px;
  background: #07111b;
}

.document-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 9px 12px;
  border-bottom: 1px solid #1d3447;
  background: #0d1b28;
  color: #91a4b8;
  font-size: 10px;
}

.document-id {
  max-width: 60%;
  overflow: hidden;
  color: #526a80;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-card pre {
  max-height: 400px;
  margin: 0;
  padding: 15px;
  overflow: auto;
  color: #b6c5d3;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  line-height: 1.6;
}

.database-search {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #1d3447;
  border-radius: 8px;
  background: #091522;
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.search-header h3 {
  margin: 0;
  color: white;
  font-size: 14px;
}

.search-header span {
  display: block;
  margin-top: 4px;
  color: #71869b;
  font-size: 10px;
}

.root-edit-badge {
  padding: 5px 9px;
  border: 1px solid #00b7ca;
  border-radius: 4px;
  color: #00e5ff;
  font-size: 9px;
  font-weight: bold;
}

.search-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-top: 14px;
}

.search-controls input,
.edit-grid input,
.edit-grid textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  border: 1px solid #29445c;
  border-radius: 5px;
  outline: none;
  background: #07111b;
  color: white;
}

.search-controls input:focus,
.edit-grid input:focus,
.edit-grid textarea:focus {
  border-color: #00e5ff;
}

.search-controls button,
.edit-button,
.save-button {
  padding: 9px 15px;
  border: 1px solid #00b7ca;
  border-radius: 5px;
  background: #10303d;
  color: #00e5ff;
  cursor: pointer;
}

.search-controls button:hover,
.edit-button:hover,
.save-button:hover {
  background: #144151;
}

.search-controls button:disabled,
.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-results {
  margin-top: 15px;
}

.search-results-header {
  margin-bottom: 8px;
  color: #71869b;
  font-size: 10px;
}

.search-result {
  display: grid;
  grid-template-columns:
    minmax(120px, 1fr)
    minmax(180px, 2fr)
    120px
    auto;
  gap: 12px;
  align-items: center;
  margin-top: 7px;
  padding: 10px;
  border: 1px solid #1d3447;
  border-radius: 6px;
  background: #0c1b29;
}

.result-main {
  display: flex;
  flex-direction: column;
}

.result-main strong {
  color: #00e5ff;
}

.result-main span,
.result-position,
.result-airport {
  color: #91a4b8;
  font-size: 10px;
}

.result-position {
  display: flex;
  gap: 15px;
}

.search-empty {
  padding: 15px;
  color: #71869b;
  text-align: center;
}

.edit-panel {
  margin-bottom: 20px;
  padding: 18px;
  border: 1px solid #00b7ca;
  border-radius: 8px;
  background: #0a1825;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 18px;
}

.edit-header h3 {
  margin: 0;
  color: #00e5ff;
  font-size: 15px;
}

.edit-header span {
  display: block;
  margin-top: 4px;
  color: #71869b;
  font-size: 10px;
}

.close-edit {
  border: none;
  background: transparent;
  color: #71869b;
  font-size: 22px;
  cursor: pointer;
}

.close-edit:hover {
  color: white;
}

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
}

.edit-grid label {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.edit-grid label > span {
  color: #71869b;
  font-size: 10px;
}

.full-field {
  grid-column: 1 / -1;
}

.checkbox-field {
  flex-direction: row !important;
  align-items: center;
  align-self: end;
  min-height: 38px;
}

.checkbox-field input {
  width: auto;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 15px;
}

.cancel-button {
  padding: 9px 15px;
  border: 1px solid #405164;
  border-radius: 5px;
  background: transparent;
  color: #91a4b8;
  cursor: pointer;
}

.cancel-button:hover {
  border-color: #71869b;
  color: white;
}

.delete-button {
  padding: 9px 15px;
  border: 1px solid #d9534f;
  border-radius: 5px;
  background: #35191b;
  color: #ff8f8f;
  cursor: pointer;
}

.delete-button:hover {
  background: #4a2023;
  border-color: #ff6b6b;
  color: white;
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-button {
  padding: 7px 12px;
  border: 1px solid #39d98a;
  border-radius: 5px;
  background: #102c24;
  color: #72e6bd;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.add-button:hover {
  border-color: #72e6bd;
  background: #16392f;
  color: white;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 18px;
}

.pagination button {
  padding: 7px 12px;
  border: 1px solid #29445c;
  border-radius: 5px;
  background: #102130;
  color: #91a4b8;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  border-color: #00e5ff;
  color: #00e5ff;
}

.pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pagination span {
  color: #71869b;
  font-size: 10px;
}

@media (max-width: 1000px) {
  .explorer {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .search-result {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .settings-page {
    padding: 15px;
  }

  .explorer {
    display: block;
  }

  .collections-panel {
    border-right: none;
    border-bottom: 1px solid #1d3447;
  }

  .collection-list {
    max-height: 250px;
    overflow: auto;
  }

  .search-controls {
    grid-template-columns: 1fr;
  }

  .search-result {
    grid-template-columns: 1fr;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }

  .full-field {
    grid-column: auto;
  }

  .documents-header,
  .page-header,
  .card-header,
  .search-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
