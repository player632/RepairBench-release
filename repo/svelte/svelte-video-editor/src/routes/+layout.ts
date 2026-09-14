// Demo/docs harness is fully static; prerender every route at build time.
export const prerender = true;

// Directory-style static output (/simple/index.html) so the repair-bench
// static server resolves extension-less route paths directly (its SPA
// fallback would otherwise serve the landing page for /simple).
export const trailingSlash = 'always';
