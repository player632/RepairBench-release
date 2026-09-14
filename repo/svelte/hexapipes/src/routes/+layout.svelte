<script>
	import { onMount } from 'svelte';
	import Header from '$lib/header/Header.svelte';
	import Footer from '$lib/footer/Footer.svelte';
	import { installRbProbe } from '$lib/rb-probe';
	import './app.css';

	// Repair-bench instrumentation: install the read-only verification bridge.
	// Module scope so the bridge exists before the first checkpoint can read it;
	// installRbProbe() is a no-op when `window` is absent (SSR / prerender) and is
	// idempotent, so the onMount call is only a belt-and-braces second chance.
	installRbProbe();
	onMount(installRbProbe);
</script>

<div class="container">
	<Header />
</div>

<main>
	<slot />
</main>

<div class="container">
	<Footer />
</div>
