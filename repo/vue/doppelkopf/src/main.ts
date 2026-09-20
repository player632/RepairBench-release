import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import router from "./router";
import "@/assets/css/app.css";
import { Config } from "@/models/config";
import { languages, defaultLocale } from "./i18n";

const messages = Object.assign(languages);

const i18n = createI18n({
  legacy: false,
  locale: "en", // [repair-bench adaptation] pinned for determinism; was navigator.language.split("-")[0] || defaultLocale
  fallbackLocale: "en",
  messages,
});

const app = createApp(App);

app.use(i18n).use(router).mount("#app");
