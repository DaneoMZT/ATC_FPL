const express = require('express')

const { MongoClient, ObjectId } = require('mongodb')

const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// =====================================
// CONFIGURACIÓN
// =====================================

const PORT = 3000

//const mongoURL =
//  'mongodb://127.0.0.1:27017'
const mongoURL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const databaseName = 'atc_database'

const client = new MongoClient(mongoURL)

let db = null

// =====================================
// CONECTAR A MONGODB
// =====================================

async function connectDB() {
  try {
    await client.connect()

    db = client.db(databaseName)

    await db.command({
      ping: 1,
    })

    console.log('MongoDB conectado')

    console.log(`Base de datos: ${databaseName}`)
  } catch (error) {
    console.error('Error conectando MongoDB:', error)

    process.exit(1)
  }
}

// =====================================
// COMPROBAR BASE DE DATOS
// =====================================

function checkDatabase(req, res, next) {
  if (!db) {
    return res.status(503).json({
      error: 'MongoDB no está disponible',
    })
  }

  next()
}

// =====================================
// STATUS
// =====================================

app.get('/api/status', checkDatabase, async (req, res) => {
  try {
    await db.command({
      ping: 1,
    })

    res.json({
      system: 'ATCFPL',

      status: 'online',

      database: databaseName,
    })
  } catch (error) {
    res.status(500).json({
      system: 'ATCFPL',

      status: 'error',
    })
  }
})

// =====================================
// OBTENER TODAS LAS AEROVÍAS
//
// SOLO INFORMACIÓN NECESARIA
// PARA LA LISTA.
//
// NO ENVIAMOS TODAS LAS COORDENADAS.
// =====================================

app.get('/api/routes', checkDatabase, async (req, res) => {
  try {
    const routes = await db
      .collection('routes')
      .find(
        {},
        {
          projection: {
            route_name: 1,

            points: 1,
          },
        },
      )
      .sort({
        route_name: 1,
      })
      .toArray()

    const result = routes.map((route) => {
      const routeName = String(route.route_name || '')
        .trim()
        .toUpperCase()

      return {
        _id: route._id,

        route_name: routeName,

        group: getRouteGroup(routeName),

        total_points: Array.isArray(route.points) ? route.points.length : 0,
      }
    })

    res.json(result)
  } catch (error) {
    console.error('Error obteniendo rutas:', error)

    res.status(500).json({
      error: 'Error obteniendo rutas',
    })
  }
})

// =====================================
// GRUPOS DE AEROVÍAS
// =====================================

app.get('/api/routes/groups', checkDatabase, async (req, res) => {
  try {
    const routes = await db
      .collection('routes')
      .find(
        {},
        {
          projection: {
            route_name: 1,
          },
        },
      )
      .toArray()

    const groupMap = {}

    routes.forEach((route) => {
      const routeName = String(route.route_name || '')
        .trim()
        .toUpperCase()

      const group = getRouteGroup(routeName)

      if (group === 'OTROS') {
        return
      }

      if (!groupMap[group]) {
        groupMap[group] = 0
      }

      groupMap[group]++
    })

    const groups = Object.keys(groupMap)
      .sort()
      .map((group) => {
        return {
          group: group,

          total: groupMap[group],
        }
      })

    res.json(groups)
  } catch (error) {
    console.error('Error obteniendo grupos:', error)

    res.status(500).json({
      error: 'Error obteniendo grupos',
    })
  }
})

// =====================================
// OBTENER UNA AEROVÍA PARA EL MAPA
// =====================================

