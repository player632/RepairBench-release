// src/rbIconStub.ts - offline stand-in for `@iconify/vue`, installed by environment/adaptation.patch
// through the resolve.alias entry added to vite.config.ts.
//
// Why: the real `@iconify/vue` Icon resolves its icon data from https://api.iconify.design at RUNTIME,
// which is the only external host the driven face can reach. task.toml [environment] declares
// allow_internet=false, so the delivered face must have zero external runtime faces (RECON measured the
// other 22 http(s)-bearing files as documentation links / XML-schema namespaces, not requests).
//
// Scope, measured: 9 files under src/ do `import { Icon } from '@iconify/vue'` and nothing else is
// imported from that package anywhere in the tree, so exporting `Icon` (named + default) is sufficient.
//
// Type-check scope, measured: tsconfig.app.json "paths" maps "@/*" -> "./src/*" and has NO entry for
// "@iconify/vue", and the alias added to vite.config.ts is a BUNDLER alias only. `vue-tsc -b` therefore
// still resolves `@iconify/vue` to the real package's own .d.ts, i.e. every existing <Icon> usage keeps
// being checked against the shipped types (the seed builds green unchanged). The only new file the type
// checker sees is this one. That is deliberate: this seed's build is `vue-tsc -b && vite build`, so a
// type-level regression would surface as a BUILD failure and burn the whole leg as a VERIFIER_ERROR
//
// into a build red).
//
// The stub renders an inert <span data-rb-icon="<name>"> : no layout, no async work, no network, and no
// text content, so it cannot perturb any text-based checkpoint reading.
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const Icon = defineComponent({
  name: 'RbIconStub',
  props: {
    // `type: null` semantics: accept anything the real component accepts. Every measured call site
    // passes a string, but `PropType<unknown>` keeps the stub honest if a call site passes an icon object.
    icon: { type: [String, Object, Function] as PropType<unknown>, default: '' },
  },
  render() {
    const value = this.icon
    return h('span', { 'data-rb-icon': typeof value === 'string' ? value : '' })
  },
})

export default Icon
