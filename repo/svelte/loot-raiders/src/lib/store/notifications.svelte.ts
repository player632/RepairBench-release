import { uuid } from '$lib/utils';

export type ToastKind = 'stage' | 'augment' | 'shield';

export interface Toast {
	id: string;
	kind: ToastKind;
	label: string;
	message?: string;
	amount?: number;
	suffix?: string;
}

export class Notifications {
	toasts = $state<Toast[]>([]);

	push(toast: Omit<Toast, 'id'>): string {
		const id = uuid();
		this.toasts.push({ ...toast, id });
		return id;
	}

	dismiss(id: string): void {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	clear(): void {
		this.toasts = [];
	}
}
