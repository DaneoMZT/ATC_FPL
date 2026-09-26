<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: isCollapsed
    }"
  >

    <!-- =====================================
         LOGO
    ====================================== -->

    <div class="brand">

      <div class="brand-icon">
        ✦
      </div>

      <div
        v-if="!isCollapsed"
        class="brand-text"
      >
        <h1>
          <span class="atc">ATC</span>
          <span class="fpl">FPL</span>
        </h1>

        <span>
          Flight Plan System
        </span>
      </div>

    </div>


    <!-- =====================================
         HAMBURGUESA
    ====================================== -->

    <button
      class="hamburger"
      @click="toggleSidebar"
      :title="
        isCollapsed
          ? 'Abrir menú'
          : 'Cerrar menú'
      "
    >

      <span></span>
      <span></span>
      <span></span>

    </button>


    <!-- =====================================
         MENÚ
    ====================================== -->

    <nav class="menu">

      <!-- DASHBOARD -->

      <RouterLink
        to="/"
        class="menu-item"
        title="Dashboard"
      >
        <span class="menu-icon">
          ▦
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Dashboard
        </span>
      </RouterLink>


      <!-- PLANES -->

      <a
        class="menu-item"
        href="#"
        title="Planes de vuelo"
      >
        <span class="menu-icon">
          ✈
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Planes de vuelo
        </span>
      </a>


      <!-- RUTAS -->

      <RouterLink
        to="/routes"
        class="menu-item"
        title="Rutas"
      >
        <span class="menu-icon">
          ⌁
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Rutas
        </span>
      </RouterLink>


      <!-- PUNTOS -->

      <a
        class="menu-item"
        href="#"
        title="Puntos característicos"
      >
        <span class="menu-icon">
          ◉
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Puntos característicos
        </span>
      </a>


      <!-- AEROPUERTOS -->

      <a
        class="menu-item"
        href="#"
        title="Aeropuertos"
      >
        <span class="menu-icon">
          △
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Aeropuertos
        </span>
      </a>


      <!-- USUARIOS -->

      <a
        class="menu-item"
        href="#"
        title="Usuarios"
      >
        <span class="menu-icon">
          ♙
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Usuarios
        </span>
      </a>


      <!-- CONFIGURACIÓN -->

      <a
        class="menu-item"
        href="#"
        title="Configuración"
      >
        <span class="menu-icon">
          ⚙
        </span>

        <span
          v-if="!isCollapsed"
          class="menu-text"
        >
          Configuración
        </span>
      </a>

    </nav>


    <!-- =====================================
         FOOTER SIDEBAR
    ====================================== -->

    <div class="sidebar-footer">

      <div class="status">

        <span class="status-dot"></span>

        <span v-if="!isCollapsed">
          SISTEMA OPERATIVO
        </span>

      </div>

      <small v-if="!isCollapsed">
        ATCFPL v1.0.0
      </small>

    </div>

  </aside>
</template>


<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const emit =
  defineEmits([
    'collapse-change'
  ])

const isCollapsed =
  ref(false)

function toggleSidebar() {
  isCollapsed.value =
    !isCollapsed.value

  emit(
    'collapse-change',
    isCollapsed.value
  )
}
</script>


<style scoped>
/* =====================================
   SIDEBAR
===================================== */

.sidebar {
  width: 250px;
  height: 100vh;

  position: fixed;

  left: 0;
  top: 0;

  z-index: 2000;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  padding: 20px 16px;

  background: #091522;

  border-right:
    1px solid #17283a;

  transition:
    width 0.25s ease;
}


/* =====================================
   COLAPSADO
===================================== */

.sidebar.collapsed {
  width: 78px;

  padding-left: 11px;
  padding-right: 11px;
}


/* =====================================
   MARCA
===================================== */

.brand {
  min-height: 48px;

  display: flex;
  align-items: center;

  gap: 12px;

  padding:
    0 5px 18px;
}


.brand-icon {
  width: 40px;
  min-width: 40px;

  height: 40px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #0b7d88;

  border-radius: 10px;

  color: white;

  font-size: 22px;

  box-shadow:
    0 0 12px
    rgba(0, 229, 255, 0.12);
}


.brand-text {
  overflow: hidden;

  white-space: nowrap;
}


.brand-text h1 {
  margin: 0;

  font-size: 20px;

  letter-spacing: 1px;
}


.brand-text .atc {
  color: #00e5ff;
}


.brand-text .fpl {
  color: #ffffff;
}


.brand-text > span {
  color: #71869b;

  font-size: 10px;
}


/* =====================================
   HAMBURGUESA
===================================== */

.hamburger {
  width: 100%;

  height: 35px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 4px;

  margin-bottom: 15px;

  background: #0d1d2c;

  border:
    1px solid #172f42;

  border-radius: 6px;

  cursor: pointer;
}


.hamburger:hover {
  border-color: #00e5ff;

  background: #102334;
}


.hamburger span {
  width: 18px;

  height: 2px;

  display: block;

  background: #5bd6dd;

  border-radius: 2px;
}


/* =====================================
   MENÚ
===================================== */

.menu {
  display: flex;

  flex-direction: column;

  gap: 7px;
}


.menu-item {
  min-height: 44px;

  box-sizing: border-box;

  display: flex;

  align-items: center;

  gap: 12px;

  padding:
    0 14px;

  border-radius: 8px;

  color: #91a4b8;

  text-decoration: none;

  transition: 0.2s;

  white-space: nowrap;
}


.menu-item:hover {
  background: #102334;

  color: white;
}


/* VUE ROUTER ACTIVO */

.menu-item.router-link-exact-active {
  background: #123847;

  color: #5bd6dd;

  box-shadow:
    inset 3px 0 0
    #00e5ff;
}


.menu-icon {
  width: 20px;

  min-width: 20px;

  text-align: center;

  font-size: 17px;
}


.menu-text {
  overflow: hidden;

  font-size: 13px;
}


/* =====================================
   MENÚ COLAPSADO
===================================== */

.sidebar.collapsed
.menu-item {
  justify-content: center;

  padding: 0;
}


.sidebar.collapsed
.menu-icon {
  width: auto;

  font-size: 19px;
}


/* =====================================
   FOOTER DEL SIDEBAR
===================================== */

.sidebar-footer {
  margin-top: auto;

  padding:
    18px 8px 0;

  border-top:
    1px solid #17283a;

  color: #6f8296;
}


.status {
  display: flex;

  align-items: center;

  gap: 8px;

  margin-bottom: 7px;

  color: #4fd68a;

  font-size: 10px;

  white-space: nowrap;
}


.status-dot {
  width: 7px;
  min-width: 7px;

  height: 7px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow:
    0 0 8px #4fd68a;
}


.sidebar-footer small {
  font-size: 9px;
}


/* =====================================
   COLAPSADO FOOTER
===================================== */

.sidebar.collapsed
.sidebar-footer {
  display: flex;

  justify-content: center;

  padding-left: 0;

  padding-right: 0;
}


.sidebar.collapsed
.status {
  margin: 0;
}


/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 800px) {
  .sidebar {
    width: 78px;

    padding-left: 11px;
    padding-right: 11px;
  }

  .brand-text,
  .menu-text,
  .sidebar-footer small,
  .status span:last-child {
    display: none;
  }

  .menu-item {
    justify-content: center;

    padding: 0;
  }
}
</style>