export interface AugmentUpgrade {
	defId: string;
	nextDefId: string;
	materials: { defId: string; count: number }[];
	bonusSlots: number;
}

export const AUGMENT_UPGRADES: AugmentUpgrade[] = [
	{
		defId: 'aug_free_loadout',
		nextDefId: 'aug_looting_mk1',
		materials: [{ defId: 'res_metal_parts', count: 18 }],
		bonusSlots: 2
	},
	{
		defId: 'aug_looting_mk1',
		nextDefId: 'aug_looting_mk2',
		materials: [
			{ defId: 'res_metal_parts', count: 12 },
			{ defId: 'res_plastic_parts', count: 4 }
		],
		bonusSlots: 2
	},
	{
		defId: 'aug_looting_mk2',
		nextDefId: 'aug_looting_mk3_cautious',
		materials: [
			{ defId: 'res_metal_parts', count: 10 },
			{ defId: 'res_plastic_parts', count: 10 }
		],
		bonusSlots: 2
	}
];

export function getAugmentUpgrade(defId: string): AugmentUpgrade | null {
	return AUGMENT_UPGRADES.find((u) => u.defId === defId) ?? null;
}

export function getAugmentLevel(defId: string): number {
	let level = 0;
	for (const u of AUGMENT_UPGRADES) {
		if (u.defId === defId) return level;
		level++;
	}
	return level;
}

export function getAugmentBonusSlots(defId: string): number {
	const level = getAugmentLevel(defId);
	return AUGMENT_UPGRADES.slice(0, level).reduce((sum, u) => sum + u.bonusSlots, 0);
}

export function formatAugmentBonus(upgrade: AugmentUpgrade): string {
	return `+${upgrade.bonusSlots} Backpack Slots`;
}
