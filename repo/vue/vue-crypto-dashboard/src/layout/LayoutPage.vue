<template>
    <div class="layout-container">
        <header class="page-header bg-primary">
            <button class="back-btn" data-testid="back-btn" v-if="currentPage === 'infoview'" @click="$router.push({ path: '/' })">
                <i class="fa fa-angle-left fa-2x"></i>
            </button>
            <span class="page-title" data-testid="page-title">VUE CRYPTO DASHBOARD</span>
        </header>
        <div class="page-container">
            <transition name="fade" mode="out-in">
                <keep-alive include="dashboard,info-view">
                    <router-view/>
                </keep-alive>
            </transition>
        </div>
    </div>
</template>
<script>
  export default {
    name: 'LayoutPage',
    data() {
      return {
        currentPage: 'dashboard'
      }
    },
  }
</script>