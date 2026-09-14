<!-- @format -->

<template>
  <PreviewVditor :pdata="pdata" @callback="handleCallBack" />
</template>

<script>
import PreviewVditor from '@components/PreviewVditor'
import AboutAryaMd from '@config/about'

export default {
  name: 'about-arya',

  data() {
    return {
      isLoading: true,
      pdata: AboutAryaMd,
    }
  },

  created() {},

  components: {
    PreviewVditor,
  },

  mounted() {
    // RepairBench instrumentation probe - strictly additive, see src/pages/Main.vue.
    const vm = this
    window.__rb = window.__rb || {}
    window.__rb.about = {
      vm,
      pdata() {
        return String(vm.pdata || '')
      },
    }
  },

  methods: {
    handleCallBack() {
      this.isLoading = false
    },
  },
}
</script>
