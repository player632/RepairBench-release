import { getDef } from '$lib/config/items';
import { isEqualLocation } from '$lib/utils';
import type { Inventory } from './inventory.svelte';
import type { Overlay } from './overlay.svelte';
import type { Selection } from './selection.svelte';
import type { AudioManager } from './audio.svelte';
import type { Tutorial } from './tutorial.svelte';
import { validateDrop, getDropActionType } from '$lib/inventory-validation';

import type { SlotState, ItemLocation, InstanceItem, DragState } from '$lib/types';

const DRAG_THRESHOLD = 3;
const DOUBLE_CLICK_DELAY = 6000;
const LONG_PRESS_DELAY = 450;

type InteractionStatus = 'idle' | 'pressing' | 'dragging';

export class Interaction {
	private inventory!: Inventory;
	private overlay!: Overlay;
	private selection!: Selection;
	private audio!: AudioManager;

	private tutorial?: Tutorial;

	status = $state<InteractionStatus>('idle');
	dragState = $state<DragState | null>(null);

	hoveredSlot = $state<SlotState | null>(null);
	pointer = $state({ x: 0, y: 0 });
	grabOffset = $state({ x: 0, y: 0 });

	dropAction = $derived.by(() => {
		if (!this.dragState || !this.hoveredSlot) return null;
		return getDropActionType(this.dragState, this.hoveredSlot);
	});

	isValidDrop = $derived.by(() => {
		if (!this.dragState || !this.hoveredSlot) return false;

		if (this.hoveredSlot.location.type === 'trash' && !(this.tutorial?.canDrop ?? true))
			return false;
		return validateDrop(
			this.dragState,
			this.hoveredSlot,
			this.inventory.getItem.bind(this.inventory)
		);
	});

	dragType = $derived.by(() => {
		if (!this.dragState) return null;
		return getDef(this.dragState.item.defId).type;
	});

	private startPos = { x: 0, y: 0 };
	private sourceElement: HTMLElement | null = null;
	private pressedSlot: SlotState | null = null;
	private pointerType: string = 'mouse';
	private longPressTimer: number | null = null;

	private pendingPointerX = 0;
	private pendingPointerY = 0;
	private pointerRafId = 0;

	private lastClickTime = 0;
	private lastClickUid = '';

	constructor(inventory: Inventory, overlay: Overlay, selection: Selection, audio: AudioManager) {
		this.inventory = inventory;
		this.overlay = overlay;
		this.selection = selection;
		this.audio = audio;
	}

	setTutorial(tutorial: Tutorial) {
		this.tutorial = tutorial;
	}

	startInteraction(slot: SlotState, e: PointerEvent, node: HTMLElement) {
		if (e.button !== 0) return;
		if (this.status !== 'idle') return;
		if (!slot.item) return;
		e.stopPropagation();
		e.preventDefault();

		this.status = 'pressing';
		this.pressedSlot = slot;
		this.startPos = { x: e.clientX, y: e.clientY };
		this.sourceElement = node;
		this.pointerType = e.pointerType;

		if (e.pointerType === 'touch') {
			this.longPressTimer = window.setTimeout(() => this.triggerLongPress(), LONG_PRESS_DELAY);
		}

		window.addEventListener('pointermove', this.handlePointerMove);
		window.addEventListener('pointerup', this.handlePointerUp);
	}

	private triggerLongPress() {
		this.longPressTimer = null;
		if (this.status !== 'pressing' || !this.pressedSlot?.item) return;
		navigator.vibrate?.(15);
		this.overlay.openContextMenu(this.startPos.x, this.startPos.y, this.pressedSlot);
		this.reset();
	}

	private clearLongPressTimer() {
		if (this.longPressTimer !== null) {
			clearTimeout(this.longPressTimer);
			this.longPressTimer = null;
		}
	}

	private handlePointerMove = (e: PointerEvent) => {
		if (this.status === 'pressing') {
			this.checkDragThreshold(e);
		} else if (this.status === 'dragging') {
			this.updatePointerPosition(e);
		}
	};

	private handlePointerUp = (e: PointerEvent) => {
		if (this.status === 'pressing') {
			this.handleClick(e);
		} else if (this.status === 'dragging') {
			this.handleDropAction();
		}
		this.reset();
	};

	private reset() {
		this.clearLongPressTimer();
		if (this.pointerRafId) {
			cancelAnimationFrame(this.pointerRafId);
			this.pointerRafId = 0;
		}
		this.status = 'idle';
		this.dragState = null;
		this.sourceElement = null;
		this.hoveredSlot = null;
		this.pressedSlot = null;

		window.removeEventListener('pointermove', this.handlePointerMove);
		window.removeEventListener('pointerup', this.handlePointerUp);
	}

	cancel() {
		if (this.status === 'idle') return;
		this.reset();
	}

