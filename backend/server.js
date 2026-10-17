const express = require('express')

const { MongoClient, ObjectId } = require('mongodb')

const cors = require('cors')

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')
const app = express()

app.use(cors())
app.use(express.json())

// ======================================================
// AUTENTICACIÓN JWT
// ======================================================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token requerido',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
    })
  }
}
function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function userFilter(username) {
  const normalizedUsername = String(username || '').trim()

  return {
    username: {
      $regex: `^${escapeRegex(normalizedUsername)}$`,
      $options: 'i',
    },
  }
}
function requireAdmin(req, res, next) {
  if (!['ADMIN', 'ROOT'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'No tiene permisos para administrar usuarios',
    })
  }
  next()
}
function requireRoot(req, res, next) {
  if (!req.user || req.user.role !== 'ROOT') {
    return res.status(403).json({
      error: 'Acceso exclusivo para ROOT',
    })
  }

  next()
}
function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function userFilter(username) {
  const normalizedUsername = String(username || '').trim()

  return {
    username: {
      $regex: `^${escapeRegex(normalizedUsername)}$`,
      $options: 'i',
    },
  }
}
// ======================================================
// ROOT - EXPLORADOR DE BASE DE DATOS
// ======================================================

// ------------------------------------------------------
// ESTADO DE MONGODB
// ------------------------------------------------------

app.get('/api/admin/database/status', verifyToken, requireRoot, async (req, res) => {
  try {
    await db.command({ ping: 1 })

    const collections = await db.listCollections().toArray()

    res.json({
      connected: true,
      database: databaseName,
      collections: collections.length,
    })
  } catch (error) {
    console.error('Error consultando MongoDB:', error)

    res.status(500).json({
      connected: false,
      error: 'No fue posible consultar MongoDB',
    })
  }
})

// ------------------------------------------------------
// LISTAR COLECCIONES
// ------------------------------------------------------

app.get('/api/admin/database/collections', verifyToken, requireRoot, async (req, res) => {
  try {
    const collections = await db.listCollections().toArray()

    const result = []

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments()

      result.push({
        name: collection.name,
        documents: count,
      })
    }

    result.sort((a, b) => a.name.localeCompare(b.name))

    res.json({
      database: databaseName,
      total: result.length,
      collections: result,
    })
  } catch (error) {
    console.error('Error listando colecciones:', error)

    res.status(500).json({
      error: 'Error consultando colecciones',
    })
  }
})

// ------------------------------------------------------
// VER DOCUMENTOS DE UNA COLECCIÓN
// ------------------------------------------------------

app.get(
  '/api/admin/database/collections/:collection',
  verifyToken,
  requireRoot,
  async (req, res) => {
    try {
      const collectionName = String(req.params.collection).trim()

      // Solo permitir colecciones existentes
      const collections = await db
        .listCollections({ name: collectionName }, { nameOnly: true })
        .toArray()

      if (collections.length === 0) {
        return res.status(404).json({
          error: 'Colección no encontrada',
        })
      }

      const page = Math.max(parseInt(req.query.page) || 1, 1)

      const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100)

      const skip = (page - 1) * limit

      const total = await db.collection(collectionName).countDocuments()

      const documents = await db
        .collection(collectionName)
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray()

      // Nunca mostrar hashes de contraseña
      if (collectionName === 'users') {
        for (const user of documents) {
          delete user.password
          delete user.passwordHash
        }
      }

      res.json({
        database: databaseName,
        collection: collectionName,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        documents,
      })
    } catch (error) {
      console.error('Error consultando colección:', error)

      res.status(500).json({
        error: 'Error consultando colección',
      })
    }
  },
)
// ======================================================
// BUSCAR DOCUMENTOS EN CHARACTERISTIC_POINTS
// SOLO ROOT
// ======================================================

