<template>
  <div class="w-full">
    <div class="flex justify-end mb-0" data-testid="rb-pagination">
      <el-pagination background layout="prev, next" :total="30" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'Pagination',
})
</script>
