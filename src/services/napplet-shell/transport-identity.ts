import localforage from "localforage";
import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip44,
  type EventTemplate,
  type NostrEvent,
} from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

export type NappletTransportSigner = {
  getPublicKey(): Promise<string>;
  signEvent(event: EventTemplate): Promise<NostrEvent>;
  nip44: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
};

const storage = localforage.createInstance({ name: "napplet-transport-identities" });
const signers = new Map<string, NappletTransportSigner>();

// WebRTC and CVM share a local transport key per app, independent of the account signer.
export function getNappletTransportSigner(appIdentity: string): NappletTransportSigner {
  const existing = signers.get(appIdentity);
  if (existing) return existing;

  const loadKey = async () => {
    const stored = await storage.getItem<string>(appIdentity);
    if (stored !== null) {
      if (typeof stored !== "string" || !/^[a-f0-9]{64}$/.test(stored))
        throw new Error("Invalid local napplet transport identity");
      const key = hexToBytes(stored);
      getPublicKey(key);
      return key;
    }
    const key = generateSecretKey();
    await storage.setItem(appIdentity, bytesToHex(key));
    return key;
  };
  const loadWithLock = async () => {
    if (typeof navigator !== "undefined" && navigator.locks)
      return await navigator.locks.request(`nostrudel:napplet-transport:${appIdentity}`, loadKey);
    return await loadKey();
  };
  let pending: Promise<Uint8Array> | undefined;
  const getKey = () => {
    pending ??= loadWithLock().catch((error) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };

  const signer: NappletTransportSigner = {
    getPublicKey: async () => getPublicKey(await getKey()),
    signEvent: async (event) => finalizeEvent(event, await getKey()),
    nip44: {
      encrypt: async (pubkey, plaintext) =>
        nip44.v2.encrypt(plaintext, nip44.v2.utils.getConversationKey(await getKey(), pubkey)),
      decrypt: async (pubkey, ciphertext) =>
        nip44.v2.decrypt(ciphertext, nip44.v2.utils.getConversationKey(await getKey(), pubkey)),
    },
  };
  signers.set(appIdentity, signer);
  return signer;
}
