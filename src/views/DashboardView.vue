<script setup>
import { ref } from 'vue'

import FlightTable from '../components/FlightTable.vue'
import FlightPlanModal from '../components/FlightPlanModal.vue'


// =====================================
// PLANES TEMPORALES
// =====================================

const flights = ref([
  {
    callsign: 'AMX123',
    aircraft: 'B738',
    departure: 'MMMX',
    destination: 'MMZT',
    eobt: '20:30',
    level: 'FL360',
    route: 'SLM UJ12 CUL',
    status: 'ACTIVO',
  },
  {
    callsign: 'VOI501',
    aircraft: 'A320',
    departure: 'MMZT',
    destination: 'MMGL',
    eobt: '20:45',
    level: 'FL320',
    route: 'CUL UJ3 GDL',
    status: 'PENDIENTE',
  },
  {
    callsign: 'VIV102',
    aircraft: 'A321',
    departure: 'MMGL',
    destination: 'MMZT',
    eobt: '21:00',
    level: 'FL340',
    route: 'GDL UJ7 CUL',
    status: 'ACTIVO',
  },
  {
    callsign: 'AMX215',
    aircraft: 'B737',
    departure: 'MMZT',
    destination: 'MMMX',
    eobt: '21:15',
    level: 'FL350',
    route: 'CUL UJ12 SLM',
    status: 'ACTIVO',
  },
  {
    callsign: 'VOI843',
    aircraft: 'A320',
    departure: 'MMTJ',
    destination: 'MMZT',
    eobt: '21:35',
    level: 'FL330',
    route: 'TIJ UJ5 CUL',
    status: 'PENDIENTE',
  },
])


// =====================================
// MODAL
// =====================================

const showNewFlight = ref(false)


// =====================================
// AGREGAR PLAN
// =====================================

function addFlight(flight) {
  flights.value.unshift(flight)
  showNewFlight.value = false
}
</script>


<template>
  <div class="dashboard">

    <!-- =====================================
         TÍTULO
    ====================================== -->

    <div class="title-row">

      <div class="title">
        <h1>Dashboard</h1>

        <p>
          Resumen operacional del sistema
        </p>
      </div>

      <button
        class="new-flight"
        @click="showNewFlight = true"
      >
        <span>＋</span>
        NUEVO PLAN DE VUELO
      </button>

    </div>


    <!-- =====================================
         TARJETAS
    ====================================== -->

    <div class="cards">

      <div class="card">

        <div class="card-header">
          <span>PLANES ACTIVOS</span>

          <div class="card-icon">
            ✈
          </div>
        </div>

        <strong>24</strong>

        <small class="green">
          ● En operación
        </small>

      </div>


      <div class="card">

        <div class="card-header">
          <span>PENDIENTES</span>

          <div class="card-icon warning-icon">
            !
          </div>
        </div>

        <strong>3</strong>

        <small class="yellow">
          ● Requieren atención
        </small>

      </div>


      <div class="card">

        <div class="card-header">
          <span>SALIDAS HOY</span>

          <div class="card-icon">
            ↗
          </div>
        </div>

        <strong>12</strong>

        <small>
          MMZT
        </small>

      </div>


      <div class="card">

        <div class="card-header">
          <span>LLEGADAS HOY</span>

          <div class="card-icon">
            ↘
          </div>
        </div>

        <strong>9</strong>

        <small>
          MMZT
        </small>

      </div>

    </div>


    <!-- =====================================
         PLANES DE VUELO
    ====================================== -->

    <section class="panel flight-panel">

      <div class="panel-header">

        <div>
          <h2>
            Planes de vuelo activos
          </h2>

          <p>
            Últimos planes procesados por ATCFPL
          </p>
        </div>

        <button class="view-all">
          VER TODOS
        </button>

      </div>


      <FlightTable
        :flights="flights"
      />

    </section>


    <!-- =====================================
         PARTE INFERIOR
    ====================================== -->

    <div class="bottom-grid">

      <!-- MENSAJES AFTN -->

      <section class="small-panel">

        <div class="small-panel-header">

          <div>
            <h2>
              Mensajes AFTN
            </h2>

            <p>
              Actividad reciente
            </p>
          </div>

          <span class="online">
            ● ONLINE
          </span>

        </div>


        <div class="messages">

          <div class="message">

            <div class="message-icon">
              FPL
            </div>

            <div>
              <strong>
                AMX123
              </strong>

              <p>
                Plan de vuelo recibido
              </p>
            </div>

            <span class="message-time">
              20:15
            </span>

          </div>


          <div class="message">

            <div class="message-icon">
              CHG
            </div>

            <div>
              <strong>
                VOI501
              </strong>

              <p>
                Modificación de plan
              </p>
            </div>

            <span class="message-time">
              20:08
            </span>

          </div>


          <div class="message">

            <div class="message-icon">
              DLA
            </div>

            <div>
              <strong>
                VIV102
              </strong>

              <p>
                Demora recibida
              </p>
            </div>

            <span class="message-time">
              19:54
            </span>

          </div>

        </div>

      </section>


      <!-- ESTADO DEL SISTEMA -->

      <section class="small-panel">

        <div class="small-panel-header">

          <div>
            <h2>
              Estado del sistema
            </h2>

            <p>
              Servicios principales
            </p>
          </div>

          <span class="online">
            ● OPERATIVO
          </span>

        </div>


        <div class="services">

          <div class="service">

            <div>
              <span class="service-dot"></span>

              <strong>
                MongoDB
              </strong>
            </div>

            <span class="service-status">
              ONLINE
            </span>

          </div>


          <div class="service">

            <div>
              <span class="service-dot"></span>

              <strong>
                API Server
              </strong>
            </div>

            <span class="service-status">
              ONLINE
            </span>

          </div>


          <div class="service">

            <div>
              <span class="service-dot"></span>

              <strong>
                ATCFPL
              </strong>
            </div>

            <span class="service-status">
              OPERATIVO
            </span>

          </div>

        </div>

      </section>

    </div>


    <!-- =====================================
         MODAL
    ====================================== -->

    <FlightPlanModal
      v-if="showNewFlight"
      @close="showNewFlight = false"
      @save="addFlight"
    />

  </div>
