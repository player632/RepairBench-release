<script setup>
import { computed } from 'vue'
import { mdiCashMinus, mdiCashPlus, mdiReceipt, mdiCreditCardOutline } from '@mdi/js'
import CardBox from '@/components/CardBox.vue'
import BaseLevel from '@/components/BaseLevel.vue'
import PillTag from '@/components/PillTag.vue'
import IconRounded from '@/components/IconRounded.vue'

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  business: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  account: {
    type: String,
    required: true,
  },
})

const icon = computed(() => {
  if (props.type === 'withdrawal') {
    return {
      icon: mdiCashMinus,
      type: 'danger',
    }
  } else if (props.type === 'deposit') {
    return {
      icon: mdiCashPlus,
      type: 'success',
    }
  } else if (props.type === 'invoice') {
    return {
      icon: mdiReceipt,
      type: 'warning',
    }
  }

  return {
    icon: mdiCreditCardOutline,
    type: 'info',
  }
})

// INSTRUMENTATION (repair-bench, read-only): transaction registry keyed by the account number, so
// the type->icon/colour mapping is assertable as a scalar.
const rbSlug = computed(() => String(props.account || 'transaction').replace(/[^a-z0-9]+/g, '-'))
const rbTestId = computed(() => 'rb-transaction-card-' + rbSlug.value)
window.__rb = window.__rb || {}
window.__rb.transactions = window.__rb.transactions || {}
window.__rb.transactions[rbSlug.value] = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    slug: () => rbSlug.value,
    account: () => safe(() => props.account ?? null),
    amount: () => safe(() => props.amount ?? null),
    date: () => safe(() => props.date ?? null),
    business: () => safe(() => props.business ?? null),
    name: () => safe(() => props.name ?? null),
    type: () => safe(() => props.type ?? null),
    iconKind: () => safe(() => icon.value.type),
    iconPath: () => safe(() => (icon.value.icon ? 'path' : 'none')),
  }
})()
</script>

<template>
  <CardBox class="mb-6 last:mb-0" :data-testid="rbTestId">
    <BaseLevel>
      <BaseLevel type="justify-start">
        <IconRounded data-testid="rb-transaction-icon" :icon="icon.icon" :color="icon.type" class="md:mr-6" />
        <div class="space-y-1 text-center md:mr-6 md:text-left">
          <h4 class="text-xl">${{ amount }}</h4>
          <p class="text-gray-500 dark:text-slate-400">
            <b>{{ date }}</b> via {{ business }}
          </p>
        </div>
      </BaseLevel>
      <div class="space-y-2 text-center md:text-right">
        <p class="text-sm text-gray-500">
          {{ name }}
        </p>
        <div>
          <PillTag data-testid="rb-transaction-pill" :color="icon.type" :label="type" small />
        </div>
      </div>
    </BaseLevel>
  </CardBox>
</template>
