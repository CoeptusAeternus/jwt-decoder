<template>
  <q-card class="jwt-card jwt-input-panel" flat>
    <q-card-section>
      <div class="panel-title">Token Input</div>
      <p class="panel-subtitle">Paste a JWT to inspect its header, payload, and signature.</p>
    </q-card-section>

    <q-card-section>
      <q-input :model-value="modelValue" label="JWT" autogrow type="textarea" outlined spellcheck="false"
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." @update:model-value="onUpdate" />
    </q-card-section>

    <q-card-section>
      <q-input :model-value="sharedSecret" label="Shared secret" outlined dense type="password" spellcheck="false"
        autocomplete="off" placeholder="required for HS256/HS384/HS512 validation"
        @update:model-value="onUpdateSecret" />
    </q-card-section>

    <q-card-section>
      <q-input :model-value="publicKey" label="RSA public key (PEM/SPKI)" autogrow type="textarea" outlined dense
        spellcheck="false" autocomplete="off" placeholder="required for RS256/RS384/RS512 validation"
        @update:model-value="onUpdatePublicKey" />
    </q-card-section>

    <q-card-actions align="between" class="panel-actions">
      <q-btn flat color="primary" label="Clear" no-caps @click="$emit('clear')" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  sharedSecret: string;
  publicKey: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:sharedSecret': [value: string];
  'update:publicKey': [value: string];
  clear: [];
}>();

function trimWrappingQuotes(value: string): string {
  const trimmedValue = value.trim();

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
    || (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1);
  }

  return value;
}

function onUpdate(value: string | number | null) {
  emit('update:modelValue', trimWrappingQuotes(String(value ?? '')));
}

function onUpdateSecret(value: string | number | null) {
  emit('update:sharedSecret', trimWrappingQuotes(String(value ?? '')));
}

function onUpdatePublicKey(value: string | number | null) {
  emit('update:publicKey', String(value ?? ''));
}
</script>

<style scoped lang="scss">
.jwt-input-panel {
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

.panel-actions {
  margin-top: auto;
  padding: 1rem;
}
</style>
