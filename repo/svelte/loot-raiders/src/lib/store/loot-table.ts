import { ITEM_DB } from '$lib/config/items';
import { randInt } from '$lib/utils';
import type { ItemRarity, ItemDefinition, ItemType } from '$lib/types';

type ItemPool = Record<ItemType, Record<ItemRarity, ItemDefinition[]>>;

export interface LootProfile {
	typeWeights: Record<ItemType, number>;
	typeCaps: Partial<Record<ItemType, number>>;
	rarityWeights: Record<ItemRarity, number>;
	attachmentChance: number;
}

export interface RawLootItem {
	def: ItemDefinition;
	count: number;
	attachments: (ItemDefinition | null)[] | null;
}

export interface QuestPick {
	defId: string;
	count: number;
}

export const DEFAULT_STACK_RANGES: Record<ItemRarity, [number, number]> = {
	common: [1, 5],
	uncommon: [1, 3],
	rare: [1, 2],
	epic: [1, 1],
	legendary: [1, 1]
};

function buildItemPool(): ItemPool {
	const pool = {} as ItemPool;
	for (const type of ['loot', 'weapon', 'augment', 'shield', 'attachment'] as ItemType[]) {
		pool[type] = { common: [], uncommon: [], rare: [], epic: [], legendary: [] };
	}
	for (const def of Object.values(ITEM_DB)) {
		pool[def.type][def.rarity].push(def);
	}
	return pool;
}

const itemPool = buildItemPool();

function weightedRoll<T extends string>(weights: Record<T, number>): T {
	const entries = Object.entries(weights) as [T, number][];
	const total = entries.reduce((sum, [, w]) => sum + w, 0);
	let roll = Math.random() * total;
	for (const [key, weight] of entries) {
		roll -= weight;
		if (roll <= 0) return key;
	}
	return entries[0][0];
}

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function rollItemType(profile: LootProfile, currentCounts: Record<string, number>): ItemType {
	const adjustedWeights = { ...profile.typeWeights };
	for (const [type, cap] of Object.entries(profile.typeCaps)) {
		if ((currentCounts[type] ?? 0) >= (cap as number)) {
			adjustedWeights[type as ItemType] = 0;
		}
	}
	return weightedRoll(adjustedWeights);
}

function rollItemRarity(profile: LootProfile, type: ItemType): ItemRarity {
	const adjustedRarity = { ...profile.rarityWeights };
	for (const rarity of Object.keys(adjustedRarity) as ItemRarity[]) {
		if (itemPool[type][rarity].length === 0) {
			adjustedRarity[rarity] = 0;
		}
	}
	return weightedRoll(adjustedRarity);
}

function rollAttachmentsForWeapon(
	profile: LootProfile,
	def: ItemDefinition
): (ItemDefinition | null)[] | null {
	if (profile.attachmentChance <= 0 || def.type !== 'weapon' || !def.attachmentSlots?.length) {
		return null;
	}

	return def.attachmentSlots.map((slot) => {
		if (Math.random() > profile.attachmentChance) return null;

		const candidates = Object.values(ITEM_DB).filter(
			(d) => d.type === 'attachment' && d.attachmentKind === slot.type
		);
		return candidates.length > 0 ? pickRandom(candidates) : null;
	});
}

export function generateLootItems(profile: LootProfile, count: number): RawLootItem[] {
	const typeCounts: Record<string, number> = {};
	const result: RawLootItem[] = [];

	for (let i = 0; i < count; i++) {
		const type = rollItemType(profile, typeCounts);
		typeCounts[type] = (typeCounts[type] ?? 0) + 1;

		const rarity = rollItemRarity(profile, type);

		const def = pickRandom(itemPool[type][rarity]);

		const [min, max] = DEFAULT_STACK_RANGES[def.rarity];
		const itemCount = type === 'loot' ? randInt(min, Math.min(max, def.maxStack ?? 1)) : 1;

		const attachments = rollAttachmentsForWeapon(profile, def);

		result.push({ def, count: itemCount, attachments });
	}

	return result;
}

export interface QuestPity {
	chance: number; // probability the pity injection fires this chest (0-1)
	count: number; // how many distinct unmatched quest types to inject when it fires
}

export function pickQuestItems(unmatched: QuestPick[], pity: QuestPity): QuestPick[] {
	if (unmatched.length === 0) return [];
	if (Math.random() >= pity.chance) return [];

	const n = Math.min(pity.count, unmatched.length);
	const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
	const picks = shuffled.slice(0, n);

	return picks.map((q) => {
		const def = ITEM_DB[q.defId];
		const count =
			def.maxStack && def.maxStack > 1 ? randInt(1, Math.min(q.count, def.maxStack)) : 1;
		return { defId: q.defId, count };
	});
}