app.get('/api/routes/:routeName/map', checkDatabase, async (req, res) => {
  try {
    const routeName = String(req.params.routeName || '')
      .trim()
      .toUpperCase()

    if (!routeName) {
      return res.status(400).json({
        error: 'Aerovía no especificada',
      })
    }

    // =================================
    // BUSCAR AEROVÍA
    // =================================

    const route = await db.collection('routes').findOne({
      route_name: routeName,
    })

    if (!route) {
      return res.status(404).json({
        error: 'Aerovía no encontrada',

        route_name: routeName,
      })
    }

    const routePoints = Array.isArray(route.points) ? route.points : []

    // =================================
    // OBTENER IDENTIFICADORES
    // =================================

    const pointIds = routePoints
      .map((point) => {
        return getPointId(point)
      })
      .filter(Boolean)

    const uniquePointIds = [...new Set(pointIds)]

    // =================================
    // BUSCAR PUNTOS EN
    // characteristic_points
    // =================================

    const characteristicPoints = await db
      .collection('characteristic_points')
      .find({
        point_id: {
          $in: uniquePointIds,
        },
      })
      .toArray()

    // =================================
    // MAPA RÁPIDO DE PUNTOS
    // =================================

    const pointMap = new Map()

    characteristicPoints.forEach((point) => {
      const pointId = String(point.point_id || '')
        .trim()
        .toUpperCase()

      if (pointId) {
        pointMap.set(pointId, point)
      }
    })

    // =================================
    // CONSERVAR ORDEN DE LA AEROVÍA
    // =================================

    const mappedPoints = []

    const missingPoints = []

    pointIds.forEach((pointId, index) => {
      const point = pointMap.get(pointId)

      if (!point) {
        missingPoints.push(pointId)

        return
      }

      const latitude = Number(point.position?.latitude)

      const longitude = Number(point.position?.longitude)

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        missingPoints.push(pointId)

        return
      }

      mappedPoints.push({
        order: index + 1,

        point_id: pointId,

        latitude: latitude,

        longitude: longitude,

        position: {
          raw: point.position?.raw || null,

          latitude: latitude,

          longitude: longitude,
        },

        point_type: point.point_type || null,

        relevant_fix: point.relevant_fix ?? false,

        airport_id: point.airport_id || null,

        comment: point.comment || null,
      })
    })

    // =================================
    // RESPUESTA
    // =================================

    res.json({
      route_name: routeName,

      group: getRouteGroup(routeName),

      total_points: pointIds.length,

      mapped_points: mappedPoints.length,

      missing_points: missingPoints,

      points: mappedPoints,
    })
  } catch (error) {
    console.error('Error obteniendo mapa:', error)

    res.status(500).json({
      error: 'Error obteniendo mapa de aerovía',
    })
  }
})

// =====================================
// OBTENER TODOS LOS
// PUNTOS CARACTERÍSTICOS
// =====================================

app.get('/api/characteristic-points', checkDatabase, async (req, res) => {
  try {
    const points = await db
      .collection('characteristic_points')
      .find({})
      .sort({
        point_id: 1,
      })
      .toArray()

    res.json(points)
  } catch (error) {
    console.error('Error obteniendo puntos:', error)

    res.status(500).json({
      error: 'Error obteniendo puntos',
    })
  }
})

// =====================================
// OBTENER UN PUNTO
// =====================================

app.get('/api/characteristic-points/:pointId', checkDatabase, async (req, res) => {
  try {
    const pointId = String(req.params.pointId || '')
      .trim()
      .toUpperCase()

    const point = await db.collection('characteristic_points').findOne({
      point_id: pointId,
    })

    if (!point) {
      return res.status(404).json({
        error: 'Punto no encontrado',

        point_id: pointId,
      })
    }

    res.json(point)
  } catch (error) {
    console.error('Error obteniendo punto:', error)

    res.status(500).json({
      error: 'Error obteniendo punto',
    })
  }
})
// =====================================
// BUSCAR AEROVÍAS QUE CONTIENEN UN FIJO
// =====================================

