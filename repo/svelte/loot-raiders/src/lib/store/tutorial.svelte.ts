import type { GameLoop } from './game-loop.svelte';
import type { LootGenerator } from './loot.svelte';
import type { Inventory } from './inventory.svelte';
import type { Quest } from './quest.svelte';
import type { Augment } from './augment.svelte';
import type { Overlay } from './overlay.svelte';
import type { Device } from './device.svelte';
import { browser } from '$app/environment';
import type { DragState, InstanceItem, OccupiedSlot, StorageId } from '$lib/types';

// Seeded into a fixed backpack cell (5th, zero-based index 4) so the highlight ring and the
// item-anchored coachmark land in a predictable, non-corner spot.
const OVERWEIGHT_SEED = { defId: 'loot_motor', count: 12, slot: 4 } as const;

const RECYCLE_SEED = 'loot_crumpled_plastic_bottle';

// The HUD anchors revealed together on most action steps. The quest panel is added per-step:
// `quest-bar` on desktop, `quest-widget` on mobile (it has no fixed slot in this list).
const BOARD = ['loot-drop', 'backpack', 'header-loot', 'header-backpak', 'full-backpack'] as const;

const STORAGE_FTUE = 'lr_ftue_v1';

function readSeen(): boolean {
	if (!browser) return false;
	try {
		return window.localStorage.getItem(STORAGE_FTUE) === '1';
	} catch {
		return false;
	}
}

function writeSeen(): void {
	if (!browser) return;
	try {
		window.localStorage.setItem(STORAGE_FTUE, '1');
	} catch {}
}

export type Platform = 'desktop' | 'mobile';

export type GestureKind = 'tap' | 'drag' | 'double-tap' | 'hold';

export interface TutorialStep {
	id: string;
	badge: string;
	title: string;
	description: string;
	cta?: string;

	targets?: string[];

	pulse?: string[];

	exclude?: string[];
	setup?: () => void;
	predicate?: () => boolean;
	autoPerform?: () => void;

	// Steps gated to one platform are filtered out on the other. Per-field mobile overrides
	// (e.g. mobileBadge) are substituted only when the active platform is mobile
	platforms?: Platform[];
	mobileBadge?: string;
	// Mobile override for `description`, for steps whose instruction names a platform gesture
	// (e.g. right-click vs long-press) that only makes sense on one input type.
	mobileDescription?: string;
	// Touch anchors differ where a HUD element is platform-specific: the quest panel is `quest-bar`
	// on desktop but the `quest-widget` button on mobile, so the highlight/card track the real node.
	mobileTargets?: string[];
	mobilePulse?: string[];

	// Renders animated finger-gesture demos in the Coachmark in place of the badge (mobile only).
	gestures?: GestureKind[];

	// Cosmetic gold ring on inventory items matched by defId (resolved via `data-tut-item`), for
	// steps that point at a specific item instead of its container. Purely visual — interactivity
	// still comes from the container in `targets`.
	itemPulse?: string[];
	// Mobile override for `itemPulse` (substituted when the active platform is mobile, like the
	// other mobile* fields), for steps whose ringed item is platform-specific.
	mobileItemPulse?: string[];
	// Desktop coachmark anchors its card next to the item matched by this defId (via `data-tut-item`),
	// instead of the usual `pulse`/`targets` element.
	itemAnchor?: string;
}

export class Tutorial {
	private gameLoop: GameLoop;
	private loot: LootGenerator;
	private inventory: Inventory;
	private quest: Quest;
	private augment: Augment;
	private overlay: Overlay;
	private device: Device;
	private allSteps: TutorialStep[];

	// Captured by an action step's setup() on entry so its predicate measures progress
	// against the value at entry, not an assumed zero (the FTUE is replayable, so the
	// signal may be non-zero on re-entry). Only one step is active at a time.
	private baseline = 0;

