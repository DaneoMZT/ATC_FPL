<script setup>
import { computed, reactive, ref } from 'vue'

const emit = defineEmits(['close', 'save'])

const activeTab = ref('fpl')
const validationErrors = ref([])
const isValidated = ref(false)

const form = reactive({
  // ITEM 7
  callsign: '',

  // ITEM 8
  flightRules: 'I',
  flightType: 'S',

  // ITEM 9
  aircraftNumber: '1',
  aircraftType: '',
  wakeTurbulence: 'M',

  // ITEM 10
  equipment: '',
  surveillance: '',

  // ITEM 13
  departure: '',
  eobt: '',

  // ITEM 15
  speed: '',
  level: '',
  route: '',

  // ITEM 16
  destination: '',
  eet: '',
  alternate1: '',
  alternate2: '',

  // ITEM 18
  pbn: '',
  dof: '',
  reg: '',
  opr: '',
  eetInfo: '',
  sel: '',
  code: '',
  per: '',
  rmk: '',

  // ITEM 19
  endurance: '',
  personsOnBoard: '',
  emergencyRadio: '',
  survivalEquipment: '',
  jackets: '',
  dinghies: '',
  aircraftColour: '',
  remarks: '',
  pilotInCommand: '',
})

function upper(value) {
  return String(value || '').toUpperCase().trim()
}

function hhmm(value) {
  return String(value || '').replace(':', '')
}

/* ==================================================
   ITEM 18
================================================== */

const item18 = computed(() => {
  const parts = []

  if (form.pbn) {
    parts.push(`PBN/${upper(form.pbn)}`)
  }

  if (form.dof) {
    parts.push(`DOF/${upper(form.dof)}`)
  }

  if (form.reg) {
    parts.push(`REG/${upper(form.reg)}`)
  }

  if (form.opr) {
    parts.push(`OPR/${upper(form.opr)}`)
  }

  if (form.eetInfo) {
    parts.push(`EET/${upper(form.eetInfo)}`)
  }

  if (form.sel) {
    parts.push(`SEL/${upper(form.sel)}`)
  }

  if (form.code) {
    parts.push(`CODE/${upper(form.code)}`)
  }

  if (form.per) {
    parts.push(`PER/${upper(form.per)}`)
  }

  if (form.rmk) {
    parts.push(`RMK/${upper(form.rmk)}`)
  }

  return parts.join(' ')
})

/* ==================================================
   GENERACIÓN DEL MENSAJE FPL
================================================== */

const aftnPreview = computed(() => {
  const callsign =
    upper(form.callsign) || 'CALLSIGN'

  const rules =
    form.flightRules || 'I'

  const type =
    form.flightType || 'S'

  const aircraftNumber =
    form.aircraftNumber &&
    String(form.aircraftNumber) !== '1'
      ? form.aircraftNumber
      : ''

  const aircraftType =
    upper(form.aircraftType) || 'TYPE'

  const wake =
    upper(form.wakeTurbulence) || 'M'

  const equipment =
    upper(form.equipment) || 'S'

  const surveillance =
    upper(form.surveillance) || 'N'

  const departure =
    upper(form.departure) || 'ZZZZ'

  const departureTime =
    hhmm(form.eobt) || '0000'

  const speed =
    upper(form.speed) || 'N0000'

  const level =
    upper(form.level) || 'F000'

  const route =
    upper(form.route) || 'DCT'

  const destination =
    upper(form.destination) || 'ZZZZ'

  const totalEet =
    hhmm(form.eet) || '0000'

  const alternates = [
    upper(form.alternate1),
    upper(form.alternate2),
  ]
    .filter(Boolean)
    .join(' ')

  let message =
    `(FPL-${callsign}-${rules}${type}\n`

  message +=
    `-${aircraftNumber}${aircraftType}/${wake}` +
    `-${equipment}/${surveillance}\n`

  message +=
    `-${departure}${departureTime}\n`

  message +=
    `-${speed}${level} ${route}\n`

  message +=
    `-${destination}${totalEet}`

  if (alternates) {
    message += ` ${alternates}`
  }

  if (item18.value) {
    message += `\n-${item18.value}`
  }

  message += ')'

  return message
})

/* ==================================================
   VALIDACIÓN
================================================== */