app.get('/api/characteristic-points/:pointId/routes', checkDatabase, async (req, res) => {
  try {
    const pointId = String(req.params.pointId).trim().toUpperCase()

    // =====================================
    // BUSCAR EL FIJO
    // =====================================

    const point = await db.collection('characteristic_points').findOne({
      point_id: pointId,
    })

    if (!point) {
      return res.status(404).json({
        error: 'Punto característico no encontrado',
        point_id: pointId,
      })
    }

    // =====================================
    // BUSCAR RUTAS QUE CONTIENEN EL FIJO
    // =====================================

    const allRoutes = await db.collection('routes').find({}).toArray()

    const matchingRoutes = allRoutes
      .filter((route) => {
        if (!Array.isArray(route.points)) {
          return false
        }

        return route.points.some((item) => {
          let id = ''

          if (typeof item === 'string') {
            id = item
          } else if (item && typeof item === 'object') {
            id = item.route_point || item.point_id || item.name || item.id || item.raw || ''
          }

          return String(id).trim().toUpperCase() === pointId
        })
      })
      .map((route) => ({
        _id: route._id,

        route_name: route.route_name,

        group: getRouteGroup(route.route_name),

        total_points: Array.isArray(route.points) ? route.points.length : 0,
      }))
      .sort((a, b) =>
        String(a.route_name).localeCompare(String(b.route_name), undefined, {
          numeric: true,
          sensitivity: 'base',
        }),
      )

    // =====================================
    // RESPUESTA
    // =====================================

    res.json({
      point: {
        _id: point._id,
        point_id: point.point_id,
        position: point.position,
        point_type: point.point_type,
        relevant_fix: point.relevant_fix,
        airport_id: point.airport_id,
        comment: point.comment,
      },

      routes: matchingRoutes,

      total_routes: matchingRoutes.length,
    })
  } catch (error) {
    console.error('Error buscando rutas del fijo:', error)

    res.status(500).json({
      error: 'Error buscando aerovías del fijo',
    })
  }
})
// =====================================
// ACTUALIZAR UN PUNTO CARACTERÍSTICO
// =====================================

