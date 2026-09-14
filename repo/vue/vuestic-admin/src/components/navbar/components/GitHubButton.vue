<template>
  <VaButton
    preset="secondary"
    color="textPrimary"
    aria-label="Visit github"
  >
    <VaIcon :component="VaIconGitHub" />
  </VaButton>
</template>

<script lang="ts" setup>
import VaIconGitHub from '../../icons/VaIconGitHub.vue'
</script>
