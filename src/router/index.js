import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import RoutesView from '../views/RoutesView.vue'
import LoginView from '../views/LoginView.vue'
import AirportsView from '../views/AirportsView.vue'
import UsersView from '../views/UsersView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        public: true,
      },
    },

    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },

    {
      path: '/routes',
      name: 'routes',
      component: RoutesView,
    },

    {
      path: '/airports',
      name: 'airports',
      component: AirportsView,
    },

    // =====================================
    // ADMINISTRACIÓN DE USUARIOS
    // SOLO ADMIN Y ROOT
    // =====================================
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: {
        roles: ['ADMIN', 'ROOT'],
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        requiresRoot: true,
      },
    },
  ],
})

// =====================================
// PROTECCIÓN DE RUTAS
// =====================================

router.beforeEach((to) => {
  const token = localStorage.getItem('atcfpl_token')

  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('atcfpl_user') || '{}')
  } catch (error) {
    console.error('Error leyendo usuario:', error)
    user = {}
  }

  // =====================================
  // NO HAY SESIÓN
  // =====================================

  if (!to.meta.public && !token) {
    return {
      name: 'login',
    }
  }

  // =====================================
  // YA ESTÁ AUTENTICADO
  // =====================================

  if (to.name === 'login' && token) {
    return {
      name: 'dashboard',
    }
  }

  // =====================================
  // CONTROL POR ROL
  // =====================================

  if (to.meta.roles && !to.meta.roles.includes(user.role)) {
    console.warn(`Acceso denegado a ${to.path}. Rol: ${user.role}`)

    return {
      name: 'dashboard',
    }
  }

  return true
})
router.beforeEach((to) => {
  const token = localStorage.getItem('atcfpl_token')

  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('atcfpl_user') || '{}')
  } catch (error) {
    user = {}
  }

  // =====================================
  // USUARIO NO AUTENTICADO
  // =====================================

  if (!to.meta.public && !token) {
    return {
      name: 'login',
    }
  }

  // =====================================
  // ROOT
  // =====================================

  if (to.meta.requiresRoot && user.role !== 'ROOT') {
    return {
      name: 'dashboard',
    }
  }

  // =====================================
  // ADMIN O ROOT
  // =====================================

  if (to.meta.requiresAdmin && !['ADMIN', 'ROOT'].includes(user.role)) {
    return {
      name: 'dashboard',
    }
  }

  // =====================================
  // LOGIN
  // =====================================

  if (to.name === 'login' && token) {
    return {
      name: 'dashboard',
    }
  }

  return true
})

export default router
