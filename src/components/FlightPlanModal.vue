<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'

const emit = defineEmits(['close', 'save'])

const activeTab = ref('fpl')

// =====================================
// ITEM 18 - CATÁLOGO DE OPERADORES
// =====================================

const operatorCatalog = [
  { code: 'AMX', name: 'AEROMEXICO' },
  { code: 'VOI', name: 'VOLARIS' },
  { code: 'VIV', name: 'VIVA AEROBUS' },
  { code: 'SLI', name: 'AEROMEXICO CONNECT' },
  { code: 'UAL', name: 'UNITED AIRLINES' },
  { code: 'AAL', name: 'AMERICAN AIRLINES' },
  { code: 'DAL', name: 'DELTA AIR LINES' },
  { code: 'SWA', name: 'SOUTHWEST AIRLINES' },
  { code: 'ASA', name: 'ALASKA AIRLINES' },
  { code: 'JBU', name: 'JETBLUE AIRWAYS' },
  { code: 'FFT', name: 'FRONTIER AIRLINES' },
  { code: 'NKS', name: 'SPIRIT AIRLINES' },
  { code: 'ACA', name: 'AIR CANADA' },
  { code: 'WJA', name: 'WESTJET' },
  { code: 'CMP', name: 'COPA AIRLINES' },
  { code: 'AVA', name: 'AVIANCA' },
  { code: 'LAN', name: 'LATAM AIRLINES' },
  { code: 'IBE', name: 'IBERIA' },
  { code: 'BAW', name: 'BRITISH AIRWAYS' },
  { code: 'AFR', name: 'AIR FRANCE' },
  { code: 'DLH', name: 'LUFTHANSA' },
  { code: 'KLM', name: 'KLM ROYAL DUTCH AIRLINES' },
  { code: 'UAE', name: 'EMIRATES' },
  { code: 'QTR', name: 'QATAR AIRWAYS' },
  { code: 'FDX', name: 'FEDEX EXPRESS' },
  { code: 'UPS', name: 'UPS AIRLINES' },
  { code: 'GTI', name: 'ATLAS AIR' },
]

const operatorSearch = ref('')

const filteredOperators = computed(() => {
  const search = operatorSearch.value.trim().toUpperCase()

  if (!search) return operatorCatalog

  return operatorCatalog.filter(
    (operator) => operator.code.includes(search) || operator.name.includes(search),
  )
})

function selectOperator(operator) {
  form.opr = operator.name
  operatorSearch.value = operator.name
  isValidated.value = false
}
// =====================================
// EOBT AUTOMÁTICO - UTC MÁS 10 MIN
// =====================================

function updateEOBT() {
  const now = new Date()

  // SUMA 10 minutos a la hora UTC actual
  const eobtDate = new Date(now.getTime() + 10 * 60 * 1000)

  // Obtener hora UTC en formato HH:MM
  const hours = String(eobtDate.getUTCHours()).padStart(2, '0')
  const minutes = String(eobtDate.getUTCMinutes()).padStart(2, '0')

  form.eobt = `${hours}:${minutes}`
}

// =====================================
// RELOJ UTC Y HORA LOCAL
// =====================================

const utcTime = ref('')
const localTime = ref('')

let clockInterval = null