function validateFlight() {
  const errors = []

  /* ITEM 7 */

  if (!/^[A-Z0-9]{2,7}$/.test(upper(form.callsign))) {
    errors.push({
      field: 'ITEM 7',
      message:
        'La identificación debe contener entre 2 y 7 caracteres.',
    })
  }

  /* ITEM 9 */

  if (!/^[A-Z0-9]{2,4}$/.test(upper(form.aircraftType))) {
    errors.push({
      field: 'ITEM 9',
      message:
        'El tipo de aeronave no tiene un formato válido.',
    })
  }

  /* ITEM 13 */

  if (!/^[A-Z]{4}$/.test(upper(form.departure))) {
    errors.push({
      field: 'ITEM 13',
      message:
        'El aeródromo de salida debe contener 4 letras.',
    })
  }

  if (!form.eobt) {
    errors.push({
      field: 'ITEM 13',
      message:
        'Debes indicar EOBT.',
    })
  }

  /* ITEM 15 */

  if (!/^[NKM]\d{4}$/.test(upper(form.speed))) {
    errors.push({
      field: 'ITEM 15',
      message:
        'Velocidad inválida. Ejemplo: N0450.',
    })
  }

  if (
    !/^(F\d{3}|A\d{3}|S\d{4}|M\d{4}|VFR)$/.test(
      upper(form.level)
    )
  ) {
    errors.push({
      field: 'ITEM 15',
      message:
        'Nivel inválido. Ejemplo: F360.',
    })
  }

  if (!upper(form.route)) {
    errors.push({
      field: 'ITEM 15',
      message:
        'Debes indicar una ruta.',
    })
  }

  /* ITEM 16 */

  if (!/^[A-Z]{4}$/.test(upper(form.destination))) {
    errors.push({
      field: 'ITEM 16',
      message:
        'El aeródromo de destino debe contener 4 letras.',
    })
  }

  if (!form.eet) {
    errors.push({
      field: 'ITEM 16',
      message:
        'Debes indicar el tiempo total estimado.',
    })
  }

  if (
    form.alternate1 &&
    !/^[A-Z]{4}$/.test(upper(form.alternate1))
  ) {
    errors.push({
      field: 'ITEM 16',
      message:
        'El primer aeródromo alterno no es válido.',
    })
  }

  if (
    form.alternate2 &&
    !/^[A-Z]{4}$/.test(upper(form.alternate2))
  ) {
    errors.push({
      field: 'ITEM 16',
      message:
        'El segundo aeródromo alterno no es válido.',
    })
  }

  /* ITEM 18 */

  if (
    form.dof &&
    !/^\d{6}$/.test(form.dof)
  ) {
    errors.push({
      field: 'ITEM 18',
      message:
        'DOF debe utilizar formato YYMMDD.',
    })
  }

  validationErrors.value = errors

  isValidated.value =
    errors.length === 0

  return isValidated.value
}

/* ==================================================
   GUARDAR
================================================== */

function saveFlight() {
  if (!validateFlight()) {
    return
  }

  const flight = {
    callsign:
      upper(form.callsign),

    aircraft:
      upper(form.aircraftType),

    departure:
      upper(form.departure),

    destination:
      upper(form.destination),

    eobt:
      form.eobt,

    level:
      upper(form.level),

    speed:
      upper(form.speed),

    route:
      upper(form.route),

    status:
      'PENDIENTE',

    icao: {
      flightRules:
        form.flightRules,

      flightType:
        form.flightType,

      aircraftNumber:
        form.aircraftNumber,

      wakeTurbulence:
        form.wakeTurbulence,

      equipment:
        upper(form.equipment),

      surveillance:
        upper(form.surveillance),

      eet:
        form.eet,

      alternate1:
        upper(form.alternate1),

      alternate2:
        upper(form.alternate2),

      item18: {
        pbn:
          upper(form.pbn),

        dof:
          upper(form.dof),

        reg:
          upper(form.reg),

        opr:
          upper(form.opr),

        eet:
          upper(form.eetInfo),

        sel:
          upper(form.sel),

        code:
          upper(form.code),

        per:
          upper(form.per),

        rmk:
          upper(form.rmk),
      },

      item19: {
        endurance:
          form.endurance,

        personsOnBoard:
          form.personsOnBoard,

        emergencyRadio:
          upper(form.emergencyRadio),

        survivalEquipment:
          upper(form.survivalEquipment),

        jackets:
          upper(form.jackets),

        dinghies:
          upper(form.dinghies),

        aircraftColour:
          upper(form.aircraftColour),

        remarks:
          upper(form.remarks),

        pilotInCommand:
          upper(form.pilotInCommand),
      },
    },

    aftnMessage:
      aftnPreview.value,
  }

  emit('save', flight)
}
</script>

