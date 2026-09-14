<script setup>
import { computed, ref, onMounted } from 'vue'
import { useMainStore } from '@/stores/main'
import {
  mdiAccountMultiple,
  mdiCartOutline,
  mdiChartTimelineVariant,
  mdiMonitorCellphone,
  mdiReload,
  mdiGithub,
  mdiChartPie,
} from '@mdi/js'
import * as chartConfig from '@/components/Charts/chart.config.js'
import LineChart from '@/components/Charts/LineChart.vue'
import SectionMain from '@/components/SectionMain.vue'
import CardBoxWidget from '@/components/CardBoxWidget.vue'
import CardBox from '@/components/CardBox.vue'
import TableSampleClients from '@/components/TableSampleClients.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import BaseButton from '@/components/BaseButton.vue'
import CardBoxTransaction from '@/components/CardBoxTransaction.vue'
import CardBoxClient from '@/components/CardBoxClient.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import SectionBannerStarOnGitHub from '@/components/SectionBannerStarOnGitHub.vue'

const chartData = ref(null)

const fillChartData = () => {
  chartData.value = chartConfig.sampleChartData()
}

onMounted(() => {
  fillChartData()
})

const mainStore = useMainStore()

// INSTRUMENTATION (repair-bench, read-only): dashboard-level scalars - the animated widget
// counters as rendered TEXT, the solid-button colour classes, and the card/avatar counts.
// Getters only, fail-close, no state writes and no listener registered here.
window.__rb = window.__rb || {}
window.__rb.home = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  const widgetText = (slug) =>
    safe(() => {
      var el = document.querySelector('[data-testid="rb-widget-' + slug + '"] [data-testid="rb-number-dynamic"]')
      return el ? String(el.textContent == null ? '' : el.textContent).trim() : null
    })
  const cls = (sel) =>
    safe(() => {
      var el = document.querySelector(sel)
      return el ? String(el.className) : null
    })
  return {
    hash: () => safe(() => location.hash),
    clientsText: () => widgetText('clients'),
    salesText: () => widgetText('sales'),
    performanceText: () => widgetText('performance'),
    widgetCount: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-widget-\"]").length),
    clientsNumber: () => safe(() => ((window.__rb.widgets || {})['clients'] || {}).number()),
    salesNumber: () => safe(() => ((window.__rb.widgets || {})['sales'] || {}).number()),
    performanceNumber: () => safe(() => ((window.__rb.widgets || {})['performance'] || {}).number()),
    starClass: () => cls('[data-testid="rb-star-home"]'),
    starHref: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-star-home\"]"); if (!el) { return null } var v = el.getAttribute("href"); return v == null ? '' : String(v) }),
    starTarget: () => safe(() => { var el = document.querySelector("[data-testid=\"rb-star-home\"]"); if (!el) { return null } var v = el.getAttribute("target"); return v == null ? '' : String(v) }),
    starTag: () => safe(() => { var el = document.querySelector('[data-testid="rb-star-home"]'); return el ? String(el.tagName).toLowerCase() : null }),
    reloadPresent: () => safe(() => !!document.querySelector('[data-testid="rb-chart-reload"]')),
    clientCards: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-client-card-\"]").length),
    transactionCards: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-transaction-card-\"]").length),
    avatars: () => safe(() => document.querySelectorAll("[data-testid=\"rb-avatar\"]").length),
    clientBarCount: () => safe(() => clientBarItems.value.length),
    transactionBarCount: () => safe(() => transactionBarItems.value.length),
    chartDataPresent: () => safe(() => !!chartData.value),
  }
})()

const clientBarItems = computed(() => mainStore.clients.slice(0, 4))

const transactionBarItems = computed(() => mainStore.history)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiChartTimelineVariant" title="Overview" main>
        <BaseButton
          data-testid="rb-star-home"
          href="https://github.com/justboil/admin-one-vue-tailwind"
          target="_blank"
          :icon="mdiGithub"
          label="Star on GitHub"
          color="contrast"
          rounded-full
          small
        />
      </SectionTitleLineWithButton>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CardBoxWidget
          trend="12%"
          trend-type="up"
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="512"
          label="Clients"
        />
        <CardBoxWidget
          trend="12%"
          trend-type="down"
          color="text-blue-500"
          :icon="mdiCartOutline"
          :number="7770"
          prefix="$"
          label="Sales"
        />
        <CardBoxWidget
          trend="Overflow"
          trend-type="alert"
          color="text-red-500"
          :icon="mdiChartTimelineVariant"
          :number="256"
          suffix="%"
          label="Performance"
        />
      </div>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="flex flex-col justify-between" data-testid="rb-transaction-list">
          <CardBoxTransaction
            v-for="(transaction, index) in transactionBarItems"
            :key="index"
            :amount="transaction.amount"
            :date="transaction.date"
            :business="transaction.business"
            :type="transaction.type"
            :name="transaction.name"
            :account="transaction.account"
          />
        </div>
        <div class="flex flex-col justify-between" data-testid="rb-client-list">
          <CardBoxClient
            v-for="client in clientBarItems"
            :key="client.id"
            :name="client.name"
            :login="client.login"
            :date="client.created"
            :progress="client.progress"
          />
        </div>
      </div>

      <SectionBannerStarOnGitHub class="mt-6 mb-6" />

      <SectionTitleLineWithButton :icon="mdiChartPie" title="Trends overview">
        <BaseButton data-testid="rb-chart-reload" :icon="mdiReload" color="whiteDark" @click="fillChartData" />
      </SectionTitleLineWithButton>

      <CardBox class="mb-6">
        <div v-if="chartData">
          <line-chart :data="chartData" class="h-96" />
        </div>
      </CardBox>

      <SectionTitleLineWithButton :icon="mdiAccountMultiple" title="Clients" />

      <NotificationBar color="info" :icon="mdiMonitorCellphone">
        <b>Responsive table.</b> Collapses on mobile
      </NotificationBar>

      <CardBox has-table>
        <TableSampleClients />
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
