/**
 * The version string is deliberately NOT one of the entries in
 * `src/lib/whats-new.ts`'s `WHATS_NEW` table. `whatsNewFor()` matches on
 * strict equality, so an unmatched version means `useWhatsNewOnUpdate()`
 * (mounted once by `src/components/layout/app-shell.tsx`) records the version
 * as seen without opening the "What's new" modal over the page - a modal would
 * sit on top of every home/search checkpoint.
 */
export const RB_OFFLINE_VERSION = "0.5.0-rb.offline";

export async function getVersion(): Promise<string> {
  return RB_OFFLINE_VERSION;
}

export async function getName(): Promise<string> {
  return "ytubic";
}
