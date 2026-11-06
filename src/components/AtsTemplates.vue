<template>
  <details class="ats-templates">
    <summary class="templates-toggle">
      <span
        ><strong>Templates ATS</strong
        ><small>Desplegar plantillas FPL, CPL, CHG, CNL y más</small></span
      >
      <span class="toggle-arrow" aria-hidden="true">⌄</span>
    </summary>
    <div class="templates-content">
      <div class="templates-heading">
        <div>
          <span class="eyebrow">ATCFPL / BIBLIOTECA ATS</span>
          <h2>Templates ATS</h2>
          <p>
            Selecciona una plantilla, sustituye los datos de ejemplo y cópiala o insértala en tu
            mensaje.
          </p>
        </div>
        <span class="lab-label">SOLO SIMULACIÓN</span>
      </div>

      <div class="templates-controls">
        <label for="ats-template-type">Tipo de mensaje</label>
        <select id="ats-template-type" v-model="selectedType">
          <option v-for="item in templates" :key="item.type" :value="item.type">
            {{ item.type }} — {{ item.label }}
          </option>
        </select>
      </div>

      <p v-if="!current.available" class="template-warning" role="status">
        No se identificó un ejemplo de {{ selectedType }} en el documento aportado. No se
        proporciona un formato no verificado.
      </p>
      <template v-else>
        <p class="template-hint">
          Ejemplo tomado y adaptado del registro IN_OUT_AFTN.rtf. Los valores entre corchetes deben
          reemplazarse antes de usarlo.
        </p>
        <textarea
          v-model="draft"
          rows="10"
          spellcheck="false"
          aria-label="Plantilla ATS editable"
        ></textarea>
        <div class="templates-actions">
          <button type="button" class="secondary" @click="resetDraft">Restaurar plantilla</button>
          <button type="button" class="secondary" @click="copyDraft">
            {{ copied ? 'Copiado' : 'Copiar mensaje' }}
          </button>
          <button type="button" class="primary" @click="insertDraft">
            Insertar en mensaje ATS
          </button>
        </div>
        <p v-if="feedback" class="template-feedback" role="status">{{ feedback }}</p>
      </template>
      <p class="disclaimer">
        Los ejemplos son históricos y no constituyen validación de formato, direccionamiento o
        autorización de transmisión operacional.
      </p>
    </div>
  </details>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const emit = defineEmits(['insert'])

// El contenido entre corchetes es editable. Ejemplos adaptados del archivo IN_OUT_AFTN.rtf.
const templates = [
  {
    type: 'FPL',
    label: 'Plan de vuelo',
    available: true,
    body: `(FPL-[IDENTIFICACION]-IS
-[TIPO_AERONAVE]/M-[EQUIPO]/[VIGILANCIA]
-[AERODROMO_SALIDA][HORA_UTC]
-N0452F380 [RUTA]
-[AERODROMO_DESTINO][EET] [ALTERNO]
-PBN/[CAPACIDADES] DOF/[AAMMDD] REG/[MATRICULA])`,
  },
  {
    type: 'CPL',
    label: 'Plan de vuelo actualizado',
    available: true,
    body: `(CPL[ORIGEN]/[DESTINO][NUMERO]-[IDENTIFICACION]/[CODIGO_SSR]-IS
-[TIPO_AERONAVE]/M-[EQUIPO]/[VIGILANCIA]
-[AERODROMO_SALIDA]-[PUNTO_TRANSFERENCIA]/[TIEMPO_NIVEL]
-N0450F380 [RUTA]
-[AERODROMO_DESTINO]
-DOF/[AAMMDD] REG/[MATRICULA])`,
  },
  {
    type: 'CHG',
    label: 'Cambio de plan de vuelo',
    available: true,
    body: `(CHG-[IDENTIFICACION]-[SALIDA]-[DESTINO]-DOF/[AAMMDD]-7/[NUEVA_IDENTIFICACION]/[CODIGO_SSR])`,
  },
  {
    type: 'CNL',
    label: 'Cancelación',
    available: true,
    body: `(CNL-[IDENTIFICACION]-[SALIDA]-[DESTINO]-DOF/[AAMMDD])`,
  },
  {
    type: 'DEP',
    label: 'Salida',
    available: true,
    body: `(DEP-[IDENTIFICACION]/[CODIGO_SSR]-[SALIDA][HORA_UTC]-[DESTINO][EET] [ALTERNO]-DOF/[AAMMDD] ORGN/[ORIGEN])`,
  },
  {
    type: 'DLA',
    label: 'Demora',
    available: true,
    body: `(DLA-[IDENTIFICACION]-[SALIDA][NUEVA_HORA_UTC]-[DESTINO][EET] [ALTERNO]-DOF/[AAMMDD])`,
  },
  {
    type: 'ARR',
    label: 'Llegada',
    available: true,
    body: `(ARR-[IDENTIFICACION]-[SALIDA]-[DESTINO][HORA_LLEGADA_UTC] -DOF/[AAMMDD] ORGN/[ORIGEN])`,
  },
  { type: 'CLN', label: 'Autorización', available: false, body: '' },
  { type: 'ABI', label: 'Información anticipada de límite', available: false, body: '' },
  { type: 'EST', label: 'Estimación', available: false, body: '' },
  { type: 'ACT', label: 'Activación', available: false, body: '' },
  { type: 'REV', label: 'Revisión', available: false, body: '' },
]

