import { resolveNapplet as resolveManifest, type ResolveNappletOptions } from "@kehto/nip/5d";

import { parseNappletManifest } from "./napplets";

/** Reject legacy manifests before fetching; Kehto owns signature and artifact verification. */
export async function resolveNapplet(options: ResolveNappletOptions) {
  parseNappletManifest(options.event);
  return resolveManifest(options);
}
