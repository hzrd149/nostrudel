import { gcm } from "@noble/ciphers/aes.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";
import type { EncryptedContentCache } from "applesauce-core/helpers";
import type { MessageFileStorage, MessageStorage } from "applesauce-extra/messages";
import localforage from "localforage";

export type EncryptedValue = { nonce: Uint8Array; ciphertext: Uint8Array };

/** A per-account data key, protected by the application's existing cache password when enabled. */
export class MessageCipher {
  constructor(private readonly key: Uint8Array) {}

  encrypt(bytes: Uint8Array): EncryptedValue {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    return { nonce, ciphertext: gcm(this.key, nonce).encrypt(bytes) };
  }

  decrypt(value: EncryptedValue): Uint8Array {
    return gcm(this.key, value.nonce).decrypt(value.ciphertext);
  }
}

async function readMessageCipher(cache: EncryptedContentCache, pubkey: string) {
  const name = `messaging-key:${pubkey}`;
  let saved = await cache.getItem(name);
  if (!saved) {
    saved = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    await cache.setItem(name, saved);
    // The existing encrypted cache can return false on a failed write. Never acknowledge durability then.
    if ((await cache.getItem(name)) !== saved) throw new Error("Unable to save messaging storage key");
  }
  const key = hexToBytes(saved);
  // Clearing/changing the cache creates a fresh namespace, never an index pointing at unreadable old rumors.
  const namespace = `${pubkey}:${bytesToHex(sha256(key)).slice(0, 16)}`;
  return { cipher: new MessageCipher(key), namespace };
}

const pendingKeys = new WeakMap<
  EncryptedContentCache,
  Map<string, Promise<Awaited<ReturnType<typeof readMessageCipher>>>>
>();

/** Serialize first-use key creation across tabs so two opens cannot strand messages under different keys. */
export function openMessageCipher(cache: EncryptedContentCache, pubkey: string) {
  let pending = pendingKeys.get(cache);
  if (!pending) {
    pending = new Map();
    pendingKeys.set(cache, pending);
  }
  let result = pending.get(pubkey);
  if (!result) {
    const open = () => readMessageCipher(cache, pubkey);
    const locked = async () =>
      typeof navigator !== "undefined" && navigator.locks
        ? await navigator.locks.request(`messaging-key:${pubkey}`, open)
        : await open();
    result = locked().finally(() => pending.delete(pubkey));
    pending.set(pubkey, result);
  }
  return result;
}

/** Draft text, checkpoints, and file bytes share the same encryption boundary as saved rumors. */
export function createMessageStorage(name: string, cipher: MessageCipher) {
  const database = localforage.createInstance({ name, storeName: "values" });
  const strings: MessageStorage = {
    async getItem(key) {
      const value = await database.getItem<EncryptedValue>(key);
      return value ? new TextDecoder().decode(cipher.decrypt(value)) : null;
    },
    async setItem(key, value) {
      await database.setItem(key, cipher.encrypt(new TextEncoder().encode(value)));
    },
    removeItem: (key) => database.removeItem(key),
  };
  const files: MessageFileStorage = {
    async getItem(key) {
      const value = await database.getItem<{ type: string; data: EncryptedValue }>(`file:${key}`);
      return value ? new Blob([new Uint8Array(cipher.decrypt(value.data))], { type: value.type }) : null;
    },
    async setItem(key, file) {
      await database.setItem(`file:${key}`, {
        type: file.type,
        data: cipher.encrypt(new Uint8Array(await file.arrayBuffer())),
      });
    },
    removeItem: (key) => database.removeItem(`file:${key}`),
  };
  return { strings, files, keys: () => database.keys() };
}