app.get('/api/admin/database/search', checkDatabase, verifyToken, requireRoot, async (req, res) => {
  try {
    const collectionName = String(req.query.collection || '').trim()

    const searchText = String(req.query.q || '').trim()

    // =====================================
    // VALIDAR COLECCIÓN
    // =====================================

    if (!collectionName) {
      return res.status(400).json({
        error: 'Debe indicar una colección',
      })
    }

    // Por seguridad, por ahora la búsqueda
    // administrativa está limitada a
    // characteristic_points
    if (collectionName !== 'characteristic_points') {
      return res.status(400).json({
        error: 'La búsqueda solo está disponible para characteristic_points',
      })
    }

    // =====================================
    // VALIDAR TEXTO
    // =====================================

    if (!searchText) {
      return res.json({
        documents: [],
        total: 0,
      })
    }

    // Escapar caracteres especiales de RegExp
    const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const regex = new RegExp(escapedSearch, 'i')

    // =====================================
    // BUSCAR
    // =====================================

    const documents = await db
      .collection('characteristic_points')
      .find({
        $or: [
          {
            point_id: regex,
          },
          {
            point_type: regex,
          },
          {
            airport_id: regex,
          },
          {
            comment: regex,
          },
        ],
      })
      .limit(100)
      .toArray()

    // =====================================
    // RESPUESTA
    // =====================================

    return res.json({
      documents,
      total: documents.length,
      query: searchText,
    })
  } catch (error) {
    console.error('Error buscando en characteristic_points:', error)

    return res.status(500).json({
      error: 'Error realizando búsqueda en MongoDB',
    })
  }
})
// ======================================================
// USERS - LISTAR
// ======================================================

app.get('/api/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await db
      .collection('users')
      .find(
        {},
        {
          projection: {
            password: 0,
            passwordHash: 0,
          },
        },
      )
      .sort({
        role: 1,
        username: 1,
      })
      .toArray()

    res.json(users)
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)

    res.status(500).json({
      error: 'Error obteniendo usuarios',
    })
  }
})
app.post('/api/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    let { username, password, airport, role = 'USER' } = req.body

    username = username?.trim().toUpperCase()
    airport = airport?.trim().toUpperCase() || null
    role = role?.trim().toUpperCase()

    if (!username || !password) {
      return res.status(400).json({
        error: 'Usuario y contraseña son obligatorios',
      })
    }

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        error: 'Rol no permitido',
      })
    }

    const existing = await db.collection('users').findOne({ username })

    if (existing) {
      return res.status(409).json({
        error: 'El usuario ya existe',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const newUser = {
      username,
      passwordHash: passwordHash,
      airport,
      role,
      active: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection('users').insertOne(newUser)

    res.status(201).json({
      message: 'Usuario creado correctamente',
      user: {
        username,
        airport,
        role,
        active: true,
        mustChangePassword: true,
      },
    })
  } catch (error) {
    console.error('Error creando usuario:', error)

    res.status(500).json({
      error: 'Error creando usuario',
    })
  }
})
app.delete('/api/users/:username', verifyToken, requireAdmin, async (req, res) => {
  try {
    const username = String(req.params.username || '').trim()

    const target = await db.collection('users').findOne(userFilter(username))

    if (!target) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      })
    }

    // ROOT nunca se elimina
    if (target.role === 'ROOT') {
      return res.status(403).json({
        error: 'El usuario ROOT no puede eliminarse',
      })
    }

    const result = await db.collection('users').deleteOne({
      _id: target._id,
    })

    res.json({
      message: 'Usuario eliminado correctamente',
      deleted: result.deletedCount === 1,
    })
  } catch (error) {
    console.error('Error eliminando usuario:', error)

    res.status(500).json({
      error: 'Error eliminando usuario',
    })
  }
})
// =====================================
// CONFIGURACIÓN
// =====================================

