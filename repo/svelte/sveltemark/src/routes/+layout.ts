// Static-hosting adaptation: prerender every route at build time so the
// adapter-static output runs from a plain static server (no server runtime,
// no /__data.json round-trips for the LayoutServerLoad data).
export const prerender = true;

// Enable SSR for SEO (pages are rendered on each request)
export const ssr = true;

// Enable client-side rendering for SPA-like navigation after initial load
export const csr = true;

// Trailing slash handling: 'always' so prerendered pages land at <route>/index.html,
// which plain static servers (dir -> dir/index.html) serve without extra mapping.
export const trailingSlash = 'always';
