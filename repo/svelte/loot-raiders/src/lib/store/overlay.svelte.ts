import type { InstanceItem, ItemLocation, OccupiedSlot, SlotState } from '$lib/types';

interface MenuState {
	x: number;
	y: number;
	slot: OccupiedSlot;
}

interface TooltipState {
	x: number;
	y: number;
	item: InstanceItem;
}

interface RecycleModalState {
	// A list so single-item recycle (length 1) and "Recycle all" share one modal path.
	locations: ItemLocation[];
}
const CONTEXT_MENU_WIDTH = 192;
const CONTEXT_MENU_HEIGHT = 260;

export class Overlay {
	contextMenu = $state<MenuState | null>(null);
	tooltip = $state<TooltipState | null>(null);
	recycleModal = $state<RecycleModalState | null>(null);
	augmentPanel = $state<{ x: number; y: number } | null>(null);
	questSheet = $state(false);
	leaderboard = $state(false);

	openContextMenu(x: number, y: number, slot: SlotState) {
		if (!slot.item) return;
		this.hideTooltip();
		this.contextMenu = {
			x: Math.min(x, window.innerWidth - CONTEXT_MENU_WIDTH - 8),
			y: Math.min(y, window.innerHeight - CONTEXT_MENU_HEIGHT - 8),
			slot: { location: slot.location, item: slot.item }
		};
	}

	closeContextMenu() {
		this.contextMenu = null;
	}

	openRecycleModal(locations: ItemLocation[]) {
		this.closeAll();
		this.recycleModal = { locations };
	}

	closeRecycleModal() {
		this.recycleModal = null;
	}

	openAugmentUpgrade(x: number, y: number) {
		this.hideTooltip();
		this.augmentPanel = { x, y };
	}

	closeAugmentUpgrade() {
		this.augmentPanel = null;
	}

	openQuestSheet() {
		this.closeAll();
		this.questSheet = true;
	}

	closeQuestSheet() {
		this.questSheet = false;
	}

	openLeaderboard() {
		this.hideTooltip();
		this.leaderboard = true;
	}

	closeLeaderboard() {
		this.leaderboard = false;
	}

	showTooltip(x: number, y: number, item: InstanceItem) {
		if (this.contextMenu || this.recycleModal || this.augmentPanel || this.leaderboard) return;
		this.tooltip = { x, y, item };
	}

	handleEscape() {
		if (this.leaderboard) {
			this.closeLeaderboard();
		} else if (this.augmentPanel) {
			this.closeAugmentUpgrade();
		} else if (this.recycleModal) {
			this.closeRecycleModal();
		} else if (this.contextMenu) {
			this.closeContextMenu();
		} else if (this.questSheet) {
			this.closeQuestSheet();
		}
	}

	hideTooltip() {
		this.tooltip = null;
	}

	closeAll() {
		this.contextMenu = null;
		this.tooltip = null;
		this.recycleModal = null;
		this.augmentPanel = null;
		this.questSheet = false;
		this.leaderboard = false;
	}
}
