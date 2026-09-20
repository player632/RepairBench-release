<template>
  <div :class="$style.multiSwitch">
    <ul :class="$style.list">
      <li
        v-for="(option, index) of options"
        :key="option.id"
        :style="{ 'grid-column': index + 1 }"
        :class="$style.item"
      >
        <button
          :data-testid="`${testId}-${option.id}`"
          type="button"
          :class="$style.button"
          @click="modelValue = option.id"
        >
          <component :is="option.icon" :class="$style.icon" />
        </button>
      </li>
    </ul>

    <ul :class="[$style.list, $style.on]">
      <li
        v-for="(option, index) of options"
        :key="option.id"
        :style="{ 'grid-column': index + 1 }"
        :class="$style.item"
      >
        <component :is="option.icon" :class="$style.icon" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { MutliSwitchOption } from '@components/base/multi-switch/MutliSwitch.types.ts';

const modelValue = defineModel<string>();

const props = defineProps<{
  options: MutliSwitchOption[];
  testId?: string;
}>();

const active = computed(() => props.options.findIndex((option) => option.id === modelValue.value));
</script>

<style lang="scss" module>
.multiSwitch {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 100px;
  background-color: var(--c-primary);
}

.list {
  display: flex;
  align-items: center;
  list-style: none outside;
  margin: 0;
  padding: 0 4px;

  &.on {
    position: absolute;
    z-index: 1;
    transition: var(--transition-m) clip-path;
    clip-path: circle(9px at calc(14px + v-bind(active) * 20px) center);
    background: var(--c-primary-hover);

    .icon {
      color: var(--c-primary-text);
    }
  }
}

.item {
  display: flex;
  justify-content: center;
  align-items: center;

  .button {
    all: unset;
    cursor: pointer;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--c-primary-hover);
    border-radius: 50%;
    width: 20px;
    height: 18px;
    padding: 2px;
  }
}
</style>
