<!-- @format -->
<template>
  <div class="export-page" data-testid="rb-export-png-page">
    <div class="button-group">
      <el-button round data-testid="rb-export-png-back" @click="onBackToMainPage">
        返回主页
      </el-button>
      <el-button
        round
        data-testid="rb-export-png-btn"
        @click="onExportBtnClick"
        type="primary"
        :loading="isExporting"
      >
        {{ isExporting ? '正在导出...' : '生成导出' }}
      </el-button>
    </div>
    <PreviewVditor :pdata="pdata" />
  </div>
</template>

<script>
import { generateScreenshot } from '@helper/export'
import PreviewVditor from '@components/PreviewVditor'
import { getExportFileName } from '@helper/utils'
import { getActiveDocId, getDocContent } from '@helper/storage'
import { trackEvent } from '@helper/analytics'

export default {
  name: 'export-image',

  data() {
    return {
      isLoading: true,
      isExporting: false,
      pdata: getDocContent(getActiveDocId()) || '',
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
    window.__rb.exportImage = {
      vm,
      pdata() {
        return String(vm.pdata || '')
      },
      exporting() {
        return vm.isExporting === true
      },
      loading() {
        return vm.isLoading === true
      },
      exportClick() {
        vm.onExportBtnClick()
      },
      back() {
        vm.onBackToMainPage()
      },
    }
  },

  updated() {},

  methods: {
    async exportAndDownloadImg(element, filename) {
      try {
        const canvas = await generateScreenshot(element)
        const isSupportDownload = 'download' in document.createElement('a')
        if (isSupportDownload) {
          const link = document.createElement('a')
          link.download = filename
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
      } catch (error) {
        console.error('导出图片失败:', error)
        this.$message.closeAll()
        this.$message.error('导出图片失败，请检查控制台获取详细错误信息')
      } finally {
        this.isLoading = false
        this.isExporting = false
      }
    },
    /* ---------------------Callback Event--------------------- */
    onBackToMainPage() {
      this.$router.push('/')
    },
    onExportBtnClick() {
      this.isLoading = true
      this.isExporting = true
      const element = document.querySelector('#khaleesi .vditor-preview')
      const filename = getExportFileName()
      this.exportAndDownloadImg(element, filename)
      trackEvent('export_image_submit', 'export', filename)
    },
  },
}
</script>
