import { EventTemplate, finalizeEvent, getPublicKey, nip04, nip44 } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { encrypt, decrypt } from "nostr-tools/nip49";

import { Nip07Signer } from "../../types/nostr-extensions";
import createDefer, { Deferred } from "../deferred";
import db from "../../services/db";

async function getSalt() {
  let salt = await db.get("misc", "salt");
  if (salt) {
    return salt as Uint8Array;
  } else {
    const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
    await db.put("misc", newSalt, "salt");
    return newSalt;
  }
}

const encoder = new TextEncoder();
async function getKeyMaterial(password: string) {
  return await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
    "deriveKey",
  ]);
}

async function getEncryptionKey(password: string) {
  const salt = await getSalt();
  const keyMaterial = await getKeyMaterial(password);
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/** @deprecated */
async function subltCryptoEncryptSecKey(key: Uint8Array, password: string) {
  const encryptionKey = await getEncryptionKey(password);
  const encode = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(96));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    encode.encode(bytesToHex(key)),
  );

  return {
    buffer: encrypted,
    iv,
  };
}

/** @deprecated */
async function subltCryptoDecryptSecKey(buffer: ArrayBuffer, iv: Uint8Array, password: string) {
  const encryptionKey = await getEncryptionKey(password);
  const decode = new TextDecoder();

  try {
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, encryptionKey, buffer);
    const key = decode.decode(decrypted);
    return hexToBytes(key);
  } catch (e) {
    console.log(e);
    throw new Error("Failed to decrypt secret key");
  }
}

export default class PasswordSigner implements Nip07Signer {
  key: Uint8Array | null = null;

  // legacy
  buffer?: ArrayBuffer;
  iv?: Uint8Array;

  ncryptsec?: string;

  nip04?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;
  nip44?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;

  get unlocked() {
    return !!this.key;
  }

  constructor() {
    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  unlockPromise?: Deferred<void>;
  private requestUnlock() {
    if (this.key) return;
    if (this.unlockPromise) return this.unlockPromise;
    const p = createDefer<void>();
    this.unlockPromise = p;
    return p;
  }

  public async setPassword(password: string) {
    if (!this.key) throw new Error("Cant set password until unlocked");

    // const { iv, buffer } = await subltCryptoEncryptSecKey(this.key, password);
    // this.iv = iv;
    // this.buffer = buffer;
    this.ncryptsec = encrypt(this.key, password);
  }

  public async unlock(password: string) {
    if (this.key) return;

    if (this.ncryptsec) {
      this.key = decrypt(this.ncryptsec, password);
      if (!this.key) throw new Error("Failed to decrypt key");
    } else if (this.buffer && this.iv) {
      this.key = await subltCryptoDecryptSecKey(this.buffer, this.iv, password);
      this.unlockPromise?.resolve();
      this.setPassword(password);
    } else throw new Error("Missing array buffer and iv");
  }

  // public methods
  public async getPublicKey() {
    await this.requestUnlock();
    return getPublicKey(this.key!);
  }
  public async signEvent(event: EventTemplate) {
    await this.requestUnlock();
    return finalizeEvent(event, this.key!);
  }

  // NIP-04
  async nip04Encrypt(pubkey: string, plaintext: string) {
    await this.requestUnlock();
    return nip04.encrypt(this.key!, pubkey, plaintext);
  }
  async nip04Decrypt(pubkey: string, ciphertext: string) {
    await this.requestUnlock();
    return nip04.decrypt(this.key!, pubkey, ciphertext);
  }

  // NIP-44
  async nip44Encrypt(pubkey: string, plaintext: string) {
    await this.requestUnlock();
    return nip44.v2.encrypt(plaintext, nip44.v2.utils.getConversationKey(this.key!, pubkey));
  }
  async nip44Decrypt(pubkey: string, ciphertext: string) {
    await this.requestUnlock();
    return nip44.v2.decrypt(ciphertext, nip44.v2.utils.getConversationKey(this.key!, pubkey));
  }
}