<template>

  <div
    class="modal-background"
    @click.self="emit('close')"
  >

    <div class="modal">

      <!-- HEADER -->

      <header class="modal-header">

        <div>

          <span class="icao-label">
            ICAO FLIGHT PLAN
          </span>

          <h2>
            Nuevo plan de vuelo
          </h2>

          <p>
            Captura, validación y generación de mensaje FPL
          </p>

        </div>

        <button
          type="button"
          class="close"
          @click="emit('close')"
        >
          ×
        </button>

      </header>

      <!-- TABS -->

      <nav class="tabs">

        <button
          type="button"
          :class="{ active: activeTab === 'fpl' }"
          @click="activeTab = 'fpl'"
        >
          FPL
        </button>

        <button
          type="button"
          :class="{ active: activeTab === 'equipment' }"
          @click="activeTab = 'equipment'"
        >
          EQUIPO
        </button>

        <button
          type="button"
          :class="{ active: activeTab === 'item18' }"
          @click="activeTab = 'item18'"
        >
          ITEM 18
        </button>

        <button
          type="button"
          :class="{ active: activeTab === 'item19' }"
          @click="activeTab = 'item19'"
        >
          SUPLEMENTARIOS
        </button>

      </nav>

      <form @submit.prevent="saveFlight">

        <div class="workspace">

          <!-- ====================================== -->
          <!-- CAPTURA -->
          <!-- ====================================== -->

          <main class="form-area">

            <!-- ================================== -->
            <!-- FPL -->
            <!-- ================================== -->

            <div
              v-if="activeTab === 'fpl'"
              class="tab-content"
            >

              <!-- ITEM 7 -->

              <section class="section">

                <div class="section-title">
                  <span>ITEM 7</span>
                  Identificación
                </div>

                <div class="grid grid-3">

                  <div class="field span-2">

                    <label>
                      IDENTIFICACIÓN DE AERONAVE
                    </label>

                    <input
                      v-model="form.callsign"
                      maxlength="7"
                      placeholder="AMX123"
                      required
                    />

                  </div>

                </div>

              </section>

              <!-- ITEM 8 -->

              <section class="section">

                <div class="section-title">
                  <span>ITEM 8</span>
                  Reglas y tipo de vuelo
                </div>

                <div class="grid grid-2">

                  <div class="field">

                    <label>
                      REGLAS DE VUELO
                    </label>

                    <select
                      v-model="form.flightRules"
                    >

                      <option value="I">
                        I — IFR
                      </option>

                      <option value="V">
                        V — VFR
                      </option>

                      <option value="Y">
                        Y — IFR → VFR
                      </option>

                      <option value="Z">
                        Z — VFR → IFR
                      </option>

                    </select>

                  </div>

                  <div class="field">

                    <label>
                      TIPO DE VUELO
                    </label>

                    <select
                      v-model="form.flightType"
                    >

                      <option value="S">
                        S — Scheduled
                      </option>

                      <option value="N">
                        N — Non-scheduled
                      </option>

                      <option value="G">
                        G — General Aviation
                      </option>

                      <option value="M">
                        M — Military
                      </option>

                      <option value="X">
                        X — Other
                      </option>

                    </select>

                  </div>

                </div>

              </section>

              <!-- ITEM 9 -->

              <section class="section">

                <div class="section-title">
                  <span>ITEM 9</span>
                  Aeronave
                </div>

                <div class="grid grid-3">

                  <div class="field">

                    <label>
                      NÚMERO
                    </label>

                    <input
                      v-model="form.aircraftNumber"
                      type="number"
                      min="1"
                    />

                  </div>

                  <div class="field">

                    <label>
                      TIPO DE AERONAVE
                    </label>

                    <input
                      v-model="form.aircraftType"
                      maxlength="4"
                      placeholder="B738"
                      required
                    />

                  </div>

                  <div class="field">

                    <label>
                      WTC
                    </label>

                    <select
                      v-model="form.wakeTurbulence"
                    >

                      <option value="L">
                        L — Light
                      </option>

                      <option value="M">
                        M — Medium
                      </option>

                      <option value="H">
                        H — Heavy
                      </option>

                      <option value="J">
                        J — Super
                      </option>

                    </select>

                  </div>

                </div>

              </section>

              <!-- ITEM 13 -->

              <section class="section">

                <div class="section-title">
                  <span>ITEM 13</span>
                  Salida
                </div>

                <div class="grid grid-2">

                  <div class="field">

                    <label>
                      AERÓDROMO DE SALIDA
                    </label>

                    <input
                      v-model="form.departure"
                      maxlength="4"
                      placeholder="MMMX"
                      required
                    />

                  </div>

                  <div class="field">

                    <label>
                      EOBT
                    </label>

                    <input
                      v-model="form.eobt"
                      type="time"
                      required
                    />

                  </div>

                </div>

              </section>

              <!-- ITEM 15 -->

              <section class="section">

                <div class="section-title">
                  <span>ITEM 15</span>
                  Velocidad, nivel y ruta
                </div>

                <div class="grid grid-2">

                  <div class="field">

                    <label>
                      VELOCIDAD
                    </label>

                    <input
                      v-model="form.speed"
                      maxlength="5"
                      placeholder="N0450"
                      required
                    />

                  </div>

                  <div class="field">

                    <label>
                      NIVEL
                    </label>

                    <input
                      v-model="form.level"
                      maxlength="5"
                      placeholder="F360"
                      required
                    />

                  </div>

                </div>

                <div class="field route-field">

                  <label>
                    RUTA
                  </label>

                  <textarea
                    v-model="form.route"
                    rows="2"
                    placeholder="SLM UJ12 CUL"
                    required
                  ></textarea>

                </div>

              </section>

              <!-- ITEM 16 -->

              <section class="section">

                <div class="section-title">
                  <span>ITEM 16</span>
                  Destino y alternos
                </div>

                <div class="grid grid-4">

                  <div class="field">

                    <label>
                      DESTINO
                    </label>

                    <input
                      v-model="form.destination"
                      maxlength="4"
                      placeholder="MMZT"
                      required
                    />

                  </div>

                  <div class="field">

                    <label>
                      TOTAL EET
                    </label>

                    <input
                      v-model="form.eet"
                      type="time"
                      required
                    />

                  </div>

                  <div class="field">

                    <label>
                      ALTERNO 1
                    </label>

                    <input
                      v-model="form.alternate1"
                      maxlength="4"
                      placeholder="MMGL"
                    />

                  </div>

                  <div class="field">

                    <label>
                      ALTERNO 2
                    </label>

                    <input
                      v-model="form.alternate2"
                      maxlength="4"
                      placeholder="MMMX"
                    />

                  </div>

                </div>

              </section>

            </div>

            <!-- ================================== -->
            <!-- EQUIPO -->
            <!-- ================================== -->

            <div
              v-if="activeTab === 'equipment'"
              class="tab-content"
            >

              <div class="tab-heading">

                <span>
                  ITEM 10
                </span>

                <h3>
                  Equipamiento y capacidades
                </h3>

                <p>
                  Comunicación, navegación y vigilancia.
                </p>

              </div>

              <div class="equipment-card">

                <div class="field">

                  <label>
                    EQUIPMENT / CAPABILITIES
                  </label>

                  <input
                    v-model="form.equipment"
                    placeholder="SDE2E3FGHIRWXY"
                  />

                  <small>
                    Parte anterior a "/"
                  </small>

                </div>

                <div class="separator">
                  /
                </div>

                <div class="field">

                  <label>
                    SURVEILLANCE
                  </label>

                  <input
                    v-model="form.surveillance"
                    placeholder="LB1"
                  />

                  <small>
                    Parte posterior a "/"
                  </small>

                </div>

              </div>

              <div class="info-box">

                <strong>
                  Ejemplo ITEM 10
                </strong>

                <code>
                  SDE2E3FGHIRWXY/LB1
                </code>

              </div>

            </div>

            <!-- ================================== -->
            <!-- ITEM 18 -->
            <!-- ================================== -->

            <div
              v-if="activeTab === 'item18'"
              class="tab-content"
            >

              <div class="tab-heading">

                <span>
                  ITEM 18
                </span>

                <h3>
                  Otra información
                </h3>

                <p>
                  ATCFPL genera automáticamente los indicadores.
                </p>

              </div>

              <div class="grid grid-3">

                <div class="field">

                  <label>PBN/</label>

                  <input
                    v-model="form.pbn"
                    placeholder="A1B1C1D1"
                  />

                </div>

                <div class="field">

                  <label>DOF/</label>

                  <input
                    v-model="form.dof"
                    maxlength="6"
                    placeholder="260917"
                  />

                </div>

                <div class="field">

                  <label>REG/</label>

                  <input
                    v-model="form.reg"
                    placeholder="XAABC"
                  />

                </div>

                <div class="field">

                  <label>OPR/</label>

                  <input
                    v-model="form.opr"
                    placeholder="AMX"
                  />

                </div>

                <div class="field">

                  <label>EET/</label>

                  <input
                    v-model="form.eetInfo"
                    placeholder="MMFR0030"
                  />

                </div>

                <div class="field">

                  <label>SEL/</label>

                  <input
                    v-model="form.sel"
                    placeholder="ABCD"
                  />

                </div>

                <div class="field">

                  <label>CODE/</label>

                  <input
                    v-model="form.code"
                    placeholder="ABC123"
                  />

                </div>

                <div class="field">

                  <label>PER/</label>

                  <input
                    v-model="form.per"
                    placeholder="C"
                  />

                </div>

                <div class="field span-3">

                  <label>RMK/</label>

                  <input
                    v-model="form.rmk"
                    placeholder="INFORMACIÓN ADICIONAL"
                  />

                </div>

              </div>

              <div
                v-if="item18"
                class="item18-preview"
              >

                <span>
                  ITEM 18 GENERADO
                </span>

                <code>
                  {{ item18 }}
                </code>

              </div>

            </div>

            <!-- ================================== -->
            <!-- ITEM 19 -->
            <!-- ================================== -->

            <div
              v-if="activeTab === 'item19'"
              class="tab-content"
            >

              <div class="tab-heading">

                <span>
                  ITEM 19
                </span>

                <h3>
                  Información suplementaria
                </h3>

                <p>
                  Información complementaria del vuelo.
                </p>

              </div>

              <div class="grid grid-3">

                <div class="field">

                  <label>
                    ENDURANCE
                  </label>

                  <input
                    v-model="form.endurance"
                    type="time"
                  />

                </div>

                <div class="field">

                  <label>
                    PERSONAS A BORDO
                  </label>

                  <input
                    v-model="form.personsOnBoard"
                    placeholder="145"
                  />

                </div>

                <div class="field">

                  <label>
                    PILOTO AL MANDO
                  </label>

                  <input
                    v-model="form.pilotInCommand"
                    placeholder="D RUIZ"
                  />

                </div>

                <div class="field">

                  <label>
                    RADIO EMERGENCIA
                  </label>

                  <input
                    v-model="form.emergencyRadio"
                    placeholder="U V E"
                  />

                </div>

                <div class="field">

                  <label>
                    SUPERVIVENCIA
                  </label>

                  <input
                    v-model="form.survivalEquipment"
                    placeholder="P D M J"
                  />

                </div>

                <div class="field">

                  <label>
                    CHALECOS
                  </label>

                  <input
                    v-model="form.jackets"
                    placeholder="L F U V"
                  />

                </div>

                <div class="field">

                  <label>
                    BOTES
                  </label>

                  <input
                    v-model="form.dinghies"
                    placeholder="2 10 C"
                  />

                </div>

                <div class="field span-2">

                  <label>
                    COLOR / MARCAS AERONAVE
                  </label>

                  <input
                    v-model="form.aircraftColour"
                    placeholder="WHITE BLUE"
                  />

                </div>

                <div class="field span-3">

                  <label>
                    OBSERVACIONES
                  </label>

                  <input
                    v-model="form.remarks"
                    placeholder="OBSERVACIONES"
                  />

                </div>

              </div>

            </div>

          </main>

          <!-- ====================================== -->
          <!-- VISTA PREVIA -->
          <!-- ====================================== -->

          <aside class="preview-area">

            <div class="preview-header">

              <div>

                <span>
                  VISTA PREVIA
                </span>

                <h3>
                  Mensaje FPL
                </h3>

              </div>

              <div
                class="generated"
                :class="{ validated: isValidated }"
              >
                {{
                  isValidated
                    ? '● VALIDADO'
                    : '● BORRADOR'
                }}
              </div>

            </div>

            <pre>{{ aftnPreview }}</pre>

            <!-- RESUMEN -->

            <div class="flight-summary">

              <div>

                <span>CALLSIGN</span>

                <strong>
                  {{ upper(form.callsign) || '---' }}
                </strong>

              </div>

              <div>

                <span>DEP</span>

                <strong>
                  {{ upper(form.departure) || '----' }}
                </strong>

              </div>

              <div>

                <span>DEST</span>

                <strong>
                  {{ upper(form.destination) || '----' }}
                </strong>

              </div>

              <div>

                <span>LEVEL</span>

                <strong>
                  {{ upper(form.level) || '----' }}
                </strong>

              </div>

            </div>

            <!-- VALIDACIÓN -->

            <div
              v-if="validationErrors.length"
              class="validation-panel"
            >

              <div class="validation-title">
                ⚠ FPL CON ERRORES
              </div>

              <div
                v-for="(error, index) in validationErrors"
                :key="index"
                class="validation-error"
              >

                <strong>
                  {{ error.field }}
                </strong>

                <span>
                  {{ error.message }}
                </span>

              </div>

            </div>

            <div
              v-if="isValidated"
              class="validation-success"
            >
              ✓ FPL VALIDADO
              <span>
                Sin errores de formato detectados
              </span>
            </div>

          </aside>

        </div>

        <!-- ====================================== -->
        <!-- FOOTER -->
        <!-- ====================================== -->

        <footer class="modal-footer">

          <div
            class="footer-status"
            :class="{ ok: isValidated }"
          >

            {{
              isValidated
                ? '● FPL VALIDADO'
                : '● BORRADOR FPL'
            }}

          </div>

          <div class="actions">

            <button
              type="button"
              class="cancel"
              @click="emit('close')"
            >
              CANCELAR
            </button>

            <button
              type="button"
              class="validate-button"
              @click="validateFlight"
            >
              VALIDAR FPL
            </button>

            <button
              type="submit"
              class="save"
            >
              GUARDAR FPL
            </button>

          </div>

        </footer>

      </form>

    </div>

  </div>

