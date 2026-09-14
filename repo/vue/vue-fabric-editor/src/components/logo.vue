<!--
 * @Description: 离线静态 logo（原远程站点信息拉取已移除）
-->

<template>
  <div class="logo">
    <span class="logo-text">快图设计</span>
  </div>
</template>

<script setup name="Logo">
// 静态本地内容，无网络请求
</script>
<style scoped lang="less">
.logo {
  width: 117px;
  height: 44px;
  display: inline-block;
  margin-right: 10px;
  margin-left: 2px;
  .logo-text {
    display: flex;
    height: 100%;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
  }
}
</style>
