<script>
	import Dock from '../Dock/Dock.svelte';
	import TopBar from '../TopBar/TopBar.svelte';
	import Wallpaper from '../apps/WallpaperApp/Wallpaper.svelte';
	import BootupScreen from './BootupScreen.svelte';
	import ContextMenu from './ContextMenu.svelte';
	import { apps } from '🍎/state/apps.svelte.ts';
	import { is_dock_hidden } from '🍎/state/dock.svelte.ts';
	import { menubar_state } from '🍎/state/menubar.svelte.ts';
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import SystemUpdate from './SystemUpdate.svelte';
	import WindowsArea from './Window/WindowsArea.svelte';

	const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

	if (!isMac) {
		Promise.all([
			import('@fontsource/inter/latin-ext-300.css'),
			import('@fontsource/inter/latin-ext-400.css'),
			import('@fontsource/inter/latin-ext-500.css'),
			import('@fontsource/inter/latin-ext-600.css'),
		]);
	}
	/** @type {HTMLElement} */
	let mainEl;
</script>

<div bind:this={mainEl} class="container">
	<main>
		<TopBar />
		<WindowsArea />
		<Dock />
	</main>

	<Wallpaper />
	<BootupScreen />
	<SystemUpdate />

	<ContextMenu target_element={mainEl} />

	<div data-testid="wlb-probes" aria-hidden="true" style="position:absolute;left:-9999px;top:0;pointer-events:none;">
		<span data-testid="probe-apps-active">{apps.active}</span>
		<span data-testid="probe-apps-fullscreen-calendar">{String(apps.fullscreen.calendar)}</span>
		<span data-testid="probe-dock-hidden">{String(is_dock_hidden.value)}</span>
		<span data-testid="probe-wallpaper-id">{preferences.wallpaper.id}</span>
		<span data-testid="probe-scheme">{preferences.theme.scheme}</span>
		<span data-testid="probe-primary">{preferences.theme.primaryColor}</span>
		<span data-testid="probe-menu-active">{menubar_state.active}</span>
	</div>
</div>

<style>
	.container {
		height: 100%;
		width: 100%;
	}

	main {
		height: 100%;
		width: 100%;

		display: grid;
		grid-template-rows: auto 1fr auto;
	}
</style>
