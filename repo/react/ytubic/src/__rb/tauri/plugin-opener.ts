import { rbNote, rbProbe } from "../probe";

/**
 * Opening the system browser is recorded and dropped: the offline face must
 * never navigate away from the served document, and the recorded list lets a
 * checkpoint assert that no external navigation was attempted.
 */
export async function openUrl(url: string, _with?: string): Promise<void> {
  rbNote(rbProbe().nav, url);
}

export async function openPath(path: string, _with?: string): Promise<void> {
  rbNote(rbProbe().nav, path);
}

export async function revealItemInDir(path: string): Promise<void> {
  rbNote(rbProbe().nav, path);
}
