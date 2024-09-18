import { EventTemplate, NostrEvent, VerifiedEvent, getEventHash, nip19, verifyEvent } from "nostr-tools";

import createDefer, { Deferred } from "../deferred";
import { getPubkeyFromDecodeResult, isHex, isHexKey } from "../../helpers/nip19";
import { Nip07Signer } from "../../types/nostr-extensions";

export default class AmberSigner implements Nip07Signer {
  static SUPPORTED = navigator.userAgent.includes("Android") && navigator.clipboard && navigator.clipboard.readText;
  private pendingRequest: Deferred<string> | null = null;
  public pubkey?: string;

  verifyEvent: typeof verifyEvent = verifyEvent;

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

  constructor() {
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      if (!this.pendingRequest || !navigator.clipboard) return;

      // read the result from the clipboard
      setTimeout(() => {
        navigator.clipboard
          .readText()
          .then((result) => this.pendingRequest?.resolve(result))
          .catch((e) => this.pendingRequest?.reject(e));
      }, 200);
    }
  };

  private async intentRequest(intent: string) {
    this.rejectPending();
    const request = createDefer<string>();
    window.open(intent, "_blank");
    // NOTE: wait 500ms before setting the pending request since the visibilitychange event fires as soon as window.open is called
    setTimeout(() => {
      this.pendingRequest = request;
    }, 500);
    const result = await request;
    if (result.length === 0) throw new Error("Empty clipboard");
    return result;
  }

  rejectPending() {
    if (this.pendingRequest) {
      this.pendingRequest.reject("Canceled");
      this.pendingRequest = null;
    }
  }

  public destroy() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  private checkSupport() {
    if (!AmberSigner.SUPPORTED) throw new Error("Cant use Amber on non-Android device");
  }

  public async getPublicKey() {
    this.checkSupport();
    if (this.pubkey) return this.pubkey;

    const result = await this.intentRequest(AmberSigner.createGetPublicKeyIntent());
    if (isHexKey(result)) {
      this.pubkey = result;
      return result;
    } else if (result.startsWith("npub") || result.startsWith("nprofile")) {
      const decode = nip19.decode(result);
      const pubkey = getPubkeyFromDecodeResult(decode);
      if (!pubkey) throw new Error("Expected npub from clipboard");
      this.pubkey = pubkey;
      return pubkey;
    }
    throw new Error("Expected clipboard to have pubkey");
  }

  public async signEvent(draft: EventTemplate & { pubkey?: string }): Promise<VerifiedEvent> {
    this.checkSupport();
    const pubkey = draft.pubkey || this.pubkey;
    if (!pubkey) throw new Error("Unknown signer pubkey");

    const draftWithId = { ...draft, id: getEventHash({ ...draft, pubkey }) };
    const sig = await this.intentRequest(AmberSigner.createSignEventIntent(draftWithId));
    if (!isHex(sig)) throw new Error("Expected hex signature");

    const event: NostrEvent = { ...draftWithId, sig, pubkey };
    if (!this.verifyEvent(event)) throw new Error("Invalid signature");
    return event;
  }

  // NIP-04
  public async nip04Encrypt(pubkey: string, plaintext: string): Promise<string> {
    this.checkSupport();
    const data = await this.intentRequest(AmberSigner.createNip04EncryptIntent(pubkey, plaintext));
    return data;
  }
  public async nip04Decrypt(pubkey: string, data: string): Promise<string> {
    this.checkSupport();
    const plaintext = await this.intentRequest(AmberSigner.createNip04DecryptIntent(pubkey, data));
    return plaintext;
  }

  // NIP-44
  public async nip44Encrypt(pubkey: string, plaintext: string): Promise<string> {
    this.checkSupport();
    const data = await this.intentRequest(AmberSigner.createNip44EncryptIntent(pubkey, plaintext));
    return data;
  }
  public async nip44Decrypt(pubkey: string, data: string): Promise<string> {
    this.checkSupport();
    const plaintext = await this.intentRequest(AmberSigner.createNip44DecryptIntent(pubkey, data));
    return plaintext;
  }

  // static methods
  static createGetPublicKeyIntent() {
    return `intent:#Intent;scheme=nostrsigner;S.compressionType=none;S.returnType=signature;S.type=get_public_key;end`;
  }
  static createSignEventIntent(draft: EventTemplate) {
    return `intent:${encodeURIComponent(
      JSON.stringify(draft),
    )}#Intent;scheme=nostrsigner;S.compressionType=none;S.returnType=signature;S.type=sign_event;end`;
  }
  static createNip04EncryptIntent(pubkey: string, plainText: string) {
    return `intent:${encodeURIComponent(
      plainText,
    )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip04_encrypt;end`;
  }
  static createNip04DecryptIntent(pubkey: string, ciphertext: string) {
    return `intent:${encodeURIComponent(
      ciphertext,
    )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip04_decrypt;end`;
  }
  static createNip44EncryptIntent(pubkey: string, plainText: string) {
    return `intent:${encodeURIComponent(
      plainText,
    )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip44_encrypt;end`;
  }
  static createNip44DecryptIntent(pubkey: string, ciphertext: string) {
    return `intent:${encodeURIComponent(
      ciphertext,
    )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip44_decrypt;end`;
  }
}
