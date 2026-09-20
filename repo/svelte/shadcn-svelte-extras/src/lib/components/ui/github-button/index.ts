import Root from './github-button.svelte';

/**
 * Get the stars for a GitHub repository using the ungh.cc API.
 *
 * @example
 * ```ts
 * const stars = await getStars({ owner: 'ieedan', repo: 'shadcn-svelte-extras', fallback: 539 });
 * ```
 *
 * @param owner - The owner of the repository
 * @param repoName - The name of the repository
 * @param fallback - The fallback value to return if the request fails
 * @returns
 */
export async function getStars({
	owner,
	repo: repoName,
	fallback = 0
}: {
	owner: string;
	repo: string;
	fallback?: number;
}) {
	// RepairBench offline adaptation (environment/adaptation.patch): ungh.cc is an external face and
	// this call is reached from src/lib/components/site-header.svelte:17 on EVERY page, so the star
	// count is never fetched. The caller's fallback is returned unchanged, which is the value the
	// seed already shows whenever the request fails. See meta.external_face, guards P17 / P18.
	void owner;
	void repoName;
	return fallback;
}

export { Root as GitHubButton };
