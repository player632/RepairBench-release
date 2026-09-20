import { defineComponent, ref } from "vue";
import TsxCard from "./card";
import "./card.scss";

const TsxExample = defineComponent({
  setup() {
    const content = "Tsx 卡片组件";

    const list = [
      { img: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" },
      { img: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" },
      { img: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" },
      { img: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" },
    ];

    const inputValue = ref("");

    function onChange(index: number) {
      console.log("图片索引 >>", index);
    }

    return () => (
      <div class="tsx-example">
        <h2 class="the-title is-line mb-[20px]">{content}</h2>
        <div class="tsx-center">
          <input class="the-input" type="text" v-model={inputValue.value} placeholder="请输入卡片标题" maxlength="17" />
        </div>
        <TsxCard images={list} title={inputValue.value} change={onChange} />
      </div>
    )
  }
})

export default TsxExample;
