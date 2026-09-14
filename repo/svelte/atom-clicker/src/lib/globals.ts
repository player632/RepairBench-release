import {SKILL_UPGRADES} from '$data/skillTree';
import {gameManager} from '$helpers/GameManager.svelte';
import {ACHIEVEMENTS} from '$data/achievements';
import {BUILDINGS} from '$data/buildings';
import {UPGRADES} from '$data/upgrades';
import {currenciesManager} from '$helpers/CurrenciesManager.svelte';
import {quarksManager} from '$helpers/QuarksManager.svelte';
import {realmManager} from '$helpers/RealmManager.svelte';
import {SAVE_KEY} from '$helpers/saves';
import {formatNumber} from '$lib/utils';
import {supabaseAuth} from '$stores/supabaseAuth.svelte';
import {toastStore} from '$stores/toasts.svelte';
import {ui} from '$stores/ui.svelte';

export function setGlobals() {
	window.ACHIEVEMENTS = ACHIEVEMENTS;
	window.BUILDINGS = BUILDINGS;
	window.SKILL_UPGRADES = SKILL_UPGRADES;
	window.UPGRADES = UPGRADES;
	if (import.meta.env.DEV) window.gameManager = gameManager;
	window.formatNumber = formatNumber;
	// Repair-Bench instrumentation: stable probe surface for checkpoint assertions.
	(window as any).__rb = {
		gameManager,
		currenciesManager,
		realmManager,
		quarksManager,
		supabaseAuth,
		ui,
		toastStore,
		SAVE_KEY,
	};
}
