export function createPortal(element: HTMLElement, elName: string) {
	const modalSlot = document.getElementById(elName);

	document.body.appendChild(element);

	return {
		destroy() {
			element.remove();
		}
	};
}
