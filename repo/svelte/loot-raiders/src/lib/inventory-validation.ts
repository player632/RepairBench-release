import { getDef } from '$lib/config/items';
import { getAllowedTypes } from '$lib/config/storages';
import { RARITY_ORDER } from './config/rarity';
import type { InstanceItem, ItemLocation, OccupiedSlot, DragState, SlotState } from '$lib/types';

export type DropActionType = 'move' | 'stack' | 'attach' | 'swap' | 'delete' | 'invalid';
export type ItemResolver = (loc: ItemLocation) => InstanceItem | null;

// ---- Batch actions (Ctrl+click multi-selection) ----

export interface BatchTargets {
	dropLocations: ItemLocation[];
	recycleLocations: ItemLocation[];
}

export const resolveBatchTargets = (
	items: OccupiedSlot[],
	selectedIds: ReadonlySet<string>
): BatchTargets => {
	const dropLocations: ItemLocation[] = [];
	const recycleLocations: ItemLocation[] = [];

	for (const slot of items) {
		if (slot.location.type !== 'slot') continue;
		if (slot.location.storageId === 'augment') continue;
		if (!selectedIds.has(slot.item.uid)) continue;

		dropLocations.push(slot.location);
		if (getDef(slot.item.defId).recycling?.length) recycleLocations.push(slot.location);
	}

	return { dropLocations, recycleLocations };
};

export const isBatchEngaged = (targets: BatchTargets): boolean => targets.dropLocations.length >= 2;

export const isAllowedInLocation = (
	item: InstanceItem,
	loc: ItemLocation,
	resolve: ItemResolver
): boolean => {
	if (loc.type === 'trash') return true;
	if (loc.type === 'slot') {
		const itemDef = getDef(item.defId);
		const allowedTypes = getAllowedTypes(loc.storageId);
		if (!allowedTypes.includes(itemDef.type)) return false;

		if (loc.storageId === 'shield') {
			const augItem = resolve({ type: 'slot', storageId: 'augment', index: 0 });
			if (!augItem) return false;
			const augRarity = getDef(augItem.defId).rarity;
			return RARITY_ORDER[itemDef.rarity] <= RARITY_ORDER[augRarity];
		}

		return true;
	}
	// attachment location: check weapon's slot definition
	const parent = resolve(loc.parentLocation);
	if (!parent) return false;
	const parentDef = getDef(parent.defId);
	if (parentDef.type !== 'weapon' || !parentDef.attachmentSlots) return false;
	const slotDef = parentDef.attachmentSlots[loc.attachIndex];
	if (!slotDef) return false;
	const itemDef = getDef(item.defId);
	return itemDef.type === 'attachment' && itemDef.attachmentKind === slotDef.type;
};

export const canStackItems = (sourceItem: InstanceItem, targetItem: InstanceItem): boolean => {
	if (sourceItem.defId !== targetItem.defId) return false;

	const def = getDef(targetItem.defId);
	if (!def.maxStack) return false;

	return targetItem.count < def.maxStack;
};

export const canAttachToWeapon = (sourceItem: InstanceItem, targetItem: InstanceItem): boolean => {
	const sourceDef = getDef(sourceItem.defId);
	const targetDef = getDef(targetItem.defId);

	if (sourceDef.type !== 'attachment') return false;
	if (targetDef.type !== 'weapon') return false;

	return targetDef.attachmentSlots?.some((slot) => slot.type === sourceDef.attachmentKind) ?? false;
};

export const getAttachmentSlotIndex = (
	sourceItem: InstanceItem,
	targetItem: InstanceItem
): number => {
	const sourceDef = getDef(sourceItem.defId);
	const targetDef = getDef(targetItem.defId);
	if (!targetDef.attachmentSlots) return -1;
	return targetDef.attachmentSlots.findIndex((s) => s.type === sourceDef.attachmentKind);
};

// Priority: delete > move (empty slot) > stack > attach > invalid (split blocks swap) > swap
export const getDropActionType = (drag: DragState, target: SlotState): DropActionType => {
	if (target.location.type === 'trash') return 'delete';
	if (!target.item) return 'move';
	if (canStackItems(drag.item, target.item)) return 'stack';
	// Attach only when target is a slot-level weapon (not an attachment-location item)
	if (target.location.type === 'slot' && canAttachToWeapon(drag.item, target.item)) return 'attach';
	// Split only allows move/stack (handled above); it cannot trigger a swap
	if (drag.isSplit) return 'invalid';
	return 'swap';
};

export const validateDrop = (
	drag: DragState,
	target: SlotState,
	resolve: ItemResolver
): boolean => {
	const action = getDropActionType(drag, target);
	if (action === 'invalid') return false;
	if (action === 'delete') return true;

	if (action === 'move' || action === 'stack') {
		return isAllowedInLocation(drag.item, target.location, resolve);
	}

	// Already classified as attach by getDropActionType (which checked canAttachToWeapon)
	if (action === 'attach') {
		return true;
	}

	// swap: both items must be allowed in each other's location
	if (action === 'swap') {
		if (!isAllowedInLocation(drag.item, target.location, resolve)) return false;
		if (drag.sourceLocation.type === 'attachment') return false;
		return isAllowedInLocation(target.item!, drag.sourceLocation, resolve);
	}

	return false;
};
