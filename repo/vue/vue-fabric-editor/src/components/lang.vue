<!--
 * @Descripttion:
 * @version:
 * @Author: June
 * @Date: 2023-05-20 09:18:28
 * @LastEditors: 秦少卫
 * @LastEditTime: 2023-07-29 22:24:03
-->
<template>
  <Dropdown placement="bottom-end" @on-click="setLang">
    <Button type="text" data-testid="wlb-lang">
      {{ lang }}
      <Icon type="ios-arrow-down"></Icon>
    </Button>
    <template #list>
      <DropdownMenu>
        <DropdownItem
          v-for="lang in langList"
          :key="lang.langType"
          :name="lang.langType"
          :data-testid="`wlb-lang-${lang.langType}`"
        >
          {{ lang.langName }}
        </DropdownItem>
      </DropdownMenu>
    </template>
  </Dropdown>
</template>

<script setup name="saveBar">

import { useI18n } from 'vue-i18n';
const { locale } = useI18n();

const LANGMAP = {
  zh: '中文',
  en: 'En',
};

let langList = reactive(
  Object.keys(LANGMAP).map((key) => ({ langType: key, langName: LANGMAP[key] }))
);

const lang = computed(() => {
  return LANGMAP[locale.value];
});

// 设置语言
const setLang = (type) => {
  locale.value = type;
};
</script>

<style scoped lang="less"></style>
