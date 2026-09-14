import type { ItemRarity, RarityStyle } from '$lib/types';

export const RARITY_STYLES: Record<ItemRarity, RarityStyle> = {
	common: {
		border: 'bg-white/20',
		bg: 'bg-white/30',
		glow: 'bg-gray-600',
		height: 'h-[40%]'
	},
	uncommon: {
		border: 'from-rarity-uncommon via-rarity-uncommon via-5% to-rarity-gradient-end to-80%',
		bg: 'bg-rarity-uncommon',
		glow: 'bg-rarity-uncommon-glow',
		height: 'h-[50%]'
	},
	rare: {
		border: 'from-rarity-rare via-rarity-rare-glow via-5% to-rarity-gradient-end to-80%',
		bg: 'bg-rarity-rare',
		glow: 'bg-rarity-rare-glow',
		height: 'h-[60%]'
	},
	epic: {
		border: 'from-rarity-epic via-rarity-epic via-5% to-rarity-gradient-end to-80%',
		bg: 'bg-rarity-epic',
		glow: 'bg-rarity-epic-glow',
		height: 'h-[70%]'
	},
	legendary: {
		border: 'from-rarity-legendary via-rarity-legendary-alt via-5% to-rarity-gradient-end to-80%',
		bg: 'bg-rarity-legendary',
		glow: 'bg-rarity-legendary-glow',
		height: 'h-[80%]'
	}
};

const TOOLTIP_OVERRIDES: Partial<Record<ItemRarity, Partial<RarityStyle>>> = {
	common: {
		border: 'bg-gray-600',
		bg: 'bg-gray-600/60',
		glow: 'bg-gray-600'
	},
	uncommon: {
		border: 'from-rarity-uncommon via-rarity-uncommon via-5% to-rarity-gradient-end to-100%',
		bg: 'bg-rarity-uncommon',
		glow: 'bg-rarity-uncommon-glow'
	},
	rare: {
		border: 'from-rarity-rare via-rarity-rare-glow via-5% to-rarity-gradient-end to-100%',
		bg: 'bg-rarity-rare',
		glow: 'bg-rarity-rare-glow'
	},
	epic: {
		border: 'from-rarity-epic via-rarity-epic via-5% to-rarity-gradient-end to-100%',
		bg: 'bg-rarity-epic',
		glow: 'bg-rarity-epic-glow'
	},
	legendary: {
		border: 'from-rarity-legendary via-rarity-legendary-alt via-5% to-rarity-gradient-end to-100%',
		bg: 'bg-rarity-legendary',
		glow: 'bg-rarity-legendary-glow'
	}
};

export const RARITY_ORDER: Record<ItemRarity, number> = {
	common: 0,
	uncommon: 1,
	rare: 2,
	epic: 3,
	legendary: 4
};

export const getRarityStyle = (rarity: ItemRarity): RarityStyle => {
	return RARITY_STYLES[rarity];
};

export const getRarityStyleTooltip = (rarity: ItemRarity): RarityStyle => {
	return { ...RARITY_STYLES[rarity], ...TOOLTIP_OVERRIDES[rarity] };
};
