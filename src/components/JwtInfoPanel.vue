<template>
  <q-card class="jwt-card info-panel" flat>
    <q-card-section>
      <div class="panel-title">How This Tool Works</div>
      <p class="panel-subtitle">This is a frontend-only tool for inspecting JSON Web Tokens in your browser. No data is
        sent to any server.</p>
    </q-card-section>

    <q-separator />

    <q-card-section class="info-grid">
      <div class="info-item">
        <div class="info-heading">Source Code</div>
        <p>Available on <a href="https://github.com/CoeptusAeternus/jwt-decoder" target="_blank"
            rel="noopener noreferrer">GitHub</a>.</p>
      </div>

      <div class="info-item">
        <div class="info-heading">Privacy</div>
        <p>Everything runs in the browser so sensitive tokens do not leave the page.</p>
      </div>

      <div class="info-item">
        <div class="info-heading">Run Locally</div>
        <p>Check out options to run this tool locally on your machine on <a
            href="https://github.com/CoeptusAeternus/jwt-decoder" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Informational component only.
</script>

<style scoped lang="scss">
.info-panel {
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

.info-grid {
  display: grid;
  gap: 0.9rem;
}

.info-item p {
  margin: 0.25rem 0 0;
  color: rgba(24, 39, 75, 0.8);
}

.info-heading {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
