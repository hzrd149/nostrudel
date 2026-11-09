import { getRumorGiftWraps, type Rumor } from "applesauce-common/helpers";
import { unixNow } from "applesauce-core/helpers";
import { kinds, type NostrEvent } from "nostr-tools";

/** NIP-40 uses integer seconds; timestamps must also fit JavaScript's date range. */
export function isValidExpiration(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000;
}

export function readMessageExpiration(message: NostrEvent | Rumor): number | undefined {
  const raw = message.tags.find((tag) => tag[0] === "expiration")?.[1];
  if (raw !== undefined) {
    const timestamp = /^\d+$/.test(raw) ? Number(raw) : NaN;
    return isValidExpiration(timestamp) ? timestamp : undefined;
  }
  if (message.kind === kinds.PrivateDirectMessage || message.kind === kinds.FileMessage) {
    for (const wrap of getRumorGiftWraps(message)) {
      const timestamp = readMessageExpiration(wrap);
      if (timestamp !== undefined) return timestamp;
    }
  }
  return undefined;
}

export function getMessageExpirationDuration(message: NostrEvent | Rumor): number | undefined {
  const timestamp = readMessageExpiration(message);
  const duration = timestamp === undefined ? undefined : timestamp - message.created_at;
  return isValidExpiration(duration) && duration > 0 ? duration : undefined;
}

/** Reject corrupt runtime preferences rather than silently sending a non-expiring message. */
export function createMessageExpiration(duration: unknown, now = unixNow()): number | undefined {
  if (duration === null || duration === undefined || duration === 0) return undefined;
  if (!isValidExpiration(duration) || duration <= 0 || !isValidExpiration(now + duration))
    throw new Error("Invalid message expiration. Select an expiration time again.");
  return now + duration;
}
