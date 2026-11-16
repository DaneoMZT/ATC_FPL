const STAGES = Object.freeze({
  UNCOORDINATED: 'UNCOORDINATED',
  PREACTIVE: 'PREACTIVE',
  DEPARTURE: 'DEPARTURE',
  ARRIVE: 'ARRIVE',
})

function getFlightStage(flight, now = new Date()) {
  if (flight.cancelled_at || flight.status === 'CNL') {
    return 'CANCELLED'
  }

  if (flight.arrived_at) {
    return 'ARRIVED'
  }

  if (flight.departed_at) {
    return 'DEPARTED'
  }

  if (flight.stage === STAGES.ARRIVE) {
    return STAGES.ARRIVE
  }

  const departureTime = new Date(flight.eobt_at)

  if (!flight.eobt_at || Number.isNaN(departureTime.getTime())) {
    return 'INVALID_TIME'
  }

  const minutesRemaining = (departureTime.getTime() - now.getTime()) / 60000

  if (minutesRemaining < 5) {
    return STAGES.DEPARTURE
  }

  if (minutesRemaining <= 10) {
    return STAGES.PREACTIVE
  }

  return STAGES.UNCOORDINATED
}

module.exports = {
  STAGES,
  getFlightStage,
}
