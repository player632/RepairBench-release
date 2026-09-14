<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  LinearScale,
  CategoryScale,
  Tooltip,
} from 'chart.js'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const root = ref(null)

let chart

Chart.register(LineElement, PointElement, LineController, LinearScale, CategoryScale, Tooltip)

onMounted(() => {
  chart = new Chart(root.value, {
    type: 'line',
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          display: false,
        },
        x: {
          display: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
})

// INSTRUMENTATION (repair-bench, read-only): publishes getters over the live Chart.js instance so
// the canvas-only surface (labels, dataset count, palette channels, point counts) is assertable
// without reading pixels. Registered once per mount; never writes chart or app state.
window.__rb = window.__rb || {}
window.__rb.chart = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    live: () => safe(() => !!chart),
    type: () => safe(() => chart.config.type),
    labelCount: () => safe(() => chart.data.labels.length),
    labels: () => safe(() => chart.data.labels.join(',')),
    firstLabel: () => safe(() => chart.data.labels[0]),
    lastLabel: () => safe(() => chart.data.labels[chart.data.labels.length - 1]),
    datasetCount: () => safe(() => chart.data.datasets.length),
    colors: () => safe(() => chart.data.datasets.map((d) => d.borderColor).join(',')),
    distinctColors: () => safe(() => new Set(chart.data.datasets.map((d) => d.borderColor)).size),
    pointColors: () => safe(() => chart.data.datasets.map((d) => d.pointBackgroundColor).join(',')),
    pointCounts: () => safe(() => chart.data.datasets.map((d) => d.data.length).join(',')),
    allNumeric: () => safe(() => chart.data.datasets.every((d) => d.data.every((v) => typeof v === 'number'))),
    borderWidths: () => safe(() => chart.data.datasets.map((d) => d.borderWidth).join(',')),
    tensions: () => safe(() => chart.data.datasets.map((d) => d.tension).join(',')),
    fill: () => safe(() => chart.data.datasets.map((d) => String(!!d.fill)).join(',')),
    canvasW: () => safe(() => (root.value ? root.value.width : null)),
    canvasH: () => safe(() => (root.value ? root.value.height : null)),
  }
})()

const chartData = computed(() => props.data)

watch(chartData, (data) => {
  if (chart) {
    chart.data = data
    chart.update()
  }
})
</script>

<template>
  <canvas ref="root" data-testid="rb-chart-canvas" />
</template>
