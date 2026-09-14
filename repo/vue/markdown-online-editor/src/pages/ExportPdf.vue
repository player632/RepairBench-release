<!-- @format -->

<template>
  <div class="export-page" data-testid="rb-export-pdf-page">
    <div class="button-group">
      <el-button round data-testid="rb-export-pdf-back" @click="onBackToMainPage">
        返回主页
      </el-button>
      <el-button
        round
        data-testid="rb-export-pdf-btn"
        @click="onExportBtnClick"
        type="primary"
        :disabled="exporting"
      >
        {{ exporting ? '正在导出...' : '生成导出' }}
      </el-button>
    </div>
    <PreviewVditor :pdata="pdata" />
  </div>
</template>

<script>
import html2pdf from 'html2pdf.js'
import PreviewVditor from '@components/PreviewVditor'
import { getExportFileName } from '@helper/utils'
import { getActiveDocId, getDocContent } from '@helper/storage'
import { trackEvent } from '@helper/analytics'

export default {
  name: 'export-pdf',

  data() {
    return {
      isLoading: true,
      pdata: getDocContent(getActiveDocId()) || '',
      exporting: false,
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
    window.__rb.exportPdf = {
      vm,
      pdata() {
        return String(vm.pdata || '')
      },
      exporting() {
        return vm.exporting === true
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

  methods: {
    exportAndDownloadPdf(element, filename) {
      const scale = window.devicePixelRatio
      const opt = {
        margin: 1,
        filename: filename,
        html2canvas: {
          scale,
          // 只捕获可见区域
          useCORS: true,
          logging: false,
          // 确保所有内容都被渲染
          scrollY: 0,
          scrollX: 0,
          // 排除 vditor-preview__action 元素
          ignoreElements: (element) => {
            return element.classList.contains('vditor-preview__action')
          },
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait',
        },
      }
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          this.isLoading = false
          this.exporting = false
        })
        .catch((error) => {
          console.error('PDF导出失败:', error)
          this.isLoading = false
          this.exporting = false
          this.$message.error('PDF导出失败，请重试')
        })
    },
    /* ---------------------Callback Event--------------------- */
    onBackToMainPage() {
      this.$router.push('/')
    },
    onExportBtnClick() {
      this.isLoading = true
      this.exporting = true
      const visibleElement = document.querySelector('#khaleesi .vditor-preview')
      const filename = getExportFileName()
      this.exportAndDownloadPdf(visibleElement || document.querySelector('#khaleesi'), filename)
      trackEvent('export_pdf_submit', 'export', filename)
    },
  },
}
</script>
