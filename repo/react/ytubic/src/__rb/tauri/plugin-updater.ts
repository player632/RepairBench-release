/**
 * `check()` resolves `null` (= "no update available"), which is the branch
 * `src/lib/updater.ts` already handles silently. Rejecting instead would put
 * a `toast.error` over the page on the mount path.
 *
 * `Update` is only ever used as a TYPE by the seed (`let update: Update |
 * null`), but it is exported as a real class so the binding still exists at
 * runtime for bundlers that keep the import.
 */
export class Update {
  readonly available = false;
  readonly version = "0.5.0-rb.offline";
  readonly body: string | null = null;
  readonly date: string | null = null;
  readonly downloadUrl: string | null = null;

  async downloadAndInstall(_onEvent?: unknown): Promise<void> {}
  async download(_onEvent?: unknown): Promise<void> {}
  async install(): Promise<void> {}
}

export async function check(_options?: unknown): Promise<Update | null> {
  return null;
}
