<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import CardBox from '@/components/CardBox.vue'
import OverlayLayer from '@/components/OverlayLayer.vue'
import CardBoxComponentFooter from '@/components/CardBoxComponentFooter.vue'
import CardBoxModalHeader from '@/components/CardBoxModalHeader.vue'
import CardBoxModalBody from '@/components/CardBoxModalBody.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  button: {
    type: String,
    default: 'info',
  },
  buttonLabel: {
    type: String,
    default: 'Done',
  },
  hasCustomLayout: Boolean,
  hasCancel: Boolean,
  isForm: Boolean,
  isProcessing: Boolean,
  modelValue: [String, Number, Boolean],
})

const emit = defineEmits(['update:modelValue', 'cancel', 'confirm'])

const value = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// INSTRUMENTATION (repair-bench, read-only): modal registry keyed by the title slug, so an
// assertion can tell the two modals on one page apart and read the open flag from the component
// itself (the overlay only exists in the DOM while open).
const rbSlug = computed(() => String(props.title || 'modal').toLowerCase().replace(/[^a-z0-9]+/g, '-'))
window.__rb = window.__rb || {}
window.__rb.modals = window.__rb.modals || {}
window.__rb.modals[rbSlug.value] = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    slug: () => rbSlug.value,
    title: () => safe(() => props.title ?? null),
    open: () => safe(() => !!value.value),
    isForm: () => safe(() => !!props.isForm),
    hasCancel: () => safe(() => !!props.hasCancel),
    buttonLabel: () => safe(() => props.buttonLabel ?? null),
    buttonColor: () => safe(() => props.button ?? null),
    isProcessing: () => safe(() => !!props.isProcessing),
  }
})()

const confirmCancel = (mode) => {
  if (mode === 'cancel' || (mode === 'confirm' && props.isForm)) {
    value.value = false
  }

  emit(mode)
}

const confirm = () => confirmCancel('confirm')

const cancel = () => confirmCancel('cancel')

const closeWithEscapeEvent = (e) => {
  if (e.key === 'Escape' && value.value) {
    cancel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', closeWithEscapeEvent)
})

onUnmounted(() => {
  window.removeEventListener('keydown', closeWithEscapeEvent)
})
</script>

<template>
  <OverlayLayer v-if="value" data-testid="rb-modal" @overlay-click="cancel">
    <CardBox
      class="z-50 max-h-[calc(100dvh-(--spacing(40)))] w-11/12 animate-fade-in shadow-lg md:w-3/5 lg:w-2/5 xl:w-4/12"
      is-modal
      has-component-layout
      :is-form="isForm"
      @submit.prevent="confirm"
    >
      <CardBoxModalHeader data-testid="rb-modal-header" :title="title" :has-cancel="hasCancel" @cancel="cancel" />

      <slot v-if="hasCustomLayout" />

      <template v-else>
        <CardBoxModalBody>
          <slot />
        </CardBoxModalBody>

        <CardBoxComponentFooter>
          <BaseButtons>
            <BaseButton
              data-testid="rb-modal-confirm"
              :label="buttonLabel"
              :color="button"
              @click="isForm ? null : confirm()"
              :type="isForm ? 'submit' : 'button'"
              :disabled="isProcessing"
              :class="{ 'opacity-25': isProcessing }"
            />
            <BaseButton v-if="hasCancel" data-testid="rb-modal-cancel" label="Cancel" :color="button" outline @click="cancel" />
          </BaseButtons>
        </CardBoxComponentFooter>
      </template>
    </CardBox>
  </OverlayLayer>
</template>