</template>


<style scoped>

/* =====================================
   DASHBOARD
===================================== */

.dashboard {
  width: 100%;
  box-sizing: border-box;

  padding: 30px;

  color: #dce7f1;
}


/* =====================================
   TÍTULO
===================================== */

.title-row {
  display: flex;

  justify-content: space-between;
  align-items: center;

  margin-bottom: 25px;
}


.title h1 {
  margin: 0;

  color: #00e5ff;

  font-size: 27px;
}


.title p {
  margin: 5px 0 0;

  color: #71869b;

  font-size: 13px;
}


/* =====================================
   BOTÓN NUEVO PLAN
===================================== */

.new-flight {
  display: flex;

  align-items: center;

  gap: 8px;

  padding: 12px 18px;

  background: #07818b;

  border: none;

  border-radius: 7px;

  color: white;

  cursor: pointer;

  font-size: 11px;
  font-weight: bold;

  transition: 0.2s;
}


.new-flight:hover {
  background: #0797a3;

  transform:
    translateY(-1px);
}


.new-flight span {
  font-size: 16px;
}


/* =====================================
   TARJETAS
===================================== */

.cards {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 18px;

  margin-bottom: 25px;
}


.card {
  min-height: 120px;

  display: flex;

  flex-direction: column;

  padding: 20px;

  background: #0c1a29;

  border:
    1px solid #172b3e;

  border-radius: 9px;

  transition: 0.2s;
}


.card:hover {
  border-color: #24506a;

  transform:
    translateY(-2px);
}


.card-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 20px;

  color: #71869b;

  font-size: 10px;
}


.card-icon {
  width: 31px;
  height: 31px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #123847;

  border-radius: 7px;

  color: #54ced7;
}


.warning-icon {
  background: #453b1c;

  color: #e7c24f;
}


.card > strong {
  margin-bottom: 7px;

  color: #e5eef5;

  font-family: 'JetBrains Mono', monospace;

  font-size: 28px;
}


.card small {
  color: #71869b;

  font-size: 10px;
}


.card .green {
  color: #4fd68a;
}


.card .yellow {
  color: #e7c24f;
}


/* =====================================
   PANELES
===================================== */

.panel,
.small-panel {
  background: #0c1a29;

  border:
    1px solid #172b3e;

  border-radius: 9px;

  overflow: hidden;
}


.flight-panel {
  margin-bottom: 20px;
}


.panel-header {
  min-height: 65px;

  box-sizing: border-box;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 15px 20px;

  border-bottom:
    1px solid #172b3e;
}


.panel-header h2 {
  margin: 0;

  font-size: 15px;
}


.panel-header p {
  margin: 5px 0 0;

  color: #71869b;

  font-size: 11px;
}


.view-all {
  background: transparent;

  border: none;

  color: #56cbd4;

  cursor: pointer;

  font-size: 11px;
}


/* =====================================
   PARTE INFERIOR
===================================== */

.bottom-grid {
  display: grid;

  grid-template-columns:
    1.4fr 1fr;

  gap: 20px;
}


.small-panel-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 18px 20px;

  border-bottom:
    1px solid #172b3e;
}


.small-panel-header h2 {
  margin: 0;

  font-size: 14px;
}


.small-panel-header p {
  margin: 4px 0 0;

  color: #71869b;

  font-size: 10px;
}


.online {
  color: #4fd68a;

  font-size: 9px;
}


/* =====================================
   MENSAJES
===================================== */

.message {
  display: grid;

  grid-template-columns:
    45px 1fr auto;

  align-items: center;

  gap: 12px;

  padding: 14px 20px;

  border-bottom:
    1px solid #14283a;
}


.message:last-child {
  border-bottom: none;
}


.message:hover {
  background: #102334;
}


.message-icon {
  width: 38px;
  height: 30px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #123847;

  border-radius: 5px;

  color: #54ced7;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;

  font-weight: bold;
}


.message strong {
  font-size: 11px;
}


.message p {
  margin: 3px 0 0;

  color: #71869b;

  font-size: 10px;
}


.message-time {
  color: #71869b;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;
}


/* =====================================
   SERVICIOS
===================================== */

.services {
  padding: 5px 20px;
}


.service {
  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 14px 0;

  border-bottom:
    1px solid #14283a;
}


.service:last-child {
  border-bottom: none;
}


.service > div {
  display: flex;

  align-items: center;

  gap: 10px;
}


.service strong {
  font-size: 11px;
}


.service-dot {
  width: 7px;
  height: 7px;

  display: inline-block;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow:
    0 0 7px #4fd68a;
}


.service-status {
  color: #4fd68a;

  font-size: 9px;

  font-weight: bold;
}


/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 1100px) {

  .cards {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .bottom-grid {
    grid-template-columns:
      1fr;
  }

}


@media (max-width: 700px) {

  .dashboard {
    padding: 20px;
  }

  .cards {
    grid-template-columns:
      1fr;
  }

  .title-row {
    align-items:
      flex-start;

    flex-direction:
      column;

    gap: 20px;
  }

}

</style>