<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '@/stores/main'
import { mdiCheckDecagram } from '@mdi/js'
import BaseLevel from '@/components/BaseLevel.vue'
import UserAvatarCurrentUser from '@/components/UserAvatarCurrentUser.vue'
import CardBox from '@/components/CardBox.vue'
import FormCheckRadio from '@/components/FormCheckRadio.vue'
import PillTag from '@/components/PillTag.vue'

const mainStore = useMainStore()

const userName = computed(() => mainStore.userName)

const userSwitchVal = ref(false)

// INSTRUMENTATION (repair-bench, read-only): the greeting name this card renders and its own
// switch model, as scalars. Getters only, fail-close.
window.__rb = window.__rb || {}
window.__rb.userCard = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    userName: () => safe(() => String(userName.value)),
    switchModel: () => safe(() => !!userSwitchVal.value),
    greeting: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-usercard-root\"] h1"); return el ? String(el.textContent == null ? '' : el.textContent).trim() : null }),
    avatarSrc: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-usercard-root\"] [data-testid=\"rb-avatar-img\"]"); if (!el) { return null } var v = el.getAttribute("src"); return v == null ? '' : String(v) }),
  }
})()
</script>

<template>
  <CardBox data-testid="rb-usercard-root">
    <BaseLevel type="justify-around lg:justify-center">
      <UserAvatarCurrentUser class="lg:mx-12" />
      <div class="space-y-3 text-center md:text-left lg:mx-12">
        <div class="flex justify-center md:block">
          <FormCheckRadio
            v-model="userSwitchVal"
            name="notifications-switch"
            type="switch"
            label="Notifications"
            :input-value="true"
          />
        </div>
        <h1 class="text-2xl">
          Howdy, <b data-testid="rb-usercard-name">{{ userName }}</b
          >!
        </h1>
        <p>Last login <b>12 mins ago</b> from <b>127.0.0.1</b></p>
        <div class="flex justify-center md:block">
          <PillTag label="Verified" color="info" :icon="mdiCheckDecagram" />
        </div>
      </div>
    </BaseLevel>
  </CardBox>
</template>
