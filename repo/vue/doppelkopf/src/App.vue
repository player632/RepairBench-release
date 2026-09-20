<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
// [repair-bench instrumentation] side-effect-only import of the read-only model exposure hook.
// App.vue is the common root of every route, so window.__rbDoko exists on / and on /play alike.
// This block adds no props, no state, no lifecycle hook and no render output.
import "@/rbProbe";
</script>
