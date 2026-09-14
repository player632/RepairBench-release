import type { ItemDefinition } from '$lib/types';

export const ITEM_DB: Record<string, ItemDefinition> = {
	// ──────────────────────────────────────
	// ASSAULT RIFLES
	// ──────────────────────────────────────
	wpn_kettle: {
		id: 'wpn_kettle',
		name: 'Kettle',
		type: 'weapon',
		rarity: 'common',
		weight: 7,
		price: 840,
		image: '/assets/items/weapons/kettle.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/light_ammo.webp',
		description: 'Quick and accurate, but has low bullet velocity and takes a long time to reload.',
		weaponClass: 'Assault Rifle',
		ammoType: 'Light Ammo',
		magazineSize: 20,
		firingMode: 'Semi-Automatic',
		armorPenetration: 'Very Weak',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 3 },
			{ itemId: 'res_rubber_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_light', placeholder: '/assets/ui/mod_slot_assets/light_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_rattler: {
		id: 'wpn_rattler',
		name: 'Rattler',
		type: 'weapon',
		rarity: 'common',
		weight: 6,
		price: 1750,
		image: '/assets/items/weapons/rattler.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'A cheap offensive option, but has to be reloaded 2 bullets at a time.',
		weaponClass: 'Assault Rifle',
		ammoType: 'Medium Ammo',
		magazineSize: 12,
		firingMode: 'Fully-Automatic',
		armorPenetration: 'Moderate',
		recycling: [{ itemId: 'res_metal_parts', amount: 8 }],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_arpeggio: {
		id: 'wpn_arpeggio',
		name: 'Arpeggio',
		type: 'weapon',
		rarity: 'uncommon',
		weight: 7,
		price: 5500,
		image: '/assets/items/weapons/arpeggio.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'Has decent damage output and accuracy.',
		weaponClass: 'Assault Rifle',
		ammoType: 'Medium Ammo',
		magazineSize: 24,
		firingMode: '3-Round Burst',
		armorPenetration: 'Moderate',
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 2 },
			{ itemId: 'res_simple_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_medium', placeholder: '/assets/ui/mod_slot_assets/medium_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_tempest: {
		id: 'wpn_tempest',
		name: 'Tempest',
		type: 'weapon',
		rarity: 'epic',
		weight: 11,
		price: 13000,
		image: '/assets/items/weapons/tempest.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'Has moderate fire rate and accuracy.',
		weaponClass: 'Assault Rifle',
		ammoType: 'Medium Ammo',
		magazineSize: 25,
		firingMode: 'Fully-Automatic',
		armorPenetration: 'Moderate',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 2
			},
			{ itemId: 'res_medium_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_medium', placeholder: '/assets/ui/mod_slot_assets/medium_magazine.webp' }
		]
	},
	wpn_bettina: {
		id: 'wpn_bettina',
		name: 'Bettina',
		type: 'weapon',
		rarity: 'epic',
		weight: 11,
		price: 8000,
		image: '/assets/items/weapons/bettina.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/heavy_ammo.webp',
		description: 'Has slow fire rate and high damage output.',
		weaponClass: 'Assault Rifle',
		ammoType: 'Heavy Ammo',
		magazineSize: 22,
		firingMode: 'Fully-Automatic',
		armorPenetration: 'Strong',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 1
			},
			{ itemId: 'res_heavy_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// BATTLE RIFLES
	// ──────────────────────────────────────
	wpn_ferro: {
		id: 'wpn_ferro',
		name: 'Ferro',
		type: 'weapon',
		rarity: 'common',
		weight: 8,
		price: 475,
		image: '/assets/items/weapons/ferro.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/heavy_ammo.webp',
		description: 'Packs a punch, but must be reloaded between every shot.',
		weaponClass: 'Battle Rifle',
		ammoType: 'Heavy Ammo',
		magazineSize: 1,
		firingMode: 'Break-Action',
		armorPenetration: 'Strong',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 2 },
			{ itemId: 'res_rubber_parts', amount: 1 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_renegade: {
		id: 'wpn_renegade',
		name: 'Renegade',
		type: 'weapon',
		rarity: 'rare',
		weight: 10,
		price: 7000,
		image: '/assets/items/weapons/renegade.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'A powerful weapon in the hands of a skilled marksman.',
		weaponClass: 'Battle Rifle',
		ammoType: 'Medium Ammo',
		magazineSize: 8,
		firingMode: 'Lever-Action',
		armorPenetration: 'Moderate',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 1
			},
			{ itemId: 'res_medium_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'magazine_medium', placeholder: '/assets/ui/mod_slot_assets/medium_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_aphelion: {
		id: 'wpn_aphelion',
		name: 'Aphelion',
		type: 'weapon',
		rarity: 'legendary',
		weight: 10,
		price: 27500,
		image: '/assets/items/weapons/aphelion.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/energy_clip.webp',
		description: 'Fires high velocity energy rounds.',
		weaponClass: 'Battle Rifle',
		ammoType: 'Energy Clip',
		magazineSize: 10,
		firingMode: '2-Round Burst',
		armorPenetration: 'Strong',
		recycling: [
			{ itemId: 'res_magnetic_accelerator', amount: 2 },
			{ itemId: 'res_complex_gun_parts', amount: 1 }
		],
		attachmentSlots: [
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// SMGs
	// ──────────────────────────────────────
	wpn_stitcher: {
		id: 'wpn_stitcher',
		name: 'Stitcher',
		type: 'weapon',
		rarity: 'common',
		weight: 5,
		price: 800,
		image: '/assets/items/weapons/stitcher.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/light_ammo.webp',
		description: 'Deals good damage, but has quite a low fire-rate and can be hard to control.',
		weaponClass: 'SMG',
		ammoType: 'Light Ammo',
		magazineSize: 20,
		firingMode: 'Fully-Automatic',
		armorPenetration: 'Very Weak',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 3 },
			{ itemId: 'res_rubber_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_light', placeholder: '/assets/ui/mod_slot_assets/light_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_bobcat: {
		id: 'wpn_bobcat',
		name: 'Bobcat',
		type: 'weapon',
		rarity: 'epic',
		weight: 7,
		price: 13000,
		image: '/assets/items/weapons/bobcat.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/light_ammo.webp',
		description: 'Has a high fire rate but low accuracy.',
		weaponClass: 'SMG',
		ammoType: 'Light Ammo',
		magazineSize: 20,
		firingMode: 'Fully-Automatic',
		armorPenetration: 'Very Weak',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 2
			},
			{ itemId: 'res_light_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_light', placeholder: '/assets/ui/mod_slot_assets/light_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// SHOTGUNS
	// ──────────────────────────────────────
	wpn_il_toro: {
		id: 'wpn_il_toro',
		name: 'Il Toro',
		type: 'weapon',
		rarity: 'uncommon',
		weight: 8,
		price: 5000,
		image: '/assets/items/weapons/il_toro.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/shotgun_ammo.webp',
		description: 'High damage output, capable of downing most Raiders at close range.',
		weaponClass: 'Shotgun',
		ammoType: 'Shotgun Ammo',
		magazineSize: 5,
		firingMode: 'Pump-Action',
		armorPenetration: 'Weak',
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 2 },
			{ itemId: 'res_simple_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle_shotgun', placeholder: '/assets/ui/mod_slot_assets/shotgun_muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_shotgun', placeholder: '/assets/ui/mod_slot_assets/shotgun_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},
	wpn_vulcano: {
		id: 'wpn_vulcano',
		name: 'Vulcano',
		type: 'weapon',
		rarity: 'epic',
		weight: 8,
		price: 10000,
		image: '/assets/items/weapons/vulcano.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/shotgun_ammo.webp',
		description: 'Has good bullet spread but sharp falloff.',
		weaponClass: 'Shotgun',
		ammoType: 'Shotgun Ammo',
		magazineSize: 6,
		firingMode: 'Semi-Automatic',
		armorPenetration: 'Weak',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 2
			},
			{ itemId: 'res_heavy_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle_shotgun', placeholder: '/assets/ui/mod_slot_assets/shotgun_muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_shotgun', placeholder: '/assets/ui/mod_slot_assets/shotgun_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// PISTOLS
	// ──────────────────────────────────────
	wpn_hairpin: {
		id: 'wpn_hairpin',
		name: 'Hairpin',
		type: 'weapon',
		rarity: 'common',
		weight: 3,
		price: 450,
		image: '/assets/items/weapons/hairpin.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/light_ammo.webp',
		description: 'Has a built-in silencer. Great for stealth, but tricky in combat.',
		weaponClass: 'Pistol',
		ammoType: 'Light Ammo',
		magazineSize: 8,
		firingMode: 'Slide-Action',
		armorPenetration: 'Very Weak',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 2 },
			{ itemId: 'res_rubber_parts', amount: 1 }
		],
		attachmentSlots: [
			{ type: 'magazine_light', placeholder: '/assets/ui/mod_slot_assets/light_magazine.webp' }
		]
	},
	wpn_burletta: {
		id: 'wpn_burletta',
		name: 'Burletta',
		type: 'weapon',
		rarity: 'uncommon',
		weight: 4,
		price: 2900,
		image: '/assets/items/weapons/burletta.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/light_ammo.webp',
		description: 'Has decent damage output and accuracy.',
		weaponClass: 'Pistol',
		ammoType: 'Light Ammo',
		magazineSize: 12,
		firingMode: 'Semi-Automatic',
		armorPenetration: 'Very Weak',
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_simple_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'magazine_light', placeholder: '/assets/ui/mod_slot_assets/light_magazine.webp' }
		]
	},
	wpn_venator: {
		id: 'wpn_venator',
		name: 'Venator',
		type: 'weapon',
		rarity: 'rare',
		weight: 5,
		price: 7000,
		image: '/assets/items/weapons/venator.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'Fires two shots at a time. Effective at close- to medium-range combat.',
		weaponClass: 'Pistol',
		ammoType: 'Medium Ammo',
		magazineSize: 10,
		firingMode: 'Semi-Automatic',
		armorPenetration: 'Moderate',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 1
			},
			{ itemId: 'res_medium_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_medium', placeholder: '/assets/ui/mod_slot_assets/medium_magazine.webp' }
		]
	},

	// ──────────────────────────────────────
	// HAND CANNON
	// ──────────────────────────────────────
	wpn_anvil: {
		id: 'wpn_anvil',
		name: 'Anvil',
		type: 'weapon',
		rarity: 'uncommon',
		weight: 5,
		price: 5000,
		image: '/assets/items/weapons/anvil.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/heavy_ammo.webp',
		description:
			'Excels at hitting targets at medium-range, but slow firing speed feels clunky at close-range.',
		weaponClass: 'Hand Cannon',
		ammoType: 'Heavy Ammo',
		magazineSize: 6,
		firingMode: 'Single-Action',
		armorPenetration: 'Strong',
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 2 },
			{ itemId: 'res_simple_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'grip', placeholder: '/assets/ui/mod_slot_assets/tech_mod.webp' }
		]
	},

	// ──────────────────────────────────────
	// LMG
	// ──────────────────────────────────────
	wpn_torrente: {
		id: 'wpn_torrente',
		name: 'Torrente',
		type: 'weapon',
		rarity: 'rare',
		weight: 12,
		price: 7000,
		image: '/assets/items/weapons/torrente.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'Has a large ammo capacity, but is only accurate while crouched.',
		weaponClass: 'LMG',
		ammoType: 'Medium Ammo',
		magazineSize: 60,
		firingMode: 'Fully-Automatic',
		armorPenetration: 'Moderate',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 1
			},
			{ itemId: 'res_medium_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'magazine_medium', placeholder: '/assets/ui/mod_slot_assets/medium_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// SNIPER RIFLES
	// ──────────────────────────────────────
	wpn_osprey: {
		id: 'wpn_osprey',
		name: 'Osprey',
		type: 'weapon',
		rarity: 'rare',
		weight: 7,
		price: 7000,
		image: '/assets/items/weapons/osprey.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		description: 'Excels at hitting long-range targets with the help of its scope.',
		weaponClass: 'Sniper Rifle',
		ammoType: 'Medium Ammo',
		magazineSize: 8,
		firingMode: 'Bolt-Action',
		armorPenetration: 'Moderate',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 1
			},
			{ itemId: 'res_medium_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'muzzle', placeholder: '/assets/ui/mod_slot_assets/muzzle.webp' },
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'magazine_medium', placeholder: '/assets/ui/mod_slot_assets/medium_magazine.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// SPECIALS
	// ──────────────────────────────────────
	wpn_hullcracker: {
		id: 'wpn_hullcracker',
		name: 'Hullcracker',
		type: 'weapon',
		rarity: 'epic',
		weight: 7,
		price: 10000,
		image: '/assets/items/weapons/hullcracker.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/launcher_ammo.webp',
		description: 'Fires explosive projectiles that only detonate when hitting ARC.',
		weaponClass: 'Special',
		ammoType: 'Launcher Ammo',
		magazineSize: 5,
		firingMode: 'Pump-Action',
		armorPenetration: 'Very Strong',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 2
			},
			{ itemId: 'res_heavy_gun_parts', amount: 2 }
		],
		attachmentSlots: [
			{ type: 'underbarrel', placeholder: '/assets/ui/mod_slot_assets/underbarrel.webp' },
			{ type: 'stock', placeholder: '/assets/ui/mod_slot_assets/stock.webp' }
		]
	},

	// ──────────────────────────────────────
	// RECYCLING RESOURCES
	// ──────────────────────────────────────
	res_metal_parts: {
		id: 'res_metal_parts',
		name: 'Metal Parts',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/CraftingMaterials/MetalParts.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 50,
		weight: 0.5,
		maxStack: 20,
		description: 'Used to craft a wide range of items.'
	},
	res_rubber_parts: {
		id: 'res_rubber_parts',
		name: 'Rubber Parts',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/CraftingMaterials/RubberParts.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 50,
		weight: 0.5,
		maxStack: 20,
		description: 'Used to craft a wide range of items.'
	},
	res_mechanical_components: {
		id: 'res_mechanical_components',
		name: 'Mechanical Components',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/MechanicalComponents.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 150,
		weight: 0.5,
		maxStack: 10,
		description: 'Used to craft a wide range of items. Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_metal_parts', amount: 3 }]
	},
	res_simple_gun_parts: {
		id: 'res_simple_gun_parts',
		name: 'Simple Gun Parts',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/SimpleGunParts.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 200,
		weight: 0.5,
		maxStack: 10,
		description: 'Used to craft weapons.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	res_adv_mechanical_components: {
		id: 'res_adv_mechanical_components',
		name: 'Advanced Mechanical Components',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/AdvancedMechanicalComponents.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 400,
		weight: 0.5,
		maxStack: 5,
		description: 'Used to craft advanced weapons. Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_steel_spring', amount: 1 },
			{ itemId: 'res_mechanical_components', amount: 1 }
		]
	},
	res_light_gun_parts: {
		id: 'res_light_gun_parts',
		name: 'Light Gun Parts',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/LightGunParts.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 200,
		weight: 0.5,
		maxStack: 5,
		description: 'Assorted spare parts used for pistols and SMGs.',
		recycling: [{ itemId: 'res_simple_gun_parts', amount: 2 }]
	},
	res_medium_gun_parts: {
		id: 'res_medium_gun_parts',
		name: 'Medium Gun Parts',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/MediumGunParts.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 200,
		weight: 0.5,
		maxStack: 5,
		description: 'Assorted spare parts used for rifles.',
		recycling: [{ itemId: 'res_simple_gun_parts', amount: 2 }]
	},
	res_heavy_gun_parts: {
		id: 'res_heavy_gun_parts',
		name: 'Heavy Gun Parts',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/HeavyGunParts.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 350,
		weight: 0.5,
		maxStack: 5,
		description: 'Used to craft weapons.',
		recycling: [{ itemId: 'res_simple_gun_parts', amount: 2 }]
	},
	res_complex_gun_parts: {
		id: 'res_complex_gun_parts',
		name: 'Complex Gun Parts',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/CraftingMaterials/ComplexGunParts.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 600,
		weight: 0.5,
		maxStack: 3,
		description: 'Used to craft advanced weapons.',
		recycling: [{ itemId: 'res_simple_gun_parts', amount: 2 }]
	},
	res_magnetic_accelerator: {
		id: 'res_magnetic_accelerator',
		name: 'Magnetic Accelerator',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/CraftingMaterials/MagneticAccelerator.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 800,
		weight: 1,
		maxStack: 3,
		description: 'Used to craft advanced weapons.',
		recycling: [
			{ itemId: 'res_adv_mechanical_components', amount: 2 },
			{ itemId: 'loot_arc_motion_core', amount: 1 }
		]
	},
	res_plastic_parts: {
		id: 'res_plastic_parts',
		name: 'Plastic Parts',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/CraftingMaterials/PlasticParts.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 50,
		weight: 0.5,
		maxStack: 20,
		description: 'Used to craft a wide range of items.'
	},
	res_wires: {
		id: 'res_wires',
		name: 'Wires',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/Wires.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 50,
		weight: 0.5,
		maxStack: 15,
		description: 'Used to craft a wide range of items. Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_rubber_parts', amount: 2 }]
	},
	res_mod_components: {
		id: 'res_mod_components',
		name: 'Mod Components',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ModComponents.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 500,
		weight: 0.5,
		maxStack: 5,
		description: 'Used to craft weapon mods. Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 1 }
		]
	},
	res_duct_tape: {
		id: 'res_duct_tape',
		name: 'Duct Tape',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/DuctTape.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 75,
		weight: 0.5,
		maxStack: 15,
		description: 'Used to craft a wide range of items. Can be recycled into crafting materials.',
		recycling: [{ itemId: 'loot_fabric', amount: 4 }]
	},
	res_steel_spring: {
		id: 'res_steel_spring',
		name: 'Steel Spring',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/SteelSpring.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		price: 75,
		weight: 0.5,
		maxStack: 15,
		description: 'Used to craft a wide range of items. Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	res_processor: {
		id: 'res_processor',
		name: 'Processor',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Processor.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 200,
		weight: 0.5,
		maxStack: 3,
		description: 'Used in crafting.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 2 }]
	},

	// ──────────────────────────────────────
	// OTHER LOOT
	// ──────────────────────────────────────
	res_arc_circuitry: {
		id: 'res_arc_circuitry',
		name: 'ARC Circuitry',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ArcCircuitry.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		price: 300,
		weight: 1,
		maxStack: 5,
		description: 'Obtained from ARC enemies or activities. Used to craft components.',
		recycling: [{ itemId: 'loot_arc_alloy', amount: 5 }]
	},
	res_toaster: {
		id: 'res_toaster',
		name: 'Toaster',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Toaster.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		price: 50,
		weight: 2,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	res_bastion_cell: {
		id: 'res_bastion_cell',
		name: 'Bastion Cell',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/CraftingMaterials/BastionCell.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		price: 500,
		weight: 0.5,
		maxStack: 3,
		description: 'Can be recycled into crafting materials or used to upgrade the Gear Bench.',
		recycling: [
			{ itemId: 'res_adv_mechanical_components', amount: 2 },
			{ itemId: 'loot_arc_alloy', amount: 3 }
		]
	},
	loot_cat_bed: {
		id: 'loot_cat_bed',
		name: 'Cat Bed',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/CatBed.webp',
		categoryIcon: '/assets/ui/category_assets/misc.webp',
		price: 150,
		weight: 1,
		maxStack: 3,
		description: 'At least a tiny bit more comfortable than your face.'
	},

	// ──────────────────────────────────────
	// ATTACHMENTS — UNDERBARREL
	// ──────────────────────────────────────
	att_angled_grip_1: {
		id: 'att_angled_grip_1',
		name: 'Angled Grip I',
		type: 'attachment',
		attachmentKind: 'underbarrel',
		rarity: 'common',
		image: '/assets/items/WeaponMods/AngledGrip1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/underbarrel.webp',
		weight: 0.25,
		price: 640,
		description: 'Reduces horizontal recoil.',
		statBonuses: ['20% Reduced Horizontal Recoil'],
		recycling: [{ itemId: 'res_plastic_parts', amount: 6 }]
	},
	att_angled_grip_3: {
		id: 'att_angled_grip_3',
		name: 'Angled Grip III',
		type: 'attachment',
		attachmentKind: 'underbarrel',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/AngledGrip3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/underbarrel.webp',
		weight: 0.5,
		price: 5000,
		description: 'Greatly reduces horizontal recoil but slows ADS.',
		statBonuses: ['40% Reduced Horizontal Recoil', '30% Reduced ADS Speed'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 2 }
		]
	},
	att_vertical_grip_1: {
		id: 'att_vertical_grip_1',
		name: 'Vertical Grip I',
		type: 'attachment',
		attachmentKind: 'underbarrel',
		rarity: 'common',
		image: '/assets/items/WeaponMods/VerticalGrip1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/underbarrel.webp',
		weight: 0.25,
		price: 640,
		description: 'Reduces vertical recoil.',
		statBonuses: ['20% Reduced Vertical Recoil'],
		recycling: [{ itemId: 'res_plastic_parts', amount: 6 }]
	},
	att_vertical_grip_2: {
		id: 'att_vertical_grip_2',
		name: 'Vertical Grip II',
		type: 'attachment',
		attachmentKind: 'underbarrel',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/VerticalGrip2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/underbarrel.webp',
		weight: 0.25,
		price: 2000,
		description: 'Reduces vertical recoil.',
		statBonuses: ['30% Reduced Vertical Recoil'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 1 }
		]
	},
	att_vertical_grip_3: {
		id: 'att_vertical_grip_3',
		name: 'Vertical Grip III',
		type: 'attachment',
		attachmentKind: 'underbarrel',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/VerticalGrip3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/underbarrel.webp',
		weight: 0.5,
		price: 5000,
		description: 'Greatly reduces vertical recoil but slows ADS.',
		statBonuses: ['40% Reduced Vertical Recoil', '30% Reduced ADS Speed'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 2 }
		]
	},
	att_horizontal_grip: {
		id: 'att_horizontal_grip',
		name: 'Horizontal Grip',
		type: 'attachment',
		attachmentKind: 'underbarrel',
		rarity: 'epic',
		image: '/assets/items/WeaponMods/HorizontalGrip.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/underbarrel.webp',
		weight: 0.5,
		price: 7000,
		description: 'Reduces all recoil but slows ADS.',
		statBonuses: [
			'30% Reduced Horizontal Recoil',
			'30% Reduced Vertical Recoil',
			'30% Reduced ADS Speed'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 2 }
		]
	},

	// ──────────────────────────────────────
	// ATTACHMENTS — MUZZLE
	// ──────────────────────────────────────
	att_compensator_1: {
		id: 'att_compensator_1',
		name: 'Compensator I',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'common',
		image: '/assets/items/WeaponMods/Compensator1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.25,
		price: 640,
		description: 'Reduces shot dispersion.',
		statBonuses: ['20% Reduced Per-Shot Dispersion', '10% Reduced Max Dispersion'],
		recycling: [{ itemId: 'res_metal_parts', amount: 5 }]
	},
	att_compensator_2: {
		id: 'att_compensator_2',
		name: 'Compensator II',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/Compensator2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.25,
		price: 2000,
		description: 'Reduces shot dispersion.',
		statBonuses: ['40% Reduced Per-Shot Dispersion', '20% Reduced Max Dispersion'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_wires', amount: 1 }
		]
	},
	att_compensator_3: {
		id: 'att_compensator_3',
		name: 'Compensator III',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/Compensator3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.5,
		price: 5000,
		description: 'Greatly reduces dispersion but increases durability burn.',
		statBonuses: [
			'60% Reduced Per-Shot Dispersion',
			'30% Reduced Max Dispersion',
			'20% Increased Durability Burn'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_wires', amount: 2 }
		]
	},
	att_muzzle_brake_1: {
		id: 'att_muzzle_brake_1',
		name: 'Muzzle Brake I',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'common',
		image: '/assets/items/WeaponMods/MuzzleBrake1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.25,
		price: 640,
		description: 'Reduces recoil.',
		statBonuses: ['15% Reduced Horizontal Recoil', '15% Reduced Vertical Recoil'],
		recycling: [{ itemId: 'res_metal_parts', amount: 5 }]
	},
	att_muzzle_brake_2: {
		id: 'att_muzzle_brake_2',
		name: 'Muzzle Brake II',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/MuzzleBrake2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.25,
		price: 2000,
		description: 'Reduces recoil.',
		statBonuses: ['20% Reduced Horizontal Recoil', '20% Reduced Vertical Recoil'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_wires', amount: 1 }
		]
	},
	att_muzzle_brake_3: {
		id: 'att_muzzle_brake_3',
		name: 'Muzzle Brake III',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/MuzzleBrake3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.5,
		price: 5000,
		description: 'Greatly reduces recoil but increases durability burn.',
		statBonuses: [
			'25% Reduced Horizontal Recoil',
			'25% Reduced Vertical Recoil',
			'20% Increased Durability Burn'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_wires', amount: 2 }
		]
	},
	att_silencer_1: {
		id: 'att_silencer_1',
		name: 'Silencer I',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/Silencer1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.25,
		price: 2000,
		description: 'Reduces noise.',
		statBonuses: ['20% Reduced Noise'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_wires', amount: 1 }
		]
	},
	att_silencer_2: {
		id: 'att_silencer_2',
		name: 'Silencer II',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/Silencer2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.5,
		price: 5000,
		description: 'Reduces noise.',
		statBonuses: ['40% Reduced Noise'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_wires', amount: 2 }
		]
	},
	att_extended_barrel: {
		id: 'att_extended_barrel',
		name: 'Extended Barrel',
		type: 'attachment',
		attachmentKind: 'muzzle',
		rarity: 'epic',
		image: '/assets/items/WeaponMods/ExtendedBarrel.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/muzzle.webp',
		weight: 0.5,
		price: 5000,
		description: 'Increases bullet velocity but adds vertical recoil.',
		statBonuses: ['25% Increased Bullet Velocity', '15% Increased Vertical Recoil'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_wires', amount: 1 }
		]
	},

	// ──────────────────────────────────────
	// ATTACHMENTS — SHOTGUN MUZZLE
	// ──────────────────────────────────────
	att_shotgun_choke_1: {
		id: 'att_shotgun_choke_1',
		name: 'Shotgun Choke I',
		type: 'attachment',
		attachmentKind: 'muzzle_shotgun',
		rarity: 'common',
		image: '/assets/items/WeaponMods/ShotgunChoke1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/shotgun_muzzle.webp',
		weight: 0.25,
		price: 640,
		description: 'Reduces base dispersion.',
		statBonuses: ['10% Reduced Base Dispersion'],
		recycling: [{ itemId: 'res_metal_parts', amount: 5 }]
	},
	att_shotgun_choke_2: {
		id: 'att_shotgun_choke_2',
		name: 'Shotgun Choke II',
		type: 'attachment',
		attachmentKind: 'muzzle_shotgun',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/ShotgunChoke2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/shotgun_muzzle.webp',
		weight: 0.5,
		price: 2000,
		description: 'Reduces base dispersion.',
		statBonuses: ['20% Reduced Base Dispersion'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_wires', amount: 1 }
		]
	},
	att_shotgun_choke_3: {
		id: 'att_shotgun_choke_3',
		name: 'Shotgun Choke III',
		type: 'attachment',
		attachmentKind: 'muzzle_shotgun',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/ShotgunChoke3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/shotgun_muzzle.webp',
		weight: 0.75,
		price: 5000,
		description: 'Greatly reduces dispersion but increases durability burn.',
		statBonuses: ['30% Reduced Base Dispersion', '20% Increased Durability Burn'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_wires', amount: 2 }
		]
	},

	// ──────────────────────────────────────
	// ATTACHMENTS — MAGAZINE
	// ──────────────────────────────────────
	att_ext_light_mag_1: {
		id: 'att_ext_light_mag_1',
		name: 'Extended Light Mag I',
		type: 'attachment',
		attachmentKind: 'magazine_light',
		rarity: 'common',
		image: '/assets/items/WeaponMods/ExtendedLightMag1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/light_magazine.webp',
		weight: 0.5,
		price: 640,
		description: 'Increases magazine capacity.',
		statBonuses: ['+5 Magazine Size'],
		recycling: [{ itemId: 'res_plastic_parts', amount: 6 }]
	},
	att_ext_light_mag_2: {
		id: 'att_ext_light_mag_2',
		name: 'Extended Light Mag II',
		type: 'attachment',
		attachmentKind: 'magazine_light',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/ExtendedLightMag2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/light_magazine.webp',
		weight: 0.5,
		price: 2000,
		description: 'Increases magazine capacity.',
		statBonuses: ['+10 Magazine Size'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 1 }
		]
	},
	att_ext_light_mag_3: {
		id: 'att_ext_light_mag_3',
		name: 'Extended Light Mag III',
		type: 'attachment',
		attachmentKind: 'magazine_light',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/ExtendedLightMag3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/light_magazine.webp',
		weight: 0.75,
		price: 5000,
		description: 'Greatly increases magazine capacity.',
		statBonuses: ['+15 Magazine Size'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 2 }
		]
	},
	att_ext_medium_mag_1: {
		id: 'att_ext_medium_mag_1',
		name: 'Extended Medium Mag I',
		type: 'attachment',
		attachmentKind: 'magazine_medium',
		rarity: 'common',
		image: '/assets/items/WeaponMods/ExtendedMediumMag1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/medium_magazine.webp',
		weight: 0.25,
		price: 640,
		description: 'Increases magazine capacity.',
		statBonuses: ['+4 Magazine Size'],
		recycling: [{ itemId: 'res_plastic_parts', amount: 6 }]
	},
	att_ext_medium_mag_2: {
		id: 'att_ext_medium_mag_2',
		name: 'Extended Medium Mag II',
		type: 'attachment',
		attachmentKind: 'magazine_medium',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/ExtendedMediumMag2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/medium_magazine.webp',
		weight: 0.5,
		price: 2000,
		description: 'Increases magazine capacity.',
		statBonuses: ['+8 Magazine Size'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 1 }
		]
	},
	att_ext_medium_mag_3: {
		id: 'att_ext_medium_mag_3',
		name: 'Extended Medium Mag III',
		type: 'attachment',
		attachmentKind: 'magazine_medium',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/ExtendedMediumMag3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/medium_magazine.webp',
		weight: 0.75,
		price: 5000,
		description: 'Greatly increases magazine capacity.',
		statBonuses: ['+12 Magazine Size'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 2 }
		]
	},
	att_ext_shotgun_mag_1: {
		id: 'att_ext_shotgun_mag_1',
		name: 'Extended Shotgun Mag I',
		type: 'attachment',
		attachmentKind: 'magazine_shotgun',
		rarity: 'common',
		image: '/assets/items/WeaponMods/ExtendedShotgunMag1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/shotgun_magazine.webp',
		weight: 0.25,
		price: 640,
		description: 'Increases magazine capacity.',
		statBonuses: ['+2 Magazine Size'],
		recycling: [{ itemId: 'res_plastic_parts', amount: 6 }]
	},
	att_ext_shotgun_mag_2: {
		id: 'att_ext_shotgun_mag_2',
		name: 'Extended Shotgun Mag II',
		type: 'attachment',
		attachmentKind: 'magazine_shotgun',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/ExtendedShotgunMag2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/shotgun_magazine.webp',
		weight: 0.5,
		price: 2000,
		description: 'Increases magazine capacity.',
		statBonuses: ['+4 Magazine Size'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 1 }
		]
	},
	att_ext_shotgun_mag_3: {
		id: 'att_ext_shotgun_mag_3',
		name: 'Extended Shotgun Mag III',
		type: 'attachment',
		attachmentKind: 'magazine_shotgun',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/ExtendedShotgunMag3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/shotgun_magazine.webp',
		weight: 0.75,
		price: 5000,
		description: 'Greatly increases magazine capacity.',
		statBonuses: ['+6 Magazine Size'],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_steel_spring', amount: 2 }
		]
	},

	// ──────────────────────────────────────
	// ATTACHMENTS — STOCK
	// ──────────────────────────────────────
	att_stable_stock_1: {
		id: 'att_stable_stock_1',
		name: 'Stable Stock I',
		type: 'attachment',
		attachmentKind: 'stock',
		rarity: 'common',
		image: '/assets/items/WeaponMods/StableStock1.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/stock.webp',
		weight: 0.25,
		price: 640,
		description: 'Reduces recoil and dispersion recovery time.',
		statBonuses: ['20% Reduced Recoil Recovery', '20% Reduced Dispersion Recovery'],
		recycling: [{ itemId: 'res_rubber_parts', amount: 6 }]
	},
	att_stable_stock_2: {
		id: 'att_stable_stock_2',
		name: 'Stable Stock II',
		type: 'attachment',
		attachmentKind: 'stock',
		rarity: 'uncommon',
		image: '/assets/items/WeaponMods/StableStock2.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/stock.webp',
		weight: 0.25,
		price: 2000,
		description: 'Reduces recoil and dispersion recovery time.',
		statBonuses: ['35% Reduced Recoil Recovery', '35% Reduced Dispersion Recovery'],
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'res_rubber_parts', amount: 1 }
		]
	},
	att_stable_stock_3: {
		id: 'att_stable_stock_3',
		name: 'Stable Stock III',
		type: 'attachment',
		attachmentKind: 'stock',
		rarity: 'rare',
		image: '/assets/items/WeaponMods/StableStock3.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/stock.webp',
		weight: 0.5,
		price: 5000,
		description: 'Greatly reduces recovery times but slows equip.',
		statBonuses: [
			'50% Reduced Recoil Recovery',
			'50% Reduced Dispersion Recovery',
			'20% Increased Equip Time'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_rubber_parts', amount: 2 }
		]
	},
	att_padded_stock: {
		id: 'att_padded_stock',
		name: 'Padded Stock',
		type: 'attachment',
		attachmentKind: 'stock',
		rarity: 'epic',
		image: '/assets/items/WeaponMods/PaddedStock.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/stock.webp',
		weight: 0.5,
		price: 5000,
		description: 'Reduces recoil and dispersion but slows ADS and equip.',
		statBonuses: [
			'15% Reduced Vertical Recoil',
			'15% Reduced Horizontal Recoil',
			'20% Reduced Dispersion',
			'30% Reduced ADS Speed'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 1 }
		]
	},
	att_lightweight_stock: {
		id: 'att_lightweight_stock',
		name: 'Lightweight Stock',
		type: 'attachment',
		attachmentKind: 'stock',
		rarity: 'epic',
		image: '/assets/items/WeaponMods/LightweightStock.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/stock.webp',
		weight: 0.25,
		price: 5000,
		description: 'Greatly increases ADS speed but adds vertical recoil.',
		statBonuses: [
			'200% Increased ADS Speed',
			'30% Reduced Equip Time',
			'50% Increased Vertical Recoil'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 1 }
		]
	},
	att_kinetic_converter: {
		id: 'att_kinetic_converter',
		name: 'Kinetic Converter',
		type: 'attachment',
		attachmentKind: 'stock',
		rarity: 'legendary',
		image: '/assets/items/WeaponMods/KineticConverter.webp',
		categoryIcon: '/assets/ui/mod_slot_assets/stock.webp',
		weight: 0.75,
		price: 7000,
		description: 'Increases fire rate but adds recoil.',
		statBonuses: [
			'15% Increased Fire Rate',
			'20% Increased Horizontal Recoil',
			'20% Increased Vertical Recoil'
		],
		recycling: [
			{ itemId: 'res_mod_components', amount: 1 },
			{ itemId: 'res_duct_tape', amount: 2 }
		]
	},

	// ──────────────────────────────────────
	// CRAFTING MATERIALS
	// ──────────────────────────────────────
	loot_chemicals: {
		id: 'loot_chemicals',
		name: 'Chemicals',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/CraftingMaterials/Chemicals.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.1,
		price: 50,
		maxStack: 50,
		description: 'Used to craft medical supplies, explosives, and utility items.'
	},
	loot_fabric: {
		id: 'loot_fabric',
		name: 'Fabric',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/CraftingMaterials/Fabric.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.1,
		price: 50,
		maxStack: 50,
		description: 'Used to craft medical supplies and shields.'
	},
	loot_arc_powercell: {
		id: 'loot_arc_powercell',
		name: 'ARC Powercell',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/CraftingMaterials/ArcPowercell.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.5,
		price: 270,
		maxStack: 5,
		description: 'Valuable resource that drops from all ARC enemies.'
	},
	loot_arc_alloy: {
		id: 'loot_arc_alloy',
		name: 'ARC Alloy',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/ArcAlloy.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 0.25,
		price: 200,
		maxStack: 15,
		description: 'Obtained from ARC enemies. Used to craft components.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	loot_battery: {
		id: 'loot_battery',
		name: 'Battery',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/Battery.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.25,
		price: 250,
		maxStack: 15,
		description: 'Used to craft a wide range of items.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	loot_canister: {
		id: 'loot_canister',
		name: 'Canister',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/Canister.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.25,
		price: 300,
		maxStack: 15,
		description: 'Used to craft a wide range of items.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 3 }]
	},
	loot_crude_explosives: {
		id: 'loot_crude_explosives',
		name: 'Crude Explosives',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/CrudeExplosives.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.5,
		price: 270,
		maxStack: 10,
		description: 'Used to craft explosives.',
		recycling: [{ itemId: 'loot_chemicals', amount: 3 }]
	},
	loot_durable_cloth: {
		id: 'loot_durable_cloth',
		name: 'Durable Cloth',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/DurableCloth.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.25,
		price: 640,
		maxStack: 10,
		description: 'Used to craft medical supplies.',
		recycling: [{ itemId: 'loot_fabric', amount: 6 }]
	},
	loot_electrical_components: {
		id: 'loot_electrical_components',
		name: 'Electrical Components',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/ElectricalComponents.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.5,
		price: 640,
		maxStack: 10,
		description: 'Used to craft a wide range of items.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 3 },
			{ itemId: 'res_rubber_parts', amount: 3 }
		]
	},
	loot_magnet: {
		id: 'loot_magnet',
		name: 'Magnet',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/Magnet.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.25,
		price: 300,
		maxStack: 15,
		description: 'Used to craft a wide range of items.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	loot_oil: {
		id: 'loot_oil',
		name: 'Oil',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/Oil.webp',
		categoryIcon: '/assets/ui/category_assets/basic_material.webp',
		weight: 0.25,
		price: 300,
		maxStack: 15,
		description: 'Used to craft weapons and explosives.',
		recycling: [{ itemId: 'loot_chemicals', amount: 3 }]
	},
	loot_great_mullein: {
		id: 'loot_great_mullein',
		name: 'Great Mullein',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/GreatMullein.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.25,
		price: 300,
		maxStack: 15,
		description: 'Used to craft medical supplies.',
		recycling: [{ itemId: 'loot_assorted_seeds', amount: 2 }]
	},
	loot_number_plate: {
		id: 'loot_number_plate',
		name: 'Number Plate',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/NumberPlate.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 270,
		maxStack: 5,
		description: 'Can be recycled into metal parts.',
		recycling: [{ itemId: 'res_metal_parts', amount: 3 }]
	},
	loot_crumpled_plastic_bottle: {
		id: 'loot_crumpled_plastic_bottle',
		name: 'Crumpled Plastic Bottle',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/CrumpledPlasticBottle.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 270,
		maxStack: 3,
		description: 'Can be recycled into plastic parts.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 4 }]
	},
	loot_camera_lens: {
		id: 'loot_camera_lens',
		name: 'Camera Lens',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/CameraLens.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 640,
		maxStack: 5,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 8 }]
	},
	loot_deflated_football: {
		id: 'loot_deflated_football',
		name: 'Deflated Football',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/DeflatedFootball.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 1000,
		maxStack: 3,
		description: 'Just by looking at this, you too start to feel slightly deflated.',
		recycling: [
			{ itemId: 'res_rubber_parts', amount: 9 },
			{ itemId: 'loot_fabric', amount: 9 }
		]
	},
	loot_ruined_baton: {
		id: 'loot_ruined_baton',
		name: 'Ruined Baton',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/RuinedBaton.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 640,
		maxStack: 5,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 6 },
			{ itemId: 'res_rubber_parts', amount: 3 }
		]
	},
	loot_ruined_handcuffs: {
		id: 'loot_ruined_handcuffs',
		name: 'Ruined Handcuffs',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/RuinedHandcuffs.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 640,
		maxStack: 5,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_metal_parts', amount: 8 }]
	},
	loot_ruined_tactical_vest: {
		id: 'loot_ruined_tactical_vest',
		name: 'Ruined Tactical Vest',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/CraftingMaterials/RuinedTacticalVest.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 640,
		maxStack: 5,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_fabric', amount: 5 },
			{ itemId: 'loot_magnet', amount: 1 }
		]
	},
	loot_adv_arc_powercell: {
		id: 'loot_adv_arc_powercell',
		name: 'Advanced ARC Powercell',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/AdvancedArcPowercell.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 0.5,
		price: 640,
		maxStack: 5,
		description: 'Very valuable resource that drops from certain ARC enemies.',
		recycling: [{ itemId: 'loot_arc_powercell', amount: 2 }]
	},
	loot_adv_electrical: {
		id: 'loot_adv_electrical',
		name: 'Advanced Electrical Components',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/AdvancedElectricalComponents.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 1750,
		maxStack: 5,
		description: 'Used to craft a wide range of items.',
		recycling: [
			{ itemId: 'res_wires', amount: 1 },
			{ itemId: 'loot_electrical_components', amount: 1 }
		]
	},
	loot_antiseptic: {
		id: 'loot_antiseptic',
		name: 'Antiseptic',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Antiseptic.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 1000,
		maxStack: 5,
		description: 'Used to craft medical supplies.',
		recycling: [{ itemId: 'loot_chemicals', amount: 10 }]
	},
	loot_arc_flex_rubber: {
		id: 'loot_arc_flex_rubber',
		name: 'ARC Flex Rubber',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ArcFlexRubber.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 1000,
		maxStack: 3,
		description: 'Found by scavenging destroyed ARC machines.',
		recycling: [{ itemId: 'res_rubber_parts', amount: 16 }]
	},
	loot_arc_motion_core: {
		id: 'loot_arc_motion_core',
		name: 'ARC Motion Core',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ArcMotionCore.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 0.3,
		price: 1000,
		maxStack: 5,
		description: 'Obtained from ARC enemies. Used to craft components.',
		recycling: [{ itemId: 'loot_arc_alloy', amount: 2 }]
	},
	loot_arc_performance_steel: {
		id: 'loot_arc_performance_steel',
		name: 'ARC Performance Steel',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ArcPerformanceSteel.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 1000,
		maxStack: 3,
		description: 'Obtained from ARC enemies. Used to craft components.',
		recycling: [{ itemId: 'res_metal_parts', amount: 12 }]
	},
	loot_arc_thermo_lining: {
		id: 'loot_arc_thermo_lining',
		name: 'ARC Thermo Lining',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ArcThermoLining.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'loot_fabric', amount: 16 }]
	},
	loot_coolant: {
		id: 'loot_coolant',
		name: 'Coolant',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Coolant.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 5 },
			{ itemId: 'loot_oil', amount: 2 }
		]
	},
	loot_explosive_compound: {
		id: 'loot_explosive_compound',
		name: 'Explosive Compound',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ExplosiveCompound.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 0.3,
		price: 1000,
		maxStack: 5,
		description: 'Used to craft explosives.',
		recycling: [{ itemId: 'loot_crude_explosives', amount: 2 }]
	},
	loot_moss: {
		id: 'loot_moss',
		name: 'Moss',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Moss.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.3,
		price: 500,
		maxStack: 5,
		description: 'Can be used to regain a small amount of health.',
		recycling: [{ itemId: 'loot_assorted_seeds', amount: 3 }]
	},
	loot_sensors: {
		id: 'loot_sensors',
		name: 'Sensors',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Sensors.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.3,
		price: 500,
		maxStack: 5,
		description: 'Used in crafting.',
		recycling: [
			{ itemId: 'res_wires', amount: 1 },
			{ itemId: 'res_metal_parts', amount: 1 }
		]
	},
	loot_speaker_component: {
		id: 'loot_speaker_component',
		name: 'Speaker Component',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/SpeakerComponent.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.3,
		price: 500,
		maxStack: 5,
		description: 'Used in crafting.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 2 },
			{ itemId: 'res_rubber_parts', amount: 3 }
		]
	},
	loot_syringe: {
		id: 'loot_syringe',
		name: 'Syringe',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Syringe.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.3,
		price: 500,
		maxStack: 5,
		description: 'Used to craft medical supplies.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 3 },
			{ itemId: 'loot_chemicals', amount: 2 }
		]
	},
	loot_synthesized_fuel: {
		id: 'loot_synthesized_fuel',
		name: 'Synthesized Fuel',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/SynthesizedFuel.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.5,
		price: 700,
		maxStack: 5,
		description: 'Used to craft utility items and explosives. Can be thrown.',
		recycling: [
			{ itemId: 'loot_oil', amount: 1 },
			{ itemId: 'res_plastic_parts', amount: 1 }
		]
	},
	loot_voltage_converter: {
		id: 'loot_voltage_converter',
		name: 'Voltage Converter',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/VoltageConverter.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.3,
		price: 500,
		maxStack: 5,
		description: 'Used in crafting.',
		recycling: [
			{ itemId: 'res_wires', amount: 1 },
			{ itemId: 'res_rubber_parts', amount: 1 }
		]
	},
	loot_dog_collar: {
		id: 'loot_dog_collar',
		name: 'Dog Collar',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/DogCollar.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 640,
		maxStack: 3,
		description: 'After all this time, you can still smell the goodness.',
		recycling: [
			{ itemId: 'loot_fabric', amount: 8 },
			{ itemId: 'res_metal_parts', amount: 1 }
		]
	},
	loot_broken_flashlight: {
		id: 'loot_broken_flashlight',
		name: 'Broken Flashlight',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/BrokenFlashlight.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_battery', amount: 2 },
			{ itemId: 'res_metal_parts', amount: 6 }
		]
	},
	loot_broken_guidance_system: {
		id: 'loot_broken_guidance_system',
		name: 'Broken Guidance System',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/BrokenGuidanceSystem.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_processor', amount: 4 }]
	},
	loot_damaged_heat_sink: {
		id: 'loot_damaged_heat_sink',
		name: 'Damaged Heat Sink',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/DamagedHeatSink.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 6 },
			{ itemId: 'res_wires', amount: 2 }
		]
	},
	loot_expired_respirator: {
		id: 'loot_expired_respirator',
		name: 'Expired Respirator',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/ExpiredRespirator.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 640,
		maxStack: 3,
		description: 'The filters are clogged with sand and noxious fumes.',
		recycling: [
			{ itemId: 'res_rubber_parts', amount: 8 },
			{ itemId: 'loot_fabric', amount: 4 }
		]
	},
	loot_freq_mod_box: {
		id: 'loot_freq_mod_box',
		name: 'Frequency Modulation Box',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/FrequencyModulationBox.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 1.5,
		price: 3000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_adv_electrical', amount: 1 },
			{ itemId: 'loot_speaker_component', amount: 1 }
		]
	},
	loot_fried_motherboard: {
		id: 'loot_fried_motherboard',
		name: 'Fried Motherboard',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/FriedMotherboard.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 5 },
			{ itemId: 'loot_electrical_components', amount: 2 },
			{ itemId: 'res_wires', amount: 5 }
		]
	},
	loot_frying_pan: {
		id: 'loot_frying_pan',
		name: 'Frying Pan',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/FryingPan.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 640,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_metal_parts', amount: 8 }]
	},
	loot_headphones: {
		id: 'loot_headphones',
		name: 'Headphones',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Headphones.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_rubber_parts', amount: 7 },
			{ itemId: 'loot_speaker_component', amount: 1 }
		]
	},
	loot_industrial_battery: {
		id: 'loot_industrial_battery',
		name: 'Industrial Battery',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/IndustrialBattery.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into materials.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 7 },
			{ itemId: 'loot_battery', amount: 2 }
		]
	},
	loot_industrial_charger: {
		id: 'loot_industrial_charger',
		name: 'Industrial Charger',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/IndustrialCharger.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 5 },
			{ itemId: 'loot_voltage_converter', amount: 1 }
		]
	},
	loot_industrial_magnet: {
		id: 'loot_industrial_magnet',
		name: 'Industrial Magnet',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/IndustrialMagnet.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 4 },
			{ itemId: 'loot_magnet', amount: 2 }
		]
	},
	loot_motor: {
		id: 'loot_motor',
		name: 'Motor',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Motor.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_oil', amount: 2 },
			{ itemId: 'res_mechanical_components', amount: 2 }
		]
	},
	loot_polluted_air_filter: {
		id: 'loot_polluted_air_filter',
		name: 'Polluted Air Filter',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/PollutedAirFilter.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.8,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_fabric', amount: 6 },
			{ itemId: 'loot_oil', amount: 2 }
		]
	},
	loot_portable_tv: {
		id: 'loot_portable_tv',
		name: 'Portable TV',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/PortableTV.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_battery', amount: 2 },
			{ itemId: 'res_wires', amount: 6 }
		]
	},
	loot_power_bank: {
		id: 'loot_power_bank',
		name: 'Power Bank',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/PowerBank.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_battery', amount: 2 },
			{ itemId: 'res_wires', amount: 2 }
		]
	},
	loot_power_cable: {
		id: 'loot_power_cable',
		name: 'Power Cable',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/PowerCable.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [{ itemId: 'res_wires', amount: 4 }]
	},
	loot_projector: {
		id: 'loot_projector',
		name: 'Projector',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/Projector.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_wires', amount: 2 },
			{ itemId: 'res_processor', amount: 1 }
		]
	},
	loot_ruined_accordion: {
		id: 'loot_ruined_accordion',
		name: 'Ruined Accordion',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/RuinedAccordion.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_rubber_parts', amount: 18 },
			{ itemId: 'res_steel_spring', amount: 3 }
		]
	},
	loot_rusted_gear: {
		id: 'loot_rusted_gear',
		name: 'Rusted Gear',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/RustedGear.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 4 },
			{ itemId: 'res_mechanical_components', amount: 2 }
		]
	},
	loot_rusted_medical_kit: {
		id: 'loot_rusted_medical_kit',
		name: 'Rusted Shut Medical Kit',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/RustedShutMedicalKit.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into medical crafting materials.',
		recycling: [
			{ itemId: 'loot_syringe', amount: 2 },
			{ itemId: 'loot_antiseptic', amount: 1 }
		]
	},
	loot_rusted_tools: {
		id: 'loot_rusted_tools',
		name: 'Rusted Tools',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/RustedTools.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into metal parts.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 8 },
			{ itemId: 'res_steel_spring', amount: 1 }
		]
	},
	loot_torn_blanket: {
		id: 'loot_torn_blanket',
		name: 'Torn Blanket',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/TornBlanket.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 640,
		maxStack: 3,
		description: 'Can be recycled into fabric.',
		recycling: [{ itemId: 'loot_fabric', amount: 12 }]
	},
	loot_turbo_pump: {
		id: 'loot_turbo_pump',
		name: 'Turbo Pump',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/TurboPump.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 3,
		price: 2000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_mechanical_components', amount: 1 },
			{ itemId: 'loot_oil', amount: 3 }
		]
	},
	loot_wasp_driver: {
		id: 'loot_wasp_driver',
		name: 'Wasp Driver',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/WaspDriver.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 0.6,
		price: 640,
		maxStack: 3,
		description: 'Can be thrown, and will explode if shot.',
		recycling: [
			{ itemId: 'loot_arc_alloy', amount: 1 },
			{ itemId: 'loot_electrical_components', amount: 1 }
		]
	},
	loot_water_filter: {
		id: 'loot_water_filter',
		name: 'Water Filter',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/WaterFilter.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_rubber_parts', amount: 2 },
			{ itemId: 'loot_canister', amount: 3 }
		]
	},
	loot_water_pump: {
		id: 'loot_water_pump',
		name: 'Water Pump',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/CraftingMaterials/WaterPump.webp',
		categoryIcon: '/assets/ui/category_assets/recyclable.webp',
		weight: 2,
		price: 1000,
		maxStack: 3,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'res_metal_parts', amount: 4 },
			{ itemId: 'loot_oil', amount: 2 }
		]
	},
	loot_power_rod: {
		id: 'loot_power_rod',
		name: 'Power Rod',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/CraftingMaterials/PowerRod.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 5000,
		maxStack: 3,
		description: 'Used to craft advanced equipment. Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_adv_electrical', amount: 1 },
			{ itemId: 'res_arc_circuitry', amount: 1 }
		]
	},
	loot_exodus_modules: {
		id: 'loot_exodus_modules',
		name: 'Exodus Modules',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/CraftingMaterials/ExodusModules.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 2750,
		maxStack: 3,
		description: 'Used to craft a wide range of items.',
		recycling: [
			{ itemId: 'loot_magnet', amount: 2 },
			{ itemId: 'res_processor', amount: 2 }
		]
	},
	loot_leaper_pulse_unit: {
		id: 'loot_leaper_pulse_unit',
		name: 'Leaper Pulse Unit',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/CraftingMaterials/LeaperPulseUnit.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 1,
		price: 3000,
		maxStack: 3,
		description: 'Can be thrown to create a violent singularity.',
		recycling: [
			{
				itemId: 'res_adv_mechanical_components',
				amount: 1
			},
			{ itemId: 'loot_arc_alloy', amount: 3 }
		]
	},
	loot_matriarch_reactor: {
		id: 'loot_matriarch_reactor',
		name: 'Matriarch Reactor',
		type: 'loot',
		rarity: 'legendary',
		image: '/assets/items/CraftingMaterials/MatriarchReactor.webp',
		categoryIcon: '/assets/ui/category_assets/refined_material.webp',
		weight: 10,
		price: 11000,
		maxStack: 1,
		description: 'Can be recycled into crafting materials.',
		recycling: [
			{ itemId: 'loot_power_rod', amount: 1 },
			{ itemId: 'res_magnetic_accelerator', amount: 1 }
		]
	},

	// ──────────────────────────────────────
	// MISC / TRINKETS
	// ──────────────────────────────────────
	loot_assorted_seeds: {
		id: 'loot_assorted_seeds',
		name: 'Assorted Seeds',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Misc/Seeds.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.05,
		price: 100,
		maxStack: 100,
		description: 'A handful of seeds.'
	},
	loot_rubber_duck: {
		id: 'loot_rubber_duck',
		name: 'Rubber Duck',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Misc/RubberDuck.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.3,
		price: 1000,
		maxStack: 15,
		description: 'Always there to lend an ear, should you need it.'
	},
	loot_apricot: {
		id: 'loot_apricot',
		name: 'Apricot',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/Apricot.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.2,
		price: 640,
		maxStack: 10,
		description: 'A sun ripe apricot. Can be consumed for a small amount of stamina.',
		recycling: [{ itemId: 'loot_assorted_seeds', amount: 3 }]
	},
	loot_olives: {
		id: 'loot_olives',
		name: 'Olives',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/Olives.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.2,
		price: 640,
		maxStack: 10,
		description: 'Can be consumed for a small amount of stamina.',
		recycling: [{ itemId: 'loot_assorted_seeds', amount: 2 }]
	},
	loot_prickly_pear: {
		id: 'loot_prickly_pear',
		name: 'Prickly Pear',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/PricklyPear.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.2,
		price: 640,
		maxStack: 10,
		description: 'Can be consumed for a small amount of stamina.',
		recycling: [{ itemId: 'loot_assorted_seeds', amount: 3 }]
	},
	loot_mushroom: {
		id: 'loot_mushroom',
		name: 'Mushroom',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/Mushrooms.webp',
		categoryIcon: '/assets/ui/category_assets/nature.webp',
		weight: 0.2,
		price: 1000,
		maxStack: 5,
		description: 'Can be consumed to regain a small amount of health.'
	},
	loot_air_freshener: {
		id: 'loot_air_freshener',
		name: 'Air Freshener',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/AirFreshener.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.3,
		price: 2000,
		maxStack: 5,
		description: 'May be worth a few coins.'
	},
	loot_bloated_tuna_can: {
		id: 'loot_bloated_tuna_can',
		name: 'Bloated Tuna Can',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Misc/BloatedTunaCan.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.2,
		price: 1000,
		maxStack: 15,
		description: "Something tells you that you don't want to open this..."
	},
	loot_dart_board: {
		id: 'loot_dart_board',
		name: 'Dart Board',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/DartBoard.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 1,
		price: 2000,
		maxStack: 3,
		description: "A trinket that your Raider hasn't quite figured out how to repurpose."
	},
	loot_light_bulb: {
		id: 'loot_light_bulb',
		name: 'Light Bulb',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/LightBulb.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.2,
		price: 2000,
		maxStack: 5,
		description: 'Good thing we get illumination from these Light Bulbs.'
	},
	loot_very_comfortable_pillow: {
		id: 'loot_very_comfortable_pillow',
		name: 'Very Comfortable Pillow',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/Misc/VeryComfortablePillow.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.3,
		price: 2000,
		maxStack: 3,
		description: 'Like sleeping on an especially ergonomic cloud.'
	},
	loot_music_album: {
		id: 'loot_music_album',
		name: 'Music Album',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/Misc/MusicAlbum.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.3,
		price: 3000,
		maxStack: 3,
		description: 'Perfect for relaxing nights at home and air guitar concerts.'
	},
	loot_fine_wristwatch: {
		id: 'loot_fine_wristwatch',
		name: 'Fine Wristwatch',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/Misc/FineWristwatch.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.2,
		price: 3000,
		maxStack: 3,
		description:
			"Perfect for telling the time, and showcasing that you're an exceedingly dignified person."
	},
	loot_silver_teaspoon_set: {
		id: 'loot_silver_teaspoon_set',
		name: 'Silver Teaspoon Set',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/Misc/SilverTeaspoonSet.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.3,
		price: 3000,
		maxStack: 3,
		description: 'A shining shimmering set of refinement and elegance.'
	},
	loot_statuette: {
		id: 'loot_statuette',
		name: 'Statuette',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/Misc/Statuette.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.3,
		price: 3000,
		maxStack: 3,
		description: 'Look at the adorable tiny Statuette.'
	},
	loot_snow_globe: {
		id: 'loot_snow_globe',
		name: 'Breathtaking Snow Globe',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/Misc/BreathtakingSnowGlobe.webp',
		categoryIcon: '/assets/ui/category_assets/trinket.webp',
		weight: 0.2,
		price: 7000,
		maxStack: 1,
		description: 'The envy of every Speranzan. Proof that this world was once thriving and magical.'
	},

	// ──────────────────────────────────────
	// QUICK USE / CONSUMABLES
	// ──────────────────────────────────────
	loot_bandage: {
		id: 'loot_bandage',
		name: 'Bandage',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/Bandage.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.1,
		price: 250,
		maxStack: 5,
		description: 'A medical item that gradually restores health over time.',
		recycling: [{ itemId: 'loot_fabric', amount: 2 }]
	},
	loot_adrenaline_shot: {
		id: 'loot_adrenaline_shot',
		name: 'Adrenaline Shot',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/AdrenalineShot.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 300,
		maxStack: 5,
		description: 'Fully restores stamina and temporarily increases stamina regeneration.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 1 },
			{ itemId: 'res_plastic_parts', amount: 1 }
		]
	},
	loot_blue_light_stick: {
		id: 'loot_blue_light_stick',
		name: 'Blue Light Stick',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/BlueLightStick.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 150,
		maxStack: 5,
		description: 'A throwable chemical light that illuminates the area.',
		recycling: [{ itemId: 'loot_chemicals', amount: 1 }]
	},
	loot_green_light_stick: {
		id: 'loot_green_light_stick',
		name: 'Green Light Stick',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/GreenLightStick.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 150,
		maxStack: 5,
		description: 'A throwable chemical light that illuminates the area.',
		recycling: [{ itemId: 'loot_chemicals', amount: 1 }]
	},
	loot_red_light_stick: {
		id: 'loot_red_light_stick',
		name: 'Red Light Stick',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/RedLightStick.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 150,
		maxStack: 5,
		description: 'A throwable chemical light that illuminates the area.',
		recycling: [{ itemId: 'loot_chemicals', amount: 1 }]
	},
	loot_firecracker: {
		id: 'loot_firecracker',
		name: 'Firecracker',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/FireCracker.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.05,
		price: 270,
		maxStack: 5,
		description: 'A device that sparks and pops in a pleasant manner.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 3 }]
	},
	loot_gas_grenade: {
		id: 'loot_gas_grenade',
		name: 'Gas Grenade',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/GasGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 270,
		maxStack: 3,
		description: 'Creates a lingering toxic cloud on impact, draining stamina.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 1 },
			{ itemId: 'res_rubber_parts', amount: 1 }
		]
	},
	loot_gas_mine: {
		id: 'loot_gas_mine',
		name: 'Gas Mine',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/GasMine.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.25,
		price: 270,
		maxStack: 3,
		description: 'A proximity-triggered mine that deploys a gas cloud.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 1 },
			{ itemId: 'res_rubber_parts', amount: 1 }
		]
	},
	loot_light_impact_grenade: {
		id: 'loot_light_impact_grenade',
		name: 'Light Impact Grenade',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/LightImpactGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.1,
		price: 270,
		maxStack: 5,
		description: 'Detonates on impact to create a small explosion.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 1 },
			{ itemId: 'res_plastic_parts', amount: 1 }
		]
	},
	loot_lil_smoke_grenade: {
		id: 'loot_lil_smoke_grenade',
		name: "Li'l Smoke Grenade",
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/LilSmokeGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 300,
		maxStack: 5,
		description: 'Pops a thick but small smoke cloud on impact.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 1 },
			{ itemId: 'res_plastic_parts', amount: 1 }
		]
	},
	loot_door_blocker: {
		id: 'loot_door_blocker',
		name: 'Door Blocker',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/DoorStopper.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 270,
		maxStack: 3,
		description: 'A locking mechanism that can be placed on large metal doors.',
		recycling: [{ itemId: 'res_metal_parts', amount: 2 }]
	},
	loot_binoculars: {
		id: 'loot_binoculars',
		name: 'Binoculars',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/QuickUse/Binoculars.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.5,
		price: 640,
		maxStack: 1,
		description: 'A basic pair of binoculars with two levels of magnification.',
		recycling: [
			{ itemId: 'res_rubber_parts', amount: 2 },
			{ itemId: 'res_plastic_parts', amount: 4 }
		]
	},
	loot_barricade_kit: {
		id: 'loot_barricade_kit',
		name: 'Barricade Kit',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/Barricade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.4,
		price: 640,
		maxStack: 3,
		description: 'A deployable cover that can block incoming damage.',
		recycling: [{ itemId: 'res_metal_parts', amount: 4 }]
	},
	loot_herbal_bandage: {
		id: 'loot_herbal_bandage',
		name: 'Herbal Bandage',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/HerbalBandage.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 900,
		maxStack: 5,
		description: 'An improvised medical item that gradually restores health.',
		recycling: [
			{ itemId: 'loot_assorted_seeds', amount: 2 },
			{ itemId: 'loot_fabric', amount: 5 }
		]
	},
	loot_lure_grenade: {
		id: 'loot_lure_grenade',
		name: 'Lure Grenade',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/LureGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.4,
		price: 1000,
		maxStack: 3,
		description: 'A noisy device that sticks to surfaces, distracting nearby ARC machines.',
		recycling: [{ itemId: 'loot_speaker_component', amount: 1 }]
	},
	loot_pulse_mine: {
		id: 'loot_pulse_mine',
		name: 'Pulse Mine',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/PulseMine.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.25,
		price: 470,
		maxStack: 3,
		description: 'A proximity-triggered mine that knocks back anything within its radius.',
		recycling: [{ itemId: 'loot_chemicals', amount: 6 }]
	},
	loot_recorder: {
		id: 'loot_recorder',
		name: 'Recorder',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/Recorder.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1000,
		maxStack: 1,
		description: 'A playable recorder used to attract ARC attention.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 10 }]
	},
	loot_seeker_grenade: {
		id: 'loot_seeker_grenade',
		name: 'Seeker Grenade',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/SeekerGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 640,
		maxStack: 5,
		description: 'A homing grenade that targets a single nearby ARC.',
		recycling: [{ itemId: 'loot_crude_explosives', amount: 1 }]
	},
	loot_shaker: {
		id: 'loot_shaker',
		name: 'Shaker',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/Shaker.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1000,
		maxStack: 1,
		description: 'A rhythmic instrument used to attract ARC attention.',
		recycling: [{ itemId: 'res_plastic_parts', amount: 10 }]
	},
	loot_shield_recharger: {
		id: 'loot_shield_recharger',
		name: 'Shield Recharger',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/ShieldRecharger.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 520,
		maxStack: 3,
		description: 'A handheld repair kit that recharges a shield over time.',
		recycling: [{ itemId: 'res_rubber_parts', amount: 4 }]
	},
	loot_shrapnel_grenade: {
		id: 'loot_shrapnel_grenade',
		name: 'Shrapnel Grenade',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/ShrapnelGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.15,
		price: 800,
		maxStack: 5,
		description: 'Bursts into razor-sharp fragments upon detonation.',
		recycling: [
			{ itemId: 'loot_crude_explosives', amount: 1 },
			{ itemId: 'res_metal_parts', amount: 1 }
		]
	},
	loot_snap_blast_grenade: {
		id: 'loot_snap_blast_grenade',
		name: 'Snap Blast Grenade',
		type: 'loot',
		rarity: 'uncommon',
		image: '/assets/items/QuickUse/SnapBlastGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 800,
		maxStack: 5,
		description: 'Sticks to surfaces, dealing explosive damage after a short delay.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 1 },
			{ itemId: 'loot_magnet', amount: 1 }
		]
	},
	loot_blaze_grenade: {
		id: 'loot_blaze_grenade',
		name: 'Blaze Grenade',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/BlazeGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1600,
		maxStack: 5,
		description: 'Detonates on impact, covering an area in fire.',
		recycling: [
			{ itemId: 'loot_oil', amount: 2 },
			{ itemId: 'res_metal_parts', amount: 4 }
		]
	},
	loot_blaze_grenade_trap: {
		id: 'loot_blaze_grenade_trap',
		name: 'Blaze Grenade Trap',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/BlazeGrenadeTrap.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.3,
		price: 1000,
		maxStack: 3,
		description: 'A laser trip wire that detonates a Blaze Grenade.'
	},
	loot_defibrillator: {
		id: 'loot_defibrillator',
		name: 'Defibrillator',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/Defibrilator.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.75,
		price: 1000,
		maxStack: 3,
		description: 'Quickly revives downed Raiders and restores some health.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 1 },
			{ itemId: 'loot_moss', amount: 1 }
		]
	},
	loot_heavy_fuze_grenade: {
		id: 'loot_heavy_fuze_grenade',
		name: 'Heavy Fuze Grenade',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/HeavyFuzeGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1600,
		maxStack: 3,
		description: 'Detonates after a delay, dealing explosive damage in its radius.',
		recycling: [
			{ itemId: 'loot_oil', amount: 1 },
			{ itemId: 'res_rubber_parts', amount: 2 }
		]
	},
	loot_jolt_mine: {
		id: 'loot_jolt_mine',
		name: 'Jolt Mine',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/JoltMine.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 850,
		maxStack: 3,
		description: 'A proximity-triggered mine that stuns anything within its radius.',
		recycling: [
			{ itemId: 'loot_battery', amount: 1 },
			{ itemId: 'res_plastic_parts', amount: 2 }
		]
	},
	loot_rope: {
		id: 'loot_rope',
		name: 'Rope',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/Rope.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.3,
		price: 500,
		maxStack: 5,
		description: 'Used in crafting.',
		recycling: [{ itemId: 'loot_fabric', amount: 5 }]
	},
	loot_smoke_grenade: {
		id: 'loot_smoke_grenade',
		name: 'Smoke Grenade',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/SmokeGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1000,
		maxStack: 3,
		description: 'Creates a lingering smoke cloud on impact.',
		recycling: [
			{ itemId: 'loot_chemicals', amount: 2 },
			{ itemId: 'loot_canister', amount: 1 }
		]
	},
	loot_sterilized_bandage: {
		id: 'loot_sterilized_bandage',
		name: 'Sterilized Bandage',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/SteralizedBandage.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 2000,
		maxStack: 3,
		description: 'Gradually restores a large amount of health over time.',
		recycling: [
			{ itemId: 'loot_fabric', amount: 1 },
			{ itemId: 'loot_antiseptic', amount: 1 }
		]
	},
	loot_surge_shield_recharger: {
		id: 'loot_surge_shield_recharger',
		name: 'Surge Shield Recharger',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/SurgeShieldRecharger.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1200,
		maxStack: 3,
		description: 'A handheld kit that recharges a shield on use.',
		recycling: [{ itemId: 'loot_electrical_components', amount: 1 }]
	},
	loot_tagging_grenade: {
		id: 'loot_tagging_grenade',
		name: 'Tagging Grenade',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/TaggingGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.4,
		price: 1000,
		maxStack: 5,
		description: 'Tags Raiders and ARC enemies in an area, allowing brief tracking.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 1 },
			{ itemId: 'loot_sensors', amount: 1 }
		]
	},
	loot_fireworks_box: {
		id: 'loot_fireworks_box',
		name: 'Fireworks Box',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/FireworksBox.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.5,
		price: 2000,
		maxStack: 1,
		description: 'A remotely triggered arrangement of dazzling fireworks.',
		recycling: [{ itemId: 'loot_explosive_compound', amount: 1 }]
	},
	loot_showstopper_grenade: {
		id: 'loot_showstopper_grenade',
		name: 'Showstopper Grenade',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/QuickUse/ShowstopperGrenade.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 0.2,
		price: 1500,
		maxStack: 3,
		description: 'A grenade that detonates after a delay, stunning enemies within its radius.'
	},
	loot_photoelectric_cloak: {
		id: 'loot_photoelectric_cloak',
		name: 'Photoelectric Cloak',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/QuickUse/PhotoelectricCloak.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 1,
		price: 5000,
		maxStack: 1,
		description: 'Allows the user to conceal themselves from ARC.',
		recycling: [
			{ itemId: 'loot_adv_electrical', amount: 1 },
			{ itemId: 'loot_speaker_component', amount: 1 }
		]
	},
	loot_deadline: {
		id: 'loot_deadline',
		name: 'Deadline',
		type: 'loot',
		rarity: 'epic',
		image: '/assets/items/QuickUse/DeadlineMine.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 1,
		price: 6000,
		maxStack: 3,
		description: 'A mine that deals damage once the timer runs out.',
		recycling: [
			{ itemId: 'loot_explosive_compound', amount: 1 },
			{ itemId: 'res_arc_circuitry', amount: 1 }
		]
	},
	loot_acoustic_guitar: {
		id: 'loot_acoustic_guitar',
		name: 'Acoustic Guitar',
		type: 'loot',
		rarity: 'legendary',
		image: '/assets/items/QuickUse/AcousticGuitar.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 1,
		price: 7000,
		maxStack: 1,
		description: 'Used to attract ARC attention, and impress other Raiders.',
		recycling: [
			{ itemId: 'res_wires', amount: 6 },
			{ itemId: 'res_metal_parts', amount: 4 }
		]
	},
	loot_snap_hook: {
		id: 'loot_snap_hook',
		name: 'Snap Hook',
		type: 'loot',
		rarity: 'legendary',
		image: '/assets/items/QuickUse/SnapHook.webp',
		categoryIcon: '/assets/ui/category_assets/quick_use.webp',
		weight: 5,
		price: 14000,
		maxStack: 1,
		description: 'Allows the user to scale structures and cover large distances.',
		recycling: [
			{ itemId: 'loot_power_rod', amount: 1 },
			{ itemId: 'loot_rope', amount: 3 }
		]
	},

	// ──────────────────────────────────────
	// AMMUNITION
	// ──────────────────────────────────────
	ammo_light: {
		id: 'ammo_light',
		name: 'Light Ammo',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Ammunition/LightAmmo.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/light_ammo.webp',
		weight: 0.01,
		price: 4,
		maxStack: 100,
		description: 'Commonly used by low-caliber weapons.'
	},
	ammo_medium: {
		id: 'ammo_medium',
		name: 'Medium Ammo',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Ammunition/MediumAmmo.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/medium_ammo.webp',
		weight: 0.025,
		price: 6,
		maxStack: 80,
		description: 'Used by medium-caliber weapons.'
	},
	ammo_heavy: {
		id: 'ammo_heavy',
		name: 'Heavy Ammo',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Ammunition/HeavyAmmo.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/heavy_ammo.webp',
		weight: 0.05,
		price: 12,
		maxStack: 40,
		description: 'Used by high-caliber weapons.'
	},
	ammo_shotgun: {
		id: 'ammo_shotgun',
		name: 'Shotgun Ammo',
		type: 'loot',
		rarity: 'common',
		image: '/assets/items/Ammunition/ShotgunAmmo.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/shotgun_ammo.webp',
		weight: 0.085,
		price: 20,
		maxStack: 20,
		description: 'Ammo for shotguns.'
	},
	ammo_energy: {
		id: 'ammo_energy',
		name: 'Energy Clip',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/Ammunition/EnergyAmmo.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/energy_clip.webp',
		weight: 0.3,
		price: 1000,
		maxStack: 5,
		description: 'Ammo used for energy weapons. One clip will fully charge a single weapon.'
	},
	ammo_launcher: {
		id: 'ammo_launcher',
		name: 'Launcher Ammo',
		type: 'loot',
		rarity: 'rare',
		image: '/assets/items/Ammunition/LauncherAmmo.webp',
		categoryIcon: '/assets/ui/ammo_type_assets/launcher_ammo.webp',
		weight: 0.1,
		price: 250,
		maxStack: 24,
		description: 'Anti-ARC payloads used mainly by the Hullcracker.'
	},

	// ──────────────────────────────────────
	// AUGMENTS
	// ──────────────────────────────────────
	aug_free_loadout: {
		id: 'aug_free_loadout',
		name: 'Free Loadout Augment',
		type: 'augment',
		rarity: 'common',
		image: '/assets/items/Augments/FreeLoadoutAugment.webp',
		categoryIcon: '/assets/ui/category_assets/augment.webp',
		weight: 1,
		price: 100,
		maxStack: 1,
		maxCarryWeight: 28,
		description: 'Basic augment for rookie Raiders.'
	},
	aug_looting_mk1: {
		id: 'aug_looting_mk1',
		name: 'Looting Mk. 1',
		type: 'augment',
		rarity: 'uncommon',
		image: '/assets/items/Augments/LootingMK1.webp',
		categoryIcon: '/assets/ui/category_assets/augment.webp',
		weight: 1,
		price: 640,
		maxStack: 1,
		maxCarryWeight: 45,
		description: 'More backpack slots and weight capacity, but low defensive capability.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 3 },
			{ itemId: 'res_rubber_parts', amount: 3 }
		]
	},
	aug_looting_mk2: {
		id: 'aug_looting_mk2',
		name: 'Looting Mk. 2',
		type: 'augment',
		rarity: 'rare',
		image: '/assets/items/Augments/LootingMK2.webp',
		categoryIcon: '/assets/ui/category_assets/augment.webp',
		weight: 1,
		price: 2000,
		maxStack: 1,
		maxCarryWeight: 58,
		description: 'Adds trinket slots. Automatically throws off attached Ticks after 1s.',
		recycling: [
			{ itemId: 'loot_magnet', amount: 1 },
			{ itemId: 'loot_electrical_components', amount: 1 }
		]
	},
	aug_looting_mk3_cautious: {
		id: 'aug_looting_mk3_cautious',
		name: 'Looting Mk. 3 (Cautious)',
		type: 'augment',
		rarity: 'epic',
		image: '/assets/items/Augments/LootingMK3Cautious.webp',
		categoryIcon: '/assets/ui/category_assets/augment.webp',
		weight: 1,
		price: 5000,
		maxStack: 1,
		maxCarryWeight: 65,
		description: 'Upon shield break, automatically administers a weak Adrenaline Shot.',
		recycling: [
			{ itemId: 'loot_adv_electrical', amount: 1 },
			{ itemId: 'res_processor', amount: 1 }
		]
	},

	// ──────────────────────────────────────
	// SHIELDS
	// ──────────────────────────────────────
	shield_light: {
		id: 'shield_light',
		name: 'Light Shield',
		type: 'shield',
		rarity: 'uncommon',
		image: '/assets/items/Shields/LightShield.webp',
		categoryIcon: '/assets/ui/category_assets/shield.webp',
		weight: 5,
		price: 640,
		timeBonus: 10,
		maxStack: 1,
		description: 'Blocks a small portion of incoming damage without impacting mobility.',
		recycling: [
			{ itemId: 'res_plastic_parts', amount: 4 },
			{ itemId: 'loot_arc_alloy', amount: 1 }
		]
	},
	shield_medium: {
		id: 'shield_medium',
		name: 'Medium Shield',
		type: 'shield',
		rarity: 'rare',
		image: '/assets/items/Shields/MediumShield.webp',
		categoryIcon: '/assets/ui/category_assets/shield.webp',
		weight: 7,
		price: 2000,
		timeBonus: 20,

		maxStack: 1,
		description: 'Blocks a medium portion of incoming damage at a moderate cost to mobility.',
		recycling: [{ itemId: 'res_arc_circuitry', amount: 1 }]
	},
	shield_heavy: {
		id: 'shield_heavy',
		name: 'Heavy Shield',
		type: 'shield',
		rarity: 'epic',
		image: '/assets/items/Shields/HeavyShield.webp',
		categoryIcon: '/assets/ui/category_assets/shield.webp',
		weight: 9,
		price: 5500,
		timeBonus: 25,

		maxStack: 1,
		description: 'Blocks a large portion of incoming damage, but significant cost to mobility.',
		recycling: [
			{ itemId: 'res_arc_circuitry', amount: 2 },
			{ itemId: 'loot_voltage_converter', amount: 1 }
		]
	}

	// ──────────────────────────────────────
	// KEYS
	// ──────────────────────────────────────
	// key_blue_gate_cellar: {
	// 	id: 'key_blue_gate_cellar',
	// 	name: 'Blue Gate Cellar Key',
	// 	type: 'loot',
	// 	rarity: 'rare',
	// 	image: '/assets/items/Keys/BlueGateCellarKey.webp',
	// 	categoryIcon: '/assets/ui/category_assets/key.webp',
	// 	weight: 0.1,
	// 	price: 100,
	// 	maxStack: 1,
	// 	description: 'Unlocks certain cellar doors near the Blue Gate.'
	// },
	// key_blue_gate_confiscation: {
	// 	id: 'key_blue_gate_confiscation',
	// 	name: 'Blue Gate Confiscation Room Key',
	// 	type: 'loot',
	// 	rarity: 'epic',
	// 	image: '/assets/items/Keys/BlueGateConfiscationKey.webp',
	// 	categoryIcon: '/assets/ui/category_assets/key.webp',
	// 	weight: 0.1,
	// 	price: 100,
	// 	maxStack: 1,
	// 	description: 'Unlocks a door to the confiscated foods area within the Blue Gate tunnels.'
	// },
	// key_buried_city_hospital: {
	// 	id: 'key_buried_city_hospital',
	// 	name: 'Buried City Hospital Key',
	// 	type: 'loot',
	// 	rarity: 'rare',
	// 	image: '/assets/items/Keys/BuriedCityHospitalKey.webp',
	// 	categoryIcon: '/assets/ui/category_assets/key.webp',
	// 	weight: 0.1,
	// 	price: 100,
	// 	maxStack: 1,
	// 	description: 'Opens a locked room in the Hospital in Buried City.'
	// },
	// key_raider_hatch: {
	// 	id: 'key_raider_hatch',
	// 	name: 'Raider Hatch Key',
	// 	type: 'loot',
	// 	rarity: 'rare',
	// 	image: '/assets/items/Keys/RaiderHatchKey.webp',
	// 	categoryIcon: '/assets/ui/category_assets/key.webp',
	// 	weight: 0.1,
	// 	price: 100,
	// 	maxStack: 1,
	// 	description: 'Used to open Raider Hatches to get out of sticky situations Topside.'
	// }
};

export const getDef = (defId: string): ItemDefinition => {
	const def = ITEM_DB[defId];
	if (!def) {
		console.warn(`[Inventory] Missing definition for ID: ${defId}`);
		return {
			id: defId,
			name: 'Unknown Item',
			type: 'loot',
			rarity: 'common',
			image: '/assets/ui/placeholder/placeholder_weapon.webp',
			categoryIcon: '',
			price: 0,
			weight: 0
		};
	}
	return def;
};