	private checkDragThreshold(e: PointerEvent) {
		const dx = e.clientX - this.startPos.x;
		const dy = e.clientY - this.startPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance > DRAG_THRESHOLD) {
			this.clearLongPressTimer();
			this.beginDrag(e);
		}
	}

	// Transitions pressing → dragging. Alt/Meta triggers split mode for stackable items.
	private beginDrag(e: PointerEvent) {
		if (!this.pressedSlot?.item) return;
		this.overlay.closeAll();
		this.status = 'dragging';
		this.audio.play('drag');
		const rect = this.sourceElement!.getBoundingClientRect();

		this.pointer = { x: e.clientX, y: e.clientY };
		this.grabOffset = {
			x: (this.startPos.x - rect.left) / rect.width,
			y: (this.startPos.y - rect.top) / rect.height
		};

		let isSplit = false;
		let dragItem = this.pressedSlot.item;

		if ((e.metaKey || e.altKey) && this.pressedSlot.location.type === 'slot') {
			const def = getDef(dragItem.defId);
			if (def.maxStack && dragItem.count > 1) {
				const splitCount = Math.floor(dragItem.count / 2);
				isSplit = true;
				dragItem = { ...dragItem, count: splitCount };
			}
		}

		this.dragState = {
			item: dragItem,
			sourceLocation: this.pressedSlot.location,
			isSplit
		};
	}

	private updatePointerPosition(e: PointerEvent) {
		this.pendingPointerX = e.clientX;
		this.pendingPointerY = e.clientY;
		if (this.pointerRafId) return;
		this.pointerRafId = requestAnimationFrame(() => {
			this.pointer = { x: this.pendingPointerX, y: this.pendingPointerY };
			this.pointerRafId = 0;
		});
	}

	private handleDropAction() {
		if (!this.isValidDrop || !this.hoveredSlot || !this.dragState || !this.dropAction) return;

		switch (this.dropAction) {
			case 'move':
				this.inventory.move(this.dragState, this.hoveredSlot.location);
				this.audio.play('drop');
				break;
			case 'stack':
				this.inventory.stack(this.dragState, this.hoveredSlot.location);
				this.audio.play('drop');
				break;
			case 'swap':
				this.inventory.swap(this.dragState, this.hoveredSlot.location);
				this.audio.play('drop');
				break;
			case 'attach':
				this.inventory.attach(this.dragState, this.hoveredSlot.location);
				this.audio.play('attach');

				break;
			case 'delete':
				this.inventory.removeItem(this.dragState.sourceLocation);
				this.audio.play('drop');
				break;
		}
	}

	private handleClick(e: PointerEvent) {
		if (!this.pressedSlot?.item) return;

		const itemUid = this.pressedSlot.item.uid;
		const isTouch = e.pointerType === 'touch';

		if (e.altKey || e.metaKey) return;
		if (e.ctrlKey) {
			this.selection.toggle(itemUid);
			return;
		}
		if (e.shiftKey) {
			this.overlay.hideTooltip();
			this.inventory.quickMove(this.pressedSlot.location);
			return;
		}

		const now = Date.now();
		const isDouble = now - this.lastClickTime < DOUBLE_CLICK_DELAY && this.lastClickUid === itemUid;

		if (isDouble) {
			this.overlay.hideTooltip();
			this.inventory.quickMove(this.pressedSlot.location);
			this.lastClickTime = 0;
			this.lastClickUid = '';
		} else {
			if (!isTouch) this.selection.select(itemUid);
			this.lastClickTime = now;
			this.lastClickUid = itemUid;
		}
	}

	setHoveredSlot(slot: SlotState) {
		const current = this.hoveredSlot;
		if (
			current &&
			isEqualLocation(current.location, slot.location) &&
			current.item?.uid === slot.item?.uid
		) {
			return;
		}
		this.hoveredSlot = slot;
	}

	clearHoveredSlot() {
		this.hoveredSlot = null;
	}

	// Suppresses the invalid icon on slots where a failed drop is expected/harmless
	// (e.g. dragging splits or attachments over backpack/lootBack)
	shouldShowInvalidHint(slot: SlotState): boolean {
		if (this.status !== 'dragging' || !this.dragState) return false;
		if (slot.location.type === 'trash') return false;

		if (slot.location.type === 'slot') {
			const sid = slot.location.storageId;
			if (sid === 'lootBack' || sid === 'backpack') return false;
		}

		const resolver = this.inventory.getItem.bind(this.inventory);
		const isValid = validateDrop(this.dragState, slot, resolver);

		if (isValid) return false;

		if (this.dragState.isSplit) {
			if (slot.location.type !== 'slot') return true;
			const targetStorageId = slot.location.storageId;
			if (targetStorageId === 'lootBack' || targetStorageId === 'backpack') return false;
			return true;
		}

		// If source is an attachment location
		if (this.dragState.sourceLocation.type === 'attachment') {
			if (slot.location.type !== 'slot') return true;
			const targetStorageId = slot.location.storageId;
			if (targetStorageId === 'backpack' || targetStorageId === 'lootBack') return false;
			return true;
		}

		// Source is a container location
		if (this.dragState.sourceLocation.type === 'slot') {
			const sourceStorageId = this.dragState.sourceLocation.storageId;

			if (slot.location.type === 'slot') {
				if (
					sourceStorageId === 'weapon' &&
					(slot.location.storageId === 'backpack' || slot.location.storageId === 'lootBack')
				)
					return false;
			}

			return true;
		}

		return true;
	}

	isSource(loc: ItemLocation): boolean {
		if (this.status !== 'dragging' || !this.dragState) return false;
		if (this.dragState.isSplit) return false;
		return isEqualLocation(this.dragState.sourceLocation, loc);
	}

	isHovered(loc: ItemLocation): boolean {
		if (!this.hoveredSlot) return false;
		const hl = this.hoveredSlot.location;
		if (isEqualLocation(hl, loc)) return true;
		return hl.type === 'attachment' && isEqualLocation(hl.parentLocation, loc);
	}

	get draggedItem(): InstanceItem | null {
		if (this.status !== 'dragging' || !this.dragState) return null;
		return this.dragState.item;
	}

	getDisplayCount(item: InstanceItem, loc: ItemLocation): number {
		if (
			this.status === 'dragging' &&
			this.dragState?.isSplit &&
			isEqualLocation(this.dragState.sourceLocation, loc)
		) {
			return item.count - this.dragState.item.count;
		}
		return item.count;
	}
}
