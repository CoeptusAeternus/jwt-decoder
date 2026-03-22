<template>
  <q-card class="jwt-card jwt-output-panel" flat>
    <q-card-section>
      <div class="panel-title">Decoded Output</div>
      <p class="panel-subtitle">Results stay in your browser and are never sent to a server.</p>
    </q-card-section>

    <q-card-section class="output-stack">
      <div class="output-item">
        <div class="output-label">Header</div>
        <div class="table-wrap">
          <q-markup-table flat dense separator="cell" class="jwt-table" v-if="headerRows.length">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in headerRows" :key="`header-${row.field}`">
                <td class="cell-field">{{ row.field }}</td>
                <td class="cell-value">{{ formatValue(row.value) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
          <div v-else class="cell-value">Enter a token to decode header data.</div>
        </div>
      </div>

      <div class="output-item">
        <div class="output-label">Claims</div>
        <div class="table-wrap">
          <q-markup-table flat dense separator="cell" class="jwt-table" v-if="payloadRows.length">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in payloadRows" :key="`claim-${row.field}`">
                <td class="cell-field">{{ row.field }}</td>
                <td class="cell-value">{{ formatValue(row.value, row.field) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
          <div v-else class="cell-value">Enter a token to decode claim data.</div>
        </div>
      </div>

      <div class="output-item">
        <div class="output-label">Signature</div>
        <div class="table-wrap">
          <q-markup-table flat dense separator="cell" class="jwt-table" v-if="signatureRows.length">
            <thead>
              <tr>
                <th>Detail</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in signatureRows" :key="`sig-${row.field}`">
                <td class="cell-field">{{ row.field }}</td>
                <td class="cell-value">{{ formatValue(row.value) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
          <div v-else class="cell-value">Signature details appear after token parsing.</div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="validation-row">
        <div class="output-label">Validation</div>
        <q-chip square dense :color="statusColor" text-color="white">{{ statusText }}</q-chip>
      </div>
      <ul class="validation-list">
        <li v-for="message in validationMessages" :key="message">{{ message }}</li>
      </ul>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type ValidationState = 'idle' | 'valid' | 'invalid' | 'ignored';

const props = defineProps<{
  headerRows: Array<{ field: string; value: unknown }>;
  payloadRows: Array<{ field: string; value: unknown }>;
  signatureRows: Array<{ field: string; value: unknown }>;
  validationState: ValidationState;
  validationMessages: string[];
}>();

function formatValue(value: unknown, key?: string): string {
  console.log('Formatting value for key:', key, 'with raw value:', value);
  if (key === 'exp' || key === 'nbf' || key === 'iat') {
    const numValue = Number(value);
    const date = new Date(numValue * 1000);
    return `${numValue} (${date.toISOString()})`;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'undefined') {
    return 'undefined';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Unserializable object]';
    }
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`;
  }

  if (typeof value === 'symbol') {
    return value.description ? `Symbol(${value.description})` : 'Symbol()';
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  return '';
}

const statusText = computed(() => {
  if (props.validationState === 'valid') {
    return 'Valid';
  }

  if (props.validationState === 'invalid') {
    return 'Invalid';
  }

  if (props.validationState === 'ignored') {
    return 'Ignored';
  }

  return 'Not checked';
});

const statusColor = computed(() => {
  if (props.validationState === 'valid') {
    return 'positive';
  }

  if (props.validationState === 'invalid') {
    return 'negative';
  }

  if (props.validationState === 'ignored') {
    return 'warning';
  }

  return 'grey-7';
});
</script>

<style scoped lang="scss">
.jwt-output-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
}

.panel-subtitle {
  margin: 0.35rem 0 0;
  color: rgba(24, 39, 75, 0.72);
}

.output-stack {
  display: grid;
  gap: 0.9rem;
}

.output-item {
  display: grid;
  gap: 0.35rem;
}

.table-wrap {
  overflow-x: auto;
}

.jwt-table {
  background: rgba(255, 255, 255, 0.65);
}

.cell-field {
  width: 35%;
  font-weight: 600;
  white-space: nowrap;
}

.cell-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  word-break: break-word;
}

.output-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(24, 39, 75, 0.86);
}

.validation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.validation-list {
  margin: 0.75rem 0 0;
  padding-left: 1rem;
  color: rgba(24, 39, 75, 0.85);
  display: grid;
  gap: 0.3rem;
}
</style>
