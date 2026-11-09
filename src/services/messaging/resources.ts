import { AsyncRumorStore } from "applesauce-core/event-store";
import type { EncryptedContentCache } from "applesauce-core/helpers";
import { IndexedDBConversationIndexStore } from "applesauce-extra/messages";
import type { GiftWrapProcessingRecord, GiftWrapProcessingStore } from "applesauce-extra/gift-wrap";
import { createMessageStorage, openMessageCipher } from "./storage";
import { RumorDatabase } from "./rumor-database";
import localforage from "localforage";

async function migrateDrafts(
  pubkey: string,
  protocol: "legacy" | "wrapped",
  destination: ReturnType<typeof createMessageStorage>,
) {
  const previous = localforage.createInstance({ name: "message-drafts", storeName: `${protocol}_${pubkey}` });
  for (const key of await previous.keys()) {
    const value = await previous.getItem<string>(key);
    if (value && (await destination.strings.getItem(key)) === null) await destination.strings.setItem(key, value);
    await previous.removeItem(key);
  }
}

/** Opens sequentially so cancellation or partial initialization always closes every acquired database. */
export async function openMessagingResources(cache: EncryptedContentCache, pubkey: string, signal: AbortSignal) {
  const cleanups: (() => void)[] = [];
  const close = () => {
    for (const cleanup of cleanups.reverse()) cleanup();
    cleanups.length = 0;
  };
  try {
    const { cipher, namespace } = await openMessageCipher(cache, pubkey);
    signal.throwIfAborted();
    const database = await RumorDatabase.open(`message-rumors:${namespace}`, cipher);
    cleanups.push(() => database.close());
    signal.throwIfAborted();
    const legacyIndex = await IndexedDBConversationIndexStore.open(`message-index:legacy:${namespace}`);
    cleanups.push(() => legacyIndex.close());
    signal.throwIfAborted();
    const wrappedIndex = await IndexedDBConversationIndexStore.open(`message-index:wrapped:${namespace}`);
    cleanups.push(() => wrappedIndex.close());
    signal.throwIfAborted();
    const rumorStore = new AsyncRumorStore({ database });
    cleanups.push(() => rumorStore.dispose());
    const checkpoints = createMessageStorage(`message-checkpoints:${namespace}`, cipher);
    const processingStore: GiftWrapProcessingStore = {
      async list() {
        const records: GiftWrapProcessingRecord[] = [];
        for (const key of await checkpoints.keys()) {
          const value = await checkpoints.strings.getItem(key);
          if (value) records.push(JSON.parse(value));
        }
        return records;
      },
      async set(record) {
        await checkpoints.strings.setItem(record.eventId, JSON.stringify(record));
      },
    };
    const legacyDrafts = createMessageStorage(`message-drafts:legacy:${namespace}`, cipher);
    const wrappedDrafts = createMessageStorage(`message-drafts:wrapped:${namespace}`, cipher);
    await migrateDrafts(pubkey, "legacy", legacyDrafts);
    signal.throwIfAborted();
    await migrateDrafts(pubkey, "wrapped", wrappedDrafts);
    signal.throwIfAborted();
    return {
      legacyIndex,
      wrappedIndex,
      rumorStore,
      processingStore,
      close,
      legacyDrafts,
      wrappedDrafts,
    };
  } catch (error) {
    close();
    throw error;
  }
}