</template>

<style scoped>

/* ==================================================
   FONDO
================================================== */

.modal-background {
  position: fixed;
  inset: 0;

  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(2, 8, 15, 0.88);

  backdrop-filter: blur(6px);
}

/* ==================================================
   MODAL
================================================== */

.modal {
  width: min(1400px, 96vw);
  height: min(850px, 92vh);

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background: #0b1826;

  border: 1px solid #20384d;

  border-radius: 11px;

  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.65);
}

/* ==================================================
   HEADER
================================================== */

.modal-header {
  height: 82px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 25px;

  background: #0c1a29;

  border-bottom: 1px solid #20384d;
}

.icao-label {
  color: #55d1d9;

  font-size: 8px;
  font-weight: bold;

  letter-spacing: 1.4px;
}

.modal-header h2 {
  margin: 3px 0;

  font-size: 19px;
}

.modal-header p {
  margin: 0;

  color: #71869b;

  font-size: 10px;
}

.close {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: transparent;

  border: 1px solid transparent;

  border-radius: 6px;

  color: #8295a8;

  font-size: 27px;

  cursor: pointer;
}

.close:hover {
  background: #142638;

  border-color: #294156;

  color: white;
}

/* ==================================================
   TABS
================================================== */

.tabs {
  height: 50px;

  flex-shrink: 0;

  display: flex;
  align-items: flex-end;

  gap: 5px;

  padding: 0 25px;

  background: #091522;

  border-bottom: 1px solid #20384d;
}

