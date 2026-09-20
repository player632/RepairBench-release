<template>
  <transition name="slide-up" appear>
    <div class="map" data-testid="rb-map-host">
      <GoogleMap :api-key="googleApi" class="w-full h-[600px]" :center="center" :zoom="15">
        <Marker :options="markerOptions" />
      </GoogleMap>
    </div>
  </transition>
</template>

<script>
import env from 'core/env'
import { defineComponent, h, ref } from 'vue'
// RB-OFFLINE (adaptation.patch): the upstream view mounts vue3-google-map's <GoogleMap>,
// whose loader injects the maps.googleapis.com script at mount time. The seed never
// supplies VITE_GOOGLE_API_KEY (default.env is not a Vite env file, so env() returns
// undefined), which means the loader would fire a real cross-origin request carrying
// key=undefined. Under allow_internet=false that is both a stall and a leak, so the two
// components are replaced by inert, dependency-free local stubs with the same names, the
// same props and the same default slot. Nothing under test lives on this page.
const GoogleMap = defineComponent({
  name: 'RbOfflineGoogleMap',
  props: { apiKey: String, center: Object, zoom: Number },
  setup(props, ctx) {
    return () =>
      h(
        'div',
        { 'data-rb-offline': 'google-map', 'data-rb-zoom': String(props.zoom) },
        ctx.slots.default ? ctx.slots.default() : [],
      )
  },
})

const Marker = defineComponent({
  name: 'RbOfflineMarker',
  props: { options: Object },
  setup(props) {
    return () =>
      h(
        'span',
        { style: { display: 'contents' }, 'data-rb-offline': 'marker',
          'data-rb-marker-label': String((props.options && props.options.label) || '') },
      )
  },
})

export default defineComponent({
  components: { GoogleMap, Marker },
  setup() {
    const googleApi = ref(env('VITE_GOOGLE_API_KEY'))
    const center = { lat: 10.796993388528781, lng: 106.66491916304027 }
    const markerOptions = { position: center, label: 'LTV', title: 'Công ty TNHH phần mềm LTV' }

    return { center, markerOptions, googleApi }
  },
})
</script>

<style lang="scss" scoped>
.map {
  @apply sm:w-[92%] md:w-[94%] lg:w-[96%] w-[92%] rounded-lg overflow-hidden p-0 mx-auto #{!important};
}
</style>
