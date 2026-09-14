/** @format */

export default {
  updatePageMeta(to, from, next) {
    if (to.meta.title) {
      document.title = window.$appTitle
    }
    next()
  }
}
