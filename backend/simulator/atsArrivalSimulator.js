'use strict'

// =====================================
// IMPORTACIONES
// =====================================

const path = require('path')
const express = require('express')
const { MongoClient } = require('mongodb')
const jwt = require('jsonwebtoken')

// =====================================
// VARIABLES DE ENTORNO
// =====================================

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
})

// =====================================
// CONFIGURACIÓN DEL SIMULADOR
// =====================================

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))

const PORT = Number(process.env.ARR_SIM_PORT || 5501)
const HOST = '127.0.0.1'

const DB_NAME = process.env.ARR_SIM_DB_NAME || 'atc_database'

const MONGO_URI = process.env.ARR_SIM_MONGO_URI || process.env.MONGODB_URI

const { JWT_SECRET } = process.env

// =====================================
// AEROPUERTOS POR ESTACIÓN
// =====================================

const AIRPORTS = {
  CUL: 'MMCL',
  MZT: 'MMMZ',
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
}

// =====================================
// MONITOR DE MENSAJES ATS - ARR
// =====================================

function logArrReceived({ callsign, departure, destination, username }) {
  console.log('\n========================================')
  console.log('       MENSAJE ATS ARR RECIBIDO')
  console.log('========================================')
  console.log('Fecha UTC :', new Date().toISOString())
  console.log('Tipo      : ARR')
  console.log('Callsign  :', callsign)
  console.log('Origen    :', departure)
  console.log('Destino   :', destination)
  console.log('Usuario   :', username)
  console.log('Canal     : HTTP LOCAL')
  console.log('Estado    : RECIBIDO')
  console.log('========================================')
}

function logArrResult(status, message) {
  const timestamp = new Date().toISOString()

  console.log('Fecha UTC :', timestamp)
  console.log('Resultado :', status)
  console.log('Detalle   :', message)
  console.log('========================================\n')
}

// =====================================
// AUTENTICACIÓN JWT
// =====================================

function authenticate(req, res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')

  if (!match) {
    logArrResult('RECHAZADO', 'Solicitud sin token JWT')

    return res.status(401).json({
      success: false,
      message: 'Token requerido',
    })
  }

  try {
    req.user = jwt.verify(match[1], JWT_SECRET, {
      algorithms: ['HS256'],
    })

    next()
  } catch (error) {
    logArrResult('RECHAZADO', `Autenticación JWT: ${error.message}`)

    return res.status(401).json({
      success: false,
      message: 'Token inválido o vencido',
    })
  }
}

// =====================================
// PERMISOS POR ROL Y ESTACIÓN
// =====================================

function authorized(req, res, next) {
  const role = String(req.user.role || '').toUpperCase()

  const station = String(req.user.airport || '').toUpperCase()

  const stationIcao = AIRPORTS[station]

  if (!['ROOT', 'ADMIN', 'USER'].includes(role)) {
    logArrResult('RECHAZADO', `Rol no autorizado: ${role}`)

    return res.status(403).json({
      success: false,
      message: 'Rol no autorizado',
    })
  }

  if (role === 'USER' && !stationIcao) {
    logArrResult('RECHAZADO', `Estación no autorizada: ${station}`)

    return res.status(403).json({
      success: false,
      message: 'Estación no autorizada',
    })
  }

  req.stationIcao = stationIcao

  req.globalAccess = ['ROOT', 'ADMIN'].includes(role)

  next()
}

// =====================================
// CONEXIÓN MONGODB
// =====================================

let client
let collection

// =====================================
// RECEPCIÓN SIMULADA DE ARR
// =====================================

