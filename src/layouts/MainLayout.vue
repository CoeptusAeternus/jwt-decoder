<template>
  <q-layout view="hHh lpR fFf" class="app-layout">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Layout intentionally minimal for a single-page JWT utility.
</script>

<style scoped lang="scss">
.app-layout {
  background: transparent;
}
</style>
