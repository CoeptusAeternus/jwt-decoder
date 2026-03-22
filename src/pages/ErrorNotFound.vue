<template>
  <div class="error-page q-pa-md flex flex-center">
    <q-card class="error-card" flat>
      <q-card-section class="text-center">
        <div class="error-code">404</div>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-copy">This route does not exist in the JWT tool.</p>
        <q-btn class="q-mt-md" color="primary" unelevated to="/" label="Back to App" no-caps />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
// Static page component.
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
}

.error-card {
  width: min(520px, 100%);
  border-radius: 1rem;
  border: 1px solid rgba(24, 39, 75, 0.08);
  background: rgba(255, 255, 255, 0.82);
}

.error-code {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(4.8rem, 12vw, 7rem);
  line-height: 0.95;
  font-weight: 700;
}

.error-title {
  margin: 0.85rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.9rem;
}

.error-copy {
  margin: 0.7rem 0 0;
  color: rgba(24, 39, 75, 0.76);
}
</style>
