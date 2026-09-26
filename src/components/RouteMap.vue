<template>

  <div class="routes-page">

    <!-- =====================================
         ENCABEZADO
    ====================================== -->

    <header class="routes-header">

      <div class="header-left">

        <!-- BOTÓN HOME -->

        <button
          class="home-button"
          @click="goHome"
          title="Regresar al Dashboard"
        >
          <span class="home-icon">
            ⌂
          </span>

          <span>
            HOME
          </span>
        </button>


        <div class="header-divider"></div>


        <!-- TÍTULO -->

        <div class="title-container">

          <div class="section-label">
            ATCFPL · NAVEGACIÓN
          </div>

          <h1>
            Rutas aéreas
          </h1>

          <p>
            Red de aerovías · México · USA ·
            Centroamérica · Cuba
          </p>

        </div>

      </div>


      <!-- ESTADO -->

      <div class="header-status">

        <div class="database-status">

          <span class="status-dot"></span>

          <div>
            <small>
              BASE DE DATOS
            </small>

            <strong>
              MONGODB
            </strong>
          </div>

        </div>

      </div>

    </header>


    <!-- =====================================
         CONTENIDO
    ====================================== -->

    <main class="routes-content">

      <AllRoutesMap />

    </main>


    <!-- =====================================
         PIE DE PÁGINA
    ====================================== -->

    <footer class="routes-footer">

      <div class="footer-left">

        <span class="footer-logo">
          ATCFPL
        </span>

        <span class="footer-separator">
          |
        </span>

        <span>
          Air Traffic Control Flight Plan System
        </span>

      </div>


      <div class="footer-center">

        <span class="footer-dot"></span>

        <span>
          SISTEMA OPERATIVO
        </span>

      </div>


      <div class="footer-right">

        <span>
          Centro de Control Mazatlán
        </span>

        <span class="footer-separator">
          ·
        </span>

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


// =====================================
// ROUTER
// =====================================

const router = useRouter()


// =====================================
// REGRESAR AL HOME
// =====================================

const goHome = () => {

  router.push('/')

}

</script>


<style scoped>

/* =====================================
   PÁGINA
===================================== */

.routes-page {
  width: 100%;

  min-height: 100vh;

  display: flex;

  flex-direction: column;

  box-sizing: border-box;

  background: #07111b;

  color: #dce7f1;
}


/* =====================================
   ENCABEZADO
===================================== */

.routes-header {
  min-height: 88px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  box-sizing: border-box;

  padding: 14px 30px;

  background:
    linear-gradient(
      90deg,
      #07131f 0%,
      #091a28 50%,
      #07131f 100%
    );

  border-bottom:
    1px solid #173448;

  box-shadow:
    0 4px 20px
    rgba(0, 0, 0, 0.25);
}


/* =====================================
   LADO IZQUIERDO
===================================== */

.header-left {
  display: flex;

  align-items: center;

  gap: 20px;
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

  letter-spacing: 0.5px;

  transition: 0.2s;
}


.home-button:hover {
  background: #103244;

  border-color: #00e5ff;

  color: #00e5ff;

  box-shadow:
    0 0 12px
    rgba(0, 229, 255, 0.12);
}


.home-icon {
  color: #00e5ff;

  font-size: 20px;
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

.title-container {
  display: flex;

  flex-direction: column;
}


.section-label {
  margin-bottom: 3px;

  color: #4e748b;

  font-family: 'JetBrains Mono', monospace;

  font-size: 8px;

  letter-spacing: 1.5px;
}


.title-container h1 {
  margin: 0;

  color: #00e5ff;

  font-size: 23px;

  font-weight: 600;

  letter-spacing: 0.3px;
}


.title-container p {
  margin: 4px 0 0;

  color: #71869b;

  font-size: 10px;
}


/* =====================================
   ESTADO BASE DE DATOS
===================================== */

.header-status {
  display: flex;

  align-items: center;
}


.database-status {
  display: flex;

  align-items: center;

  gap: 9px;

  padding: 8px 12px;

  background: #07131f;

  border:
    1px solid #173448;

  border-radius: 7px;
}


.database-status > div {
  display: flex;

  flex-direction: column;

  gap: 1px;
}


.database-status small {
  color: #60758b;

  font-size: 7px;

  letter-spacing: 1px;
}


.database-status strong {
  color: #4fd68a;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;
}


.status-dot {
  width: 7px;

  height: 7px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow:
    0 0 8px
    rgba(79, 214, 138, 0.8);
}


/* =====================================
   CONTENIDO
===================================== */

.routes-content {
  flex: 1;

  width: 100%;

  box-sizing: border-box;

  padding: 20px 30px 25px;
}


/* =====================================
   FOOTER
===================================== */

.routes-footer {
  min-height: 45px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  box-sizing: border-box;

  padding: 0 30px;

  background: #06101a;

  border-top:
    1px solid #173448;

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


.footer-logo {
  color: #00e5ff;

  font-weight: bold;

  letter-spacing: 1px;
}


.footer-separator {
  color: #29495c;
}


/* =====================================
   FOOTER CENTRO
===================================== */

.footer-center {
  display: flex;

  align-items: center;

  gap: 7px;

  color: #4fd68a;
}


.footer-dot {
  width: 5px;

  height: 5px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow:
    0 0 6px #4fd68a;
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


/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 850px) {

  .routes-header {
    align-items: flex-start;

    flex-direction: column;

    gap: 15px;

    padding: 15px 20px;
  }


  .header-divider {
    display: none;
  }


  .routes-content {
    padding: 15px;
  }


  .routes-footer {
    align-items: flex-start;

    flex-direction: column;

    gap: 7px;

    padding: 12px 20px;
  }


  .footer-center {
    order: -1;
  }

}

</style>