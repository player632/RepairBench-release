<template>
  <div>
    <span class="options-label">{{ $t('settings.item-size-label') }}</span>
    <div class="display-options">
      <IconSmall
        @click="updateIconSize('small')"
        data-testid="icon-size-small"
        v-tooltip="tooltip($t('settings.item-size-small'))"
        :class="`layout-icon ${iconSize === 'small' ? 'selected' : ''}`"
        tabindex="-2"
      />
      <IconMedium
        @click="updateIconSize('medium')"
        data-testid="icon-size-medium"
        v-tooltip="tooltip($t('settings.item-size-medium'))"
        :class="`layout-icon ${iconSize === 'medium' ? 'selected' : ''}`"
        tabindex="-2"
      />
      <IconLarge
        @click="updateIconSize('large')"
        data-testid="icon-size-large"
        v-tooltip="tooltip($t('settings.item-size-large'))"
        :class="`layout-icon ${iconSize === 'large' ? 'selected' : ''}`"
        tabindex="-2"
      />
    </div>
  </div>
</template>

<script>
import StoreKeys from '@/utils/StoreMutations';
import IconSmall from '@/assets/interface-icons/icon-size-small.svg';
import IconMedium from '@/assets/interface-icons/icon-size-medium.svg';
import IconLarge from '@/assets/interface-icons/icon-size-large.svg';

export default {
  name: 'ItemSizeSelector',
  computed: {
    iconSize() {
      return this.$store.getters.iconSize;
    },
  },
  components: {
    IconSmall,
    IconMedium,
    IconLarge,
  },
  methods: {
    updateIconSize(iconSize) {
      this.$store.commit(StoreKeys.SET_ITEM_SIZE, iconSize);
    },
    tooltip(content) {
      return { content };
    },
  },
};
</script>

