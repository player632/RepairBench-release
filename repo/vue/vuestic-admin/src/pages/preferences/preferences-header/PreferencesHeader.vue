<template>
  <VaAvatar size="large" color="warning" data-testid="pref-avatar"><span class="text-4xl"> 😍 </span></VaAvatar>
  <div class="flex flex-col justify-center">
    <h2 class="text-[28px] md:text-[32px] leading-10 font-bold" data-testid="pref-name">{{ userName }}</h2>
    <div class="flex space-x-1 text-[13px] leading-4">
      <p>Member since</p>
      <p data-testid="pref-member-since">{{ memberSince }}</p>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useUserStore } from '../../../stores/user-store'

const { userName, memberSince } = useUserStore()
</script>
