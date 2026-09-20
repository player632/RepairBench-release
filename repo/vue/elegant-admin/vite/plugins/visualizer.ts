import { visualizer } from 'rollup-plugin-visualizer'

// 依赖分析插件
export default function createVisualizer() {
  return visualizer({
    emitFile: true,
    filename: 'stats.html', // 分析图生成的文件名
    open: false, // RepairBench adaptation: 打包结束不再自动拉起浏览器（无人值守验证下会挂住构建）
  })
}