const selectedType = ref('FPL')
const current = computed(() => templates.find((item) => item.type === selectedType.value))
const draft = ref(templates[0].body)
const copied = ref(false)
const feedback = ref('')

watch(selectedType, () => resetDraft())

function resetDraft() {
  draft.value = current.value.body
  copied.value = false
  feedback.value = ''
}

async function copyDraft() {
  if (!current.value.available || !draft.value.trim()) return
  try {
    await navigator.clipboard.writeText(draft.value)
    copied.value = true
    feedback.value = 'Plantilla copiada al portapapeles.'
  } catch {
    feedback.value =
      'No fue posible copiar automáticamente. Selecciona el texto y cópialo manualmente.'
  }
}

function insertDraft() {
  if (!current.value.available || !draft.value.trim()) return
  emit('insert', { type: selectedType.value, body: draft.value })
  feedback.value = 'Plantilla enviada al formulario ATS. Revisa los campos antes de simular.'
}
</script>

<style scoped>
.ats-templates {
  padding: 0;
  border: 1px solid #1b3448;
  border-radius: 12px;
  background: #0d1d2c;
  color: #e8f2fa;
  margin-top: 20px;
}
.templates-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  cursor: pointer;
  list-style: none;
  color: #e8f2fa;
}
.templates-toggle::-webkit-details-marker {
  display: none;
}
.templates-toggle strong {
  display: block;
  font-size: 16px;
}
.templates-toggle small {
  display: block;
  margin-top: 4px;
  color: #91a4b8;
  font-size: 12px;
}
.toggle-arrow {
  font-size: 24px;
  transition: transform 0.2s ease;
  color: #5bd6dd;
}
.ats-templates[open] .toggle-arrow {
  transform: rotate(180deg);
}
.templates-content {
  padding: 0 24px 24px;
}
.templates-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}
.eyebrow {
  color: #00cde4;
  letter-spacing: 1.5px;
  font-size: 11px;
}
h2 {
  margin: 8px 0;
  font-size: 20px;
}
p {
  color: #9bb0c3;
  line-height: 1.5;
  font-size: 13px;
}
.lab-label {
  font-size: 10px;
  color: #5bd6dd;
  border: 1px solid #276a7a;
  border-radius: 6px;
  padding: 8px;
  white-space: nowrap;
}
.templates-controls {
  margin: 18px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
label {
  font-size: 13px;
  font-weight: 600;
}
select,
textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #254055;
  border-radius: 8px;
  background: #091522;
  color: #f0f7ff;
  padding: 12px;
  font: inherit;
}
textarea {
  resize: vertical;
  min-height: 180px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: 1.5;
}
.templates-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
button {
  padding: 11px 15px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.secondary {
  background: #142a3c;
  border: 1px solid #254055;
  color: #c8d8e7;
}
.primary {
  background: #007d91;
  border: 1px solid #00cde4;
  color: #fff;
}
.template-warning {
  color: #f4b860;
}
.template-feedback {
  color: #8ce4b1;
}
.disclaimer {
  font-size: 11px;
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .templates-toggle {
    padding: 16px;
  }
  .templates-content {
    padding: 0 16px 16px;
  }
  .templates-heading {
    flex-direction: column;
  }
}
</style>
