<template>
  <div class="users-page">
    <!-- ENCABEZADO -->
    <div class="page-header">
      <div>
        <h1>Administración de usuarios</h1>
        <p>Gestión de usuarios, permisos y contraseñas del sistema ATCFPL.</p>
      </div>

      <button class="btn-primary" @click="openCreateModal">+ Nuevo usuario</button>
    </div>

    <!-- MENSAJE -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>

    <!-- CARGANDO -->
    <div v-if="loading" class="loading">Cargando usuarios...</div>

    <!-- TABLA -->
    <div v-else class="table-container">
      <div class="table-header">
        <div>
          <h2>Usuarios del sistema</h2>
          <span>{{ users.length }} usuarios registrados</span>
        </div>

        <button class="btn-refresh" @click="loadUsers">↻ Actualizar</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Aeropuerto</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Cambiar contraseña</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in users" :key="user._id || user.username">
            <!-- USUARIO -->
            <td>
              <div class="user-cell">
                <div class="avatar">
                  {{ getInitials(user.username) }}
                </div>

                <div>
                  <strong>{{ user.username }}</strong>

                  <small v-if="user.username === currentUsername"> Sesión actual </small>
                </div>
              </div>
            </td>

            <!-- AEROPUERTO -->
            <td>
              <span v-if="user.airport" class="airport-badge">
                {{ user.airport }}
              </span>

              <span v-else class="empty"> — </span>
            </td>

            <!-- ROL -->
            <td>
              <span class="role-badge" :class="user.role.toLowerCase()">
                {{ user.role }}
              </span>
            </td>

            <!-- ESTADO -->
            <td>
              <span class="status-badge" :class="user.active ? 'active' : 'inactive'">
                <span class="status-dot"></span>

                {{ user.active ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </td>

            <!-- CONTRASEÑA -->
            <td>
              <button class="btn-password" @click="openPasswordModal(user)">🔑 Cambiar</button>
            </td>

            <!-- ACCIONES -->
            <td>
              <div class="actions">
                <button class="btn-edit" @click="openEditModal(user)">Editar</button>

                <button v-if="user.role !== 'ROOT'" class="btn-delete" @click="deleteUser(user)">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="users.length === 0">
            <td colspan="6" class="empty-table">No existen usuarios registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==========================================
         MODAL CREAR / EDITAR
    =========================================== -->

    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2>
              {{ editingUser ? 'Editar usuario' : 'Nuevo usuario' }}
            </h2>

            <p>
              {{
                editingUser
                  ? 'Modificar información del usuario'
                  : 'Registrar un nuevo usuario ATCFPL'
              }}
            </p>
          </div>

          <button class="close-button" @click="closeUserModal">×</button>
        </div>

        <form @submit.prevent="saveUser">
          <label>Usuario</label>

          <input
            v-model="form.username"
            type="text"
            placeholder="Ej. MZT"
            :disabled="editingUser"
            required
          />

          <template v-if="!editingUser">
            <label>Contraseña inicial</label>

            <input
              v-model="form.password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              minlength="8"
              required
            />
          </template>

          <label>Rol</label>

          <select v-model="form.role" :disabled="editingUser?.role === 'ROOT'">
            <option value="USER">USER</option>

            <option value="ADMIN">ADMIN</option>
          </select>

          <template v-if="form.role === 'USER'">
            <label>Aeropuerto</label>

            <input v-model="form.airport" type="text" placeholder="Ej. MZT" maxlength="4" />
          </template>

          <template v-if="editingUser">
            <label>Estado</label>

            <select v-model="form.active" :disabled="editingUser.role === 'ROOT'">
              <option :value="true">ACTIVO</option>

              <option :value="false">INACTIVO</option>
            </select>
          </template>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeUserModal">Cancelar</button>

            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'GUARDANDO...' : editingUser ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==========================================
         MODAL CONTRASEÑA
    =========================================== -->

    <div v-if="showPasswordModal" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal password-modal">
        <div class="modal-header">
          <div>
            <h2>Cambiar contraseña</h2>

            <p>
              Usuario:
              <strong>
                {{ passwordUser?.username }}
              </strong>
            </p>
          </div>

          <button class="close-button" @click="closePasswordModal">×</button>
        </div>

        <form @submit.prevent="changePassword">
          <label>Nueva contraseña</label>

          <input
            v-model="newPassword"
            type="password"
            placeholder="Mínimo 8 caracteres"
            minlength="8"
            required
          />

          <label>Confirmar contraseña</label>

          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repetir contraseña"
            minlength="8"
            required
          />

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closePasswordModal">Cancelar</button>

            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'ACTUALIZANDO...' : 'Cambiar contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { API_URL } from '../config'

const users = ref([])

const loading = ref(false)
const saving = ref(false)

const message = ref('')
const messageType = ref('success')

const showUserModal = ref(false)
const showPasswordModal = ref(false)

const editingUser = ref(null)
const passwordUser = ref(null)

const newPassword = ref('')
const confirmPassword = ref('')

const form = ref({
  username: '',
  password: '',
  airport: '',
  role: 'USER',
  active: true,
})

const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('atcfpl_user') || '{}')
  } catch (error) {
    return {}
  }
})

