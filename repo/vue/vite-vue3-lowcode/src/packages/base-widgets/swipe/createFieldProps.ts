/*
 * @Author: 卜启缘
 * @Date: 2021-06-14 12:24:12
 * @LastEditTime: 2021-06-21 23:04:42
 * @LastEditors: 卜启缘
 * @Description:
 * @FilePath: \vite-vue3-lowcode\src\packages\base-widgets\swipe\createFieldProps.ts
 */
import {
  createEditorInputProp,
  createEditorSwitchProp,
  createEditorCrossSortableProp,
} from '@/visual-editor/visual-editor.props';

export const createFieldProps = () => ({
  images: createEditorCrossSortableProp({
    label: '图片列表',
    labelPosition: 'top',
    defaultValue: [
      // Repair-Bench offline adaptation (D): upstream defaults were two remote
      // img.yzcdn.cn JPEGs that the swipe widget really fetches at runtime. Replaced
      // by on-disk supply added by this patch; the two files carry distinct labels
      // (swipe-1 / swipe-2) so a checkpoint can tell which slide is showing.
      '/rb-offline/swipe-1.svg',
      '/rb-offline/swipe-2.svg',
    ],
  }),
  // width: createEditorInputProp({ label: '滑块宽度，单位为 px', defaultValue: 'auto' }),
  height: createEditorInputProp({ label: '滑块高度，单位为 px', defaultValue: '200' }),
  autoplay: createEditorInputProp({ label: '自动轮播间隔，单位为 ms', defaultValue: '3000' }),
  duration: createEditorInputProp({ label: '动画时长，单位为 ms', defaultValue: '500' }),
  indicatorColor: createEditorInputProp({ label: '指示器颜色', defaultValue: '#1989fa' }),
  initialSwipe: createEditorInputProp({ label: '初始位置索引值', defaultValue: '0' }),
  lazyRender: createEditorSwitchProp({ label: '是否延迟渲染未展示的轮播', defaultValue: false }),
  loop: createEditorSwitchProp({ label: '是否开启循环播放', defaultValue: true }),
  showIndicators: createEditorSwitchProp({ label: '是否显示指示器', defaultValue: true }),
  stopPropagation: createEditorSwitchProp({ label: '是否阻止滑动事件冒泡', defaultValue: true }),
  touchable: createEditorSwitchProp({ label: '是否可以通过手势滑动', defaultValue: true }),
  vertical: createEditorSwitchProp({ label: '是否为纵向滚动', defaultValue: false }),
});
