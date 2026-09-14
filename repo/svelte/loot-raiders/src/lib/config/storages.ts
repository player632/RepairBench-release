import type { StorageConfig, ItemType, StorageId } from '$lib/types';

export const STORAGE_CONFIGS: Record<StorageId, StorageConfig> = {
	lootBack: {
		name: 'lootBack',
		size: 16,
		allowedTypes: ['loot', 'attachment', 'weapon', 'augment', 'shield'],
		quickMoveTarget: 'backpack'
	},
	augment: {
		name: 'augment',
		size: 1,
		allowedTypes: ['augment'],
		placeholder: '/assets/ui/placeholder/augment_placeholder.webp',
		quickMoveTarget: 'backpack'
	},
	shield: {
		name: 'shield',
		size: 1,
		allowedTypes: ['shield'],
		placeholder: '/assets/ui/placeholder/shield_placeholder.webp',
		quickMoveTarget: 'backpack'
	},
	weapon: {
		name: 'weapon',
		size: 2,
		allowedTypes: ['weapon'],
		placeholder: '/assets/ui/placeholder/placeholder_weapon.webp',
		quickMoveTarget: 'backpack'
	},
	backpack: {
		name: 'backpack',
		size: 14,
		allowedTypes: ['loot', 'weapon', 'augment', 'shield', 'attachment'],
		quickMoveTarget: 'lootBack'
	}
};

export const getStorageConfig = (name: StorageId): StorageConfig => {
	return STORAGE_CONFIGS[name];
};

export const getAllowedTypes = (name: StorageId): ItemType[] => {
	const config = getStorageConfig(name);
	return config?.allowedTypes ?? [];
};
