const normalize = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()

function getPointId(item) {
  if (typeof item === 'string') return normalize(item)

  return normalize(item?.point_id || item?.route_point || item?.name || item?.id || item?.raw)
}

async function resolveFlightPath(db, routeText) {
  const tokens = normalize(routeText).split(/\s+/).filter(Boolean)

  if (!tokens.length || tokens.length > 300) {
    throw new Error('Ruta vacía o demasiado extensa')
  }

  const routes = await db
    .collection('routes')
    .find({ route_name: { $in: tokens } })
    .toArray()

  const airwayMap = new Map(routes.map((route) => [normalize(route.route_name), route]))

  const ids = new Set()

  for (const token of tokens) {
    if (token !== 'DCT' && !airwayMap.has(token)) {
      ids.add(token)
    }
  }

  for (const route of routes) {
    for (const item of route.points || []) {
      const id = getPointId(item)
      if (id) ids.add(id)
    }
  }

  const fixes = await db
    .collection('characteristic_points')
    .find({ point_id: { $in: [...ids] } }, { projection: { point_id: 1, position: 1 } })
    .toArray()

  const positions = new Map()

  for (const fix of fixes) {
    const latitude = Number(fix.position?.latitude)
    const longitude = Number(fix.position?.longitude)

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      positions.set(normalize(fix.point_id), {
        latitude,
        longitude,
      })
    }
  }

  const expanded = []
  const errors = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token === 'DCT') {
      if (
        !expanded.length ||
        !tokens[i + 1] ||
        tokens[i + 1] === 'DCT' ||
        airwayMap.has(tokens[i + 1])
      ) {
        errors.push(`Conexión DCT incompleta en posición ${i + 1}`)
        break
      }
      continue
    }

    if (airwayMap.has(token)) {
      const airway = airwayMap.get(token)
      const start = expanded[expanded.length - 1]
      const end = tokens[i + 1]

      if (!start || !end || end === 'DCT' || airwayMap.has(end)) {
        errors.push(`Tramo incompleto de ${token}`)
        break
      }

      if (normalize(airway.sense) !== 'B') {
        errors.push(`Sentido de ${token} pendiente de validación`)
        break
      }

      const ordered = [...(airway.points || [])]
        .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0))
        .map(getPointId)
        .filter(Boolean)

      const first = ordered.indexOf(start)
      const last = ordered.indexOf(end)

      if (first < 0 || last < 0 || first === last) {
        errors.push(`${start} y ${end} no forman un tramo válido de ${token}`)
        break
      }

      const direction = last > first ? 1 : -1

      for (let j = first + direction; j !== last + direction; j += direction) {
        expanded.push(ordered[j])
      }

      i++
      continue
    }

    if (!positions.has(token)) {
      errors.push(`Punto no localizado: ${token}`)
      break
    }

    expanded.push(token)
  }

  const trajectory = expanded.map((id, index) => {
    const position = positions.get(id)

    if (!position) {
      errors.push(`Coordenadas no disponibles: ${id}`)
    }

    return {
      order: index + 1,
      point_id: id,
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
    }
  })

  return {
    route: normalize(routeText),
    status: errors.length ? 'INVALID_ROUTE' : 'VALID',
    trajectory: errors.length ? [] : trajectory,
    errors,
  }
}

module.exports = { resolveFlightPath }
