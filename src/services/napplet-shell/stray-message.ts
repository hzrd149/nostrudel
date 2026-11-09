const MAX_KEYS = 6;

/**
 * Summarises a stray window-level message from a napplet frame, without its payload.
 * NIP-5D frames may only post the single `napplet.hello`, so anything else usually comes from an old
 * napplet SDK or a browser extension content script running inside the frame.
 */
export function describeStrayMessage(data: unknown): string {
  if (data === null || typeof data !== "object") return typeof data;
  const record = data as Record<string, unknown>;
  for (const field of ["type", "source", "method", "action"]) {
    if (typeof record[field] === "string") return `${field} "${record[field]}"`;
  }
  const keys = Object.keys(record);
  const shown = keys.slice(0, MAX_KEYS).join(", ");
  return `{${shown}${keys.length > MAX_KEYS ? ", …" : ""}}`;
}
