<template>
  <div class="flex flex-col p-4 bg-backgroundSecondary rounded-lg" data-testid="notifications-root">
    <h3 class="h3 mb-6">Notifications you receive</h3>
    <div v-for="(notification, index) in notifications" :key="notification.name" class="group">
      <div class="flex items-center justify-between overflow-x-hidden">
        <p class="text-regularLarge">
          {{ notification.name }}
        </p>
        <VaSwitch v-model="notification.isEnabled" size="small" :data-testid="'notif-switch-' + index" />
      </div>
      <VaDivider class="py-4 group-last:hidden" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useNotificationsStore } from '../../../stores/notifications'

const { notifications } = useNotificationsStore()
</script>
