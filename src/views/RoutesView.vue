<template>
  <div class="routes-view">

    <!-- ENCABEZADO DE LA PÁGINA -->
    <div class="page-header">

      <div class="header-left">

        <!-- HOME -->
        <button
          class="home-button"
          @click="goHome"
        >
          <span class="home-icon">⌂</span>
          HOME
        </button>

        <div class="header-divider"></div>

        <!-- TÍTULO -->
        <div>
          <span class="section-label">
            ATCFPL · NAVEGACIÓN
          </span>

          <h1>
            Rutas aéreas
          </h1>

          <span class="subtitle">
            México · USA · Centroamérica · Cuba
          </span>
        </div>

      </div>


      <!-- ESTADO MONGODB -->
      <div class="database-status">

        <span class="dot"></span>

        <div>
          <span>BASE DE DATOS</span>
          <strong>MONGODB</strong>
        </div>

      </div>

    </div>


    <!-- MAPA -->
    <main class="map-content">
      <AllRoutesMap />
    </main>


    <!-- PIE DE PÁGINA -->
    <footer class="page-footer">

      <div class="footer-left">
        <strong>ATCFPL</strong>

        <span class="separator">|</span>

        <span>
          Air Traffic Control Flight Plan System
        </span>
      </div>


      <div class="system-status">
        <span class="footer-dot"></span>
        SISTEMA OPERATIVO
      </div>


      <div class="footer-right">
        <span>
          Centro de Control Mazatlán
        </span>

        <span class="separator">·</span>

        <strong>
          v1.0.0
        </strong>
      </div>

    </footer>

  </div>
</template>


<script setup>

import { useRouter } from 'vue-router'

import AllRoutesMap
  from '../components/AllRoutesMap.vue'


const router = useRouter()


// =====================================
// REGRESAR AL DASHBOARD
// =====================================

const goHome = () => {
  router.push('/')
}

</script>


<style scoped>

/* =====================================
   PÁGINA
===================================== */

.routes-view {
  width: 100%;

  min-height: 100vh;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  padding: 25px 30px 0;

  background: #07111b;
}


/* =====================================
   ENCABEZADO
===================================== */

.page-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 20px;

  padding-bottom: 18px;

  border-bottom:
    1px solid #17283a;
}


/* =====================================
   IZQUIERDA
===================================== */

.header-left {
  display: flex;

  align-items: center;

  gap: 18px;
}


/* =====================================
   HOME
===================================== */

.home-button {
  height: 42px;

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 0 14px;

  background: #0b1c2a;

  border:
    1px solid #1b4054;

  border-radius: 7px;

  color: #91a4b8;

  cursor: pointer;

  font-family: 'JetBrains Mono', monospace;

  font-size: 11px;

  font-weight: bold;

  transition: 0.2s;
}


.home-button:hover {
  background: #103244;

  border-color: #00e5ff;

  color: #00e5ff;

  box-shadow:
    0 0 12px
    rgba(0, 229, 255, 0.15);
}


.home-icon {
  color: #00e5ff;

  font-size: 19px;
}


/* =====================================
   DIVISOR
===================================== */

.header-divider {
  width: 1px;

  height: 42px;

  background: #1b3447;
}


/* =====================================
   TÍTULO
===================================== */

.section-label {
  display: block;

  margin-bottom: 3px;

  color: #4f7187;

  font-family: 'JetBrains Mono', monospace;

  font-size: 8px;

  letter-spacing: 1.5px;
}


.page-header h1 {
  margin: 0 0 4px;

  color: #00e5ff;

  font-size: 22px;

  font-weight: 600;
}


.subtitle {
  color: #71869b;

  font-size: 10px;
}


/* =====================================
   ESTADO MONGODB
===================================== */

.database-status {
  display: flex;

  align-items: center;

  gap: 9px;

  padding: 8px 12px;

  background: #091522;

  border:
    1px solid #17283a;

  border-radius: 6px;
}


.database-status > div {
  display: flex;

  flex-direction: column;

  gap: 2px;
}


.database-status div span {
  color: #60758b;

  font-size: 7px;

  letter-spacing: 1px;
}


.database-status strong {
  color: #4fd68a;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;
}


.dot {
  width: 7px;

  height: 7px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow:
    0 0 7px #4fd68a;
}


/* =====================================
   MAPA
===================================== */

.map-content {
  width: 100%;

  flex: 1;
}


/* =====================================
   PIE DE PÁGINA
===================================== */

.page-footer {
  min-height: 50px;

  margin-top: 25px;

  margin-left: -30px;
  margin-right: -30px;

  padding: 0 30px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  background: #06101a;

  border-top:
    1px solid #17283a;

  color: #60758b;

  font-family: 'JetBrains Mono', monospace;

  font-size: 9px;
}


/* =====================================
   FOOTER IZQUIERDO
===================================== */

.footer-left {
  display: flex;

  align-items: center;

  gap: 8px;
}


.footer-left strong {
  color: #00e5ff;

  letter-spacing: 1px;
}


/* =====================================
   SISTEMA OPERATIVO
===================================== */

.system-status {
  display: flex;

  align-items: center;

  gap: 7px;

  color: #4fd68a;
}


.footer-dot {
  width: 6px;

  height: 6px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow:
    0 0 7px #4fd68a;
}


/* =====================================
   FOOTER DERECHO
===================================== */

.footer-right {
  display: flex;

  align-items: center;

  gap: 7px;
}


.footer-right strong {
  color: #91a4b8;
}


.separator {
  color: #29495c;
}


/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 850px) {

  .routes-view {
    padding:
      18px 15px 0;
  }


  .page-header {
    align-items: flex-start;

    flex-direction: column;

    gap: 15px;
  }


  .header-divider {
    display: none;
  }


  .page-footer {
    margin-left: -15px;

    margin-right: -15px;

    padding: 12px 15px;

    align-items: flex-start;

    flex-direction: column;

    gap: 8px;
  }

}

</style>