app.post('/api/simulator/arr', authenticate, authorized, async (req, res) => {
  const { callsign, departure, destination } = req.body || {}

  const clean = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '')

  const cs = clean(callsign)
  const dep = clean(departure)
  const dest = clean(destination)

  // Registrar mensaje recibido

  logArrReceived({
    callsign: cs,
    departure: dep,
    destination: dest,
    username: req.user.username || 'DESCONOCIDO',
  })

  // =====================================
  // VALIDACIÓN DEL MENSAJE
  // =====================================

  if (!/^[A-Z0-9]{2,10}$/.test(cs) || !/^[A-Z]{4}$/.test(dep) || !/^[A-Z]{4}$/.test(dest)) {
    logArrResult('RECHAZADO', 'CALLSIGN, DEP o DEST inválidos')

    return res.status(400).json({
      success: false,
      message: 'CALLSIGN, DEP o DEST inválidos',
    })
  }

  // =====================================
  // VALIDACIÓN POR ESTACIÓN
  // =====================================

  if (!req.globalAccess && dep !== req.stationIcao && dest !== req.stationIcao) {
    logArrResult('RECHAZADO', `Vuelo ${cs} ajeno a la estación ${req.stationIcao}`)

    return res.status(403).json({
      success: false,
      message: 'Vuelo ajeno a la estación',
    })
  }

  try {
    const timestamp = new Date()

    console.log('MongoDB   : Buscando FPL...')
    console.log('Base datos:', DB_NAME)
    console.log('Colección : flight_plans')

    // =====================================
    // BUSCAR FPL DEPARTED
    // =====================================

    const result = await collection.findOneAndUpdate(
      {
        callsign: cs,
        departure: dep,
        destination: dest,
        lifecycle: 'DEPARTED',
      },
      {
        $set: {
          lifecycle: 'ARRIVED',
          status: 'ARRIVED',
          arrived_at: timestamp,
          updated_at: timestamp,
          simulated: true,
        },
      },
      {
        returnDocument: 'after',
        sort: { eobt_at: -1 },
      },
    )

    // Compatibilidad con versiones del driver MongoDB

    const updated = result && (result.value || result)

    // =====================================
    // FPL NO ENCONTRADO
    // =====================================

    if (!updated || !updated._id) {
      logArrResult('RECHAZADO', `No existe un FPL DEPARTED para ${cs} (${dep} - ${dest})`)

      return res.status(404).json({
        success: false,
        message: 'No se encontró FPL DEPARTED para esa ruta',
      })
    }

    // =====================================
    // LLEGADA REGISTRADA
    // =====================================

    console.log('FPL ID    :', String(updated._id))
    console.log('Estado    : ARRIVED')
    console.log('Llegada UTC:', timestamp.toISOString())

    logArrResult('ACEPTADO', `Vuelo ${cs} actualizado a ARRIVED en MongoDB`)

    return res.json({
      success: true,
      status: 'SIMULATED_ARR_RECEIVED',
      aftnDelivered: false,
      message: 'Llegada simulada registrada correctamente',
      flight: {
        id: String(updated._id),
        callsign: cs,
        departure: dep,
        destination: dest,
        lifecycle: 'ARRIVED',
        arrived_at: timestamp,
        simulated: true,
      },
    })
  } catch (error) {
    console.error('[ARR SIM]', error)

    logArrResult('ERROR', 'Falló el procesamiento del mensaje ARR')

    return res.status(500).json({
      success: false,
      message: 'Error al registrar ARR simulado',
    })
  }
})

// =====================================
// INICIAR SIMULADOR
// =====================================

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Simulador deshabilitado en producción')
  }

  if (!MONGO_URI || !JWT_SECRET) {
    throw new Error('Configura ARR_SIM_MONGO_URI o MONGODB_URI y JWT_SECRET')
  }

  if (!/(_test|_lab|_sandbox)$/i.test(DB_NAME)) {
    throw new Error('Usa una BD terminada en _test, _lab o _sandbox')
  }

  client = new MongoClient(MONGO_URI)

  await client.connect()

  collection = client.db(DB_NAME).collection('flight_plans')

  app.listen(PORT, HOST, () => {
    console.log('\n========================================')
    console.log('      ATCFPL - SIMULADOR ATS ARR')
    console.log('========================================')
    console.log('Estado    : ACTIVO')
    console.log('Protocolo : HTTP / JSON')
    console.log('Host      :', HOST)
    console.log('Puerto    :', PORT)
    console.log('Base datos:', DB_NAME)
    console.log('Colección : flight_plans')
    console.log('AFTN      : DESHABILITADO')
    console.log('========================================')
    console.log('Esperando mensajes ARR...\n')
  })
}

main().catch((error) => {
  console.error('[ARR SIM]', error.message)
  process.exitCode = 1
})

// =====================================
// CIERRE CONTROLADO
// =====================================

process.on('SIGINT', async () => {
  console.log('\nCerrando simulador ARR...')

  await client?.close()

  process.exit(0)
})
