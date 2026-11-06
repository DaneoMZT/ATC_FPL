const net = require('node:net')

const HOST = '127.0.0.1'
const PORT = 5500
const MAX_BYTES = 16384

// Construye el texto que se mostrará en la terminal.
function formatAftnMessage(data) {
  const body = String(data.body || '').trim()

  // Si la plantilla ya incluye el encabezado AFTN,
  // conservar el texto y sus saltos de línea.
  if (/^(FF|GG|DD|SS)\s+[A-Z0-9]{8}\b/i.test(body)) {
    return body
  }

  // Si solo se recibe el cuerpo ATS, crear un
  // encabezado de presentación para el simulador.
  const recipients = Array.isArray(data.recipients)
    ? data.recipients
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim().toUpperCase())
        .join(' ')
    : ''

  const priority = 'FF'
  const originator = 'MMZTZRZX'

  const now = new Date()
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')

  const dateTime = `${dd}${hh}${mm}`

  return [`${priority} ${recipients}`.trim(), '', `${dateTime} ${originator}`, '', body].join('\n')
}

const server = net.createServer((socket) => {
  let buffer = ''
  let bytes = 0
  let processed = false

  socket.setTimeout(5000)

  socket.on('data', (chunk) => {
    if (processed) return

    bytes += chunk.length

    if (bytes > MAX_BYTES) {
      socket.destroy()
      return
    }

    buffer += chunk.toString('utf8')

    if (!buffer.includes('\n')) return

    processed = true

    const line = buffer.split('\n')[0]

    try {
      const data = JSON.parse(line)

      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        typeof data.body !== 'string' ||
        !Array.isArray(data.recipients)
      ) {
        throw new Error('Estructura de mensaje inválida')
      }

      const formattedMessage = formatAftnMessage(data)

      console.log('\n--- MENSAJE ATS SIMULADO ---\n')
      console.log(formattedMessage)
      console.log('\n----------------------------\n')

      socket.end(
        JSON.stringify({
          success: true,
          status: 'SIMULATED_RECEIVED',
          aftnDelivered: false,
          timestamp: new Date().toISOString(),
        }) + '\n',
      )
    } catch (error) {
      console.error('Error al procesar mensaje:', error.message)

      socket.end(
        JSON.stringify({
          success: false,
          error: 'Mensaje de prueba inválido',
        }) + '\n',
      )
    }
  })

  socket.on('timeout', () => socket.destroy())

  socket.on('error', (err) => {
    console.error('Error del cliente:', err.message)
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Simulador ATS TCP: ${HOST}:${PORT}`)
  console.log('MODO LABORATORIO - SIN CONEXIÓN AFTN')
})