	// Guards setup() against re-running on the same step. The Coachmark effect re-fires enterStep()
	// whenever `active` flips back to true (pause→resume toggles tutorial→paused→tutorial), so without
	// this a resume would re-seed the live step — double-dropping items / resetting its baseline.
	private lastSetupIndex = -1;

	// Latches when the mobile 'open-quests' step's sheet is opened, so that step can complete
	// on the subsequent CLOSE (its only "was opened" signal is the reactive sheet flag).
	private questSheetOpened = $state(false);

	index = $state(0);

	private get platform(): Platform {
		return this.device.isCoarsePointer ? 'mobile' : 'desktop';
	}

	// The ordered list for the active platform: steps gated to the other platform are dropped.
	// Recomputed reactively off the pointer type so "step N of total" stays honest per device.
	get steps(): TutorialStep[] {
		const p = this.platform;
		return this.allSteps.filter((s) => !s.platforms || s.platforms.includes(p));
	}

	get active(): boolean {
		return this.gameLoop.status === 'tutorial';
	}
	get step(): TutorialStep | null {
		const s = this.steps[this.index] ?? null;
		if (!s) return null;
		if (this.platform !== 'mobile') return s;
		if (
			!s.mobileBadge &&
			!s.mobileDescription &&
			!s.mobileTargets &&
			!s.mobilePulse &&
			!s.mobileItemPulse
		)
			return s;
		return {
			...s,
			badge: s.mobileBadge ?? s.badge,
			description: s.mobileDescription ?? s.description,
			targets: s.mobileTargets ?? s.targets,
			pulse: s.mobilePulse ?? s.pulse,
			itemPulse: s.mobileItemPulse ?? s.itemPulse
		};
	}
	get total(): number {
		return this.steps.length;
	}
	get stepNumber(): number {
		return this.index + 1;
	}
	get isActionStep(): boolean {
		return !!this.step?.autoPerform;
	}

	get stepComplete(): boolean {
		return this.step?.predicate?.() ?? false;
	}

	get canDrop(): boolean {
		if (!this.active) return true;
		const i = this.steps.findIndex((s) => s.id === 'overweight' || s.id === 'overweight-mobile');
		return i === -1 || this.index > i;
	}

	get canDropFromMenu(): boolean {
		if (!this.active) return true;
		const id = this.step?.id;
		return id === 'overweight' || id === 'overweight-mobile';
	}
	get canRecycle(): boolean {
		if (!this.active) return true;
		const i = this.steps.findIndex((s) => s.id === 'recycle');
		return i === -1 || this.index >= i;
	}

	constructor(
		gameLoop: GameLoop,
		loot: LootGenerator,
		inventory: Inventory,
		quest: Quest,
		augment: Augment,
		overlay: Overlay,
		device: Device
	) {
		this.gameLoop = gameLoop;
		this.loot = loot;
		this.inventory = inventory;
		this.quest = quest;
		this.augment = augment;
		this.overlay = overlay;
		this.device = device;
		this.allSteps = this.buildSteps();
	}

	// Called from the highlight layer when the quest sheet opens, so the mobile 'open-quests'
	// step can require an open before its close-to-continue predicate fires.
	noteQuestSheetOpened() {
		this.questSheetOpened = true;
	}

	hasSeen(): boolean {
		return readSeen();
	}

	enter() {
		if (this.hasSeen()) {
			this.gameLoop.start();
		} else {
			this.start();
		}
	}

	start() {
		this.index = 0;
		this.lastSetupIndex = -1;
		this.gameLoop.startTutorial();
	}

	// Seeds the current step once. Idempotent across resumes: a step's setup() runs only the first
	// time we enter that index, so resuming a paused tutorial restores the same board untouched.
	enterStep() {
		if (this.lastSetupIndex === this.index) return;
		this.lastSetupIndex = this.index;
		this.step?.setup?.();
	}

	advance() {
		if (this.index < this.steps.length - 1) {
			this.index++;
			return;
		}
		this.finish();
	}

