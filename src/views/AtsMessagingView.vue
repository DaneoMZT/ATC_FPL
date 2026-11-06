<template>
  <AtsTemplates @insert="insertAtsTemplate" />
  <main class="ats-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ATCFPL / COMUNICACIONES</span>

        <h1>Mensajería ATS</h1>

        <p>Elaboración y transmisión simulada de mensajes aeronáuticos mediante TCP/IP.</p>
      </div>

      <span class="lab-status">● MODO LABORATORIO</span>
    </header>

    <div class="ats-layout">
      <section class="panel">
        <div class="panel-heading">
          <h2>Nuevo mensaje ATS</h2>

          <span>Simulador local</span>
        </div>

        <form @submit.prevent="sendMessage">
          <div class="field">
            <label for="messageType">Tipo de mensaje</label>

            <select id="messageType" v-model="messageType" required>
              <option value="" disabled>Seleccionar tipo de mensaje</option>

              <option v-for="type in messageTypes" :key="type.code" :value="type.code">
                {{ type.code }} — {{ type.description }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="recipientInput">Destinatarios (direcciones de 8 caracteres)</label>

            <div class="recipient-entry">
              <input
                id="recipientInput"
                v-model="recipientInput"
                maxlength="8"
                placeholder="Ej. MMFOZQZX"
                autocomplete="off"
                @input="handleRecipientInput"
                @keydown.enter.prevent="addRecipient"
              />

              <button type="button" class="secondary-button" @click="addRecipient">Agregar</button>
            </div>

            <div v-if="aftnLoading" class="aftn-message">Buscando direcciones AFTN...</div>

            <div v-if="aftnError" class="result-error" role="alert">{{ aftnError }}</div>

            <div v-if="aftnResults.length" class="aftn-results">
              <button
                v-for="item in aftnResults"
                :key="item.address"
                type="button"
                class="aftn-option"
                @click="selectAftnAddress(item)"
              >
                <strong>{{ item.address }}</strong>

                <span>{{ item.name }}</span>

                <small>{{ item.country }}</small>
              </button>
            </div>

            <small
              >Hasta 20 destinatarios. Directorio histórico para simulación local; no se verifica
              vigencia operacional.</small
            >

            <div v-if="recipients.length" class="recipient-list">
              <span v-for="recipient in recipients" :key="recipient" class="recipient-chip">
                {{ recipient }}

                <button
                  type="button"
                  :aria-label="`Eliminar ${recipient}`"
                  @click="removeRecipient(recipient)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <div class="field">
            <div class="field-heading">
              <label for="messageBody">Contenido del mensaje</label>

              <span>{{ messageBody.length }} / 10000</span>
            </div>

            <textarea
              id="messageBody"
              v-model="messageBody"
              maxlength="10000"
              rows="12"
              placeholder="Escribe aquí el contenido del mensaje ATS..."
              required
            ></textarea>
          </div>

          <div class="actions">
            <button type="button" class="secondary-button" :disabled="sending" @click="clearForm">
              Limpiar
            </button>

            <button type="submit" class="primary-button" :disabled="sending">
              {{ sending ? 'Enviando...' : 'Enviar prueba TCP' }}
            </button>
          </div>
        </form>
      </section>

      <aside class="side-panel">
        <section class="panel">
          <h2>Estado de la simulación</h2>

          <div class="status-row"><span>Protocolo</span><strong>TCP/IP local</strong></div>

          <div class="status-row"><span>Servidor</span><strong>127.0.0.1:5500</strong></div>

          <div class="status-row">
            <span>Tipo seleccionado</span><strong>{{ messageType || 'Sin seleccionar' }}</strong>
          </div>

          <div class="status-row">
            <span>Destinatarios</span><strong>{{ recipients.length }}</strong>
          </div>

          <div class="status-row">
            <span>Entrega AFTN real</span><strong class="not-delivered">NO</strong>
          </div>
        </section>

        <section class="panel">
          <h2>Resultado del envío</h2>

          <p v-if="!result && !errorMessage" class="muted">
            Todavía no se ha enviado ningún mensaje.
          </p>

          <div v-if="errorMessage" class="result-error" role="alert">{{ errorMessage }}</div>

          <div v-if="result" class="result-success" role="status">
            <strong>Mensaje recibido por el simulador</strong>

            <p>Estado: {{ result.status }}</p>

            <p>Fecha: {{ formatTimestamp(result.timestamp) }}</p>

            <p>Entrega AFTN: No realizada</p>
          </div>
        </section>

        <section class="notice">
          <strong>Entorno de pruebas</strong>

          <p>
            Esta herramienta únicamente simula la recepción de mensajes ATS. No realiza transmisión
            ni entrega a una red AFTN operacional.
          </p>
        </section>
      </aside>
    </div>
  </main>
</template>

<script setup>
import AtsTemplates from '@/components/AtsTemplates.vue'

function insertAtsTemplate(template) {
  messageType.value = template.type
  messageBody.value = template.body
}
import { ref } from 'vue'

const messageTypes = [
  { code: 'FPL', description: 'Plan de vuelo presentado' },

  { code: 'CPL', description: 'Plan de vuelo actualizado' },

  { code: 'ABI', description: 'Información anticipada de límite' },

  { code: 'CLN', description: 'Autorización' },

  { code: 'CHG', description: 'Modificación' },

  { code: 'DLA', description: 'Demora' },

  { code: 'CNL', description: 'Cancelación' },

  { code: 'DEP', description: 'Salida' },

  { code: 'ARR', description: 'Llegada' },

  { code: 'EST', description: 'Estimación' },

  { code: 'ACT', description: 'Activación' },

  { code: 'REV', description: 'Revisión' },
]

const messageType = ref('')

const recipientInput = ref('')

const recipients = ref([])

const messageBody = ref('')

const sending = ref(false)

const result = ref(null)

const errorMessage = ref('')

const aftnResults = ref([])

const aftnLoading = ref(false)

const aftnError = ref('')

let aftnRequestId = 0

async function searchAftnAddresses() {
  const requestId = ++aftnRequestId

  const search = recipientInput.value.trim()

  aftnResults.value = []

  aftnError.value = ''

  if (search.length < 2) {
    aftnLoading.value = false

    return
  }

  aftnLoading.value = true

  try {
    const token = localStorage.getItem('atcfpl_token')

    const response = await fetch(`/api/aftn-addresses?search=${encodeURIComponent(search)}`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`)
    }

    const data = await response.json()

    if (requestId !== aftnRequestId) return

    aftnResults.value = data.addresses || []
  } catch (error) {
    if (requestId !== aftnRequestId) return

    aftnError.value = error.message
  } finally {
    if (requestId === aftnRequestId) {
      aftnLoading.value = false
    }
  }
}

function handleRecipientInput() {
  normalizeRecipient()

  searchAftnAddresses()
}

function selectAftnAddress(item) {
  recipientInput.value = item.address

  aftnResults.value = []

  aftnError.value = ''

  aftnRequestId++

  addRecipient()
}

function normalizeRecipient() {
  recipientInput.value = recipientInput.value

    .toUpperCase()

    .replace(/[^A-Z0-9]/g, '')

    .slice(0, 8)
}

function addRecipient() {
  errorMessage.value = ''

  const address = recipientInput.value.trim().toUpperCase()

  if (!/^[A-Z0-9]{8}$/.test(address)) {
    errorMessage.value = 'Cada destinatario debe tener exactamente 8 caracteres alfanuméricos.'

    return
  }

  if (recipients.value.includes(address)) {
    errorMessage.value = 'El destinatario ya está agregado.'

    return
  }

  if (recipients.value.length >= 20) {
    errorMessage.value = 'Se permiten como máximo 20 destinatarios.'

    return
  }

  recipients.value.push(address)

  recipientInput.value = ''
}

function removeRecipient(address) {
  recipients.value = recipients.value.filter((item) => item !== address)
}

function clearForm() {
  messageType.value = ''

  recipientInput.value = ''

  recipients.value = []

  messageBody.value = ''

  result.value = null

  errorMessage.value = ''
}

function formatTimestamp(value) {
  if (!value) return 'No disponible'

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'No disponible' : date.toLocaleString('es-MX')
}

async function sendMessage() {
  errorMessage.value = ''

  result.value = null

  if (!messageType.value) {
    errorMessage.value = 'Selecciona un tipo de mensaje.'

    return
  }

  if (recipients.value.length === 0) {
    errorMessage.value = 'Agrega al menos un destinatario.'

    return
  }

  if (!messageBody.value.trim()) {
    errorMessage.value = 'Escribe el contenido del mensaje.'

    return
  }

  sending.value = true

  try {
    // Usa el mismo mecanismo de autenticación

    // configurado en el backend de ATCFPL.

    const token = localStorage.getItem('atcfpl_token')

    const response = await fetch('/api/messages/simulate', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',

        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },

      body: JSON.stringify({
        type: messageType.value,

        recipients: recipients.value,

        body: messageBody.value,
      }),
    })

    const data = await response.json()

    if (!response.ok || data.success !== true) {
      throw new Error(data.error || `Error HTTP ${response.status}`)
    }

    result.value = data
  } catch (error) {
    errorMessage.value = error.message || 'No fue posible realizar la simulación.'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.ats-page {
  width: 100%;

  min-height: 100%;

  box-sizing: border-box;

  padding: 30px;

  color: #e8f2fa;
}

.page-header {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 20px;

  margin-bottom: 26px;
}

.eyebrow {
  font-size: 11px;

  letter-spacing: 2px;

  color: #00cde4;
}

.page-header h1 {
  margin: 8px 0;

  font-size: 28px;

  color: #fff;
}

.page-header p,
.muted {
  color: #91a4b8;

  line-height: 1.6;
}

.lab-status {
  padding: 10px 14px;

  border: 1px solid #276a7a;

  border-radius: 8px;

  color: #5bd6dd;

  white-space: nowrap;

  font-size: 11px;
}

.ats-layout {
  display: grid;

  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);

  gap: 20px;

  align-items: start;
}

.panel {
  min-width: 0;

  padding: 24px;

  margin-bottom: 20px;

  border: 1px solid #1b3448;

  border-radius: 12px;

  background: #0d1d2c;
}

.panel h2 {
  margin: 0 0 20px;

  font-size: 17px;

  color: #fff;
}

.panel-heading {
  display: flex;

  justify-content: space-between;

  gap: 12px;

  align-items: center;
}

.panel-heading span {
  font-size: 12px;

  color: #6f8296;
}

.field {
  margin-bottom: 22px;
}

.field label {
  display: block;

  margin-bottom: 9px;

  color: #c8d8e7;

  font-size: 13px;

  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  width: 100%;

  box-sizing: border-box;

  padding: 12px 14px;

  border: 1px solid #254055;

  border-radius: 8px;

  background: #091522;

  color: #f0f7ff;

  font: inherit;

  outline: none;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #00cde4;
}

.field textarea {
  resize: vertical;

  min-height: 220px;

  line-height: 1.6;
}

.field small {
  display: block;

  margin-top: 8px;

  color: #8298ad;

  font-size: 11px;
}

.field-heading,
.actions,
.recipient-entry {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 10px;
}

.field-heading span {
  color: #8298ad;

  font-size: 11px;
}

.recipient-entry input {
  flex: 1;

  min-width: 0;
}

.recipient-list {
  display: flex;

  flex-wrap: wrap;

  gap: 8px;

  margin-top: 14px;
}

.recipient-chip {
  display: inline-flex;

  align-items: center;

  gap: 10px;

  padding: 7px 10px;

  border-radius: 6px;

  background: #123847;

  color: #5bd6dd;

  font-size: 12px;
}

.recipient-chip button {
  border: none;

  background: transparent;

  color: #fff;

  cursor: pointer;

  font-size: 17px;
}

.primary-button,
.secondary-button {
  padding: 11px 16px;

  border-radius: 8px;

  font-weight: 600;

  cursor: pointer;
}

.primary-button {
  border: 1px solid #00cde4;

  background: #007d91;

  color: white;
}

.primary-button:hover {
  background: #0096aa;
}

.secondary-button {
  border: 1px solid #254055;

  background: #142a3c;

  color: #c8d8e7;
}

button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.status-row {
  display: flex;

  justify-content: space-between;

  gap: 12px;

  padding: 12px 0;

  border-bottom: 1px solid #1b3448;

  font-size: 12px;
}

.status-row span {
  color: #91a4b8;
}

.status-row strong {
  text-align: right;

  overflow-wrap: anywhere;
}

.not-delivered {
  color: #f4b860;
}

.result-success {
  color: #8ce4b1;

  line-height: 1.6;

  overflow-wrap: anywhere;
}

.result-error {
  color: #ff9a9a;

  line-height: 1.6;

  overflow-wrap: anywhere;
}

.notice {
  padding: 18px;

  border: 1px solid #38516a;

  border-radius: 10px;

  background: #102334;

  color: #a9bfd2;

  font-size: 12px;

  line-height: 1.7;
}

.notice strong {
  color: #5bd6dd;
}

@media (max-width: 1000px) {
  .ats-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .ats-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
  }

  .recipient-entry {
    flex-wrap: wrap;
  }
}

.aftn-results {
  margin-top: 8px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #254055;
  border-radius: 8px;
  background: #091522;
}

.aftn-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  width: 100%;
  padding: 12px;
  border: none;
  border-bottom: 1px solid #254055;
  background: transparent;
  color: #e8f2fa;
  text-align: left;
  cursor: pointer;
}

.aftn-option:hover {
  background: #123847;
}

.aftn-option strong {
  color: #5bd6dd;
}

.aftn-message {
  margin-top: 8px;
  color: #91a4b8;
  font-size: 12px;
}
</style>
