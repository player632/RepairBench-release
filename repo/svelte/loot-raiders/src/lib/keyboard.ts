import type { Game } from '$lib/store/game.svelte';

export function handleGlobalKeydown(e: KeyboardEvent, game: Game): void {
	const { gameLoop, loot, overlay, audio } = game;

	if (e.key === 'Escape') {
		if (gameLoop.status === 'tutorial') return;
		if (gameLoop.status === 'playing') {
			gameLoop.resume();
		} else if (gameLoop.status === 'paused') {
			gameLoop.pause();
		} else {
			overlay.handleEscape();
		}
		return;
	}

	if (e.key === ' ') {
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (gameLoop.status === 'playing') {
			e.preventDefault();
			loot.next();
		} else if (gameLoop.status === 'idle' && !overlay.leaderboard) {
			e.preventDefault();
			audio.play('click');
			gameLoop.start();
		}
	}
}
