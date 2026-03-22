<template>
  <q-page class="jwt-page">
    <div class="bg-orb orb-one"></div>
    <div class="bg-orb orb-two"></div>

    <section class="hero">
      <div class="hero-kicker">Frontend JWT Toolkit</div>
      <h1 class="hero-title">Decode and Validate JSON Web Tokens in Your Browser</h1>
      <p class="hero-copy">
        Build and test token parsing flows locally. No backend calls, no token upload.
      </p>
    </section>

    <section class="workspace-grid">
      <JwtInputPanel v-model="jwtInput" v-model:shared-secret="sharedSecret" @clear="handleClear" />
      <JwtOutputPanel :header-rows="headerRows" :payload-rows="payloadRows" :signature-rows="signatureRows"
        :validation-state="validationState" :validation-messages="validationMessages" />
      <JwtInfoPanel class="workspace-info" />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import JwtInfoPanel from 'components/JwtInfoPanel.vue';
import JwtInputPanel from 'components/JwtInputPanel.vue';
import JwtOutputPanel from 'components/JwtOutputPanel.vue';
import { decodeAndValidateJwt, type TableRow, type ValidationState } from 'src/utils/jwt';

const jwtInput = ref('');
const sharedSecret = ref('');
const headerRows = ref<TableRow[]>([{ field: 'status', value: 'Enter a token to decode header data.' }]);
const payloadRows = ref<TableRow[]>([{ field: 'status', value: 'Enter a token to decode claim data.' }]);
const signatureRows = ref<TableRow[]>([{ field: 'status', value: 'Signature details appear after token parsing.' }]);
const validationState = ref<ValidationState>('idle');
const validationMessages = ref<string[]>(['Validation runs automatically while you type.']);
let currentRun = 0;

watch([jwtInput, sharedSecret], () => {
  void decodeAndValidate();
});

async function decodeAndValidate() {
  currentRun += 1;
  const runId = currentRun;
  const result = await decodeAndValidateJwt({
    token: jwtInput.value,
    sharedSecret: sharedSecret.value,
  });

  if (runId !== currentRun) {
    return;
  }

  headerRows.value = result.headerRows;
  payloadRows.value = result.payloadRows;
  signatureRows.value = result.signatureRows;
  validationState.value = result.validationState;
  validationMessages.value = result.validationMessages;
}

void decodeAndValidate();

function handleClear() {
  jwtInput.value = '';
  sharedSecret.value = '';
}
</script>

<style scoped lang="scss">
.jwt-page {
  position: relative;
  min-height: 100vh;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(36px);
}

.orb-one {
  width: 260px;
  height: 260px;
  top: -90px;
  right: -70px;
  background: rgba(255, 154, 109, 0.38);
}

.orb-two {
  width: 360px;
  height: 360px;
  bottom: -170px;
  left: -120px;
  background: rgba(61, 173, 255, 0.22);
}

.hero {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
  animation: rise-in 420ms ease-out both;
}

.hero-kicker {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: rgba(24, 39, 75, 0.72);
}

.hero-title {
  margin: 0.7rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 5vw, 3rem);
  line-height: 1.15;
}

.hero-copy {
  margin: 0.9rem auto 0;
  max-width: 52ch;
  color: rgba(24, 39, 75, 0.74);
}

.workspace-grid {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 1.5rem auto 0;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  animation: rise-in 620ms ease-out both;
}

.workspace-grid :deep(.jwt-card) {
  border: 1px solid rgba(24, 39, 75, 0.08);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(9px);
}

.workspace-grid> :nth-child(1) {
  grid-column: span 6;
}

.workspace-grid> :nth-child(2) {
  grid-column: span 6;
}

.workspace-info {
  grid-column: 1 / -1;
}

@media (max-width: 1024px) {

  .workspace-grid> :nth-child(1),
  .workspace-grid> :nth-child(2) {
    grid-column: 1 / -1;
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