app.put('/api/characteristic-points/:pointId', checkDatabase, async (req, res) => {
  try {
    const currentPointId = String(req.params.pointId || '')
      .trim()
      .toUpperCase()

    // =====================================
    // VALIDAR IDENTIFICADOR
    // =====================================

    if (!currentPointId) {
      return res.status(400).json({
        error: 'Punto característico no especificado',
      })
    }

    // =====================================
    // BUSCAR FIJO ACTUAL
    // =====================================

    const currentPoint = await db.collection('characteristic_points').findOne({
      point_id: currentPointId,
    })

    if (!currentPoint) {
      return res.status(404).json({
        error: 'Punto característico no encontrado',
        point_id: currentPointId,
      })
    }

    const body = req.body || {}

    // =====================================
    // NUEVO IDENTIFICADOR
    // =====================================

    const newPointId = String(body.point_id || currentPointId)
      .trim()
      .toUpperCase()

    if (!newPointId) {
      return res.status(400).json({
        error: 'El identificador del fijo es obligatorio',
      })
    }

    // =====================================
    // COORDENADAS
    // =====================================

    const latitude = Number(
      body.latitude ?? body.position?.latitude ?? currentPoint.position?.latitude,
    )

    const longitude = Number(
      body.longitude ?? body.position?.longitude ?? currentPoint.position?.longitude,
    )

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Latitud no válida. Debe estar entre -90 y 90.',
      })
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Longitud no válida. Debe estar entre -180 y 180.',
      })
    }

    // =====================================
    // VERIFICAR DUPLICADO SI CAMBIA NOMBRE
    // =====================================

    if (newPointId !== currentPointId) {
      const duplicatedPoint = await db.collection('characteristic_points').findOne({
        point_id: newPointId,
      })

      if (duplicatedPoint) {
        return res.status(409).json({
          error: `Ya existe un punto con el identificador ${newPointId}`,
        })
      }
    }

    // =====================================
    // POSICIÓN DMS / RAW
    // =====================================

    const rawPosition = String(
      body.position_raw ?? body.raw ?? body.position?.raw ?? currentPoint.position?.raw ?? '',
    )
      .trim()
      .toUpperCase()

    // =====================================
    // DATOS A ACTUALIZAR
    // =====================================

    const updateData = {
      point_id: newPointId,

      position: {
        raw: rawPosition,

        latitude: latitude,

        longitude: longitude,

        geojson: {
          type: 'Point',

          // GeoJSON usa:
          // [longitud, latitud]
          coordinates: [longitude, latitude],
        },
      },

      point_type: String(body.point_type ?? currentPoint.point_type ?? '')
        .trim()
        .toUpperCase(),

      relevant_fix:
        body.relevant_fix !== undefined
          ? Boolean(body.relevant_fix)
          : Boolean(currentPoint.relevant_fix),

      airport_id:
        body.airport_id !== undefined ? body.airport_id : (currentPoint.airport_id ?? null),

      comment: body.comment !== undefined ? body.comment : (currentPoint.comment ?? null),

      updated_at: new Date(),
    }

    // =====================================
    // ACTUALIZAR CHARACTERISTIC_POINTS
    // =====================================

    const result = await db.collection('characteristic_points').findOneAndUpdate(
      {
        point_id: currentPointId,
      },

      {
        $set: updateData,
      },

      {
        returnDocument: 'after',
      },
    )

    if (!result) {
      return res.status(404).json({
        error: 'No se pudo actualizar el punto',
      })
    }

    // =====================================
    // ACTUALIZAR ROUTES SI CAMBIÓ EL NOMBRE
    // =====================================

    let routesUpdated = 0

    if (newPointId !== currentPointId) {
      const allRoutes = await db.collection('routes').find({}).toArray()

      for (const route of allRoutes) {
        if (!Array.isArray(route.points)) {
          continue
        }

        let changed = false

        const newPoints = route.points.map((item) => {
          // Punto guardado como string
          if (typeof item === 'string') {
            if (String(item).trim().toUpperCase() === currentPointId) {
              changed = true

              return newPointId
            }

            return item
          }

          // Punto guardado como objeto
          if (item && typeof item === 'object') {
            const itemId = getPointId(item)

            if (itemId !== currentPointId) {
              return item
            }

            changed = true

            const updatedItem = {
              ...item,
            }

            if (Object.prototype.hasOwnProperty.call(updatedItem, 'route_point')) {
              updatedItem.route_point = newPointId
            }

            if (Object.prototype.hasOwnProperty.call(updatedItem, 'point_id')) {
              updatedItem.point_id = newPointId
            }

            if (Object.prototype.hasOwnProperty.call(updatedItem, 'name')) {
              updatedItem.name = newPointId
            }

            if (Object.prototype.hasOwnProperty.call(updatedItem, 'id')) {
              updatedItem.id = newPointId
            }

            return updatedItem
          }

          return item
        })

        // =====================================
        // GUARDAR AEROVÍA MODIFICADA
        // =====================================

        if (changed) {
          await db.collection('routes').updateOne(
            {
              _id: route._id,
            },

            {
              $set: {
                points: newPoints,
                updated_at: new Date(),
              },
            },
          )

          routesUpdated++
        }
      }
    }

    // =====================================
    // RESPUESTA
    // =====================================

    res.json({
      message: 'Punto característico actualizado correctamente',

      renamed: newPointId !== currentPointId,

      previous_point_id: currentPointId,

      point_id: newPointId,

      routes_updated: routesUpdated,

      point: result,
    })
  } catch (error) {
    console.error('Error actualizando punto característico:', error)

    res.status(500).json({
      error: 'Error actualizando punto característico',
    })
  }
})
// =====================================
// PLANES DE VUELO
// =====================================

// =====================================
// OBTENER TODOS LOS PLANES
// =====================================

app.get('/api/flight-plans', checkDatabase, async (req, res) => {
  try {
    const flightPlans = await db
      .collection('flight_plans')
      .find({})
      .sort({
        created_at: -1,
      })
      .toArray()

    res.json(flightPlans)
  } catch (error) {
    console.error('Error obteniendo planes:', error)

    res.status(500).json({
      error: 'Error obteniendo planes de vuelo',
    })
  }
})

// =====================================
// OBTENER UN PLAN POR ID
// =====================================

app.get('/api/flight-plans/:id', checkDatabase, async (req, res) => {
  try {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'ID de plan no válido',
      })
    }

    const flightPlan = await db.collection('flight_plans').findOne({
      _id: new ObjectId(id),
    })

    if (!flightPlan) {
      return res.status(404).json({
        error: 'Plan de vuelo no encontrado',
      })
    }

    res.json(flightPlan)
  } catch (error) {
    console.error('Error obteniendo plan:', error)

    res.status(500).json({
      error: 'Error obteniendo plan de vuelo',
    })
  }
})

// =====================================
// CREAR PLAN DE VUELO
// =====================================