const PORT = 3000
const JWT_SECRET = process.env.JWT_SECRET || 'atcfpl_desarrollo_local_2026'

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
app.put('/api/users/:username', verifyToken, requireAdmin, async (req, res) => {
  try {
    const username = String(req.params.username || '').trim()

    const { airport, role, active } = req.body || {}

    const target = await db.collection('users').findOne(userFilter(username))

    if (!target) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      })
    }

    // Solo ROOT puede modificar a ROOT
    if (target.role === 'ROOT' && req.user.role !== 'ROOT') {
      return res.status(403).json({
        error: 'Solo ROOT puede modificar este usuario',
      })
    }

    const update = {
      updatedAt: new Date(),
    }

    // Aeropuerto
    if (airport !== undefined) {
      update.airport = airport ? String(airport).trim().toUpperCase() : null
    }

    // Rol
    if (role !== undefined) {
      const normalizedRole = String(role).trim().toUpperCase()

      if (!['USER', 'ADMIN'].includes(normalizedRole)) {
        return res.status(400).json({
          error: 'Rol no permitido',
        })
      }

      // ROOT no puede perder su rol
      if (target.role === 'ROOT') {
        return res.status(403).json({
          error: 'El rol ROOT no puede modificarse',
        })
      }

      update.role = normalizedRole
    }

    // Activar / desactivar
    if (typeof active === 'boolean') {
      if (target.role === 'ROOT' && active === false) {
        return res.status(403).json({
          error: 'El usuario ROOT no puede deshabilitarse',
        })
      }

      update.active = active
    }

    await db.collection('users').updateOne(
      { _id: target._id },
      {
        $set: update,
      },
    )

    const updatedUser = await db.collection('users').findOne(
      { _id: target._id },
      {
        projection: {
          password: 0,
          passwordHash: 0,
        },
      },
    )

    res.json({
      message: 'Usuario actualizado correctamente',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error actualizando usuario:', error)

    res.status(500).json({
      error: 'Error actualizando usuario',
    })
  }
})
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
app.put('/api/users/:username/password', verifyToken, requireAdmin, async (req, res) => {
  try {
    const username = String(req.params.username || '').trim()

    const { password } = req.body || {}

    if (!password || String(password).length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 8 caracteres',
      })
    }

    const target = await db.collection('users').findOne(userFilter(username))

    if (!target) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      })
    }

    // ADMIN no puede cambiar contraseña de ROOT
    if (target.role === 'ROOT' && req.user.role !== 'ROOT') {
      return res.status(403).json({
        error: 'Solo ROOT puede cambiar esta contraseña',
      })
    }

    const passwordHash = await bcrypt.hash(String(password), 12)

    await db.collection('users').updateOne(
      {
        _id: target._id,
      },
      {
        $set: {
          passwordHash,
          mustChangePassword: true,
          updatedAt: new Date(),
        },
      },
    )

    res.json({
      success: true,
      message: `Contraseña de ${target.username} actualizada`,
    })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)

    res.status(500).json({
      error: 'Error cambiando contraseña',
    })
  }
})
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
//
// =====================================
// AUTENTICACIÓN - LOGIN
// =====================================

