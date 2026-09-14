import type { LootProfile, QuestPity } from '$lib/store/loot-table';

export interface QuestDef {
	defId: string;
	count: number;
}

export interface StageDef {
	id: number;
	name: string;
	timeLimit: number;
	lootCooldown: number;
	chestSize: { min: number; max: number };
	questPity: QuestPity;
	quests: QuestDef[];
	lootProfile: LootProfile;
}

export const STAGES: StageDef[] = [
	{
		id: 50,
		name: 'Scavenger Run',
		timeLimit: 60,
		lootCooldown: 10,
		chestSize: { min: 5, max: 10 },
		questPity: { chance: 1.0, count: 2 },
		quests: [
			{ defId: 'loot_crude_explosives', count: 4 },
			{ defId: 'loot_battery', count: 4 },
			{ defId: 'loot_fabric', count: 4 },
			{ defId: 'loot_oil', count: 3 },
			{ defId: 'loot_bandage', count: 3 }
		],
		lootProfile: {
			typeWeights: { loot: 88, attachment: 5, weapon: 5, shield: 2, augment: 0 },
			typeCaps: { weapon: 1, augment: 1, shield: 1 },
			rarityWeights: { common: 55, uncommon: 30, rare: 12, epic: 3, legendary: 0 },
			attachmentChance: 0
		}
	},
	{
		id: 2,
		name: 'Resource Haul',
		timeLimit: 55,
		lootCooldown: 10,
		chestSize: { min: 6, max: 12 },
		questPity: { chance: 0.92, count: 3 },
		quests: [
			{ defId: 'res_steel_spring', count: 4 },
			{ defId: 'res_rubber_parts', count: 5 },
			{ defId: 'res_wires', count: 5 },
			{ defId: 'loot_electrical_components', count: 3 },
			{ defId: 'res_arc_circuitry', count: 2 }
		],
		lootProfile: {
			typeWeights: { loot: 78, attachment: 8, weapon: 8, shield: 6, augment: 0 },
			typeCaps: { weapon: 2, augment: 1, shield: 1 },
			rarityWeights: { common: 40, uncommon: 35, rare: 19, epic: 6, legendary: 0 },
			attachmentChance: 0.1
		}
	},
	{
		id: 3,
		name: 'Arms Deal',
		timeLimit: 50,
		lootCooldown: 9,
		chestSize: { min: 7, max: 13 },
		questPity: { chance: 0.94, count: 2 },
		quests: [
			{ defId: 'wpn_kettle', count: 1 },
			{ defId: 'res_simple_gun_parts', count: 4 },
			{ defId: 'res_medium_gun_parts', count: 3 },
			{ defId: 'res_light_gun_parts', count: 4 },
			{ defId: 'res_mechanical_components', count: 4 }
		],
		lootProfile: {
			typeWeights: { loot: 67, attachment: 10, weapon: 15, shield: 8, augment: 0 },
			typeCaps: { weapon: 1, augment: 0, shield: 1 },
			rarityWeights: { common: 30, uncommon: 35, rare: 26, epic: 8, legendary: 1 },
			attachmentChance: 0.25
		}
	},
	{
		id: 4,
		name: 'High Value Targets',
		timeLimit: 50,
		lootCooldown: 9,
		chestSize: { min: 8, max: 13 },
		questPity: { chance: 0.83, count: 2 },
		quests: [
			{ defId: 'wpn_tempest', count: 1 },
			{ defId: 'loot_industrial_magnet', count: 2 },
			{ defId: 'res_processor', count: 3 },
			{ defId: 'loot_sensors', count: 3 },
			{ defId: 'loot_voltage_converter', count: 2 }
		],
		lootProfile: {
			typeWeights: { loot: 56, attachment: 14, weapon: 20, shield: 10, augment: 0 },
			typeCaps: { weapon: 3, augment: 1, shield: 1 },
			rarityWeights: { common: 20, uncommon: 33, rare: 35, epic: 10, legendary: 2 },
			attachmentChance: 0.3
		}
	},
	{
		id: 5,
		name: 'Final Extraction',
		timeLimit: 45,
		lootCooldown: 8,
		chestSize: { min: 8, max: 14 },
		questPity: { chance: 0.67, count: 2 },
		quests: [
			{ defId: 'wpn_aphelion', count: 1 },
			{ defId: 'loot_exodus_modules', count: 2 },
			{ defId: 'res_bastion_cell', count: 2 },
			{ defId: 'res_magnetic_accelerator', count: 2 },
			{ defId: 'loot_leaper_pulse_unit', count: 2 }
		],
		lootProfile: {
			typeWeights: { loot: 46, attachment: 17, weapon: 25, shield: 12, augment: 0 },
			typeCaps: { weapon: 3, augment: 1, shield: 1 },
			rarityWeights: { common: 10, uncommon: 20, rare: 50, epic: 15, legendary: 5 },
			attachmentChance: 0.35
		}
	}
];
