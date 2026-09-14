<script setup>
import SectionTitle from '@/components/SectionTitle.vue'
import SectionMain from '@/components/SectionMain.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
</script>

<template>
  <LayoutAuthenticated>
    <SectionTitle first>Mobile & Tablet</SectionTitle>

    <SectionMain>
      <div
        class="overflow-hidden rounded-3xl border-8 border-white shadow-2xl md:mx-auto md:w-10/12"
      >
        <img
          src="/vendor/screenshot-placeholder.svg?view=mobile"
          data-testid="rb-screenshot-mobile"
          class="block"
        />
      </div>
    </SectionMain>

    <SectionTitle>Small laptop 1024px</SectionTitle>

    <SectionMain>
      <div
        class="overflow-hidden rounded-3xl border-8 border-white shadow-2xl md:mx-auto md:w-10/12"
      >
        <img
          src="/vendor/screenshot-placeholder.svg?view=1024"
          data-testid="rb-screenshot-1024"
          class="block"
        />
      </div>
    </SectionMain>

    <SectionMain>
      <div
        class="overflow-hidden rounded-3xl border-8 border-white shadow-2xl md:mx-auto md:w-10/12"
      >
        <img
          src="/vendor/screenshot-placeholder.svg?view=1024-menu-open"
          data-testid="rb-screenshot-1024-menu-open"
          class="block"
        />
      </div>
    </SectionMain>

    <SectionTitle>Laptop & desktop</SectionTitle>

    <SectionMain>
      <div
        class="overflow-hidden rounded-3xl border-8 border-white shadow-2xl md:mx-auto md:w-10/12"
      >
        <img
          src="/vendor/screenshot-placeholder.svg?view=widescreen"
          data-testid="rb-screenshot-widescreen"
          class="block"
        />
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
