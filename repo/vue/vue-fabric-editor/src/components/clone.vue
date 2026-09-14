<template>
  <Tooltip v-if="isOne" :content="$t('quick.copy')">
    <Button long @click="clone" icon="ios-copy" type="text" data-testid="wlb-clone"></Button>
  </Tooltip>
</template>

<script setup name="Clone">
import useSelect from '@/hooks/select';
import { debounce } from 'lodash-es';

const { canvasEditor, isOne } = useSelect();
const clone = () => {
  canvasEditor.clone();
};
</script>
