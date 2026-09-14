<script setup>
import { reactive } from 'vue'
import { useMainStore } from '@/stores/main'
import { mdiAccount, mdiMail, mdiAsterisk, mdiFormTextboxPassword, mdiGithub } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import FormFilePicker from '@/components/FormFilePicker.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import UserCard from '@/components/UserCard.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'

const mainStore = useMainStore()

const profileForm = reactive({
  name: mainStore.userName,
  email: mainStore.userEmail,
})

const passwordForm = reactive({
  password_current: '',
  password: '',
  password_confirmation: '',
})

// INSTRUMENTATION (repair-bench, read-only): the two profile forms' DOM values plus the store
// identity they write into, as scalars. Getters only, fail-close, no state writes.
window.__rb = window.__rb || {}
window.__rb.profile = (function () {
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
    storeName: () => safe(() => String(mainStore.userName)),
    storeEmail: () => safe(() => String(mainStore.userEmail)),
    storeAvatar: () => safe(() => String(mainStore.userAvatar)),
    nameInput: () => safe(() => val('[data-testid="rb-control-username"] input')),
    emailInput: () => safe(() => val('[data-testid="rb-control-email"] input')),
    passCurrentInput: () => safe(() => val('[data-testid="rb-control-password-current"] input')),
    passInput: () => safe(() => val('[data-testid="rb-control-password"] input')),
    passConfirmInput: () => safe(() => val('[data-testid="rb-control-password-confirmation"] input')),
    userCardName: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-usercard-name\"]"); return el ? String(el.textContent == null ? '' : el.textContent).trim() : null }),
    submitCount: () => safe(() => document.querySelectorAll("[data-testid=\"rb-profile-submit\"],[data-testid=\"rb-pass-submit\"]").length),
    optionsClass: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-profile-options\"]"); return el ? String(el.className) : null }),
    submitClass: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-profile-submit\"]"); return el ? String(el.className) : null }),
    avatarSrc: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-usercard-root\"] [data-testid=\"rb-avatar-img\"]"); if (!el) { return null } var v = el.getAttribute("src"); return v == null ? '' : String(v) }),
  }
})()

const submitProfile = () => {
  mainStore.setUser(profileForm)
}

const submitPass = () => {
  //
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiAccount" title="Profile" main>
        <BaseButton
          data-testid="rb-star-profile"
          href="https://github.com/justboil/admin-one-vue-tailwind"
          target="_blank"
          :icon="mdiGithub"
          label="Star on GitHub"
          color="contrast"
          rounded-full
          small
        />
      </SectionTitleLineWithButton>

      <UserCard class="mb-6" />

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardBox is-form @submit.prevent="submitProfile">
          <FormField label="Avatar" help="Max 500kb">
            <FormFilePicker label="Upload" />
          </FormField>

          <FormField label="Name" help="Required. Your name">
            <FormControl
              v-model="profileForm.name"
              :icon="mdiAccount"
              name="username"
              required
              autocomplete="username"
            />
          </FormField>
          <FormField label="E-mail" help="Required. Your e-mail">
            <FormControl
              v-model="profileForm.email"
              :icon="mdiMail"
              type="email"
              name="email"
              required
              autocomplete="email"
            />
          </FormField>

          <template #footer>
            <BaseButtons>
              <BaseButton data-testid="rb-profile-submit" color="info" type="submit" label="Submit" />
              <BaseButton data-testid="rb-profile-options" color="info" label="Options" outline />
            </BaseButtons>
          </template>
        </CardBox>

        <CardBox is-form @submit.prevent="submitPass">
          <FormField label="Current password" help="Required. Your current password">
            <FormControl
              v-model="passwordForm.password_current"
              :icon="mdiAsterisk"
              name="password_current"
              type="password"
              required
              autocomplete="current-password"
            />
          </FormField>

          <BaseDivider />

          <FormField label="New password" help="Required. New password">
            <FormControl
              v-model="passwordForm.password"
              :icon="mdiFormTextboxPassword"
              name="password"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>

          <FormField label="Confirm password" help="Required. New password one more time">
            <FormControl
              v-model="passwordForm.password_confirmation"
              :icon="mdiFormTextboxPassword"
              name="password_confirmation"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>

          <template #footer>
            <BaseButtons>
              <BaseButton data-testid="rb-pass-submit" type="submit" color="info" label="Submit" />
              <BaseButton data-testid="rb-pass-options" color="info" label="Options" outline />
            </BaseButtons>
          </template>
        </CardBox>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
