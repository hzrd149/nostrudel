import { NostrEvent } from "nostr-tools";
import { getTagValue } from "applesauce-core/helpers";

/** Kind 1063 file metadata events that contain a .xdc attachment */
export const WEBXDC_KIND = 1063;

/** Kind 4932 persistent state update events */
export const WEBXDC_UPDATE_KIND = 4932;

/** Kind 20932 ephemeral realtime data events */
export const WEBXDC_REALTIME_KIND = 20932;

/** MIME type for webxdc apps */
export const WEBXDC_MIME_TYPE = "application/x-webxdc";

/** Extract the webxdc coordination identifier from a kind 1063 event */
export function getWebxdcId(event: NostrEvent): string | undefined {
  return getTagValue(event, "webxdc");
}

/** Extract the URL of the .xdc file from a kind 1063 event */
export function getWebxdcUrl(event: NostrEvent): string | undefined {
  return getTagValue(event, "url");
}

/** Get the display name for a webxdc app */
export function getWebxdcName(event: NostrEvent): string {
  const name = getTagValue(event, "name") || getTagValue(event, "alt");
  if (name) {
    // Strip "Webxdc app: " prefix if present (from NIP-DC spec alt tag format)
    return name.replace(/^Webxdc app:\s*/i, "");
  }
  // Fall back to filename from URL
  const url = getWebxdcUrl(event);
  if (url) {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split("/").pop() || "";
      return filename.replace(/\.xdc$/i, "") || "Webxdc App";
    } catch {
      /* ignore */
    }
  }
  return "Webxdc App";
}

/** Get the SHA-256 hash of the .xdc file for integrity verification */
export function getWebxdcHash(event: NostrEvent): string | undefined {
  return getTagValue(event, "x");
}

/** Get the thumbnail/icon image URL */
export function getWebxdcImage(event: NostrEvent): string | undefined {
  return getTagValue(event, "image") || getTagValue(event, "thumb");
}

/** Get the summary/description */
export function getWebxdcSummary(event: NostrEvent): string | undefined {
  return getTagValue(event, "summary") || event.content || undefined;
}

/** Validate that an event is a proper webxdc kind 1063 event */
export function validateWebxdc(event: NostrEvent): boolean {
  try {
    if (event.kind !== WEBXDC_KIND) return false;
    const mimeType = getTagValue(event, "m");
    if (mimeType !== WEBXDC_MIME_TYPE) return false;
    const url = getWebxdcUrl(event);
    if (!url) return false;
    return true;
  } catch {
    return false;
  }
}

/** Check if a URL points to a .xdc file */
export function isWebxdcUrl(url: URL | string): boolean {
  try {
    const urlObj = typeof url === "string" ? new URL(url) : url;
    return urlObj.pathname.toLowerCase().endsWith(".xdc");
  } catch {
    return false;
  }
}

/**
 * Get the webxdc identifier from a kind 4932 or 20932 state update event.
 * This is stored in the "i" tag.
 */
export function getWebxdcUpdateId(event: NostrEvent): string | undefined {
  return getTagValue(event, "i");
}
