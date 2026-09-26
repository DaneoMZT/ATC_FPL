<script setup>
defineProps({
  flights: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>CALLSIGN</th>
          <th>AERONAVE</th>
          <th>DEP</th>
          <th>DEST</th>
          <th>EOBT</th>
          <th>FL</th>
          <th>RUTA</th>
          <th>ESTADO</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="flight in flights" :key="flight.callsign">
          <td class="callsign">
            {{ flight.callsign }}
          </td>

          <td>{{ flight.aircraft }}</td>

          <td>{{ flight.departure }}</td>

          <td>{{ flight.destination }}</td>

          <td class="time">
            {{ flight.eobt }}
          </td>

          <td>
            {{ flight.level }}
          </td>

          <td class="route">
            {{ flight.route }}
          </td>

          <td>
            <span
              class="status"
              :class="flight.status.toLowerCase()"
            >
              {{ flight.status }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #091522;
}

th {
  padding: 13px 16px;

  text-align: left;

  color: #71869b;

  font-size: 10px;

  letter-spacing: 0.5px;
}

td {
  padding: 15px 16px;

  border-top: 1px solid #172b3e;

  color: #b6c5d4;

  font-size: 12px;
}

tbody tr {
  transition: 0.2s;
}

tbody tr:hover {
  background: #102334;
}

.callsign {
  color: #55d1d9;

  font-weight: bold;
}

.time {
  font-family: 'JetBrains Mono', monospace;

  color: #e4edf6;
}

.route {
  max-width: 250px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  color: #8da0b4;
}

.status {
  display: inline-block;

  padding: 5px 9px;

  border-radius: 5px;

  font-size: 9px;

  font-weight: bold;
}

.status.activo {
  background: #123c32;

  color: #52d692;
}

.status.pendiente {
  background: #40331b;

  color: #f0b94e;
}

.status.cancelado {
  background: #422328;

  color: #ef6d78;
}
</style>