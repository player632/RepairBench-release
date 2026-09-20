// RepairBench measurement probe (instrumentation only - see src/rb-probe.js). Imported FIRST, above every
// application module, so it is evaluated before ./store (below) and before ./permission. That ordering is
// load-bearing: src/store/modules/user.js:13 reads `token: getItem(TOKEN) || ""` at store-creation time and
// src/permission.js:25 gates the whole router on `if (store.getters.token)`, so the probe seeds the offline
// session (localStorage token + userInfo) before either runs and the run never needs the seed's captcha
// screen. The probe also installs the cross-origin egress census and the boot/residue/error scalars that
// tests/dsl.json reads. It renders nothing, adds no element, no class, no id and no selector of its own,
// holds no constant or expectation belonging to any defect, and never writes application state.
import "./rb-probe";
import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";

import router from "./router";

// 导入权限控制模块
import "./permission";
import "@/styles/index.scss";

// import axios from '@/utils/axios'
// app.config.globalProperties.$axios = axios // 使用globalProperties挂载

// element
import installElementPlus from "./plugins/element";
// directives
import installDirective from "@/directives";
// filter
import installFilter from "@/filters";

// 自定义表格工具组件
import RightToolbar from "@/components/RightToolbar";
// 分页组件
import Pagination from "@/components/Pagination";
// svg组件
import svgIcon from "@/components/SvgIcon/index.vue";
const app = createApp(App);
installElementPlus(app);
installDirective(app);
installFilter(app);
// 全局组件挂载
app.component("RightToolbar", RightToolbar);
app.component("Pagination", Pagination);
app.component("svg-icon", svgIcon);

app
	.use(store)
	.use(router)
	.mount("#app");