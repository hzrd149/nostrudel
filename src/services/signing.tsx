import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { Account } from "./account";
import { getPublicKey } from "nostr-tools/keys";
import { signEvent, getEventHash } from "nostr-tools/event";
import db from "./db";

class SigningService {
  private async getSalt() {
    let salt = await db.get("settings", "salt");
    if (salt) {
      return salt as Uint8Array;
    } else {
      const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
      await db.put("settings", newSalt, "salt");
      return newSalt;
    }
  }

  private async getKeyMaterial() {
    const password = window.prompt("Enter local encryption password");
    if (!password) throw new Error("password required");
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"]);
  }
  private async getEncryptionKey() {
    const salt = await this.getSalt();
    const keyMaterial = await this.getKeyMaterial();
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
      ["encrypt", "decrypt"]
    );
  }

  async encryptSecKey(secKey: string) {
    const key = await this.getEncryptionKey();
    const encode = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(96));

    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode.encode(secKey));

    return {
      secKey: encrypted,
      iv,
    };
  }

  async decryptSecKey(account: Account) {
    if (!account.secKey) throw new Error("account dose not have a secret key");
    const key = await this.getEncryptionKey();
    const decode = new TextDecoder();

    try {
      const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: account.iv }, key, account.secKey);
      return decode.decode(decrypted);
    } catch (e) {
      throw new Error("failed to decrypt secret key");
    }
  }

  async requestSignature(draft: DraftNostrEvent, account: Account) {
    if (account?.readonly) throw new Error("cant sign in readonly mode");
    if (account?.useExtension) {
      if (window.nostr) {
        const signed = await window.nostr.signEvent(draft);
        if (signed.pubkey !== account.pubkey) throw new Error("signed with the wrong pubkey!");
        return signed;
      } else throw new Error("missing nostr extension");
    } else if (account?.secKey) {
      const secKey = await this.decryptSecKey(account);
      const tmpDraft = { ...draft, pubkey: getPublicKey(secKey) };
      const signature = signEvent(tmpDraft, secKey);
      const event: NostrEvent = {
        ...tmpDraft,
        id: getEventHash(tmpDraft),
        sig: signature,
      };

      return event;
    } else throw new Error("no signing method");
  }
}

const signingService = new SigningService();

export default signingService;