	skip() {
		const step = this.step;
		if (!step) return;
		if (step.autoPerform) {
			step.autoPerform();
		} else {
			this.advance();
		}
	}

	// Bail out of the whole FTUE: mark it seen so it won't auto-appear again, then hand off into a
	// normal run — the same end state as finishing the last step. Replayable later via How to Play.
	skipTutorial() {
		this.finish();
	}

	private finish() {
		writeSeen();
		this.index = 0;
		this.lastSetupIndex = -1;
		this.gameLoop.restart();
	}

	private buildSteps(): TutorialStep[] {
		return [
			{
				id: 'intro',
				badge: 'note',
				title: 'Welcome, Raider',
				description:
					"Raid for loot, complete quests, beat the clock, and bank your Extract. I'll walk you through it — let's start.",
				cta: "Let's go",
				pulse: []
			},
			{
				id: 'touch-controls',
				badge: 'note',
				title: 'Control with Your Finger',
				description: 'Drag to move an item, hold for its menu, double-tap to quick-move.',
				cta: 'Got it',
				platforms: ['mobile'],
				gestures: ['drag', 'double-tap', 'hold']
			},
			{
				id: 'open-drop',
				badge: 'click',
				title: 'Open the Loot Drop',
				description:
					'This is a Loot Drop — your source of gear. Click "Open Now" to crack it open.',
				mobileDescription:
					'This is a Loot Drop — your source of gear. Tap "Open Now" to crack it open.',
				targets: ['header-loot', 'loot-drop'],
				pulse: ['open-now'],
				exclude: ['loot-dropzone'],
				setup: () => {
					this.baseline = this.loot.chestsOpened;
					this.loot.scriptedDrop = () => [
						this.inventory.createItem('loot_battery', 1),
						this.inventory.createItem('loot_fabric', 2),
						this.inventory.createItem('loot_oil', 1),
						this.inventory.createItem('res_metal_parts', 3)
					];
				},
				predicate: () => this.loot.chestsOpened > this.baseline,
				autoPerform: () => this.loot.next()
			},
			{
				id: 'triage',
				badge: 'drag',
				title: 'Stash Your Loot',
				description: "Drag an item into your Loadout — that's what you bank at extraction.",
				targets: [...BOARD],
				pulse: ['backpack'],
				exclude: ['loot-dropzone', 'shield', 'augment'],
				setup: () => {
					this.baseline = this.backpackCount();
				},
				predicate: () => this.backpackCount() > this.baseline,
				autoPerform: () => this.dragItem('lootBack', 'backpack')
			},
			{
				id: 'open-quests',
				badge: 'tap',
				title: 'Find Your Quests',
				description:
					'Tap the Quests panel to see what this stage wants, then close it to continue.',
				platforms: ['mobile'],
				targets: ['quest-widget', 'loot-drop', 'header-loot', 'header-backpak', 'full-backpack'],
				pulse: ['quest-widget'],
				exclude: ['loot-dropzone', 'shield', 'augment'],
				setup: () => {
					this.questSheetOpened = false;
				},
				// Completes on CLOSE after an open: noteQuestSheetOpened() latches the open (reactive
				// via $state), so the player must open and dismiss the sheet before this advances.
				predicate: () => this.questSheetOpened && !this.overlay.questSheet,
				autoPerform: () => {
					this.questSheetOpened = true;
					this.overlay.closeQuestSheet();
				}
			},
			{
				id: 'quest',
				badge: 'drag',
				title: 'Complete a Quest',
				description:
					'Drag the matching item into your Loadout — the quest turns in automatically for bonus time.',
				targets: ['quest-bar', ...BOARD],
				pulse: ['quest-bar'],
				// Mobile hides the quest-bar (pointer-coarse:hidden); anchor to the quest-widget button instead.
				mobileTargets: ['quest-widget', ...BOARD],
				// Ring the actual quest item in the drop, not the quest-widget button.
				mobilePulse: [],
				mobileItemPulse: ['loot_bandage'],
				exclude: ['loot-dropzone', 'shield', 'augment'],

				setup: () => {
					this.baseline = this.quest.totalQuestsCompleted;
					this.seedDrop([this.inventory.createItem('loot_bandage', 4)]);
				},
				predicate: () => this.quest.totalQuestsCompleted > this.baseline,
				autoPerform: () => {
					this.dragItem('lootBack', 'backpack', 'loot_bandage');
					this.quest.checkMatches();
				}
			},
			{
				id: 'overweight',
				badge: 'drag',
				title: 'Drop the Dead Weight',
				description:
					'Your bag is too heavy. Drag the bulky item to the Drop zone to clear the penalty.',
				platforms: ['desktop'],
				targets: ['quest-bar', ...BOARD],
				pulse: ['loot-dropzone'],
				itemAnchor: OVERWEIGHT_SEED.defId,
				exclude: ['shield', 'augment'],
				setup: () => {
					this.inventory.placeItem(
						{ type: 'slot', storageId: 'backpack', index: OVERWEIGHT_SEED.slot },
						this.inventory.createItem(OVERWEIGHT_SEED.defId, OVERWEIGHT_SEED.count)
					);
				},

				predicate: () => !this.inventoryHas(OVERWEIGHT_SEED.defId),
				autoPerform: () => this.dropSeeded(OVERWEIGHT_SEED.defId)
			},
			{
				id: 'overweight-mobile',
				badge: 'long-press',
				title: 'Drop the Dead Weight',
				description:
					'Your bag is too heavy. Long-press the bulky item, then choose Drop to clear the penalty.',
				platforms: ['mobile'],
				targets: [...BOARD],
				pulse: [],
				itemPulse: [OVERWEIGHT_SEED.defId],
				exclude: ['shield', 'augment'],
				setup: () => {
					this.inventory.placeItem(
						{ type: 'slot', storageId: 'backpack', index: OVERWEIGHT_SEED.slot },
						this.inventory.createItem(OVERWEIGHT_SEED.defId, OVERWEIGHT_SEED.count)
					);
				},
				predicate: () => !this.inventoryHas(OVERWEIGHT_SEED.defId),
				autoPerform: () => {
					this.dropSeeded(OVERWEIGHT_SEED.defId);
					this.overlay.closeContextMenu();
				}
			},
			{
				id: 'augment',
				badge: 'drag',
				title: 'Upgrade Your Augment',
				description:
					'Drag crafting parts into your Loadout to auto-upgrade your Augment and unlock slots.',
				targets: ['quest-bar', ...BOARD],
				pulse: ['augment', 'backpack'],
				exclude: ['loot-dropzone'],
				setup: () => {
					this.baseline = this.augment.upgradePulse;
					this.seedDrop([this.inventory.createItem('res_metal_parts', 8)]);
				},
				predicate: () => this.augment.upgradePulse > this.baseline,
				autoPerform: () => {
					this.dragItem('lootBack', 'backpack', 'res_metal_parts');
					this.augment.autoUpgrade();
				}
			},
			{
				id: 'shield',
				badge: 'drag',
				title: 'Equip a Shield',
				description: 'Drag the shield into its slot to bank extra time on the clock.',
				targets: ['quest-bar', ...BOARD],
				pulse: ['shield'],
				// Park the card next to the shield item in the drop (the source), while the ring stays
				// on the destination slot.
				itemAnchor: 'shield_light',
				exclude: ['loot-dropzone'],
				setup: () => {
					this.seedDrop([this.inventory.createItem('shield_light', 1)]);
				},
				// Fresh $state read of the shield slot rather than the unowned `shieldItem`
				// $derived, for the same staleness reason as the overweight step above.
				predicate: () =>
					this.inventory.getItem({ type: 'slot', storageId: 'shield', index: 0 }) !== null,
				autoPerform: () => this.dragItem('lootBack', 'shield', 'shield_light')
			},
			{
				id: 'recycle',
				badge: 'right-click',
				mobileBadge: 'long-press',
				title: 'Recycle the Junk',
				description: 'Right-click the item, then choose Recycle to break it into parts.',
				mobileDescription: 'Long-press the item, then choose Recycle to break it into parts.',
				targets: ['quest-bar', ...BOARD],
				// Ring the junk item itself rather than the whole backpack.
				pulse: [],
				itemPulse: [RECYCLE_SEED],
				exclude: ['loot-dropzone'],
				setup: () => {
					this.baseline = this.inventory.recyclePulse;
					this.inventory.fillStorage('backpack', [this.inventory.createItem(RECYCLE_SEED, 1)]);
				},
				// recyclePulse is bumped only on a successful recycleItem, so "rose above entry" ⟺
				// the player recycled. Auto-recycles (none in Tutorial Mode) would advance too, but
				// the cadence is suspended, so the seeded item is the only thing that can fire it.
				predicate: () => this.inventory.recyclePulse > this.baseline,
				autoPerform: () => {
					this.recycleSeeded();
					this.overlay.closeContextMenu();
				}
			},
			{
				id: 'outro',
				badge: 'finish',
				title: "You're Ready to Raid",
				description:
					"You've got the basics: complete quests, watch your weight, and bank your Loadout as Extract. Good luck out there!",
				cta: 'Start raiding'
			}
		];
	}

