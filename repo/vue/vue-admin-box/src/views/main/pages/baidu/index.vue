<template>
  <!-- RepairBench adaptation A3: the upstream page embeds the external site
       the author's own blog in a full-size iframe (that host is quoted on the
       deleted line only, never on an added one). It is a runtime external
       document load, replaced by a local placeholder of the same size. This
       route (/pages/blog and /pages/jump) is declared checkpoint-forbidden in
       instruction.md, so no assertion depends on the embedded content. -->
  <div class="full-iframe rb-local-placeholder">外部站点嵌入已在离线环境中停用</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  setup() {

  }
})
</script>

<style lang="scss" scoped>
  .full-iframe {
    width: 100%;
    height: calc(100% - 5px);
    overflow: hidden;
  }
</style>