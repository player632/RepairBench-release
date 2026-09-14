const proxy = {
	'/dev/': {
		// --- harness adaptation (AD-4) ---
		// @cool-vue/vite-plugin@8.2.2 reads THIS FILE's `const value = 'dev'` (getProxyTarget,
		// node_modules/@cool-vue/vite-plugin/dist/index.js:1417-1432), takes proxy['/dev/'].target and
		// issues three real HTTP GETs at build time - /admin/base/open/eps (:812), <p>/dict/info/types
		// (:1322) and /admin/base/comm/program (:1632), each with a 5 s timeout and a silent catch.
		// Upstream points that at http://127.0.0.1:8001, i.e. at whatever happens to be listening on
		// the developer's own loopback: the build measured for this package answered only because
		// nothing was listening. On a lane box where some other process owns 8001 the plugin would
		// OVERWRITE the local build/cool/eps.json truth with remote content and the artifact would
		// drift run to run. Port 1 cannot be bound without root, so the three probes are guaranteed to
		// fail fast and identically on every machine, and the local eps.json stays authoritative.
		// The '/prod/' entry below is left byte-identical: it only feeds config.host, which a
		// production build never requests.
		target: 'http://127.0.0.1:1',
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/dev/, '')
	},

	'/prod/': {
		target: 'https://show.cool-admin.com',
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/prod/, '/api')
	}
};

const value = 'dev';
const host = proxy[`/${value}/`]?.target;

export { proxy, host, value };
