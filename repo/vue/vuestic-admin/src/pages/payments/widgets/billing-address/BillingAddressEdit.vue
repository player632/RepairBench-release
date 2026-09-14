<template>
  <VaForm ref="form" @submit.prevent="submit">
    <VaInput
      v-model="localBillingAddress.name"
      :rules="[(v) => !!v || 'Name field is required']"
      class="mb-4"
      label="Name"
      data-testid="address-form-name"
    />
    <VaCheckbox
      v-model="localBillingAddress.isPrimary"
      class="mb-4"
      label="Primary Address"
      data-testid="address-form-primary"
    />
    <VaInput
      v-model="localBillingAddress.street"
      :rules="[(v) => !!v || 'Street field is required']"
      class="mb-4"
      label="Street"
      data-testid="address-form-street"
    />
    <VaInput
      v-model="localBillingAddress.city"
      :rules="[(v) => !!v || 'City field is required']"
      class="mb-4"
      label="City"
      data-testid="address-form-city"
    />
    <VaInput
      v-model="localBillingAddress.state"
      :rules="[(v) => !!v || 'State field is required']"
      class="mb-4"
      label="State"
      data-testid="address-form-state"
    />
    <VaInput
      v-model="localBillingAddress.postalCode"
      :rules="[(v) => !!v || 'Postal Code field is required']"
      class="mb-4"
      label="Postal Code"
      data-testid="address-form-postal"
    />
    <VaInput
      v-model="localBillingAddress.country"
      :rules="[(v) => !!v || 'Country field is required']"
      class="mb-4"
      label="Country"
      data-testid="address-form-country"
    />
    <div class="flex justify-end gap-3">
      <VaButton color="secondary" preset="secondary" data-testid="address-form-cancel" @click="emits('cancel')"
        >Cancel</VaButton
      >
      <VaButton data-testid="address-form-save" @click="submit">{{ submitText }}</VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { useForm } from 'vuestic-ui'
import { BillingAddress } from '../../types'
import { watch, ref } from 'vue'

const { validate } = useForm('form')
const emits = defineEmits(['save', 'cancel'])

const props = defineProps<{
  billingAddress: BillingAddress
  submitText: string
}>()

const localBillingAddress = ref<BillingAddress>({ ...props.billingAddress })

watch(
  () => props.billingAddress,
  (value) => {
    localBillingAddress.value = { ...value }
  },
  { deep: true },
)

const submit = () => {
  if (validate()) {
    emits('save', localBillingAddress.value)
  }
}
</script>
