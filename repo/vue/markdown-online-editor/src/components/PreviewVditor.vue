<template>
  <div
    class="preview-vditor"
    data-testid="rb-preview"
    v-loading="isLoading"
    element-loading-text="正在努力，请稍候..."
  >
    <div v-show="!isLoading" id="khaleesi" class="vditor-preview" />
  </div>
</template>

<script>
import Vditor from 'vditor'
import 'vditor/src/assets/less/index.less'
import { updateHtmlStyle, hideVditorTextarea } from '@helper/utils'

export default {
  name: 'PreviewVditor',

  data() {
    return {
      isLoading: true,
    }
  },

  props: {
    pdata: {
      type: String,
      required: true,
      default: '',
    },
  },

  created() {
    updateHtmlStyle()
    this.setDefaultText()
  },

  components: {},

  mounted() {
    this.initVditor()
    hideVditorTextarea()
    // RepairBench instrumentation probe - strictly additive, see src/pages/Main.vue.
    const vm = this
    window.__rb = window.__rb || {}
    window.__rb.preview = {
      vm,
      ready() {
        try {
          return (
            vm.isLoading === false &&
            !!vm.vditor &&
            !!document.querySelector('#khaleesi .vditor-toolbar')
          )
        } catch (e) {
          return false
        }
      },
      resetText() {
        try {
          const el = document.querySelector('#khaleesi .vditor-preview .vditor-reset')
          return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''
        } catch (e) {
          return ''
        }
      },
      resetHtmlLength() {
        try {
          const el = document.querySelector('#khaleesi .vditor-preview .vditor-reset')
          return el ? String(el.innerHTML || '').length : -1
        } catch (e) {
          return -1
        }
      },
    }
  },

  methods: {
    initVditor() {
      const options = {
        // OFFLINE ADAPTATION (RepairBench): same reason and same local copy as src/pages/Main.vue -
        // vditor's i18n and lute bundles are fetched inside addScript(...).then(...) from its
        // default unpkg cdn, so without this the preview pane on every /export/* page and on
        // /about-arya stays an empty spinner offline. See commands/vendor-offline-assets.js.
        cdn: '/vditor',
        width: '61.8%',
        mode: 'sv',
        preview: {
          delay: 1000,
          show: true,
        },
      }
      this.vditor = new Vditor('khaleesi', options)
      this.$nextTick(() => {
        this.isLoading = false
      })
    },

    setDefaultText() {
      localStorage.setItem('khaleesi', this.pdata)
    },
  },
}
</script>

<style lang="less">
@import './../assets/styles/style.less';

// Chrome only: page surface + card shell. Markdown content (.vditor-reset) left as-is.
.preview-vditor {
  width: 100%;
  height: 100%;
  min-height: 100%;
  background-color: transparent;
  .flex-box-center(column);
  padding: 12px 16px 48px;

  #khaleesi {
    max-width: 960px;
    min-width: 50vw;
    height: 100%;
    min-height: 70vh;
    margin: 0 auto;
    text-align: left;
    padding: 0;

    .vditor-toolbar {
      display: none;
    }

    .vditor-content {
      .vditor-sv {
        display: none !important;
      }
    }

    .vditor-preview {
      padding: 0 20px;
      background: @paper;
      border-radius: @radius-xl;
      border: 1px solid @border-hairline;
      box-shadow: @shadow-sm;

      .vditor-preview__action {
        display: none;
      }

      .vditor-reset {
        h1 {
          text-align: center;
        }
      }
    }
  }

  .vditor {
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    --toolbar-icon-hover-color: @text-primary;
  }
}

@media (max-width: 768px) {
  .preview-vditor {
    padding: 32px;

    #khaleesi {
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .vditor-preview {
      border-radius: @radius-md;
    }

    .vditor-reset {
      table {
        display: inline-block;
        overflow-x: auto;
      }
    }
  }
}
</style>
