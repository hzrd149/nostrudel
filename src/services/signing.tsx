import { nip04, getPublicKey, finishEvent } from "nostr-tools";
import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { Account } from "./account";
import db from "./db";

const decryptedKeys = new Map<string, string>();

class SigningService {
  private async getSalt() {
    let salt = await db.get("misc", "salt");
    if (salt) {
      return salt as Uint8Array;
    } else {
      const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
      await db.put("misc", newSalt, "salt");
      return newSalt;
    }
  }

  private async getKeyMaterial() {
    const password = window.prompt(
      "Enter local encryption password. This password is used to keep your secret key save.",
    );
    if (!password) throw new Error("Password required");
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
      ["encrypt", "decrypt"],
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
    if (!account.secKey) throw new Error("Account dose not have a secret key");

    const cache = decryptedKeys.get(account.pubkey);
    if (cache) return cache;

    const key = await this.getEncryptionKey();
    const decode = new TextDecoder();

    try {
      const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: account.iv }, key, account.secKey);
      const secKey = decode.decode(decrypted);
      decryptedKeys.set(account.pubkey, secKey);
      return secKey;
    } catch (e) {
      throw new Error("Failed to decrypt secret key");
    }
  }

  async requestSignature(draft: DraftNostrEvent, account: Account) {
    if (account?.readonly) throw new Error("Cant sign in readonly mode");
    if (account?.useExtension) {
      if (window.nostr) {
        const signed = await window.nostr.signEvent(draft);
        if (signed.pubkey !== account.pubkey) throw new Error("Signed with the wrong pubkey!");
        return signed;
      } else throw new Error("Missing nostr extension");
    } else if (account?.secKey) {
      const secKey = await this.decryptSecKey(account);
      const tmpDraft = { ...draft, pubkey: getPublicKey(secKey) };
      const event = finishEvent(tmpDraft, secKey) as NostrEvent;

      return event;
    } else throw new Error("No signing method");
  }

  async requestDecrypt(data: string, pubkey: string, account: Account) {
    if (account?.readonly) throw new Error("Cant decrypt in readonly mode");
    if (account?.useExtension) {
      if (window.nostr) {
        if (window.nostr.nip04) {
          return await window.nostr.nip04.decrypt(pubkey, data);
        } else throw new Error("Extension dose not support decryption");
      } else throw new Error("Missing nostr extension");
    } else if (account?.secKey) {
      const secKey = await this.decryptSecKey(account);
      return await nip04.decrypt(secKey, pubkey, data);
    } else throw new Error("No decryption method");
  }

  async requestEncrypt(text: string, pubkey: string, account: Account) {
    if (account?.readonly) throw new Error("Cant encrypt in readonly mode");
    if (account?.useExtension) {
      if (window.nostr) {
        if (window.nostr.nip04) {
          return await window.nostr.nip04.encrypt(pubkey, text);
        } else throw new Error("Extension dose not support encryption");
      } else throw new Error("Missing nostr extension");
    } else if (account?.secKey) {
      const secKey = await this.decryptSecKey(account);
      return await nip04.encrypt(secKey, pubkey, text);
    } else throw new Error("No encryption method");
  }
}

const signingService = new SigningService();

export default signingService;
