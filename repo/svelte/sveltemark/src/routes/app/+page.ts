import type { PageLoad } from './$types';

// Static-hosting adaptation: app state lives client-side (IndexedDB/localStorage),
// so the route prerenders like any other page.
export const prerender = true;

// Enable server-side rendering for initial SEO but rely on CSR for functionality
// This ensures search engines can index the page while maintaining full client-side app capabilities
export const ssr = true;

// Enable client-side rendering - the actual app runs entirely client-side
export const csr = true;

// Export load function for SSR compatibility
// The actual app state is managed client-side via IndexedDB and localStorage
export const load: PageLoad = async () => {
    return {
        // Signal that this is the editor app
        isEditorApp: true,
        // Timestamp for cache busting
        loadedAt: new Date().toISOString()
    };
};
