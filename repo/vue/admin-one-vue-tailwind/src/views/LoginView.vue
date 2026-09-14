<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { mdiAccount, mdiAsterisk } from '@mdi/js'
import SectionFullScreen from '@/components/SectionFullScreen.vue'
import CardBox from '@/components/CardBox.vue'
import FormCheckRadio from '@/components/FormCheckRadio.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'

const form = reactive({
  login: 'john.doe',
  pass: 'highly-secure-password-fYjUw-',
  remember: true,
})

const router = useRouter()

// INSTRUMENTATION (repair-bench, read-only): login form scalars. Getters only, fail-close.
window.__rb = window.__rb || {}
window.__rb.login = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  const val = (sel) => {
    var el = document.querySelector(sel)
    return el ? String(el.value) : null
  }
  return {
    hash: () => safe(() => location.hash),
    loginValue: () => safe(() => val('[data-testid="rb-control-login"] input')),
    passValue: () => safe(() => val('[data-testid="rb-control-password"] input')),
    rememberChecked: () =>
      safe(() => {
        var el = document.querySelector('[data-testid="rb-check-remember"] input')
        return el ? !!el.checked : null
      }),
    submitPresent: () => safe(() => !!document.querySelector('[data-testid="rb-login-submit"]')),
    backHref: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-login-back\"]"); if (!el) { return null } var v = el.getAttribute("href"); return v == null ? '' : String(v) }),
    submitClass: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-login-submit\"]"); return el ? String(el.className) : null }),
  }
})()

const submit = () => {
  router.push('/dashboard')
}
</script>

<template>
  <LayoutGuest>
    <SectionFullScreen v-slot="{ cardClass }" bg="purplePink">
      <CardBox :class="cardClass" is-form @submit.prevent="submit">
        <FormField label="Login" help="Please enter your login">
          <FormControl
            v-model="form.login"
            :icon="mdiAccount"
            name="login"
            autocomplete="username"
          />
        </FormField>

        <FormField label="Password" help="Please enter your password">
          <FormControl
            v-model="form.pass"
            :icon="mdiAsterisk"
            type="password"
            name="password"
            autocomplete="current-password"
          />
        </FormField>

        <FormCheckRadio
          v-model="form.remember"
          name="remember"
          label="Remember"
          :input-value="true"
        />

        <template #footer>
          <BaseButtons>
            <BaseButton data-testid="rb-login-submit" type="submit" color="info" label="Login" />
            <BaseButton data-testid="rb-login-back" to="/dashboard" color="info" outline label="Back" />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionFullScreen>
  </LayoutGuest>
</template>
