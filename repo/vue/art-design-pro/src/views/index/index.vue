<!-- 布局容器 -->
<template>
  <div class="app-layout" data-testid="layout-shell">
    <aside id="app-sidebar">
      <ArtSidebarMenu />
    </aside>

    <main id="app-main">
      <div id="app-header" data-testid="app-header-bar">
        <ArtHeaderBar />
      </div>
      <div id="app-content" data-testid="app-content">
        <ArtPageContent />
      </div>
    </main>

    <div id="app-global">
      <ArtGlobalComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AppLayout' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
