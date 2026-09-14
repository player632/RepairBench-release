import { rbNote, rbProbe } from "../probe";

/** Restarting the native process is recorded and dropped. */
export async function relaunch(): Promise<void> {
  rbNote(rbProbe().nav, "relaunch");
}

export async function exit(_code?: number): Promise<void> {
  rbNote(rbProbe().nav, "exit");
}