.tabs button {
  height: 50px;

  padding: 0 18px;

  background: transparent;

  border: none;

  border-bottom:
    2px solid transparent;

  color: #71869b;

  font-size: 10px;
  font-weight: bold;

  cursor: pointer;
}

.tabs button:hover {
  color: #b7c8d8;
}

.tabs button.active {
  color: #58d2da;

  border-bottom-color: #16a2ad;
}

/* ==================================================
   FORM
================================================== */

form {
  flex: 1;

  min-height: 0;

  display: flex;
  flex-direction: column;
}

/* ==================================================
   WORKSPACE
================================================== */

.workspace {
  flex: 1;

  min-height: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1.8fr)
    minmax(330px, 0.8fr);
}

/* ==================================================
   ÁREA DE CAPTURA
================================================== */

.form-area {
  min-width: 0;

  overflow-y: auto;

  padding: 20px 24px;

  border-right:
    1px solid #20384d;
}

.tab-content {
  animation:
    tabFade 0.15s ease;
}

@keyframes tabFade {

  from {
    opacity: 0;

    transform:
      translateY(3px);
  }

  to {
    opacity: 1;

    transform:
      translateY(0);
  }

}

/* ==================================================
   SECCIONES
================================================== */

.section {
  margin-bottom: 15px;

  padding-bottom: 15px;

  border-bottom:
    1px solid #172b3e;
}

