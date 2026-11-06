const net = require('node:net')

const HOST = '127.0.0.1'
const PORT = 5500

const ALLOWED_TYPES = [
  'FPL',
  'CPL',
  'ABI',
  'CLN',
  'CHG',
  'DLA',
  'CNL',
  'DEP',
  'ARR',
  'EST',
  'ACT',
  'REV',
]

// ========================================
// SERVICIO DE SIMULACIÓN DE MENSAJES ATS
// ========================================

function simulateAtsMessage(data) {
  return new Promise((resolve, reject) => {
    const type = String(data?.type || '')
      .trim()
      .toUpperCase()
    const recipients = data?.recipients
    const body = data?.body

    // Validar tipo de mensaje
    if (!ALLOWED_TYPES.includes(type)) {
      return reject(new Error('Tipo de mensaje inválido'))
    }

    // Validar destinatarios
    if (
      !Array.isArray(recipients) ||
      recipients.length < 1 ||
      recipients.length > 20 ||
      !recipients.every((item) => typeof item === 'string' && /^[A-Z0-9]{8}$/.test(item))
    ) {
      return reject(new Error('Destinatarios inválidos'))
    }

    // Validar contenido
    if (typeof body !== 'string' || !body.trim() || body.length > 10000) {
      return reject(new Error('Contenido inválido'))
    }

    // Conectar con simulador TCP local
    const socket = net.createConnection({
      host: HOST,
      port: PORT,
    })

    let response = ''
    let settled = false

    function finish(error, result) {
      if (settled) return

      settled = true
      socket.destroy()

      if (error) reject(error)
      else resolve(result)
    }

    socket.setTimeout(5000)

    socket.on('connect', () => {
      socket.write(
        JSON.stringify({
          type,
          recipients,
          body,
          simulation: true,
        }) + '\n',
      )
    })

    socket.on('data', (chunk) => {
      response += chunk.toString('utf8')

      if (response.length > 4096) {
        return finish(new Error('Respuesta demasiado grande'))
      }

      if (response.includes('\n')) {
        try {
          const result = JSON.parse(response.split('\n')[0])

          if (result.success !== true) {
            return finish(new Error(result.error || 'Simulación rechazada'))
          }

          finish(null, result)
        } catch (error) {
          finish(error)
        }
      }
    })

    socket.on('timeout', () => {
      finish(new Error('Tiempo de espera agotado'))
    })

    socket.on('error', (error) => {
      finish(error)
    })

    socket.on('end', () => {
      if (!settled) {
        finish(new Error('Conexión cerrada sin respuesta'))
      }
    })
  })
}

// Exportación compatible con CommonJS
module.exports = { simulateAtsMessage }
