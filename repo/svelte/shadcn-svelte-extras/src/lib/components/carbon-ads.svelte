<!-- Thanks Hunter! https://github.com/huntabyte/shadcn-svelte/blob/cb5d1d3b05c721593db07fa1974110038d44c1b0/docs/src/lib/components/carbon.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { dev, browser } from '$app/environment';

	// RepairBench offline adaptation (environment/adaptation.patch): the Carbon CDN script is an
	// external face, so the element this component builds at :29-37 keeps its exact shape but
	// resolves same-origin. static/vendor/inert-carbon.js is a no-op. See meta.external_face and
	// the egress == 0 guards P17 / P18.
	const src = '/vendor/inert-carbon.js';
	const localId = $props.id();

	let container: HTMLElement | null = null;

	onMount(() => {
		if (!dev) {
			refreshCarbonAds();

			return () => {
				const scriptNode = container?.querySelector(`[data-id="${localId}"]`);
				const carbonNode = container?.querySelector(`#carbonads`);
				scriptNode?.remove();
				carbonNode?.remove();
			};
		}
	});

	beforeNavigate(() => refreshCarbonAds());

	function createCarbonScript() {
		const script = document.createElement('script');
		script.async = true;
		script.id = '_carbonads_js';
		script.src = src;
		script.type = 'text/javascript';
		script.dataset.id = localId;
		return script;
	}

	function refreshCarbonAds() {
		if (!dev) {
			if (!browser) return;

			const scriptNode = container?.querySelector("[data-id='_carbonads_js']");
			const carbonAdsNode = container?.querySelector('#carbonads');

			carbonAdsNode?.remove();
			scriptNode?.remove();

			const script = createCarbonScript();
			container = document.getElementById(localId);
			if (container) {
				container.appendChild(script);
			}
		}
	}
</script>

<div id={localId} class="w-full pt-4"></div>