.section:last-child {
  margin-bottom: 0;

  border-bottom: none;
}

.section-title {
  margin-bottom: 11px;

  color: #9bafc2;

  font-size: 10px;

  font-weight: bold;
}

.section-title span,
.tab-heading > span {
  display: inline-block;

  margin-right: 7px;

  padding: 3px 6px;

  background: #123847;

  border-radius: 4px;

  color: #55d1d9;

  font-family: 'JetBrains Mono', monospace;

  font-size: 8px;
}

/* ==================================================
   GRID
================================================== */

.grid {
  display: grid;

  gap: 11px;
}

.grid-2 {
  grid-template-columns:
    repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns:
    repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns:
    repeat(4, 1fr);
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

/* ==================================================
   CAMPOS
================================================== */

.field {
  display: flex;

  flex-direction: column;

  gap: 5px;
}

label {
  color: #71869b;

  font-size: 8px;

  font-weight: bold;

  letter-spacing: 0.5px;
}

input,
select,
textarea {
  width: 100%;

  min-height: 36px;

  padding: 8px 10px;

  background: #07131f;

  border: 1px solid #20384d;

  border-radius: 5px;

  outline: none;

  color: #e8f0fa;

  font-size: 11px;
}

textarea {
  min-height: 55px;

  resize: none;

  font-family:
    Monaco,
    Consolas,
    monospace;
}

select {
  cursor: pointer;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #16a2ad;

  box-shadow:
    0 0 0 2px
    rgba(22, 162, 173, 0.1);
}

input::placeholder,
textarea::placeholder {
  color: #40576c;
}

.field small {
  color: #526b81;

  font-size: 8px;
}

.route-field {
  margin-top: 10px;
}

/* ==================================================
   TAB HEADINGS
================================================== */

.tab-heading {
  margin-bottom: 25px;
}

.tab-heading h3 {
  margin: 8px 0 5px;

  font-size: 18px;
}

.tab-heading p {
  margin: 0;

  color: #71869b;

  font-size: 10px;
}

/* ==================================================
   EQUIPMENT
================================================== */

.equipment-card {
  display: grid;

  grid-template-columns:
    1fr 30px 1fr;

  align-items: center;

  gap: 10px;

  padding: 25px;

  background: #091522;

  border: 1px solid #1c3549;

  border-radius: 7px;
}

.separator {
  text-align: center;

  color: #55d1d9;

  font-size: 25px;
}

.info-box {
  margin-top: 15px;

  padding: 15px;

  background: #102334;

  border-left:
    3px solid #16a2ad;

  border-radius: 4px;
}

.info-box strong {
  display: block;

  margin-bottom: 8px;

  color: #7f95a9;

  font-size: 9px;
}

.info-box code {
  color: #64d6dd;
}

/* ==================================================
   ITEM 18
================================================== */

.item18-preview {
  margin-top: 20px;

  padding: 15px;

  background: #07131f;

  border: 1px solid #1c3549;

  border-radius: 6px;
}

.item18-preview span {
  display: block;

  margin-bottom: 8px;

  color: #71869b;

  font-size: 8px;
}

.item18-preview code {
  color: #5dd3da;

  font-size: 11px;

  overflow-wrap: anywhere;
}

/* ==================================================
   PREVIEW
================================================== */

.preview-area {
  min-width: 0;

  padding: 22px;

  background:
    linear-gradient(
      180deg,
      #081521 0%,
      #07111c 100%
    );

  overflow-y: auto;
}

.preview-header {
  display: flex;

  align-items: center;

  justify-content:
    space-between;

  margin-bottom: 17px;
}

.preview-header span {
  color: #55d1d9;

  font-size: 8px;

  letter-spacing: 1px;
}

.preview-header h3 {
  margin: 4px 0 0;

  font-size: 14px;
}

.generated {
  color: #f0b94e;

  font-size: 8px;

  font-weight: bold;
}

.generated.validated {
  color: #4fd68a;
}

pre {
  min-height: 230px;

  margin: 0;

  padding: 18px;

  background: #030b12;

  border: 1px solid #162b3d;

  border-radius: 6px;

  color: #69d9df;

  font-family:
    Monaco,
    Consolas,
    monospace;

  font-size: 11px;

  line-height: 1.8;

  white-space: pre-wrap;

  overflow-wrap: anywhere;
}

/* ==================================================
   RESUMEN
================================================== */

.flight-summary {
  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 8px;

  margin-top: 15px;
}

.flight-summary > div {
  padding: 12px;

  background: #0b1a28;

  border: 1px solid #172b3e;

  border-radius: 5px;
}

.flight-summary span {
  display: block;

  margin-bottom: 5px;

  color: #60778d;

  font-size: 7px;
}

.flight-summary strong {
  color: #dbe8f3;

  font-family: 'JetBrains Mono', monospace;

  font-size: 11px;
}

/* ==================================================
   VALIDACIÓN
================================================== */

.validation-panel {
  margin-top: 15px;

  padding: 14px;

  background: #261419;

  border: 1px solid #743640;

  border-radius: 6px;
}

.validation-title {
  margin-bottom: 10px;

  color: #ff7884;

  font-size: 9px;

  font-weight: bold;
}

.validation-error {
  display: flex;

  flex-direction: column;

  gap: 3px;

  padding: 7px 0;

  border-bottom:
    1px solid #47252b;
}

.validation-error:last-child {
  border-bottom: none;
}

.validation-error strong {
  color: #ff7884;

  font-size: 8px;
}

.validation-error span {
  color: #c7a2a7;

  font-size: 9px;
}

.validation-success {
  margin-top: 15px;

  padding: 13px;

  background: #102d27;

  border: 1px solid #24664f;

  border-radius: 6px;

  color: #55d993;

  font-size: 9px;

  font-weight: bold;
}

.validation-success span {
  display: block;

  margin-top: 4px;

  color: #7faf9d;

  font-size: 8px;

  font-weight: normal;
}

/* ==================================================
   FOOTER
================================================== */

.modal-footer {
  height: 68px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  padding: 0 25px;

  background: #091522;

  border-top:
    1px solid #20384d;
}

.footer-status {
  color: #f0b94e;

  font-size: 8px;

  font-weight: bold;
}

.footer-status.ok {
  color: #4fd68a;
}

.actions {
  display: flex;

  gap: 10px;
}

.actions button {
  min-width: 110px;

  padding: 10px 17px;

  border-radius: 5px;

  font-size: 9px;

  font-weight: bold;

  cursor: pointer;
}

.cancel {
  background: transparent;

  border: 1px solid #294156;

  color: #91a4b8;
}

.cancel:hover {
  background: #132536;
}

.validate-button {
  background: #17364a;

  border: 1px solid #2d617d;

  color: #64d6dd;
}

.validate-button:hover {
  background: #1c465e;
}

.save {
  background: #07818b;

  border: 1px solid #07818b;

  color: white;
}

.save:hover {
  background: #0797a3;
}

/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 950px) {

  .workspace {
    grid-template-columns: 1fr;
  }

  .preview-area {
    display: none;
  }

  .grid-4 {
    grid-template-columns:
      repeat(2, 1fr);
  }

}

