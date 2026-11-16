'use strict'

function parseFpl(raw) {
  if (typeof raw !== 'string' || raw.length > 8192) {
    throw new Error('Mensaje FPL inválido o demasiado largo')
  }

  const text = raw.trim().toUpperCase().replace(/\r\n?/g, '\n')
  if (!text.startsWith('(FPL-') || !text.endsWith(')')) {
    throw new Error('Se requiere un mensaje (FPL-...) completo')
  }

  const fields = text.slice(1, -1).split(/\s*-\s*(?=\S)/)

  if (fields.length < 9 || fields[0] !== 'FPL') {
    throw new Error('Estructura FPL incompleta')
  }

  const callsign = fields[1]
  const rules = fields[2]
  const aircraftField = fields[3]
  const equipmentField = fields[4]
  const departureField = fields[5]
  const routeField = fields[6]
  const destinationField = fields[7]
  const item18 = fields.slice(8).join(' ')

  const dep = departureField.match(/^([A-Z]{4})(\d{4})$/)
  const dest = destinationField.match(/^([A-Z]{4})(\d{4})(?:\s+([A-Z]{4}))?/)
  const aircraft = aircraftField.match(/^(?:\d{1,2})?([A-Z0-9]{2,4})\/([LMHJ])$/)
  const route = routeField.match(/^([NK]\d{4}|M\d{3})([FA]\d{3}|S\d{4}|M\d{4})\s+(.+)$/s)
  const dof = item18.match(/\bDOF\/(\d{6})\b/)

  console.log('=== DIAGNÓSTICO FPL ===')
  console.log('Campos:', fields)
  console.log('Callsign:', callsign)
  console.log('Reglas:', rules)
  console.log('Aeronave:', aircraft)
  console.log('Salida:', dep)
  console.log('Ruta:', route)
  console.log('Destino:', dest)
  console.log('DOF:', dof)

  if (
    !/^[A-Z0-9]{2,10}$/.test(callsign) ||
    !/^[IVYZ][SNGMX]$/.test(rules) ||
    !dep ||
    !dest ||
    !aircraft ||
    !route ||
    !dof
  ) {
    throw new Error('Campos OACI obligatorios inválidos o no compatibles')
  }

  const hhmmValid = (v) => {
    const h = Number(v.slice(0, 2))
    const m = Number(v.slice(2, 4))
    return h <= 23 && m <= 59
  }

  if (!hhmmValid(dep[2])) {
    throw new Error('EOBT inválida')
  }

  const eetMinutes = Number(dest[2].slice(0, 2)) * 60 + Number(dest[2].slice(2, 4))

  if (Number(dest[2].slice(2, 4)) > 59 || eetMinutes === 0) {
    throw new Error('EET inválido')
  }

  const yy = 2000 + Number(dof[1].slice(0, 2))
  const mm = Number(dof[1].slice(2, 4))
  const dd = Number(dof[1].slice(4, 6))
  const eobtAt = new Date(
    Date.UTC(yy, mm - 1, dd, Number(dep[2].slice(0, 2)), Number(dep[2].slice(2, 4))),
  )

  if (
    eobtAt.getUTCFullYear() !== yy ||
    eobtAt.getUTCMonth() !== mm - 1 ||
    eobtAt.getUTCDate() !== dd
  ) {
    throw new Error('DOF inválida')
  }

  return {
    message_type: 'FPL',
    raw_message: text,
    callsign,
    flight_rules: rules[0],
    flight_type: rules[1],
    aircraft: aircraft[1],
    wake_turbulence: aircraft[2],
    equipment: equipmentField,
    departure: dep[1],
    destination: dest[1],
    alternate: dest[3] || '',
    eobt: dep[2],
    eobtDateTime: eobtAt.toISOString(),
    eet: dest[2],
    eta: new Date(eobtAt.getTime() + eetMinutes * 60000).toISOString(),
    speed: route[1],
    flight_level: route[2],
    route: route[3].trim(),
    dof: dof[1],
    item18,
  }
}

module.exports = { parseFpl }
