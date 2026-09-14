import { SCENES } from '$lib/components/backdrop/scenes';

export interface PreloadImage {
	src: string;
	alt: string;
}

export const PRELOAD_IMAGES: PreloadImage[] = [
	{ src: '/assets/preload/slide-1.webp', alt: '' },
	{ src: '/assets/preload/slide-2.webp', alt: '' },
	{ src: SCENES.menu.staticImage ?? SCENES.menu.image, alt: '' },
	{ src: '/assets/preload/slide-3.webp', alt: '' },
	{ src: '/assets/preload/slide-4.webp', alt: '' }
];

export const PRELOAD_URLS: string[] = PRELOAD_IMAGES.map((i) => i.src).filter((src) =>
	src.endsWith('.webp')
);
