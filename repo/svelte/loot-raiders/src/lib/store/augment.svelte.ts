import { getDef } from '$lib/config/items';
import { getRarityStyleTooltip } from '$lib/config/rarity';
import { getAugmentUpgrade, getAugmentLevel, formatAugmentBonus } from '$lib/config/augments';
import type { AugmentUpgrade } from '$lib/config/augments';
import type { Inventory } from './inventory.svelte';
import type { Notifications } from './notifications.svelte';

export class Augment {
	private inventory: Inventory;
	private notifications: Notifications;

	// Bumped on every applied auto-upgrade so the UI can play a one-shot flash.
	upgradePulse = $state(0);

	constructor(inventory: Inventory, notifications: Notifications) {
		this.inventory = inventory;
		this.notifications = notifications;
	}

	info = $derived.by(() => {
		const augment = this.inventory.augmentItem;
		if (!augment) return null;

		const def = getDef(augment.defId);
		const style = getRarityStyleTooltip(def.rarity);
		const level = getAugmentLevel(augment.defId);

		const upgradeAugment = getAugmentUpgrade(augment.defId);

		if (!upgradeAugment) {
			return { def, style, level, isMaxLevel: true as const };
		}

		const nextDef = getDef(upgradeAugment.nextDefId);
		const nextStyle = getRarityStyleTooltip(nextDef.rarity);
		const costs = upgradeAugment.materials.map((m) => {
			const have = this.inventory.countAvailable(m.defId);
			return { def: getDef(m.defId), defId: m.defId, need: m.count, have, ok: have >= m.count };
		});
		const canAfford = costs.every((c) => c.ok);
		const futureBackpackSlots =
			this.inventory.getStorageSize('backpack') + upgradeAugment.bonusSlots;

		return {
			def,
			style,
			level,
			isMaxLevel: false as const,
			upgradeAugment,
			nextDef,
			nextStyle,
			costs,
			canAfford,
			futureBackpackSlots
		};
	});

	private affordable(upgrade: AugmentUpgrade): boolean {
		return upgrade.materials.every((m) => this.inventory.countAvailable(m.defId) >= m.count);
	}

	private applyUpgrade(upgrade: AugmentUpgrade): void {
		for (const m of upgrade.materials) this.inventory.consumeItems(m.defId, m.count);
		this.inventory.removeItem({ type: 'slot', storageId: 'augment', index: 0 });
		this.inventory.fillStorage('augment', [this.inventory.createItem(upgrade.nextDefId)]);
		this.notifications.push({
			kind: 'augment',
			label: 'Augment upgraded',
			message: formatAugmentBonus(upgrade)
		});
		this.upgradePulse++;
	}

	autoUpgrade(): boolean {
		let upgraded = false;
		while (true) {
			const augment = this.inventory.augmentItem;
			if (!augment) break;
			const upgrade = getAugmentUpgrade(augment.defId);
			if (!upgrade || !this.affordable(upgrade)) break;
			this.applyUpgrade(upgrade);
			upgraded = true;
		}
		return upgraded;
	}
}
