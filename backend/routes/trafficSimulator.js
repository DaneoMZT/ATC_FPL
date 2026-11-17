'use strict'

const express = require('express')
const { ObjectId } = require('mongodb')
const { parseFpl } = require('../services/fplParser')

function eetMinutes(value) {
  const raw = String(value ?? '')
    .trim()
    .replace(':', '')

  if (!/^\d{4}$/.test(raw)) return null

  const hours = Number(raw.slice(0, 2))
  const minutes = Number(raw.slice(2))

  if (minutes > 59 || hours * 60 + minutes <= 0) {
    return null
  }

  return hours * 60 + minutes
}

function createTrafficSimulatorRouter(db) {
  const router = express.Router()
  const collection = db.collection('simulated_flight_plans')

  // Inyectar un plan de vuelo FPL simulado
  router.post('/fpl', async (req, res) => {
    try {
      const message = req.body?.message

      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar un mensaje FPL válido.',
        })
      }

      const flight = parseFpl(message.trim())

      if (!flight || typeof flight !== 'object') {
        return res.status(422).json({
          success: false,
          error: 'No fue posible interpretar el mensaje FPL.',
        })
      }

      const minutes = eetMinutes(flight.eet ?? flight.icao?.eet)

      if (minutes === null) {
        return res.status(422).json({
          success: false,
          error: 'EET inválido o ausente. Se requiere HHMM mayor que 0000.',
        })
      }

      const now = new Date()
      const eta = new Date(now.getTime() + minutes * 60000)

      // Exclusivamente simulación:
      // La recepción del FPL equivale a una salida simulada.
      const document = {
        ...flight,
        lifecycle: 'DEPARTED',
        status: 'DEPARTED',
        departed_at: now,
        eta_at: eta,
        departure_source: 'SIMULATED_FPL_RECEIVED',
        simulated: true,
        source: 'ATCFPL_TRAFFIC_SIMULATOR',
        created_at: now,
        updated_at: now,
      }

      const result = await collection.insertOne(document)

      return res.status(201).json({
        success: true,
        id: result.insertedId.toString(),
        flight: {
          ...document,
          _id: result.insertedId,
        },
      })
    } catch (error) {
      console.error('Error al inyectar FPL:', error)

      return res.status(400).json({
        success: false,
        error: error.message || 'No fue posible procesar el FPL.',
      })
    }
  })

  // Procesar eventos simulados DEP y ARR
  router.post('/:id/event', async (req, res) => {
    try {
      const { id } = req.params
      const event = String(req.body?.event || '')
        .trim()
        .toUpperCase()

      if (!ObjectId.isValid(id) || !['DEP', 'ARR'].includes(event)) {
        return res.status(400).json({
          success: false,
          error: 'ID o evento inválido.',
        })
      }

      const isDeparture = event === 'DEP'

      const filter = {
        _id: new ObjectId(id),
        simulated: true,
        source: 'ATCFPL_TRAFFIC_SIMULATOR',
        lifecycle: isDeparture ? 'SCHEDULED' : 'DEPARTED',
      }

      const flight = await collection.findOne(filter)

      if (!flight) {
        return res.status(409).json({
          success: false,
          error: 'Vuelo inexistente o transición no permitida.',
        })
      }

      const now = new Date()

      const fields = {
        lifecycle: isDeparture ? 'DEPARTED' : 'ARRIVED',
        status: isDeparture ? 'DEPARTED' : 'ARRIVED',
        [isDeparture ? 'departed_at' : 'arrived_at']: now,
        updated_at: now,
      }

      if (isDeparture) {
        const minutes = eetMinutes(flight.eet ?? flight.icao?.eet)

        if (minutes === null) {
          return res.status(422).json({
            success: false,
            error: 'EET inválido o ausente. Se requiere HHMM.',
          })
        }

        fields.eta_at = new Date(now.getTime() + minutes * 60000)
      } else {
        fields.arrival_source = 'SIMULATED_MANUAL_ARR'
      }

      const result = await collection.updateOne(filter, { $set: fields })

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          error: 'Transición modificada concurrentemente.',
        })
      }

      const updated = await collection.findOne({
        _id: flight._id,
      })

      return res.json({
        success: true,
        event,
        flight: updated,
      })
    } catch (error) {
      console.error('Error en evento simulado:', error)

      return res.status(500).json({
        success: false,
        error: 'No se pudo procesar el evento.',
      })
    }
  })

  // Consultar vuelos generados por el simulador
  router.get('/flights', async (req, res) => {
    try {
      const flights = await collection
        .find({
          simulated: true,
          source: 'ATCFPL_TRAFFIC_SIMULATOR',
        })
        .sort({ created_at: -1 })
        .limit(100)
        .toArray()

      return res.json({
        success: true,
        flights,
      })
    } catch (error) {
      console.error('Error al consultar vuelos simulados:', error)

      return res.status(500).json({
        success: false,
        error: 'No se pudieron consultar los vuelos.',
      })
    }
  })

  return router
}

module.exports = { createTrafficSimulatorRouter }