@media (max-width: 650px) {

  .modal {
    width: 100%;

    height: 96vh;
  }

  .tabs {
    overflow-x: auto;
  }

  .tabs button {
    white-space: nowrap;
  }

  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .span-2,
  .span-3 {
    grid-column: span 1;
  }

  .equipment-card {
    grid-template-columns: 1fr;
  }

  .separator {
    display: none;
  }

  .footer-status {
    display: none;
  }

}

/* ==================================================
   TAMAÑO DE LETRA - NUEVO PLAN DE VUELO
================================================== */

/* Título principal */
.modal-header h2 {
  font-size: 26px !important;
  font-weight: 700;
}

/* ICAO FLIGHT PLAN */
.icao-label {
  font-size: 11px !important;
}

/* Subtítulo */
.modal-header p {
  font-size: 13px !important;
}

/* Pestañas FPL / EQUIPO / ITEM 18 / SUPLEMENTARIOS */
.tabs button {
  font-size: 13px !important;
}

/* ITEM 7, ITEM 8, ITEM 9... */
.section-title {
  font-size: 14px !important;
}

.section-title span,
.tab-heading > span {
  font-size: 11px !important;
}

/* Etiquetas de los campos */
label {
  font-size: 12px !important;
}

/* Campos de captura */
input,
select,
textarea {
  font-size: 15px !important;
  min-height: 42px;
}

/* Textos auxiliares */
.field small {
  font-size: 11px !important;
}

/* Encabezados de otras pestañas */
.tab-heading h3 {
  font-size: 22px !important;
}

.tab-heading p {
  font-size: 13px !important;
}

/* Vista previa */
.preview-header span {
  font-size: 10px !important;
}

.preview-header h3 {
  font-size: 18px !important;
}

.generated {
  font-size: 11px !important;
}

/* Mensaje AFTN */
pre {
  font-size: 14px !important;
  line-height: 1.7;
}

/* Resumen del vuelo */
.flight-summary span {
  font-size: 10px !important;
}

.flight-summary strong {
  font-size: 14px !important;
}

/* Validaciones */
.validation-title {
  font-size: 12px !important;
}

.validation-error strong {
  font-size: 11px !important;
}

.validation-error span {
  font-size: 12px !important;
}

.validation-success {
  font-size: 12px !important;
}

.validation-success span {
  font-size: 11px !important;
}

/* Estado inferior */
.footer-status {
  font-size: 11px !important;
}

/* Botones inferiores */
.actions button {
  font-size: 12px !important;
  min-width: 125px;
  padding: 11px 19px;
}

</style>