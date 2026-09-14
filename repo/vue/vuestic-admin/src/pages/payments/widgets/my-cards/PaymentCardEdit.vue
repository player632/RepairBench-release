<template>
  <VaForm ref="form" @submit.prevent="submit">
    <VaInput
      v-model="paymentCardLocal.name"
      :rules="[(v) => !!v || 'Card Name field is required']"
      class="mb-4"
      label="Card Name"
      input-aria-label="Card Name"
      data-testid="card-form-name"
    />
    <VaCheckbox v-model="paymentCardLocal.isPrimary" class="mb-4" label="Primary Card" data-testid="card-form-primary" />
    <VaSelect
      v-model="paymentCardLocal.paymentSystem"
      :options="paymentSystemTypeOptions"
      :rules="[(v) => !!v || 'Payment System field is required']"
      class="mb-4"
      label="Payment System"
      data-testid="card-form-system"
    />
    <VaInput
      v-model="paymentCardLocal.cardNumberMasked"
      :rules="[(v) => !!v || 'Card Number field is required']"
      class="mb-4"
      label="Card Number"
      input-aria-label="Card Number"
      mask="creditCard"
      placeholder="#### #### #### ####"
      data-testid="card-form-number"
    />
    <VaInput
      v-model="paymentCardLocal.expirationDate"
      data-testid="card-form-expiry"
      :mask="{
        date: true,
        datePattern: ['m', 'y'],
      }"
      :rules="[
        (v) => !!v || 'Expiration Date field is required',
        (v) => /^\d{4}$/.test(v) || 'Expiration Date must be in MM/YY format',
      ]"
      class="mb-4"
      label="Expiration Date"
      input-aria-label="Expiration Date"
    />

    <div class="flex justify-end gap-3">
      <VaButton color="secondary" preset="secondary" data-testid="card-form-cancel" @click="emits('cancel')"
        >Cancel</VaButton
      >
      <VaButton data-testid="card-form-save" @click="submit">{{ submitText }}</VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { useForm } from 'vuestic-ui'
import { PaymentCard, PaymentSystemType } from '../../types'
import { watch, ref } from 'vue'

const { validate } = useForm('form')
const emits = defineEmits(['save', 'cancel'])

const props = defineProps<{
  paymentCard: PaymentCard
  submitText: string
}>()

const paymentSystemTypeOptions = Object.values(PaymentSystemType)
const paymentCardLocal = ref({ ...props.paymentCard })

watch(
  () => props.paymentCard,
  (value) => {
    paymentCardLocal.value = { ...value }
  },
  { deep: true },
)

const submit = () => {
  if (validate()) {
    emits('save', {
      ...paymentCardLocal.value,
      cardNumberMasked: paymentCardLocal.value.cardNumberMasked.replace(/\d{4}(.*)/g, '****$1'),
    })
  }
}
</script>