app.post('/api/flight-plans', checkDatabase, async (req, res) => {
  try {
    const flightPlan = req.body

    // -----------------------------
    // VALIDACIONES BÁSICAS
    // -----------------------------

    if (!flightPlan.callsign || !flightPlan.departure || !flightPlan.destination) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios',
        required: ['callsign', 'departure', 'destination'],
      })
    }

    // -----------------------------
    // NORMALIZAR DATOS
    // -----------------------------

    const newFlightPlan = {
      ...flightPlan,

      callsign: String(flightPlan.callsign).trim().toUpperCase(),

      departure: String(flightPlan.departure).trim().toUpperCase(),

      destination: String(flightPlan.destination).trim().toUpperCase(),

      aircraft: String(flightPlan.aircraft || '')
        .trim()
        .toUpperCase(),

      route: String(flightPlan.route || '')
        .trim()
        .toUpperCase(),

      status: String(flightPlan.status || 'PENDIENTE')
        .trim()
        .toUpperCase(),

      created_at: new Date(),

      updated_at: new Date(),
    }

    // -----------------------------
    // GUARDAR EN MONGODB
    // -----------------------------

    const result = await db.collection('flight_plans').insertOne(newFlightPlan)

    // -----------------------------
    // RESPUESTA
    // -----------------------------

    res.status(201).json({
      message: 'Plan de vuelo guardado correctamente',

      flightPlan: {
        _id: result.insertedId,

        ...newFlightPlan,
      },
    })
  } catch (error) {
    console.error('Error guardando plan:', error)

    res.status(500).json({
      error: 'Error guardando plan de vuelo',
    })
  }
})

// =====================================
// ACTUALIZAR PLAN
// =====================================

app.put('/api/flight-plans/:id', checkDatabase, async (req, res) => {
  try {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'ID de plan no válido',
      })
    }

    const updateData = {
      ...req.body,

      updated_at: new Date(),
    }

    // Nunca permitimos modificar _id

    delete updateData._id

    const result = await db.collection('flight_plans').findOneAndUpdate(
      {
        _id: new ObjectId(id),
      },
      {
        $set: updateData,
      },
      {
        returnDocument: 'after',
      },
    )

    if (!result) {
      return res.status(404).json({
        error: 'Plan de vuelo no encontrado',
      })
    }

    res.json({
      message: 'Plan actualizado correctamente',

      flightPlan: result,
    })
  } catch (error) {
    console.error('Error actualizando plan:', error)

    res.status(500).json({
      error: 'Error actualizando plan de vuelo',
    })
  }
})

// =====================================
// ELIMINAR PLAN
// =====================================

app.delete('/api/flight-plans/:id', checkDatabase, async (req, res) => {
  try {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'ID de plan no válido',
      })
    }

    const result = await db.collection('flight_plans').deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Plan de vuelo no encontrado',
      })
    }

    res.json({
      message: 'Plan de vuelo eliminado correctamente',
    })
  } catch (error) {
    console.error('Error eliminando plan:', error)

    res.status(500).json({
      error: 'Error eliminando plan de vuelo',
    })
  }
})

// =====================================
// FUNCIONES AUXILIARES
// =====================================

function getRouteGroup(routeName) {
  const name = String(routeName || '')
    .trim()
    .toUpperCase()

  if (!name) {
    return 'OTROS'
  }

  const first = name.charAt(0)

  if (/^[A-Z]$/.test(first)) {
    return first
  }

  return 'OTROS'
}

function getPointId(point) {
  if (!point) {
    return ''
  }

  if (typeof point === 'string') {
    return point.trim().toUpperCase()
  }

  return String(point.point_id || point.route_point || point.raw || '')
    .trim()
    .toUpperCase()
}

// =====================================
// ENDPOINT NO ENCONTRADO
// =====================================

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',

    path: req.originalUrl,
  })
})

// =====================================
// INICIAR SERVIDOR
// =====================================

async function startServer() {
  await connectDB()

  app.listen(PORT, () => {
    console.log('')
    console.log('==============================')

    console.log('       ATCFPL BACKEND')

    console.log('==============================')

    console.log(`API: http://localhost:${PORT}`)

    console.log(`MongoDB: ${databaseName}`)

    console.log('==============================')

    console.log('')
  })
}

startServer()
