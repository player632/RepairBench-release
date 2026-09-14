<!--
 * @Author: 秦少卫
 * @Date: 2022-09-03 19:16:55
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-05-31 16:58:12
 * @Description: 导入JSON文件
-->

<template>
  <div style="display: inline-block" data-testid="wlb-import-json">
    <Dropdown @on-click="clickHandler">
      <a href="javascript:void(0)">
        {{ $t('importFiles.file') }}
        <Icon type="ios-arrow-down"></Icon>
      </a>
      <template #list>
        <DropdownMenu>
          <DropdownItem name="importFiles">{{ $t('importFiles.importFiles') }}</DropdownItem>
          <DropdownItem name="psd">PSD</DropdownItem>
        </DropdownMenu>
      </template>
    </Dropdown>
  </div>
</template>

<script name="ImportJson" setup>
import useSelect from '@/hooks/select';
import { Spin } from 'view-ui-plus';

const { canvasEditor } = useSelect();

const clickHandler = (type) => {
  const handleMap = {
    // 导入文件
    importFiles: canvasEditor.insert,
    // psd
    psd: () => {
      // Spin.show({
      //   render: (h) => h('div', t('alert.loading_data')),
      // });
      canvasEditor.insertPSD().finally(Spin.hide);
    },
  };
  handleMap[type]?.();
};
</script>
<style scoped lang="less">
h3 {
  margin-bottom: 10px;
}
.divider {
  margin-top: 0;
}
</style>
