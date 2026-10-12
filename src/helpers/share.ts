import { DEFAULT_SHARE_SERVICE } from "../const";

/** Resolves id against shareService, returning undefined unless the result is an http(s) URL */
function resolveOnService(id: string, shareService: string): string | undefined {
  try {
    const url = new URL(id, shareService);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    // shareService is not a base that can resolve id (e.g. no scheme or an opaque one); undefined makes the caller use the default service
    return undefined;
  }
}

/**
 * Builds a share link for a bech32 id on the user's share service.
 * Falls back to DEFAULT_SHARE_SERVICE when the setting is empty or is not an http(s) URL that can resolve the id,
 * because the setting is synced from other clients and is not validated on load.
 */
export function buildShareUrl(id: string, shareService?: string): string {
  return (shareService && resolveOnService(id, shareService)) || new URL(id, DEFAULT_SHARE_SERVICE).toString();
}
