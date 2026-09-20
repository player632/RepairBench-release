import { execSync } from 'child_process';
import site from '$lib/data/site.json';

export const prerender = true;

const URL_CHANGE_FREQUENCY = 'daily';
const URL_PRIORITY = 0.7;
let URL_LAST_MODIFICATION_DATE = new Date(0).toISOString();
try {
	URL_LAST_MODIFICATION_DATE = new Date(execSync('git log -1 --format=%cI').toString().trim()).toISOString();
} catch {
	// RepairBench offline adaptation: the materialised state tree carries no .git, so the seed's
	// module-scope `git log` throws at import time and kills `vite build` during the prerender pass
	// (this route exports prerender = true at line 4). The epoch fallback only changes a <lastmod>
	// string inside build/sitemap.xml, which nothing in this face reads or asserts.
}

export async function GET() {
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
        <urlset 
            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" 
            xmlns:xhtml="http://www.w3.org/1999/xhtml" 
            xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" 
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" 
            xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
        <url>
            <loc>${site.url}</loc>
            <changefreq>${URL_CHANGE_FREQUENCY}</changefreq>
            <priority>${URL_PRIORITY}</priority>
            <lastmod>${URL_LAST_MODIFICATION_DATE}</lastmod>
        </url>
        </urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	);
}
