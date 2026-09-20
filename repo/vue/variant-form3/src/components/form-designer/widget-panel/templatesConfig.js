// rb-adapt (environment/adaptation.patch): the seed ships 8 cross-origin template thumbnails and
// 8 cross-origin template JSON urls. widget-panel/index.vue:74 renders <img :src="ft.imgUrl"> for all
// 4 templates inside a NON-lazy el-tab-pane (showFormTemplates() defaults to true), so every one of
// them is requested on EVERY page load - offline that is 4 hangs per checkpoint, and it is pure
// measurement noise: no checkpoint reads a template thumbnail. Both keys are rewritten to inert
// same-origin/data values; titles, descriptions and the array shape are untouched.
export const formTemplates = [
  {
    title: '单列表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '多列表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '分组表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '标签页表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '主从表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '响应式表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '问卷调查表',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

  {
    title: '固定表格表单',
    imgUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E',  // rb-adapt: 1x1 transparent SVG placeholder, was a cross-origin ksyuncs PNG
    jsonUrl: '/rb-inert/form-samples/template.json',  // rb-adapt: was a cross-origin ksyuncs .txt, fetched only by the 载入模板 button (widget-panel/index.vue:249) which no checkpoint clicks
    description: '表单模板详细说明...'
  },

]