function updateClock() {
  const now = new Date()

  // Hora UTC
  utcTime.value = now.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Hora local de la computadora
  localTime.value = now.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Iniciar relojes UTC y local
updateClock()

// Actualizar los relojes cada segundo
clockInterval = setInterval(updateClock, 1000)
const validationErrors = ref([])

const isValidated = ref(false)

const form = reactive({
  // ITEM 7

  callsign: '',

  // ITEM 8

  flightRules: 'I',

  flightType: 'S',

  // ITEM 9

  aircraftNumber: '1',

  aircraftType: '',

  wakeTurbulence: 'M',

  // ITEM 10

  equipment: '',

  surveillance: '',

  // ITEM 13

  departure: '',

  eobt: '',

  // ITEM 15

  speed: '',

  level: '',

  route: '',

  // ITEM 16

  destination: '',

  eet: '',

  alternate1: '',

  alternate2: '',

  // ITEM 18

  pbn: '',

  dof: '',

  reg: '',

  opr: '',

  eetInfo: '',

  sel: '',

  code: '',

  per: '',

  rmk: '',

  // ITEM 19

  endurance: '',

  personsOnBoard: '',

  emergencyRadio: '',

  survivalEquipment: '',

  jackets: '',

  dinghies: '',

  aircraftColour: '',

  remarks: '',

  pilotInCommand: '',
})
// Establecer EOBT inicial: UTC más 10 minutos
updateEOBT()
// =====================================
// ITEM 10 - CATÁLOGO DE EQUIPAMIENTO OACI
// =====================================

const equipmentCatalog = [
  { code: 'N', name: 'Sin equipo COM/NAV/APCH utilizable' },
  { code: 'S', name: 'Equipo estándar: VHF RTF, VOR e ILS' },
  { code: 'A', name: 'Sistema de aterrizaje GBAS' },
  { code: 'B', name: 'Sistema de aterrizaje LPV (SBAS)' },
  { code: 'C', name: 'LORAN C' },
  { code: 'D', name: 'DME' },
  { code: 'E1', name: 'FMC WPR ACARS' },
  { code: 'E2', name: 'D-FIS ACARS' },
  { code: 'E3', name: 'PDC ACARS' },
  { code: 'F', name: 'ADF' },
  { code: 'G', name: 'GNSS' },
  { code: 'H', name: 'HF RTF' },
  { code: 'I', name: 'Navegación inercial' },
  { code: 'J1', name: 'CPDLC ATN VDL Mode 2' },
  { code: 'J2', name: 'CPDLC FANS 1/A HFDL' },
  { code: 'J3', name: 'CPDLC FANS 1/A VDL Mode A' },
  { code: 'J4', name: 'CPDLC FANS 1/A VDL Mode 2' },
  { code: 'J5', name: 'CPDLC FANS 1/A SATCOM INMARSAT' },
  { code: 'J6', name: 'CPDLC FANS 1/A SATCOM MTSAT' },
  { code: 'J7', name: 'CPDLC FANS 1/A SATCOM Iridium' },
  { code: 'K', name: 'MLS' },
  { code: 'L', name: 'ILS' },
  { code: 'M1', name: 'ATC RTF SATCOM INMARSAT' },
  { code: 'M2', name: 'ATC RTF SATCOM MTSAT' },
  { code: 'M3', name: 'ATC RTF SATCOM Iridium' },
  { code: 'O', name: 'VOR' },
  { code: 'R', name: 'Aprobación PBN' },
  { code: 'T', name: 'TACAN' },
  { code: 'U', name: 'UHF RTF' },
  { code: 'V', name: 'VHF RTF' },
  { code: 'W', name: 'Aprobación RVSM' },
  { code: 'X', name: 'Aprobación MNPS' },
  { code: 'Y', name: 'VHF con separación de canales de 8.33 kHz' },
  { code: 'Z', name: 'Otro equipamiento o capacidad' },
]

const selectedEquipment = ref([])

function toggleEquipment(code) {
  if (code === 'N') {
    selectedEquipment.value = selectedEquipment.value.includes('N') ? [] : ['N']
  } else {
    selectedEquipment.value = selectedEquipment.value.filter((item) => item !== 'N')

    if (code === 'S') {
      selectedEquipment.value = selectedEquipment.value.includes('S')
        ? selectedEquipment.value.filter((item) => item !== 'S')
        : [...selectedEquipment.value, 'S']
    } else {
      selectedEquipment.value = selectedEquipment.value.includes(code)
        ? selectedEquipment.value.filter((item) => item !== code)
        : [...selectedEquipment.value, code]
    }
  }

  form.equipment = equipmentCatalog
    .filter((item) => selectedEquipment.value.includes(item.code))
    .map((item) => item.code)
    .join('')

  isValidated.value = false
}

// ITEM 10 - VIGILANCIA OACI
const surveillanceCatalog = [
  { code: 'N', name: 'Sin equipo de vigilancia' },
  { code: 'A', name: 'Transpondedor Modo A' },
  { code: 'C', name: 'Transpondedor Modo A/C' },
  { code: 'E', name: 'Modo S con identificación, altitud y Extended Squitter' },
  { code: 'H', name: 'Modo S con identificación, altitud y vigilancia mejorada' },
  { code: 'I', name: 'Modo S con identificación' },
  {
    code: 'L',
    name: 'Modo S con identificación, altitud, Extended Squitter y vigilancia mejorada',
  },
  { code: 'P', name: 'Modo S con altitud de presión' },
  { code: 'S', name: 'Modo S con identificación y altitud' },
  { code: 'X', name: 'Modo S sin identificación ni altitud' },
  { code: 'B1', name: 'ADS-B OUT mediante 1090ES' },
  { code: 'B2', name: 'ADS-B IN y OUT mediante 1090ES' },
  { code: 'U1', name: 'ADS-B OUT mediante UAT' },
  { code: 'U2', name: 'ADS-B IN y OUT mediante UAT' },
  { code: 'V1', name: 'ADS-B OUT mediante VDL Modo 4' },
  { code: 'V2', name: 'ADS-B IN y OUT mediante VDL Modo 4' },
  { code: 'D1', name: 'ADS-C FANS 1/A' },
  { code: 'G1', name: 'ADS-C ATN' },
]
const selectedSurveillance = ref([])

function toggleSurveillance(code) {
  if (code === 'N') {
    selectedSurveillance.value = selectedSurveillance.value.includes('N') ? [] : ['N']
  } else {
    selectedSurveillance.value = selectedSurveillance.value.filter((item) => item !== 'N')

    // Un solo código de transpondedor Modo A/C/S
    const transponders = ['A', 'C', 'E', 'H', 'I', 'L', 'P', 'S', 'X']

    if (transponders.includes(code)) {
      selectedSurveillance.value = selectedSurveillance.value.filter(
        (item) => !transponders.includes(item),
      )
    }

    // Evitar declarar simultáneamente IN/OUT y OUT del mismo enlace
    const alternatives = [
      ['B1', 'B2'],
      ['U1', 'U2'],
      ['V1', 'V2'],
    ]

    for (const group of alternatives) {
      if (group.includes(code)) {
        selectedSurveillance.value = selectedSurveillance.value.filter(
          (item) => !group.includes(item),
        )
      }
    }

    selectedSurveillance.value.push(code)
  }

  form.surveillance = surveillanceCatalog
    .filter((item) => selectedSurveillance.value.includes(item.code))
    .map((item) => item.code)
    .join('')

  isValidated.value = false
}
// =====================================
// ITEM 18 - CATÁLOGO PBN OACI
// =====================================

const pbnCatalog = [
  { code: 'A1', name: 'RNAV 10 (RNP 10)' },

  { code: 'B1', name: 'RNAV 5 - Todos los sensores permitidos' },
  { code: 'B2', name: 'RNAV 5 - GNSS' },
  { code: 'B3', name: 'RNAV 5 - DME/DME' },
  { code: 'B4', name: 'RNAV 5 - VOR/DME' },
  { code: 'B5', name: 'RNAV 5 - INS o IRS' },
  { code: 'B6', name: 'RNAV 5 - LORAN C' },

  { code: 'C1', name: 'RNAV 2 - Todos los sensores permitidos' },
  { code: 'C2', name: 'RNAV 2 - GNSS' },
  { code: 'C3', name: 'RNAV 2 - DME/DME' },
  { code: 'C4', name: 'RNAV 2 - DME/DME/IRU' },

  { code: 'D1', name: 'RNAV 1 - Todos los sensores permitidos' },
  { code: 'D2', name: 'RNAV 1 - GNSS' },
  { code: 'D3', name: 'RNAV 1 - DME/DME' },
  { code: 'D4', name: 'RNAV 1 - DME/DME/IRU' },

  { code: 'L1', name: 'RNP 4' },

  { code: 'O1', name: 'Basic RNP 1 - Todos los sensores permitidos' },
  { code: 'O2', name: 'Basic RNP 1 - GNSS' },
  { code: 'O3', name: 'Basic RNP 1 - DME/DME' },
  { code: 'O4', name: 'Basic RNP 1 - DME/DME/IRU' },

  { code: 'S1', name: 'RNP APCH' },
  { code: 'S2', name: 'RNP APCH con BARO-VNAV' },

  { code: 'T1', name: 'RNP AR APCH con RF' },
  { code: 'T2', name: 'RNP AR APCH sin RF' },
]

const selectedPbn = ref([])

function togglePbn(code) {
  selectedPbn.value = selectedPbn.value.includes(code)
    ? selectedPbn.value.filter((item) => item !== code)
    : [...selectedPbn.value, code]

  // Mantener el orden del catálogo y un máximo de 8 códigos
  selectedPbn.value = pbnCatalog
    .filter((item) => selectedPbn.value.includes(item.code))
    .slice(0, 8)
    .map((item) => item.code)

  form.pbn = selectedPbn.value.join('')

  isValidated.value = false
}
// =====================================
// ITEM 18 - DOF FECHA DE VUELO
// =====================================

const dofDate = ref('')

function updateDOF() {
  if (!dofDate.value) {
    form.dof = ''
    isValidated.value = false
    return
  }

  // Convertir YYYY-MM-DD a YYMMDD
  const [year, month, day] = dofDate.value.split('-')

  form.dof = `${year.slice(-2)}${month}${day}`

  isValidated.value = false
}
// =====================================
// ITEM 18 - REG MATRÍCULA
// =====================================

function handleRegistrationInput() {
  form.reg = String(form.reg || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)

  isValidated.value = false
}
// =====================================
// CATÁLOGO DE AERÓDROMOS - MONGODB
// =====================================

const airportOptions = ref([])
const airportLoading = ref(false)
const airportError = ref('')
const activeAirportField = ref(null)

let airportTimer = null
let airportRequest = null

const airportFields = ['departure', 'destination', 'alternate1', 'alternate2']

// Consultar aeródromos desde el backend
async function searchAirports(field) {
  clearTimeout(airportTimer)
  airportRequest?.abort()

  activeAirportField.value = field
  airportOptions.value = []
  airportError.value = ''

  const q = String(form[field] || '')
    .trim()
    .toUpperCase()

  // Esperar brevemente mientras el usuario escribe
  airportLoading.value = true

  airportTimer = setTimeout(async () => {
    const controller = new AbortController()
    airportRequest = controller

    try {
      const response = await fetch(
        `http://localhost:3000/api/airports?q=${encodeURIComponent(q)}`,
        {
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (airportRequest !== controller) return

      airportOptions.value = Array.isArray(data) ? data : []
    } catch (error) {
      if (error.name !== 'AbortError') {
        airportError.value = 'No se pudo consultar el catálogo de aeródromos.'
      }
    } finally {
      if (airportRequest === controller) {
        airportLoading.value = false
        airportRequest = null
      }
    }
  }, 200)
}

// Seleccionar aeródromo
function chooseAirport(field, airport) {
  form[field] = airport.airport_id
  activeAirportField.value = null
  airportOptions.value = []
  isValidated.value = false
}

// Cerrar resultados
function closeAirportResults() {
  clearTimeout(airportTimer)
  airportRequest?.abort()
  airportRequest = null
  airportLoading.value = false
  activeAirportField.value = null
  airportOptions.value = []
}

// Normalizar la entrada
function handleAirportInput(field) {
  form[field] = String(form[field] || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)

  isValidated.value = false
  searchAirports(field)
}

// Catálogo de tipos de aeronave desde MongoDB
const aircraftOptions = ref([])
const aircraftLoading = ref(false)
const aircraftError = ref('')
const selectedAircraft = ref(null)
let aircraftRequest = null
let aircraftTimer = null

watch(
  () => form.aircraftType,
  (value) => {
    isValidated.value = false
    const q = String(value || '')
      .trim()
      .toUpperCase()
    selectedAircraft.value =
      selectedAircraft.value?.designator === q ? selectedAircraft.value : null
    clearTimeout(aircraftTimer)
    aircraftRequest?.abort()
    aircraftOptions.value = []
    aircraftError.value = ''
    aircraftLoading.value = false
    if (!q) return
    aircraftLoading.value = true

    aircraftTimer = setTimeout(async () => {
      const controller = new AbortController()
      aircraftRequest = controller
      aircraftLoading.value = true
      try {
        //const response = await fetch(`/api/aircraft-types?q=${encodeURIComponent(q)}`, {
        //signal: controller.signal
        //})
        const response = await fetch(
          `http://localhost:3000/api/aircraft-types?q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
          },
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (aircraftRequest !== controller) return
        aircraftOptions.value = Array.isArray(data) ? data : []
        const exact = aircraftOptions.value.find((a) => a.designator === q)
        if (exact) selectedAircraft.value = exact
      } catch (error) {
        if (error.name !== 'AbortError' && aircraftRequest === controller) {
          aircraftError.value = 'No se pudo consultar el catálogo de aeronaves.'
        }
      } finally {
        if (aircraftRequest === controller) {
          aircraftLoading.value = false
          aircraftRequest = null
        }
      }
    }, 250)
  },
)

// =====================================
// ITEM 15 - RENDIMIENTO DE AERONAVES
// =====================================

const performanceLevels = ref([])
const performanceLoading = ref(false)
const performanceError = ref('')

let performanceRequest = null

async function loadAircraftPerformance(designator) {
  performanceRequest?.abort()

  const controller = new AbortController()
  performanceRequest = controller

  performanceLevels.value = []
  performanceError.value = ''
  performanceLoading.value = true

  form.level = ''
  form.speed = ''
  isValidated.value = false

  try {
    const response = await fetch(
      `http://localhost:3000/api/aircraft-performance/${encodeURIComponent(designator)}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (performanceRequest !== controller) return

    performanceLevels.value = (data.levels || []).map((item) => ({
      level: `F${String(item.level).replace(/^F/, '').padStart(3, '0')}`,
      altitude_ft: item.altitude_ft,
      speed: item.speed,
    }))
  } catch (error) {
    if (error.name !== 'AbortError' && performanceRequest === controller) {
      performanceError.value = 'No se pudieron cargar los niveles de vuelo.'
    }
  } finally {
    if (performanceRequest === controller) {
      performanceLoading.value = false
      performanceRequest = null
    }
  }
}

function selectPerformanceLevel() {
  const selected = performanceLevels.value.find((item) => item.level === form.level)

  form.speed = selected?.speed || ''
  isValidated.value = false
}
// =====================================
// ITEM 16 - CÁLCULO AUTOMÁTICO DE EET
// =====================================

const eetLoading = ref(false)
const eetError = ref('')

async function calculateEET() {
  if (!form.departure || !form.destination || !form.route || !form.speed) {
    form.eet = ''
    return
  }

  eetLoading.value = true
  eetError.value = ''

  try {
    const params = new URLSearchParams({
      origin: form.departure,
      destination: form.destination,
      route: form.route,
      speed: form.speed,
      level: form.level,
    })

    const response = await fetch(`http://localhost:3000/api/flight-eet?${params}`)

    if (!response.ok) {
      throw new Error('No se pudo calcular el EET')
    }

    const data = await response.json()

    form.eet = data.eet
  } catch (error) {
    eetError.value = error.message
    form.eet = ''
  } finally {
    eetLoading.value = false
  }
}
// Recalcular EET cuando cambien los datos del vuelo
watch(
  () => [form.departure, form.destination, form.route, form.speed, form.level],
  () => {
    calculateEET()
  },
)

function chooseAircraft(aircraft) {
  selectedAircraft.value = aircraft

  form.aircraftType = aircraft.designator
  form.wakeTurbulence = aircraft.wake_category

  aircraftOptions.value = []
  isValidated.value = false

  // Consultar niveles y velocidades del ITEM 15
  loadAircraftPerformance(aircraft.designator)
}
// =====================================
// ITEM 15 - RUTA AUTOMÁTICA
// =====================================

const routeLoading = ref(false)
const routeError = ref('')
const routeWarning = ref('')
const routeWasEdited = ref(false)

let routeRequest = null
let routeTimer = null
let generatedRoute = ''

async function generateRoute(force = false) {
  const origin = String(form.departure || '')
    .trim()
    .toUpperCase()
  const destination = String(form.destination || '')
    .trim()
    .toUpperCase()

  if (!/^[A-Z]{4}$/.test(origin) || !/^[A-Z]{4}$/.test(destination) || origin === destination)
    return

  if (!force && routeWasEdited.value) return

  routeRequest?.abort()

  const controller = new AbortController()
  routeRequest = controller

  routeLoading.value = true
  routeError.value = ''
  routeWarning.value = ''

  try {
    const response = await fetch(
      `http://localhost:3000/api/route-suggestions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      { signal: controller.signal },
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    if (routeRequest !== controller) return

    if (force || !routeWasEdited.value) {
      form.route = data.route
      generatedRoute = data.route
      routeWasEdited.value = false
      isValidated.value = false
    }

    routeWarning.value = data.warning || ''
  } catch (error) {
    if (error.name !== 'AbortError' && routeRequest === controller) {
      routeError.value = error.message
    }
  } finally {
    if (routeRequest === controller) {
      routeLoading.value = false
      routeRequest = null
    }
  }
}

function onRouteInput() {
  routeWasEdited.value = form.route.trim() !== generatedRoute.trim()

  isValidated.value = false
}

watch(
  () => [form.departure, form.destination],
  () => {
    clearTimeout(routeTimer)

    routeRequest?.abort()
    routeRequest = null

    routeLoading.value = false
    routeError.value = ''
    routeWarning.value = ''

    if (!routeWasEdited.value) {
      form.route = ''
      generatedRoute = ''
    }

    routeTimer = setTimeout(() => generateRoute(false), 450)
  },
)

onBeforeUnmount(() => {
  clearTimeout(aircraftTimer)
  aircraftRequest?.abort()
  clearInterval(clockInterval)

  clearTimeout(airportTimer)
  airportRequest?.abort()

  performanceRequest?.abort()

  clearTimeout(routeTimer)
  routeRequest?.abort()
})

function upper(value) {
  return String(value || '')
    .toUpperCase()
    .trim()
}

function hhmm(value) {
  return String(value || '').replace(':', '')
}

/* ==================================================

   ITEM 18

================================================== */

const item18 = computed(() => {
  const parts = []

  if (form.pbn) {
    parts.push(`PBN/${upper(form.pbn)}`)
  }

  if (form.dof) {
    parts.push(`DOF/${upper(form.dof)}`)
  }

  if (form.reg) {
    parts.push(`REG/${upper(form.reg)}`)
  }

  if (form.opr) {
    parts.push(`OPR/${upper(form.opr)}`)
  }

  if (form.eetInfo) {
    parts.push(`EET/${upper(form.eetInfo)}`)
  }

  if (form.sel) {
    parts.push(`SEL/${upper(form.sel)}`)
  }

  if (form.code) {
    parts.push(`CODE/${upper(form.code)}`)
  }

  if (form.per) {
    parts.push(`PER/${upper(form.per)}`)
  }

  if (form.rmk) {
    parts.push(`RMK/${upper(form.rmk)}`)
  }

  return parts.join(' ')
})

/* ==================================================

   GENERACIÓN DEL MENSAJE FPL

================================================== */

const aftnPreview = computed(() => {
  const callsign = upper(form.callsign) || 'CALLSIGN'

  const rules = form.flightRules || 'I'

  const type = form.flightType || 'S'

  const aircraftNumber =
    form.aircraftNumber && String(form.aircraftNumber) !== '1' ? form.aircraftNumber : ''

  const aircraftType = upper(form.aircraftType) || 'TYPE'

  const wake = upper(form.wakeTurbulence) || 'M'

  const equipment = upper(form.equipment) || 'S'

  const surveillance = upper(form.surveillance) || 'N'

  const departure = upper(form.departure) || 'ZZZZ'

  const departureTime = hhmm(form.eobt) || '0000'

  const speed = upper(form.speed) || 'N0000'

  const level = upper(form.level) || 'F000'

  const route = upper(form.route) || 'DCT'

  const destination = upper(form.destination) || 'ZZZZ'

  const totalEet = hhmm(form.eet) || '0000'

  const alternates = [upper(form.alternate1), upper(form.alternate2)]

    .filter(Boolean)

    .join(' ')

  let message = `(FPL-${callsign}-${rules}${type}\n`

  message += `-${aircraftNumber}${aircraftType}/${wake}` + `-${equipment}/${surveillance}\n`

  message += `-${departure}${departureTime}\n`

  message += `-${speed}${level} ${route}\n`

  message += `-${destination}${totalEet}`

  if (alternates) {
    message += ` ${alternates}`
  }

  if (item18.value) {
    message += `\n-${item18.value}`
  }

  message += ')'

  return message
})

/* ==================================================

   VALIDACIÓN

================================================== */

function validateFlight() {

  const errors = []

  /* ITEM 7 */

  if (!/^[A-Z0-9]{2,7}$/.test(upper(form.callsign))) {
    errors.push({
      field: 'ITEM 7',

      message: 'La identificación debe contener entre 2 y 7 caracteres.',
    })
  }

  /* ITEM 9 */

  if (!/^[A-Z0-9]{2,4}$/.test(upper(form.aircraftType))) {
    errors.push({
      field: 'ITEM 9',

      message: 'El tipo de aeronave no tiene un formato válido.',
    })
  }

  /* ITEM 13 */

  if (!/^[A-Z]{4}$/.test(upper(form.departure))) {
    errors.push({
      field: 'ITEM 13',

      message: 'El aeródromo de salida debe contener 4 letras.',
    })
  }

  if (!form.eobt) {
    errors.push({
      field: 'ITEM 13',

      message: 'Debes indicar EOBT.',
    })
  }

  /* ITEM 15 */

  if (!/^([NK]\d{4}|M\d{3})$/.test(upper(form.speed))) {
    errors.push({
      field: 'ITEM 15',

      message: 'Velocidad inválida. Ejemplo: N0450.',
    })
  }

  if (!/^(F\d{3}|A\d{3}|S\d{4}|M\d{4}|VFR)$/.test(upper(form.level))) {
    errors.push({
      field: 'ITEM 15',

      message: 'Nivel inválido. Ejemplo: F360.',
    })
  }

  if (!upper(form.route)) {
    errors.push({
      field: 'ITEM 15',

      message: 'Debes indicar una ruta.',
    })
  }

  /* ITEM 16 */

  if (!/^[A-Z]{4}$/.test(upper(form.destination))) {
    errors.push({
      field: 'ITEM 16',

      message: 'El aeródromo de destino debe contener 4 letras.',
    })
  }

  if (!form.eet) {
    errors.push({
      field: 'ITEM 16',

      message: 'Debes indicar el tiempo total estimado.',
    })
  }

  if (form.alternate1 && !/^[A-Z]{4}$/.test(upper(form.alternate1))) {
    errors.push({
      field: 'ITEM 16',

      message: 'El primer aeródromo alterno no es válido.',
    })
  }

  if (form.alternate2 && !/^[A-Z]{4}$/.test(upper(form.alternate2))) {
    errors.push({
      field: 'ITEM 16',

      message: 'El segundo aeródromo alterno no es válido.',
    })
  }
  // Validar matrícula REG/
  if (form.reg && !/^[A-Z0-9]{1,12}$/.test(upper(form.reg))) {
    errors.push({
      field: 'ITEM 18 - REG',
      message: 'La matrícula debe contener únicamente letras y números.',
    })
  }
  /* ITEM 18 */

  if (form.dof && !/^\d{6}$/.test(form.dof)) {
    errors.push({
      field: 'ITEM 18',

      message: 'DOF debe utilizar formato YYMMDD.',
    })
  }

  validationErrors.value = errors

  isValidated.value = errors.length === 0

  return isValidated.value
}

/* ==================================================

   GUARDAR

================================================== */

function saveFlight() {
  if (!validateFlight()) {
    return
  }

  const flight = {
    callsign: upper(form.callsign),

    aircraft: upper(form.aircraftType),

    departure: upper(form.departure),

    destination: upper(form.destination),

    eobt: form.eobt,

    level: upper(form.level),

    speed: upper(form.speed),

    route: upper(form.route),

    status: 'PENDIENTE',

    icao: {
      flightRules: form.flightRules,

      flightType: form.flightType,

      aircraftNumber: form.aircraftNumber,

      wakeTurbulence: form.wakeTurbulence,

      equipment: upper(form.equipment),

      surveillance: upper(form.surveillance),

      eet: form.eet,

      alternate1: upper(form.alternate1),

      alternate2: upper(form.alternate2),

      item18: {
        pbn: upper(form.pbn),

        dof: upper(form.dof),

        reg: upper(form.reg),

        opr: upper(form.opr),

        eet: upper(form.eetInfo),

        sel: upper(form.sel),

        code: upper(form.code),

        per: upper(form.per),

        rmk: upper(form.rmk),
      },

      item19: {
        endurance: form.endurance,

        personsOnBoard: form.personsOnBoard,

        emergencyRadio: upper(form.emergencyRadio),

        survivalEquipment: upper(form.survivalEquipment),

        jackets: upper(form.jackets),

        dinghies: upper(form.dinghies),

        aircraftColour: upper(form.aircraftColour),

        remarks: upper(form.remarks),

        pilotInCommand: upper(form.pilotInCommand),
      },
    },

    aftnMessage: aftnPreview.value,
  }

  emit('save', flight)
}
</script>

<template>
  <div class="modal-background" @click.self="emit('close')">
    <div class="modal">
      <!-- HEADER -->

      <header class="modal-header">
        <div>
          <span class="icao-label"> ICAO FLIGHT PLAN </span>

          <h2>Nuevo plan de vuelo</h2>

          <p>Captura, validación y generación de mensaje FPL</p>
        </div>

        <!-- RELOJ UTC Y LOCAL -->
        <div class="header-right">
          <div class="flight-clock">
            <div class="clock-utc">{{ utcTime }} <span>UTC</span></div>

            <div class="clock-local">{{ localTime }} LT</div>
          </div>

          <button type="button" class="close" @click="emit('close')">×</button>
        </div>
      </header>

      <!-- TABS -->

      <nav class="tabs">
        <button type="button" :class="{ active: activeTab === 'fpl' }" @click="activeTab = 'fpl'">
          FPL
        </button>

        <button
          type="button"
          :class="{ active: activeTab === 'equipment' }"
          @click="activeTab = 'equipment'"
        >
          EQUIPO
        </button>

        <button
          type="button"
          :class="{ active: activeTab === 'item18' }"
          @click="activeTab = 'item18'"
        >
          ITEM 18
        </button>

        <button
          type="button"
          :class="{ active: activeTab === 'item19' }"
          @click="activeTab = 'item19'"
        >
          SUPLEMENTARIOS
        </button>
      </nav>

      <form @submit.prevent="saveFlight">
        <div class="workspace">
          <!-- ====================================== -->

          <!-- CAPTURA -->

          <!-- ====================================== -->

          <main class="form-area">
            <!-- ================================== -->

            <!-- FPL -->

            <!-- ================================== -->
            <div v-if="activeTab === 'fpl'" class="tab-content fpl-layout">
              <!-- ITEM 7 -->

              <section class="section">
                <div class="section-title">
                  <span>ITEM 7</span>

                  Identificación
                </div>

                <div class="grid grid-3">
                  <div class="field span-2">
                    <label> IDENTIFICACIÓN DE AERONAVE </label>

                    <input v-model="form.callsign" maxlength="7" placeholder="AMX123" required />
                  </div>
                </div>
              </section>

              <!-- ITEM 8 -->

              <section class="section">
                <div class="section-title">
                  <span>ITEM 8</span>

                  Reglas y tipo de vuelo
                </div>

                <div class="grid grid-2">
                  <div class="field">
                    <label> REGLAS DE VUELO </label>

                    <select v-model="form.flightRules">
                      <option value="I">I — IFR</option>

                      <option value="V">V — VFR</option>

                      <option value="Y">Y — IFR → VFR</option>

                      <option value="Z">Z — VFR → IFR</option>
                    </select>
                  </div>

                  <div class="field">
                    <label> TIPO DE VUELO </label>

                    <select v-model="form.flightType">
                      <option value="S">S — Scheduled</option>

                      <option value="N">N — Non-scheduled</option>

                      <option value="G">G — General Aviation</option>

                      <option value="M">M — Military</option>

                      <option value="X">X — Other</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- ITEM 9 -->

              <section class="section">
                <div class="section-title">
                  <span>ITEM 9</span>

                  Aeronave
                </div>

                <div class="grid grid-3">
                  <div class="field">
                    <label> NÚMERO </label>

                    <input v-model="form.aircraftNumber" type="number" min="1" />
                  </div>

                  <div class="field">
                    <label> TIPO DE AERONAVE </label>

                    <input
                      v-model="form.aircraftType"
                      maxlength="4"
                      placeholder="Buscar: B73, A32..."
                      autocomplete="off"
                      required
                    />
                    <small v-if="aircraftLoading">Buscando aeronaves...</small>
                    <small v-if="aircraftError" class="aircraft-error">{{ aircraftError }}</small>
                    <div v-if="aircraftOptions.length" class="aircraft-results">
                      <button
                        v-for="aircraft in aircraftOptions"
                        :key="aircraft.designator"
                        type="button"
                        class="aircraft-option"
                        @click="chooseAircraft(aircraft)"
                      >
                        <strong>{{ aircraft.designator }}</strong>
                        <span>WTC {{ aircraft.wake_category }}</span>
                      </button>
                    </div>
                    <small
                      v-else-if="
                        form.aircraftType && !aircraftLoading && !aircraftError && !selectedAircraft
                      "
                    >
                      Sin coincidencias. Comprueba el código.
                    </small>
                  </div>

                  <div class="field">
                    <label> WTC </label>

                    <select v-model="form.wakeTurbulence">
                      <option value="L">L — Light</option>

                      <option value="M">M — Medium</option>

                      <option value="H">H — Heavy</option>

                      <option value="J">J — Super</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- ITEM 13 -->

              <section class="section">
                <div class="section-title">
                  <span>ITEM 13</span>

                  Salida
                </div>

                <div class="grid grid-2">
                  <div class="field airport-field">
                    <label> AERÓDROMO DE SALIDA </label>

                    <input
                      v-model="form.departure"
                      maxlength="4"
                      placeholder="MMZT"
                      autocomplete="off"
                      required
                      @focus="searchAirports('departure')"
                      @input="handleAirportInput('departure')"
                      @keydown.esc="closeAirportResults"
                    />
                    <!-- LISTA DE AERÓDROMOS DESDE MONGODB -->
                    <div v-if="activeAirportField === 'departure'" class="airport-results">
                      <small v-if="airportLoading"> Buscando aeródromos... </small>

                      <small v-if="airportError" class="airport-error">
                        {{ airportError }}
                      </small>

                      <button
                        v-for="airport in airportOptions"
                        :key="airport.airport_id"
                        type="button"
                        class="airport-option"
                        @mousedown.prevent="chooseAirport('departure', airport)"
                      >
                        {{ airport.airport_id }}
                      </button>

                      <small v-if="!airportLoading && !airportError && !airportOptions.length">
                        No se encontraron aeródromos.
                      </small>
                    </div>
                  </div>

                  <div class="field">
                    <label> EOBT </label>

                    <input v-model="form.eobt" type="time" required />
                  </div>
                </div>
              </section>

              <!-- ITEM 15 -->

              <div class="grid grid-2">
                <div class="field">
                  <label>VELOCIDAD DE CRUCERO</label>

                  <input v-model="form.speed" maxlength="5" placeholder="N0300 / M075" required />

                  <small v-if="form.speed"> Velocidad asociada al nivel seleccionado </small>
                </div>

                <div class="field">
                  <label>NIVEL DE VUELO</label>

                  <select v-model="form.level" @change="selectPerformanceLevel" required>
                    <option value="">Seleccionar nivel</option>

                    <option v-for="item in performanceLevels" :key="item.level" :value="item.level">
                      {{ item.level }} — {{ item.altitude_ft }} ft
                    </option>
                  </select>

                  <small v-if="performanceLoading"> Consultando niveles de vuelo... </small>

                  <small v-if="performanceError" class="aircraft-error">
                    {{ performanceError }}
                  </small>

                  <small
                    v-if="!performanceLoading && !performanceError && !performanceLevels.length"
                  >
                    Selecciona primero un tipo de aeronave en el Ítem 9.
                  </small>
                </div>
              </div>
              <!-- RUTA DE VUELO -->
              <div class="field route-field">
                <label>RUTA</label>

                <textarea
                  v-model="form.route"
                  @input="onRouteInput"
                  rows="2"
                  placeholder="La ruta se generará automáticamente"
                  required
                ></textarea>

                <button
                  type="button"
                  @click="generateRoute(true)"
                  :disabled="routeLoading || !form.departure || !form.destination"
                >
                  {{ routeLoading ? 'Buscando ruta...' : 'Generar ruta' }}
                </button>

                <small v-if="routeError" class="aircraft-error">
                  {{ routeError }}
                </small>

                <small v-if="routeWarning">
                  {{ routeWarning }}
                </small>
              </div>

              <!-- ITEM 16 -->
              <section class="section">
                <div class="section-title"><span>ITEM 16</span>Destino y alternos</div>

                <div class="grid grid-4">
                  <!-- AERÓDROMO DE DESTINO -->
                  <div class="field airport-field">
                    <label>DESTINO</label>

                    <input
                      v-model="form.destination"
                      maxlength="4"
                      placeholder="MMZT"
                      autocomplete="off"
                      required
                      @focus="searchAirports('destination')"
                      @input="handleAirportInput('destination')"
                      @keydown.esc="closeAirportResults"
                    />

                    <div v-if="activeAirportField === 'destination'" class="airport-results">
                      <small v-if="airportLoading"> Buscando aeródromos... </small>

                      <small v-if="airportError" class="airport-error">
                        {{ airportError }}
                      </small>

                      <button
                        v-for="airport in airportOptions"
                        :key="airport.airport_id"
                        type="button"
                        class="airport-option"
                        @mousedown.prevent="chooseAirport('destination', airport)"
                      >
                        {{ airport.airport_id }}
                      </button>

                      <small v-if="!airportLoading && !airportError && !airportOptions.length">
                        No se encontraron aeródromos.
                      </small>
                    </div>
                  </div>

                  <!-- TIEMPO TOTAL ESTIMADO -->
                  <div class="field">
                    <label>TOTAL EET</label>

                    <input
                      v-model="form.eet"
                      type="text"
                      placeholder="HH:MM"
                      maxlength="5"
                      readonly
                      required
                    />
                  </div>

                  <!-- AERÓDROMO ALTERNO 1 -->
                  <div class="field airport-field">
                    <label>ALTERNO 1</label>

                    <input
                      v-model="form.alternate1"
                      maxlength="4"
                      placeholder="MMGL"
                      autocomplete="off"
                      @focus="searchAirports('alternate1')"
                      @input="handleAirportInput('alternate1')"
                      @keydown.esc="closeAirportResults"
                    />

                    <div v-if="activeAirportField === 'alternate1'" class="airport-results">
                      <small v-if="airportLoading"> Buscando aeródromos... </small>

                      <small v-if="airportError" class="airport-error">
                        {{ airportError }}
                      </small>

                      <button
                        v-for="airport in airportOptions"
                        :key="airport.airport_id"
                        type="button"
                        class="airport-option"
                        @mousedown.prevent="chooseAirport('alternate1', airport)"
                      >
                        {{ airport.airport_id }}
                      </button>

                      <small v-if="!airportLoading && !airportError && !airportOptions.length">
                        No se encontraron aeródromos.
                      </small>
                    </div>
                  </div>

                  <!-- AERÓDROMO ALTERNO 2 -->
                  <div class="field airport-field">
                    <label>ALTERNO 2</label>

                    <input
                      v-model="form.alternate2"
                      maxlength="4"
                      placeholder="MMMX"
                      autocomplete="off"
                      @focus="searchAirports('alternate2')"
                      @input="handleAirportInput('alternate2')"
                      @keydown.esc="closeAirportResults"
                    />

                    <div v-if="activeAirportField === 'alternate2'" class="airport-results">
                      <small v-if="airportLoading"> Buscando aeródromos... </small>

                      <small v-if="airportError" class="airport-error">
                        {{ airportError }}
                      </small>

                      <button
                        v-for="airport in airportOptions"
                        :key="airport.airport_id"
                        type="button"
                        class="airport-option"
                        @mousedown.prevent="chooseAirport('alternate2', airport)"
                      >
                        {{ airport.airport_id }}
                      </button>

                      <small v-if="!airportLoading && !airportError && !airportOptions.length">
                        No se encontraron aeródromos.
                      </small>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- ================================== -->

            <!-- EQUIPO -->

            <!-- ================================== -->

            <div v-if="activeTab === 'equipment'" class="tab-content">
              <div class="tab-heading">
                <span> ITEM 10 </span>

                <h3>Equipamiento y capacidades</h3>

                <p>Comunicación, navegación y vigilancia.</p>
              </div>
              <!-- =====================================
                    ITEM 10 - MENÚ DE EQUIPAMIENTO
              ===================================== -->
              <!-- ITEM 10 - MENÚ DESPLEGABLE -->
              <div class="equipment-selector">
                <details class="equipment-dropdown">
                  <summary>
                    SELECCIONAR EQUIPAMIENTO OACI ({{ selectedEquipment.length }} seleccionados)
                  </summary>

                  <div class="equipment-options">
                    <label
                      v-for="item in equipmentCatalog"
                      :key="item.code"
                      class="equipment-option"
                    >
                      <input
                        type="checkbox"
                        :checked="selectedEquipment.includes(item.code)"
                        @change="toggleEquipment(item.code)"
                      />

                      <strong>{{ item.code }}</strong>
                      <span>{{ item.name }}</span>
                    </label>
                  </div>
                </details>
              </div>
              <!-- ITEM 10 - SELECCIÓN DE VIGILANCIA -->
              <div class="equipment-selector">
                <details class="equipment-dropdown">
                  <summary>
                    SELECCIONAR VIGILANCIA OACI ({{ selectedSurveillance.length }} seleccionados)
                  </summary>

                  <div class="equipment-options">
                    <label
                      v-for="item in surveillanceCatalog"
                      :key="item.code"
                      class="equipment-option"
                    >
                      <input
                        type="checkbox"
                        :checked="selectedSurveillance.includes(item.code)"
                        @change="toggleSurveillance(item.code)"
                      />

                      <strong>{{ item.code }}</strong>
                      <span>{{ item.name }}</span>
                    </label>
                  </div>
                </details>
              </div>

              <div class="equipment-card">
                <div class="field">
                  <label> EQUIPMENT / CAPABILITIES </label>

                  <input v-model="form.equipment" placeholder="SDE2E3FGHIRWXY" />

                  <small> Parte anterior a "/" </small>
                </div>

                <div class="separator">/</div>

                <div class="field">
                  <label> SURVEILLANCE </label>

                  <input v-model="form.surveillance" placeholder="LB1" />

                  <small> Parte posterior a "/" </small>
                </div>
              </div>

              <div class="info-box">
                <strong> Ejemplo ITEM 10 </strong>

                <code> SDE2E3FGHIRWXY/LB1 </code>
              </div>
            </div>

            <!-- ================================== -->

            <!-- ITEM 18 -->

            <!-- ================================== -->

            <div v-if="activeTab === 'item18'" class="tab-content">
              <div class="tab-heading">
                <span> ITEM 18 </span>

                <h3>Otra información</h3>

                <p>ATCFPL genera automáticamente los indicadores.</p>
              </div>

              <div class="grid grid-3">
                <!-- ITEM 18 - PBN -->
                <div class="field pbn-field">
                  <label>PBN/ - CAPACIDADES DE NAVEGACIÓN</label>

                  <div class="equipment-selector">
                    <details class="equipment-dropdown">
                      <summary>
                        SELECCIONAR CAPACIDADES PBN ({{ selectedPbn.length }} seleccionadas)
                      </summary>

                      <div class="equipment-options">
                        <label v-for="item in pbnCatalog" :key="item.code" class="equipment-option">
                          <input
                            type="checkbox"
                            :checked="selectedPbn.includes(item.code)"
                            :disabled="!selectedPbn.includes(item.code) && selectedPbn.length >= 8"
                            @change="togglePbn(item.code)"
                          />

                          <strong>{{ item.code }}</strong>
                          <span>{{ item.name }}</span>
                        </label>
                      </div>
                    </details>
                  </div>

                  <input v-model="form.pbn" placeholder="B1D1S1" readonly />

                  <small> Máximo 8 códigos PBN (16 caracteres). </small>
                </div>
                <!-- ITEM 18 - FECHA DEL VUELO -->
                <div class="field dof-field">
                  <label>DOF/ - FECHA DEL VUELO</label>

                  <div class="dof-date-container">
                    <input v-model="dofDate" type="date" class="dof-calendar" @change="updateDOF" />

                    <input
                      v-model="form.dof"
                      type="text"
                      class="dof-code"
                      placeholder="YYMMDD"
                      readonly
                    />
                  </div>

                  <small>Selecciona la fecha del vuelo. Formato OACI: YYMMDD.</small>
                </div>

                <!-- ITEM 18 - MATRÍCULA DE AERONAVE -->
                <div class="field">
                  <label>REG/ - MATRÍCULA DE LA AERONAVE</label>

                  <input
                    v-model="form.reg"
                    type="text"
                    maxlength="12"
                    placeholder="XAABC"
                    autocomplete="off"
                    @input="handleRegistrationInput"
                  />

                  <small> Identificación de matrícula sin guiones ni espacios. </small>
                </div>
                <!-- ITEM 18 - OPERADOR DE AERONAVE -->
                <div class="field opr-field">
                  <label>OPR/ - OPERADOR DE LA AERONAVE</label>

                  <input
                    v-model="operatorSearch"
                    type="text"
                    maxlength="60"
                    placeholder="BUSCAR AEROLÍNEA O CÓDIGO OACI"
                    autocomplete="off"
                    @input="handleOperatorSearch"
                  />

                  <div
                    v-if="operatorSearch.trim() !== form.opr.trim() && filteredOperators.length"
                    class="operator-options"
                  >
                    <button
                      v-for="operator in filteredOperators"
                      :key="operator.code"
                      type="button"
                      class="operator-option"
                      @click="selectOperator(operator)"
                    >
                      <strong>{{ operator.code }}</strong>
                      <span>{{ operator.name }}</span>
                    </button>
                  </div>

                  <small> Busca y selecciona un operador o escribe uno manualmente. </small>
                </div>

                <div class="field">
                  <label>EET/</label>

                  <input v-model="form.eetInfo" placeholder="MMFR0030" />
                </div>

                <div class="field">
                  <label>SEL/</label>

                  <input v-model="form.sel" placeholder="ABCD" />
                </div>

                <div class="field">
                  <label>CODE/</label>

                  <input v-model="form.code" placeholder="ABC123" />
                </div>

                <div class="field">
                  <label>PER/</label>

                  <input v-model="form.per" placeholder="C" />
                </div>

                <div class="field span-3">
                  <label>RMK/</label>

                  <input v-model="form.rmk" placeholder="INFORMACIÓN ADICIONAL" />
                </div>
              </div>

              <div v-if="item18" class="item18-preview">
                <span> ITEM 18 GENERADO </span>

                <code>
                  {{ item18 }}
                </code>
              </div>
            </div>

            <!-- ================================== -->

            <!-- ITEM 19 -->

            <!-- ================================== -->

            <div v-if="activeTab === 'item19'" class="tab-content">
              <div class="tab-heading">
                <span> ITEM 19 </span>

                <h3>Información suplementaria</h3>

                <p>Información complementaria del vuelo.</p>
              </div>

              <div class="grid grid-3">
                <div class="field">
                  <label> ENDURANCE </label>

                  <input v-model="form.endurance" type="time" />
                </div>

                <div class="field">
                  <label> PERSONAS A BORDO </label>

                  <input v-model="form.personsOnBoard" placeholder="145" />
                </div>

                <div class="field">
                  <label> PILOTO AL MANDO </label>

                  <input v-model="form.pilotInCommand" placeholder="D RUIZ" />
                </div>

                <div class="field">
                  <label> RADIO EMERGENCIA </label>

                  <input v-model="form.emergencyRadio" placeholder="U V E" />
                </div>

                <div class="field">
                  <label> SUPERVIVENCIA </label>

                  <input v-model="form.survivalEquipment" placeholder="P D M J" />
                </div>

                <div class="field">
                  <label> CHALECOS </label>

                  <input v-model="form.jackets" placeholder="L F U V" />
                </div>

                <div class="field">
                  <label> BOTES </label>

                  <input v-model="form.dinghies" placeholder="2 10 C" />
                </div>

                <div class="field span-2">
                  <label> COLOR / MARCAS AERONAVE </label>

                  <input v-model="form.aircraftColour" placeholder="WHITE BLUE" />
                </div>

                <div class="field span-3">
                  <label> OBSERVACIONES </label>

                  <input v-model="form.remarks" placeholder="OBSERVACIONES" />
                </div>
              </div>
            </div>
          </main>

          <!-- ====================================== -->

          <!-- VISTA PREVIA -->

          <!-- ====================================== -->

          <aside class="preview-area">
            <div class="preview-header">
              <div>
                <span> VISTA PREVIA </span>

                <h3>Mensaje FPL</h3>
              </div>

              <div class="generated" :class="{ validated: isValidated }">
                {{ isValidated ? '● VALIDADO' : '● BORRADOR' }}
              </div>
            </div>

            <pre>{{ aftnPreview }}</pre>

            <!-- RESUMEN -->

            <div class="flight-summary">
              <div>
                <span>CALLSIGN</span>

                <strong>
                  {{ upper(form.callsign) || '---' }}
                </strong>
              </div>

              <div>
                <span>DEP</span>

                <strong>
                  {{ upper(form.departure) || '----' }}
                </strong>
              </div>

              <div>
                <span>DEST</span>

                <strong>
                  {{ upper(form.destination) || '----' }}
                </strong>
              </div>

              <div>
                <span>LEVEL</span>

                <strong>
                  {{ upper(form.level) || '----' }}
                </strong>
              </div>
            </div>

            <!-- VALIDACIÓN -->

            <div v-if="validationErrors.length" class="validation-panel">
              <div class="validation-title">⚠ FPL CON ERRORES</div>

              <div v-for="(error, index) in validationErrors" :key="index" class="validation-error">
                <strong>
                  {{ error.field }}
                </strong>

                <span>
                  {{ error.message }}
                </span>
              </div>
            </div>

            <div v-if="isValidated" class="validation-success">
              ✓ FPL VALIDADO

              <span> Sin errores de formato detectados </span>
            </div>
          </aside>
        </div>

        <!-- ====================================== -->

        <!-- FOOTER -->

        <!-- ====================================== -->

        <footer class="modal-footer">
          <div class="footer-status" :class="{ ok: isValidated }">
            {{ isValidated ? '● FPL VALIDADO' : '● BORRADOR FPL' }}
          </div>

          <div class="actions">
            <button type="button" class="cancel" @click="emit('close')">CANCELAR</button>

            <button type="button" class="validate-button" @click="validateFlight">
              VALIDAR FPL
            </button>

            <button type="submit" class="save">GUARDAR FPL</button>
          </div>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* ==================================================

   FONDO

================================================== */

.modal-background {
  position: fixed;

  inset: 0;

  z-index: 1000;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20px;

  background: rgba(2, 8, 15, 0.88);

  backdrop-filter: blur(6px);
}

/* ==================================================

   MODAL

================================================== */

.modal {
  width: min(1400px, 96vw);

  height: min(850px, 92vh);

  display: flex;

  flex-direction: column;

  overflow: hidden;

  background: #0b1826;

  border: 1px solid #20384d;

  border-radius: 11px;

  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.65);
}

/* ==================================================

   HEADER

================================================== */

.modal-header {
  height: 82px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 25px;

  background: #0c1a29;

  border-bottom: 1px solid #20384d;
}

.icao-label {
  color: #55d1d9;

  font-size: 8px;

  font-weight: bold;

  letter-spacing: 1.4px;
}

.modal-header h2 {
  margin: 3px 0;

  font-size: 19px;
}

.modal-header p {
  margin: 0;

  color: #71869b;

  font-size: 10px;
}

.close {
  width: 38px;

  height: 38px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: transparent;

  border: 1px solid transparent;

  border-radius: 6px;

  color: #8295a8;

  font-size: 27px;

  cursor: pointer;
}

.close:hover {
  background: #142638;

  border-color: #294156;

  color: white;
}

/* ==================================================

   TABS

================================================== */

.tabs {
  height: 50px;

  flex-shrink: 0;

  display: flex;

  align-items: flex-end;

  gap: 5px;

  padding: 0 25px;

  background: #091522;

  border-bottom: 1px solid #20384d;
}

.tabs button {
  height: 50px;

  padding: 0 18px;

  background: transparent;

  border: none;

  border-bottom: 2px solid transparent;

  color: #71869b;

  font-size: 10px;

  font-weight: bold;

  cursor: pointer;
}

.tabs button:hover {
  color: #b7c8d8;
}

.tabs button.active {
  color: #58d2da;

  border-bottom-color: #16a2ad;
}

/* ==================================================

   FORM

================================================== */

form {
  flex: 1;

  min-height: 0;

  display: flex;

  flex-direction: column;
}

/* ==================================================

   WORKSPACE

================================================== */

.workspace {
  flex: 1;

  min-height: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1.8fr)
    minmax(330px, 0.8fr);
}

/* ==================================================

   ÁREA DE CAPTURA

================================================== */

.form-area {
  min-width: 0;

  overflow-y: auto;

  padding: 20px 24px;

  border-right: 1px solid #20384d;
}

.tab-content {
  animation: tabFade 0.15s ease;
}

@keyframes tabFade {
  from {
    opacity: 0;

    transform: translateY(3px);
  }

  to {
    opacity: 1;

    transform: translateY(0);
  }
}

/* ==================================================

   SECCIONES

================================================== */

.section {
  margin-bottom: 15px;

  padding-bottom: 15px;

  border-bottom: 1px solid #172b3e;
}

.section:last-child {
  margin-bottom: 0;

  border-bottom: none;
}

.section-title {
  margin-bottom: 11px;

  color: #9bafc2;

  font-size: 10px;

  font-weight: bold;
}

.section-title span,
.tab-heading > span {
  display: inline-block;

  margin-right: 7px;

  padding: 3px 6px;

  background: #123847;

  border-radius: 4px;

  color: #55d1d9;

  font-family: 'JetBrains Mono', monospace;

  font-size: 8px;
}

/* ==================================================

   GRID

================================================== */

.grid {
  display: grid;

  gap: 11px;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

/* ==================================================

   CAMPOS

================================================== */

.field {
  display: flex;

  flex-direction: column;

  gap: 5px;
}

label {
  color: #71869b;

  font-size: 8px;

  font-weight: bold;

  letter-spacing: 0.5px;
}

input,
select,
textarea {
  width: 100%;

  min-height: 36px;

  padding: 8px 10px;

  background: #07131f;

  border: 1px solid #20384d;

  border-radius: 5px;

  outline: none;

  color: #e8f0fa;

  font-size: 11px;
}

textarea {
  min-height: 55px;

  resize: none;

  font-family: Monaco, Consolas, monospace;
}

select {
  cursor: pointer;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #16a2ad;

  box-shadow: 0 0 0 2px rgba(22, 162, 173, 0.1);
}

input::placeholder,
textarea::placeholder {
  color: #40576c;
}

.field small {
  color: #526b81;

  font-size: 8px;
}

.route-field {
  margin-top: 10px;
}

/* ==================================================

   TAB HEADINGS

================================================== */

.tab-heading {
  margin-bottom: 25px;
}

.tab-heading h3 {
  margin: 8px 0 5px;

  font-size: 18px;
}

.tab-heading p {
  margin: 0;

  color: #71869b;

  font-size: 10px;
}

/* ==================================================

   EQUIPMENT

================================================== */

.equipment-card {
  display: grid;

  grid-template-columns: 1fr 30px 1fr;

  align-items: center;

  gap: 10px;

  padding: 25px;

  background: #091522;

  border: 1px solid #1c3549;

  border-radius: 7px;
}

.separator {
  text-align: center;

  color: #55d1d9;

  font-size: 25px;
}

.info-box {
  margin-top: 15px;

  padding: 15px;

  background: #102334;

  border-left: 3px solid #16a2ad;

  border-radius: 4px;
}

.info-box strong {
  display: block;

  margin-bottom: 8px;

  color: #7f95a9;

  font-size: 9px;
}

.info-box code {
  color: #64d6dd;
}

/* ==================================================

   ITEM 18

================================================== */

.item18-preview {
  margin-top: 20px;

  padding: 15px;

  background: #07131f;

  border: 1px solid #1c3549;

  border-radius: 6px;
}

.item18-preview span {
  display: block;

  margin-bottom: 8px;

  color: #71869b;

  font-size: 8px;
}

.item18-preview code {
  color: #5dd3da;

  font-size: 11px;

  overflow-wrap: anywhere;
}

/* ==================================================

   PREVIEW

================================================== */

.preview-area {
  min-width: 0;

  padding: 22px;

  background: linear-gradient(180deg, #081521 0%, #07111c 100%);

  overflow-y: auto;
}

.preview-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 17px;
}

.preview-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 17px;
}

.preview-header span {
  color: #55d1d9;

  font-size: 8px;

  letter-spacing: 1px;
}

.preview-header h3 {
  margin: 4px 0 0;

  font-size: 14px;
}

.generated {
  color: #f0b94e;

  font-size: 8px;

  font-weight: bold;
}

.generated.validated {
  color: #4fd68a;
}

pre {
  min-height: 230px;

  margin: 0;

  padding: 18px;

  background: #030b12;

  border: 1px solid #162b3d;

  border-radius: 6px;

  color: #69d9df;

  font-family: Monaco, Consolas, monospace;

  font-size: 11px;

  line-height: 1.8;

  white-space: pre-wrap;

  overflow-wrap: anywhere;
}

/* ==================================================

   RESUMEN

================================================== */

.flight-summary {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 8px;

  margin-top: 15px;
}

.flight-summary > div {
  padding: 12px;

  background: #0b1a28;

  border: 1px solid #172b3e;

  border-radius: 5px;
}

.flight-summary span {
  display: block;

  margin-bottom: 5px;

  color: #60778d;

  font-size: 7px;
}

.flight-summary strong {
  color: #dbe8f3;

  font-family: 'JetBrains Mono', monospace;

  font-size: 11px;
}

/* ==================================================

   VALIDACIÓN

================================================== */

.validation-panel {
  margin-top: 15px;

  padding: 14px;

  background: #261419;

  border: 1px solid #743640;

  border-radius: 6px;
}

.validation-title {
  margin-bottom: 10px;

  color: #ff7884;

  font-size: 9px;

  font-weight: bold;
}

.validation-error {
  display: flex;

  flex-direction: column;

  gap: 3px;

  padding: 7px 0;

  border-bottom: 1px solid #47252b;
}

.validation-error:last-child {
  border-bottom: none;
}

.validation-error strong {
  color: #ff7884;

  font-size: 8px;
}

.validation-error span {
  color: #c7a2a7;

  font-size: 9px;
}

.validation-success {
  margin-top: 15px;

  padding: 13px;

  background: #102d27;

  border: 1px solid #24664f;

  border-radius: 6px;

  color: #55d993;

  font-size: 9px;

  font-weight: bold;
}

.validation-success span {
  display: block;

  margin-top: 4px;

  color: #7faf9d;

  font-size: 8px;

  font-weight: normal;
}

/* ==================================================

   FOOTER

================================================== */

.modal-footer {
  height: 68px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 25px;

  background: #091522;

  border-top: 1px solid #20384d;
}

.footer-status {
  color: #f0b94e;

  font-size: 8px;

  font-weight: bold;
}

.footer-status.ok {
  color: #4fd68a;
}

.actions {
  display: flex;

  gap: 10px;
}

.actions button {
  min-width: 110px;

  padding: 10px 17px;

  border-radius: 5px;

  font-size: 9px;

  font-weight: bold;

  cursor: pointer;
}

.cancel {
  background: transparent;

  border: 1px solid #294156;

  color: #91a4b8;
}

.cancel:hover {
  background: #132536;
}

.validate-button {
  background: #17364a;

  border: 1px solid #2d617d;

  color: #64d6dd;
}

.validate-button:hover {
  background: #1c465e;
}

.save {
  background: #07818b;

  border: 1px solid #07818b;

  color: white;
}

.save:hover {
  background: #0797a3;
}

/* ==================================================

   RESPONSIVE

================================================== */

@media (max-width: 950px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .preview-area {
    display: none;
  }

  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .modal {
    width: 100%;

    height: 96vh;
  }

  .tabs {
    overflow-x: auto;
  }

  .tabs button {
    white-space: nowrap;
  }

  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .span-2,
  .span-3 {
    grid-column: span 1;
  }

  .equipment-card {
    grid-template-columns: 1fr;
  }

  .separator {
    display: none;
  }

  .footer-status {
    display: none;
  }
}

/* ==================================================

   TAMAÑO DE LETRA - NUEVO PLAN DE VUELO

================================================== */

/* Título principal */

.modal-header h2 {
  font-size: 26px !important;

  font-weight: 700;
}

/* ICAO FLIGHT PLAN */

.icao-label {
  font-size: 11px !important;
}

/* Subtítulo */

.modal-header p {
  font-size: 13px !important;
}

/* Pestañas FPL / EQUIPO / ITEM 18 / SUPLEMENTARIOS */

.tabs button {
  font-size: 13px !important;
}

/* ITEM 7, ITEM 8, ITEM 9... */

.section-title {
  font-size: 14px !important;
}

.section-title span,
.tab-heading > span {
  font-size: 11px !important;
}

/* Etiquetas de los campos */

label {
  font-size: 12px !important;
}

/* Campos de captura */

input,
select,
textarea {
  font-size: 15px !important;

  min-height: 42px;
}

/* Textos auxiliares */

.field small {
  font-size: 11px !important;
}

/* Encabezados de otras pestañas */

.tab-heading h3 {
  font-size: 22px !important;
}

.tab-heading p {
  font-size: 13px !important;
}

/* Vista previa */

.preview-header span {
  font-size: 10px !important;
}

.preview-header h3 {
  font-size: 18px !important;
}

.generated {
  font-size: 11px !important;
}

/* Mensaje AFTN */

pre {
  font-size: 14px !important;

  line-height: 1.7;
}

/* Resumen del vuelo */

.flight-summary span {
  font-size: 10px !important;
}

.flight-summary strong {
  font-size: 14px !important;
}

/* Validaciones */

.validation-title {
  font-size: 12px !important;
}

.validation-error strong {
  font-size: 11px !important;
}

.validation-error span {
  font-size: 12px !important;
}

.validation-success {
  font-size: 12px !important;
}

.validation-success span {
  font-size: 11px !important;
}

/* Estado inferior */

.footer-status {
  font-size: 11px !important;
}

/* Botones inferiores */

.actions button {
  font-size: 12px !important;

  min-width: 125px;

  padding: 11px 19px;
}

/* Autocompletado ITEM 9 */
.aircraft-results {
  max-height: 190px;
  overflow-y: auto;
  margin-top: 5px;
  background: #102436;
  border: 1px solid #294156;
  border-radius: 6px;
}
.aircraft-option {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 0;
  border-bottom: 1px solid #20384d;
  background: transparent;
  color: #e4eef6;
  cursor: pointer;
  text-align: left;
}
.aircraft-option:hover {
  background: #1a3a4d;
}
.aircraft-option span {
  color: #8eafc0;
}
.aircraft-error {
  color: #ff9999;
}

/* AUTOCOMPLETADO DE AERÓDROMOS */

.airport-field {
  position: relative;
}

.airport-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
  background: #0c1a29;
  border: 1px solid #294156;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.airport-option {
  display: block;
  width: 100%;
  padding: 10px 12px;
  background: #0c1a29;
  color: #e8f0fa;
  border: none;
  border-bottom: 1px solid #20384d;
  text-align: left;
  cursor: pointer;
}

.airport-option:hover {
  background: #123847;
  color: #55d1d9;
}

.airport-results small {
  display: block;
  padding: 8px 12px;
  color: #9bafc2;
}
</style>
