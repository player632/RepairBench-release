import { h, defineComponent } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue/dist/offline";

// Iconify Icon在Vue里离线使用（适配：离线环境不走 iconify API，图标全部来自本地注册表）
export default defineComponent({
  name: "IconifyIconOnline",
  components: { IconifyIcon },
  props: {
    icon: {
      type: String,
      default: ""
    }
  },
  render() {
    const attrs = this.$attrs;
    return h(
      IconifyIcon,
      {
        icon: `${this.icon}`,
        "aria-hidden": false,
        style: attrs?.style
          ? Object.assign(attrs.style, { outline: "none" })
          : { outline: "none" },
        ...attrs
      },
      {
        default: () => []
      }
    );
  }
});
