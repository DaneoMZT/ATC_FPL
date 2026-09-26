<template>
  <div class="app-layout">

    <AppSidebar
      @collapse-change="handleSidebarChange"
    />

    <div
      class="app-main"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <AppHeader />

      <main class="page-content">
        <RouterView />
      </main>

      <AppFooter />
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'

import AppSidebar from '../components/AppSidebar.vue'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'

const sidebarCollapsed = ref(false)

function handleSidebarChange(value) {
  sidebarCollapsed.value = value
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #07111b;
}

.app-main {
  min-height: 100vh;
  margin-left: 250px;

  display: flex;
  flex-direction: column;

  transition: margin-left 0.25s ease;
}

.app-main.collapsed {
  margin-left: 78px;
}

.page-content {
  flex: 1;
  min-width: 0;
  background: #07111b;
}

@media (max-width: 800px) {
  .app-main {
    margin-left: 78px;
  }
}
</style>