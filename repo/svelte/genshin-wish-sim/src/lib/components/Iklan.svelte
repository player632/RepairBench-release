<script>
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { isMobile, isPWA, showAd } from '$lib/store/app-stores';
	import { randomNumber } from '$lib/helpers/gacha/itemdrop-base';

	export let type = '';
	export let head = false;
	export let size = 'wide';

	const show = randomNumber(1, 2) === 1;

	const adSize = {
		square: 6247038092,
		wide: 6827309798
	};

	onMount(() => {
		if (type !== 'banner' || head || (type === 'banner' && !show)) return;
		try {
			// Google Ads
			(window.adsbygoogle = window.adsbygoogle || []).push({});
			// End Google Ads
		} catch (e) {
			console.error(e);
		}
	});

	let addcashLoaded = false;
	const loadAdcash = () => {
		if (addcashLoaded) return;
		addcashLoaded = true;

		const sc = document.createElement('script');
		sc.setAttribute('id', 'aclib');
		sc.setAttribute('type', 'text/javascript');
		sc.src = '//acscdn.com/script/aclib.js';
		document.head.appendChild(sc);
		sc.addEventListener('load', () => window.aclib.runAutoTag({ zoneId: 'v1xd6wvvpe' }));
	};

	const loadHeaderAds = () => {
		loadAdcash();
		// Ezoic
		window.ezstandalone = window.ezstandalone || {};
		window.ezstandalone.cmd = window.ezstandalone.cmd || [];
		window.ezstandalone.cmd.push(function () {
			window.ezstandalone.showAds();
		});
		// End Ezoic
	};

	$: if ($showAd && !dev && head && !type && !($isPWA && $isMobile)) { /* header ads disabled in the offline adaptation */ }
</script>

{#if dev && type === 'banner' && show}
	<div class="row">
		<div class="banner" />
	</div>
{/if}

{#if false}
	<!-- ad slots removed by the offline adaptation (pagead2/gatekeeper/ejoic external scripts) -->
{/if}

<style>
	ins::-webkit-scrollbar,
	.row::-webkit-scrollbar {
		display: none;
	}

	.row {
		width: 100%;
		overflow: auto;
		display: flex;
	}

	ins {
		margin: auto;
		overflow: auto;
		max-width: 100%;
	}

	:global(ins.adsbygoogle[data-ad-status='unfilled']) {
		display: none !important;
	}

	.banner {
		margin: auto;
		width: 100%;
		max-width: 728px;
		height: 280px;
		aspect-ratio: 728/90;
		background-image: linear-gradient(40deg, #00aaff, pink 50%);
		background-size: cover;
	}
</style>