app.post('/api/auth/login', checkDatabase, async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Usuario y contraseña son obligatorios',
      })
    }

    //const normalizedUsername = String(username).trim().toUpperCase()
    //const user = await db.collection('users').findOne({
    //  username: normalizedUsername,
    //})
    const normalizedUsername = String(username).trim()

    const user = await db.collection('users').findOne({
      username: {
        $regex: `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
    })

    if (!user) {
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos',
      })
    }

    if (!user.active) {
      return res.status(403).json({
        error: 'Usuario deshabilitado',
      })
    }

    const validPassword = await bcrypt.compare(String(password), user.passwordHash)

    if (!validPassword) {
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos',
      })
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
        airport: user.airport,
      },
      JWT_SECRET,
      {
        expiresIn: '8h',
      },
    )

    res.json({
      success: true,

      user: {
        username: user.username,
        airport: user.airport,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },

      token,
    })
  } catch (error) {
    console.error('Error en login:', error)

    res.status(500).json({
      error: 'Error interno del servidor',
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

// =====================================
// ACTUALIZAR UN PUNTO CARACTERÍSTICO
// SOLO ROOT
// =====================================
app.put(
  '/api/admin/database/characteristic-points/:pointId',
  checkDatabase,
  verifyToken,
  requireRoot,
  async (req, res) => {
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
  },
)
// ======================================================
// AGREGAR PUNTO CARACTERÍSTICO
// SOLO ROOT
// ======================================================

app.post(
  '/api/admin/database/characteristic-points',
  checkDatabase,
  verifyToken,
  requireRoot,
  async (req, res) => {
    try {
      const {
        point_id,
        point_type,
        latitude,
        longitude,
        position_raw,
        relevant_fix,
        airport_id,
        comment,
      } = req.body || {}

      // =====================================
      // IDENTIFICADOR
      // =====================================

      const pointId = String(point_id || '')
        .trim()
        .toUpperCase()

      if (!pointId) {
        return res.status(400).json({
          error: 'El identificador del punto es obligatorio',
        })
      }

      // =====================================
      // VERIFICAR QUE NO EXISTA
      // =====================================

      const existingPoint = await db.collection('characteristic_points').findOne({
        point_id: pointId,
      })

      if (existingPoint) {
        return res.status(409).json({
          error: `El punto ${pointId} ya existe`,
        })
      }

      // =====================================
      // COORDENADAS
      // =====================================

      const lat = Number(latitude)
      const lon = Number(longitude)

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          error: 'La latitud debe estar entre -90 y 90',
        })
      }

      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        return res.status(400).json({
          error: 'La longitud debe estar entre -180 y 180',
        })
      }

      // =====================================
      // CREAR DOCUMENTO
      // =====================================

      const newPoint = {
        point_id: pointId,

        point_type: String(point_type || '')
          .trim()
          .toUpperCase(),

        position: {
          latitude: lat,
          longitude: lon,
          raw: String(position_raw || '').trim(),
        },

        relevant_fix: Boolean(relevant_fix),

        airport_id: airport_id ? String(airport_id).trim().toUpperCase() : null,

        comment: comment ? String(comment).trim() : null,

        created_at: new Date(),

        created_by: req.user?.username || 'ROOT',
      }

      // =====================================
      // INSERTAR EN MONGODB
      // =====================================

      const result = await db.collection('characteristic_points').insertOne(newPoint)

      console.log(`ROOT ${req.user?.username || ''} creó el punto ${pointId}`)

      return res.status(201).json({
        message: `Punto ${pointId} creado correctamente`,

        point: {
          _id: result.insertedId,
          ...newPoint,
        },
      })
    } catch (error) {
      console.error('Error creando punto característico:', error)

      return res.status(500).json({
        error: 'Error creando punto característico',
      })
    }
  },
)
// ======================================================
// INSERTAR PUNTO ENTRE DOS FIJOS DE UNA AEROVÍA
// SOLO ROOT
// ======================================================

app.post(
  '/api/admin/database/routes/:routeName/insert-point',
  checkDatabase,
  verifyToken,
  requireRoot,
  async (req, res) => {
    try {
      const routeName = String(req.params.routeName || '')
        .trim()
        .toUpperCase()

      const pointId = String(req.body?.point_id || '')
        .trim()
        .toUpperCase()

      const previousPoint = String(req.body?.previous_point || '')
        .trim()
        .toUpperCase()

      const nextPoint = String(req.body?.next_point || '')
        .trim()
        .toUpperCase()

      // =====================================
      // VALIDAR DATOS
      // =====================================

      if (!routeName || !pointId || !previousPoint || !nextPoint) {
        return res.status(400).json({
          error: 'Aerovía, punto nuevo, punto anterior y punto siguiente son obligatorios',
        })
      }

      // =====================================
      // VERIFICAR QUE EL PUNTO NUEVO EXISTA
      // =====================================

      const point = await db.collection('characteristic_points').findOne({
        point_id: pointId,
      })

      if (!point) {
        return res.status(404).json({
          error: `El punto ${pointId} no existe en characteristic_points`,
        })
      }

      // =====================================
      // BUSCAR AEROVÍA
      // =====================================

      const route = await db.collection('routes').findOne({
        route_name: routeName,
      })

      if (!route) {
        return res.status(404).json({
          error: `La aerovía ${routeName} no existe`,
        })
      }

      if (!Array.isArray(route.points)) {
        return res.status(400).json({
          error: `La aerovía ${routeName} no tiene una lista válida de puntos`,
        })
      }

      // =====================================
      // FUNCIÓN PARA OBTENER ID DEL PUNTO
      // =====================================

      const getRoutePointId = (item) => {
        if (typeof item === 'string') {
          return item.trim().toUpperCase()
        }

        if (item && typeof item === 'object') {
          return String(item.route_point || item.point_id || item.name || item.id || item.raw || '')
            .trim()
            .toUpperCase()
        }

        return ''
      }

      // =====================================
      // EVITAR DUPLICADOS
      // =====================================

      const alreadyExists = route.points.some((item) => getRoutePointId(item) === pointId)

      if (alreadyExists) {
        return res.status(409).json({
          error: `El punto ${pointId} ya pertenece a la aerovía ${routeName}`,
        })
      }

      // =====================================
      // BUSCAR LOS DOS FIJOS CONSECUTIVOS
      // =====================================

      let insertIndex = -1

      for (let i = 0; i < route.points.length - 1; i++) {
        const currentPoint = getRoutePointId(route.points[i])

        const followingPoint = getRoutePointId(route.points[i + 1])

        if (currentPoint === previousPoint && followingPoint === nextPoint) {
          insertIndex = i + 1
          break
        }
      }

      if (insertIndex === -1) {
        return res.status(400).json({
          error: `${previousPoint} y ${nextPoint} no son puntos consecutivos en ${routeName}`,
        })
      }

      // =====================================
      // CONSERVAR EL FORMATO DE route.points
      // =====================================

      const referencePoint = route.points[insertIndex - 1]

      let newRoutePoint = pointId

      if (referencePoint && typeof referencePoint === 'object') {
        if (Object.prototype.hasOwnProperty.call(referencePoint, 'route_point')) {
          newRoutePoint = {
            route_point: pointId,
          }
        } else if (Object.prototype.hasOwnProperty.call(referencePoint, 'point_id')) {
          newRoutePoint = {
            point_id: pointId,
          }
        } else if (Object.prototype.hasOwnProperty.call(referencePoint, 'name')) {
          newRoutePoint = {
            name: pointId,
          }
        } else if (Object.prototype.hasOwnProperty.call(referencePoint, 'id')) {
          newRoutePoint = {
            id: pointId,
          }
        }
      }

      // =====================================
      // INSERTAR EN LA POSICIÓN
      // =====================================

      const newPoints = [...route.points]

      newPoints.splice(insertIndex, 0, newRoutePoint)

      // =====================================
      // ACTUALIZAR AEROVÍA
      // =====================================

      const result = await db.collection('routes').updateOne(
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

      if (result.modifiedCount !== 1) {
        return res.status(500).json({
          error: `No fue posible actualizar la aerovía ${routeName}`,
        })
      }

      console.log(
        `ROOT ${req.user?.username || ''} insertó ` +
          `${pointId} en ${routeName} entre ` +
          `${previousPoint} y ${nextPoint}`,
      )

      return res.json({
        message: `Punto ${pointId} insertado correctamente en ${routeName}`,

        route_name: routeName,

        point_id: pointId,

        inserted_between: {
          previous: previousPoint,
          next: nextPoint,
        },

        position: insertIndex + 1,

        total_points: newPoints.length,
      })
    } catch (error) {
      console.error('Error insertando punto en aerovía:', error)

      return res.status(500).json({
        error: 'Error insertando punto en aerovía',
      })
    }
  },
)
// ======================================================
// ELIMINAR PUNTO CARACTERÍSTICO
// SOLO ROOT
// También elimina el punto de las aerovías
// ======================================================

app.delete(
  '/api/admin/database/characteristic-points/:pointId',
  checkDatabase,
  verifyToken,
  requireRoot,
  async (req, res) => {
    try {
      const pointId = String(req.params.pointId || '')
        .trim()
        .toUpperCase()

      if (!pointId) {
        return res.status(400).json({
          error: 'Debe especificar el punto a eliminar',
        })
      }

      // =====================================
      // 1. VERIFICAR QUE EL PUNTO EXISTA
      // =====================================

      const point = await db.collection('characteristic_points').findOne({
        point_id: pointId,
      })

      if (!point) {
        return res.status(404).json({
          error: `El punto ${pointId} no existe`,
        })
      }

      // =====================================
      // 2. BUSCAR TODAS LAS AEROVÍAS
      // =====================================

      const routes = await db.collection('routes').find({}).toArray()

      const routesToUpdate = []

      // =====================================
      // 3. BUSCAR EL PUNTO EN CADA AEROVÍA
      // =====================================

      for (const route of routes) {
        if (!Array.isArray(route.points)) {
          continue
        }

        const newPoints = route.points.filter((item) => {
          let id = ''

          if (typeof item === 'string') {
            id = item
          } else if (item && typeof item === 'object') {
            id = item.route_point || item.point_id || item.name || item.id || item.raw || ''
          }

          return String(id).trim().toUpperCase() !== pointId
        })

        // Si cambió la cantidad de puntos,
        // significa que esta aerovía utilizaba el fijo.
        if (newPoints.length !== route.points.length) {
          routesToUpdate.push({
            _id: route._id,
            route_name: route.route_name,
            points: newPoints,
          })
        }
      }

      // =====================================
      // 4. ACTUALIZAR LAS AEROVÍAS
      // =====================================

      const updatedRoutes = []

      for (const route of routesToUpdate) {
        await db.collection('routes').updateOne(
          {
            _id: route._id,
          },
          {
            $set: {
              points: route.points,
              updated_at: new Date(),
            },
          },
        )

        updatedRoutes.push(route.route_name || String(route._id))
      }

      // =====================================
      // 5. ELIMINAR EL PUNTO
      // =====================================

      const result = await db.collection('characteristic_points').deleteOne({
        point_id: pointId,
      })

      if (result.deletedCount !== 1) {
        return res.status(500).json({
          error: `No fue posible eliminar ${pointId}`,
        })
      }

      // =====================================
      // 6. REGISTRO EN TERMINAL
      // =====================================

      console.log(`ROOT ${req.user?.username || ''} eliminó el punto ${pointId}`)

      if (updatedRoutes.length > 0) {
        console.log('Aerovías actualizadas:', updatedRoutes)
      }

      // =====================================
      // 7. RESPUESTA
      // =====================================

      return res.json({
        message: `Punto ${pointId} eliminado correctamente`,

        point_id: pointId,

        routes_updated: updatedRoutes,

        total_routes_updated: updatedRoutes.length,
      })
    } catch (error) {
      console.error('Error eliminando punto característico:', error)

      return res.status(500).json({
        error: 'Error eliminando punto característico',
      })
    }
  },
)
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
// ======================================================
// SID - MAPA
// ======================================================

app.get('/api/sids/:procedureName/map', async (req, res) => {
  try {
    const procedureName = req.params.procedureName.toUpperCase()

    const sid = await db.collection('sids').findOne({
      procedure_name: procedureName,
    })

    if (!sid) {
      return res.status(404).json({
        error: `SID ${procedureName} no encontrada`,
      })
    }

    const pointIds = sid.points || []

    const characteristicPoints = await db
      .collection('characteristic_points')
      .find({
        point_id: { $in: pointIds },
      })
      .toArray()

    const pointMap = new Map(characteristicPoints.map((point) => [point.point_id, point]))

    // Mantener exactamente el orden de la SID
    const points = pointIds.map((pointId, index) => {
      const point = pointMap.get(pointId)

      if (!point) {
        return {
          sequence: index + 1,
          point_id: pointId,
          found: false,
        }
      }

      return {
        sequence: index + 1,

        point_id: point.point_id,

        latitude: point.position?.latitude ?? null,

        longitude: point.position?.longitude ?? null,

        geojson: point.position?.geojson ?? null,

        point_type: point.point_type ?? null,

        relevant_fix: point.relevant_fix ?? false,

        found: true,
      }
    })

    res.json({
      procedure_name: sid.procedure_name,

      type: 'SID',

      airport_id: sid.airport_id,

      runway: sid.runway,

      performance_categories: sid.performance_categories || [],

      eligible_routes: sid.eligible_routes || [],

      total_points: points.length,

      points,
    })
  } catch (error) {
    console.error('Error generando mapa SID:', error)

    res.status(500).json({
      error: 'Error generando mapa de SID',
    })
  }
})

// ======================================================
// STAR - MAPA
// ======================================================

app.get('/api/stars/:procedureName/map', async (req, res) => {
  try {
    const procedureName = req.params.procedureName.toUpperCase()

    const star = await db.collection('stars').findOne({
      procedure_name: procedureName,
    })

    if (!star) {
      return res.status(404).json({
        error: `STAR ${procedureName} no encontrada`,
      })
    }

    const pointIds = star.points || []

    const characteristicPoints = await db
      .collection('characteristic_points')
      .find({
        point_id: { $in: pointIds },
      })
      .toArray()

    const pointMap = new Map(characteristicPoints.map((point) => [point.point_id, point]))

    const points = pointIds.map((pointId, index) => {
      const point = pointMap.get(pointId)

      if (!point) {
        return {
          sequence: index + 1,
          point_id: pointId,
          found: false,
        }
      }

      return {
        sequence: index + 1,

        point_id: point.point_id,

        latitude: point.position?.latitude ?? null,

        longitude: point.position?.longitude ?? null,

        geojson: point.position?.geojson ?? null,

        point_type: point.point_type ?? null,

        relevant_fix: point.relevant_fix ?? false,

        found: true,
      }
    })

    res.json({
      procedure_name: star.procedure_name,

      type: 'STAR',

      airport_id: star.airport_id,

      runway: star.runway,

      performance_categories: star.performance_categories || [],

      atg_ils: star.atg_ils ?? null,

      eligible_routes: star.eligible_routes || [],

      total_points: points.length,

      points,
    })
  } catch (error) {
    console.error('Error generando mapa STAR:', error)

    res.status(500).json({
      error: 'Error generando mapa de STAR',
    })
  }
})
// ======================================================
// OBTENER LISTA DE AEROPUERTOS
// ROOT / ADMIN
// ======================================================

app.get('/api/airports', checkDatabase, verifyToken, async (req, res) => {
  try {
    const role = String(req.user?.role || '')
      .trim()
      .toUpperCase()

    // Solo ROOT y ADMIN pueden consultar
    // la lista completa de aeropuertos
    if (!['ROOT', 'ADMIN'].includes(role)) {
      return res.status(403).json({
        error: 'No tiene permisos para consultar todos los aeropuertos',
      })
    }

    const airports = await db
      .collection('airports')
      .find(
        {},
        {
          projection: {
            _id: 0,
            airport_id: 1,
            name: 1,
            airport_name: 1,
            city: 1,
            altitude: 1,
          },
        },
      )
      .sort({
        airport_id: 1,
      })
      .toArray()

    return res.json(airports)
  } catch (error) {
    console.error('Error obteniendo aeropuertos:', error)

    return res.status(500).json({
      error: 'Error obteniendo la lista de aeropuertos',
    })
  }
})
// ======================================================
// PROCEDIMIENTOS SID / STAR POR AEROPUERTO
// ======================================================

app.get('/api/airports/:airportId/procedures', async (req, res) => {
  try {
    const airportId = req.params.airportId.trim().toUpperCase()

    // Verificar que el aeropuerto exista
    const airport = await db.collection('airports').findOne({
      airport_id: airportId,
    })

    if (!airport) {
      return res.status(404).json({
        error: `Aeropuerto ${airportId} no encontrado`,
      })
    }

    // Buscar SID
    const sids = await db
      .collection('sids')
      .find({
        airport_id: airportId,
      })
      .project({
        _id: 0,
        procedure_name: 1,
        runway: 1,
        performance_categories: 1,
        points: 1,
        eligible_routes: 1,
      })
      .sort({
        runway: 1,
        procedure_name: 1,
      })
      .toArray()

    // Buscar STAR
    const stars = await db
      .collection('stars')
      .find({
        airport_id: airportId,
      })
      .project({
        _id: 0,
        procedure_name: 1,
        runway: 1,
        performance_categories: 1,
        points: 1,
        eligible_routes: 1,
      })
      .sort({
        runway: 1,
        procedure_name: 1,
      })
      .toArray()

    // Pistas
    const runways = Array.isArray(airport.runways)
      ? airport.runways.map((runway) => ({
          runway: runway.runway,
          default: runway.default,
          heading_true_deg: runway.heading_true_deg,
          location: runway.location,
        }))
      : []

    res.json({
      airport_id: airportId,

      altitude: airport.altitude || null,

      runways,

      counts: {
        sids: sids.length,
        stars: stars.length,
      },

      sids,

      stars,
    })
  } catch (error) {
    console.error('Error cargando procedimientos del aeropuerto:', error)

    res.status(500).json({
      error: 'Error interno al cargar procedimientos',
    })
  }
})

startServer()