const currentUsername = computed(() => {
  return currentUser.value.username || ''
})

function getToken() {
  return localStorage.getItem('atcfpl_token')
}

function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type

  setTimeout(() => {
    message.value = ''
  }, 4000)
}

// ==========================================
// CARGAR USUARIOS
// ==========================================

async function loadUsers() {
  loading.value = true

  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error cargando usuarios')
    }

    users.value = data.users || data
  } catch (error) {
    console.error(error)

    showMessage(error.message, 'error')
  } finally {
    loading.value = false
  }
}

// ==========================================
// NUEVO USUARIO
// ==========================================

function openCreateModal() {
  editingUser.value = null

  form.value = {
    username: '',
    password: '',
    airport: '',
    role: 'USER',
    active: true,
  }

  showUserModal.value = true
}

// ==========================================
// EDITAR
// ==========================================

function openEditModal(user) {
  editingUser.value = user

  form.value = {
    username: user.username,
    password: '',
    airport: user.airport || '',
    role: user.role,
    active: user.active,
  }

  showUserModal.value = true
}

function closeUserModal() {
  showUserModal.value = false
  editingUser.value = null
}

// ==========================================
// GUARDAR
// ==========================================

async function saveUser() {
  saving.value = true

  try {
    let url = `${API_URL}/users`
    let method = 'POST'

    let body = {
      username: form.value.username,
      password: form.value.password,
      airport: form.value.airport,
      role: form.value.role,
    }

    if (editingUser.value) {
      url = `${API_URL}/users/` + encodeURIComponent(editingUser.value.username)

      method = 'PUT'

      body = {
        airport: form.value.airport,
        role: form.value.role,
        active: form.value.active,
      }
    }

    const response = await fetch(url, {
      method,

      headers: {
        'Content-Type': 'application/json',

        Authorization: `Bearer ${getToken()}`,
      },

      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error guardando usuario')
    }

    closeUserModal()

    showMessage(data.message || 'Usuario guardado correctamente')

    await loadUsers()
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    saving.value = false
  }
}

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================

function openPasswordModal(user) {
  passwordUser.value = user

  newPassword.value = ''
  confirmPassword.value = ''

  showPasswordModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  passwordUser.value = null
}

async function changePassword() {
  if (newPassword.value.length < 8) {
    showMessage('La contraseña debe tener mínimo 8 caracteres', 'error')

    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showMessage('Las contraseñas no coinciden', 'error')

    return
  }

  saving.value = true

  try {
    const username = encodeURIComponent(passwordUser.value.username)

    const response = await fetch(`${API_URL}/users/${username}/password`, {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',

        Authorization: `Bearer ${getToken()}`,
      },

      body: JSON.stringify({
        password: newPassword.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error cambiando contraseña')
    }

    closePasswordModal()

    showMessage(data.message || 'Contraseña actualizada correctamente')

    await loadUsers()
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    saving.value = false
  }
}

// ==========================================
// ELIMINAR
// ==========================================

async function deleteUser(user) {
  const confirmed = window.confirm(`¿Eliminar el usuario ${user.username}?`)

  if (!confirmed) {
    return
  }

  try {
    const response = await fetch(`${API_URL}/users/${encodeURIComponent(user.username)}`, {
      method: 'DELETE',

      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error eliminando usuario')
    }

    showMessage(data.message || 'Usuario eliminado correctamente')

    await loadUsers()
  } catch (error) {
    showMessage(error.message, 'error')
  }
}

function getInitials(username) {
  if (!username) {
    return '--'
  }

  return username.substring(0, 2).toUpperCase()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page {
  min-height: 100%;
  padding: 25px;
  box-sizing: border-box;
  background: #07111b;
  color: white;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.page-header h1 {
  margin: 0;
  color: #00e5ff;
  font-size: 27px;
}

.page-header p {
  margin: 6px 0 0;
  color: #71869b;
  font-size: 13px;
}

.table-container {
  overflow: hidden;
  border: 1px solid #17283a;
  border-radius: 10px;
  background: #0a1725;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #17283a;
}

.table-header h2 {
  margin: 0 0 4px;
  font-size: 17px;
}

.table-header span {
  color: #71869b;
  font-size: 11px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 13px 16px;
  background: #0d1d2c;
  color: #71869b;
  text-align: left;
  font-size: 10px;
  letter-spacing: 0.5px;
}

td {
  padding: 14px 16px;
  border-top: 1px solid #142536;
  font-size: 12px;
}

tbody tr:hover {
  background: #0d1d2c;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-cell > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-cell small {
  color: #00e5ff;
  font-size: 9px;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #144355;
  color: #60dbe2;
  font-weight: 700;
}

.airport-badge,
.role-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 5px;
  background: #10283a;
  color: #79cbd2;
  font-size: 10px;
}

.role-badge.root {
  color: #ffcc66;
}

.role-badge.admin {
  color: #b998ff;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-badge.active {
  color: #4fd68a;
}

.status-badge.active .status-dot {
  background: #4fd68a;
}

.status-badge.inactive {
  color: #d66b6b;
}

.status-badge.inactive .status-dot {
  background: #d66b6b;
}

.actions {
  display: flex;
  gap: 7px;
}

button {
  font-family: inherit;
}

.btn-primary,
.btn-refresh,
.btn-edit,
.btn-delete,
.btn-password,
.btn-cancel {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-primary {
  border: 1px solid #00b9cc;
  background: #0b7d88;
  color: white;
}

.btn-primary:hover {
  background: #1095a1;
}

.btn-refresh,
.btn-edit,
.btn-password {
  border: 1px solid #29445c;
  background: #102334;
  color: #91cbd3;
}

.btn-delete {
  border: 1px solid #5e2c35;
  background: #2c1820;
  color: #e27d87;
}

.btn-cancel {
  border: 1px solid #29445c;
  background: transparent;
  color: #91a4b8;
}

.loading,
.empty-table {
  padding: 40px;
  text-align: center;
  color: #71869b;
}

.message {
  margin-bottom: 18px;
  padding: 12px 16px;
  border-radius: 7px;
}

.message.success {
  border: 1px solid #245c43;
  background: #102c22;
  color: #5dd697;
}

.message.error {
  border: 1px solid #63313a;
  background: #301a20;
  color: #ff9da6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.7);
}

.modal {
  width: 460px;
  max-width: 100%;
  padding: 25px;
  border: 1px solid #1d364b;
  border-radius: 12px;
  background: #0a1725;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 22px;
}

.modal-header h2 {
  margin: 0;
  color: #00e5ff;
}

.modal-header p {
  margin: 5px 0 0;
  color: #71869b;
  font-size: 11px;
}

.close-button {
  border: 0;
  background: transparent;
  color: #71869b;
  font-size: 25px;
  cursor: pointer;
}

label {
  display: block;
  margin: 15px 0 6px;
  color: #a7b7c6;
  font-size: 11px;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #29445c;
  border-radius: 6px;
  outline: none;
  background: #07111b;
  color: white;
}

input:focus,
select:focus {
  border-color: #00b9cc;
}

input:disabled,
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.empty {
  color: #52677b;
}

@media (max-width: 900px) {
  .table-container {
    overflow-x: auto;
  }

  table {
    min-width: 850px;
  }
}
</style>
