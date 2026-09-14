<script setup>
import { reactive, ref } from 'vue'
import { mdiBallotOutline, mdiAccount, mdiMail, mdiGithub } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import FormCheckRadioGroup from '@/components/FormCheckRadioGroup.vue'
import FormFilePicker from '@/components/FormFilePicker.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import NotificationBarInCard from '@/components/NotificationBarInCard.vue'

const selectOptions = [
  { id: 1, label: 'Business development' },
  { id: 2, label: 'Marketing' },
  { id: 3, label: 'Sales' },
]

const form = reactive({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '',
  department: selectOptions[0],
  subject: '',
  question: '',
})

const customElementsForm = reactive({
  checkbox: ['lorem'],
  radio: 'one',
  switch: ['one'],
  file: null,
})

const submit = () => {
  //
}

const formStatusWithHeader = ref(true)

const formStatusCurrent = ref(0)

const formStatusOptions = ['info', 'success', 'danger', 'warning']

// INSTRUMENTATION (repair-bench, read-only): the status-banner state machine and the authored
// form model of this view, as scalars. Getters only, fail-close, no state writes.
window.__rb = window.__rb || {}
window.__rb.forms = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    hash: () => safe(() => location.hash),
    statusOptions: () => safe(() => formStatusOptions.join(',')),
    statusOptionCount: () => safe(() => formStatusOptions.length),
    statusCurrent: () => safe(() => formStatusCurrent.value),
    statusOption: () => safe(() => { var v = formStatusOptions[formStatusCurrent.value]; return v === undefined ? null : String(v) }),
    statusWithHeader: () => safe(() => !!formStatusWithHeader.value),
    statusLabel: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-status-label\"]"); return el ? String(el.textContent == null ? '' : el.textContent).trim() : null }),
    statusBarClass: () =>
      safe(() => {
        var bar = document.querySelector('[data-testid="rb-status-bar"]')
        if (!bar || !bar.firstElementChild) { return null }
        return String(bar.firstElementChild.className)
      }),
    statusTriggerPresent: () => safe(() => !!document.querySelector('[data-testid="rb-status-trigger"]')),
    formName: () => safe(() => String(form.name)),
    formEmail: () => safe(() => String(form.email)),
    formPhone: () => safe(() => String(form.phone)),
    formSubject: () => safe(() => String(form.subject)),
    formQuestion: () => safe(() => String(form.question)),
    departmentId: () => safe(() => (form.department ? form.department.id : null)),
    departmentLabel: () => safe(() => (form.department ? String(form.department.label) : null)),
    selectOptionCount: () => safe(() => selectOptions.length),
    selectOptionLabels: () => safe(() => selectOptions.map((o) => o.label).join('|')),
    checkboxModel: () => safe(() => customElementsForm.checkbox.join(',')),
    radioModel: () => safe(() => String(customElementsForm.radio)),
    switchModel: () => safe(() => customElementsForm.switch.join(',')),
    controlCount: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-control-\"]").length),
    checkCount: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-check-\"]").length),
  }
})()

const formStatusSubmit = () => {
  formStatusCurrent.value = formStatusCurrent.value + 1
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiBallotOutline" title="Forms example" main>
        <BaseButton
          data-testid="rb-star-forms"
          href="https://github.com/justboil/admin-one-vue-tailwind"
          target="_blank"
          :icon="mdiGithub"
          label="Star on GitHub"
          color="contrast"
          rounded-full
          small
        />
      </SectionTitleLineWithButton>
      <CardBox form @submit.prevent="submit">
        <FormField label="Grouped with icons">
          <FormControl v-model="form.name" :icon="mdiAccount" />
          <FormControl v-model="form.email" type="email" :icon="mdiMail" />
        </FormField>

        <FormField label="With help line" help="Do not enter the leading zero">
          <FormControl v-model="form.phone" type="tel" placeholder="Your phone number" />
        </FormField>

        <FormField label="Dropdown">
          <FormControl v-model="form.department" :options="selectOptions" />
        </FormField>

        <BaseDivider />

        <FormField label="Question" help="Your question. Max 255 characters">
          <FormControl type="textarea" placeholder="Explain how we can help you" />
        </FormField>

        <template #footer>
          <BaseButtons>
            <BaseButton type="submit" color="info" label="Submit" />
            <BaseButton type="reset" color="info" outline label="Reset" />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionMain>

    <SectionTitle>Custom elements</SectionTitle>

    <SectionMain>
      <CardBox>
        <FormField label="Checkbox">
          <FormCheckRadioGroup
            v-model="customElementsForm.checkbox"
            name="sample-checkbox"
            :options="{ lorem: 'Lorem', ipsum: 'Ipsum', dolore: 'Dolore' }"
          />
        </FormField>

        <BaseDivider />

        <FormField label="Radio">
          <FormCheckRadioGroup
            v-model="customElementsForm.radio"
            name="sample-radio"
            type="radio"
            :options="{ one: 'One', two: 'Two' }"
          />
        </FormField>

        <BaseDivider />

        <FormField label="Switch">
          <FormCheckRadioGroup
            v-model="customElementsForm.switch"
            name="sample-switch"
            type="switch"
            :options="{ one: 'One', two: 'Two' }"
          />
        </FormField>

        <BaseDivider />

        <FormFilePicker v-model="customElementsForm.file" label="Upload" />
      </CardBox>

      <SectionTitle>Form with status example</SectionTitle>

      <CardBox
        data-testid="rb-status-form"
        class="shadow-2xl md:mx-auto md:w-7/12 lg:w-5/12 xl:w-4/12"
        is-form
        is-hoverable
        @submit.prevent="formStatusSubmit"
      >
        <NotificationBarInCard
          data-testid="rb-status-bar"
          :color="formStatusOptions[formStatusCurrent]"
          :is-placed-with-header="formStatusWithHeader"
        >
          <span
            ><b data-testid="rb-status-label" class="capitalize">{{ formStatusOptions[formStatusCurrent] }}</b> state</span
          >
        </NotificationBarInCard>
        <FormField label="Fields">
          <FormControl
            v-model="form.name"
            :icon-left="mdiAccount"
            help="Your full name"
            placeholder="Name"
          />
        </FormField>

        <template #footer>
          <BaseButton data-testid="rb-status-trigger" label="Trigger" type="submit" color="info" />
        </template>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
