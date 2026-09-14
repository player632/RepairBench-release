import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'fallback.html',
			precompress: false,
			strict: false
		}),
		// Let SvelteKit bundle the service worker but we register manually
		serviceWorker: {
			register: false
		},
		// Force prerendering for static build
		prerender: {
			entries: ['*']
		}
	}
};

export default config;

