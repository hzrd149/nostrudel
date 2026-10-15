import { RelayInformationCache } from "applesauce-relay";
import { RelayInformation } from "nostr-tools/nip11";

import db from "./database";

type CachedInformation = { document: RelayInformation; expires: number };

/** Shares expiring NIP-11 documents with Applesauce using the existing cache database. */
export const relayInformationCache: RelayInformationCache = {
  async get(key) {
    const cached: CachedInformation | undefined = await db.get("relayInfo", key);
    // Legacy entries have no expiry; fetch a fresh document instead of retaining them forever.
    if (!cached?.expires || cached.expires <= Date.now()) return undefined;
    return cached.document;
  },
  async set(key, document, ttl) {
    await db.put("relayInfo", { document, expires: Date.now() + ttl } satisfies CachedInformation, key);
  },
};