	// Load a step's scripted contents into the next drop and crack it open immediately, so the
	// teaching items are on the board the moment the step begins.
	private seedDrop(items: InstanceItem[]): void {
		this.loot.scriptedDrop = () => items;
		this.loot.next();
	}

	private backpackCount(): number {
		return this.inventory.items.filter(
			(slot) => slot.location.type === 'slot' && slot.location.storageId === 'backpack'
		).length;
	}

	// True while any copy of the seeded item still sits in the inventory, in any storage.
	// The overweight step completes only once the item is actually discarded, so parking it
	// in the weight-free lootBack must NOT satisfy it — hence "anywhere", not just the loadout.
	private inventoryHas(defId: string): boolean {
		return this.inventory.items.some(
			(slot) => slot.location.type === 'slot' && slot.item.defId === defId
		);
	}

	private backpackSlot(defId: string): OccupiedSlot | undefined {
		return this.inventory.items.find(
			(slot) =>
				slot.location.type === 'slot' &&
				slot.location.storageId === 'backpack' &&
				slot.item.defId === defId
		);
	}

	// Recycle step skip path: runs the same inventory.recycleItem the context-menu "Recycle"
	// invokes, so skip ≡ the manual recycle.
	private recycleSeeded(): void {
		const source = this.backpackSlot(RECYCLE_SEED);
		if (source) this.inventory.recycleItem(source.location);
	}

	// Overweight skip path: removes the seeded item outright, matching both manual discards —
	// dragging onto the desktop trash zone (move → removeItem) and the mobile context-menu "Drop".
	private dropSeeded(defId: string): void {
		const source = this.backpackSlot(defId);
		if (source) this.inventory.removeItem(source.location);
	}

	// Replays a player drag without the pointer layer: builds the minimal DragState the DnD
	// path produces and routes it through inventory.move, so skip ends exactly where a manual
	// drag would. `defId` picks a specific item when the source slot holds a mix.
	private dragItem(from: StorageId, to: StorageId, defId?: string): void {
		const source = this.inventory.items.find(
			(slot) =>
				slot.location.type === 'slot' &&
				slot.location.storageId === from &&
				(defId === undefined || slot.item.defId === defId)
		);
		if (!source) return;
		const target = this.inventory.getFirstEmptySlot(to);
		if (!target) return;
		const drag: DragState = {
			item: source.item,
			sourceLocation: source.location,
			isSplit: false
		};
		this.inventory.move(drag, target);
	}
}
