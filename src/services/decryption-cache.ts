import Subject from "../classes/subject";
import _throttle from "lodash.throttle";

import createDefer, { Deferred } from "../classes/deferred";
import signingService from "./signing";
import accountService from "./account";
import { logger } from "../helpers/debug";

type EncryptionType = "nip04" | "nip44";

class DecryptionContainer {
  /** event id */
  id: string;
  type: "nip04" | "nip44";
  pubkey: string;
  cipherText: string;

  plaintext = new Subject<string>();
  error = new Subject<Error>();

  constructor(id: string, type: EncryptionType = "nip04", pubkey: string, cipherText: string) {
    this.id = id;
    this.pubkey = pubkey;
    this.cipherText = cipherText;
    this.type = type;
  }
}

class DecryptionCache {
  containers = new Map<string, DecryptionContainer>();
  log = logger.extend("DecryptionCache");

  getContainer(id: string) {
    return this.containers.get(id);
  }
  getOrCreateContainer(id: string, type: EncryptionType, pubkey: string, cipherText: string) {
    let container = this.containers.get(id);
    if (!container) {
      container = new DecryptionContainer(id, type, pubkey, cipherText);
      this.containers.set(id, container);
    }
    return container;
  }

  private async decryptContainer(container: DecryptionContainer) {
    const account = accountService.current.value;
    if (!account) throw new Error("Missing account");

    switch (container.type) {
      case "nip04":
        return await signingService.nip04Decrypt(container.cipherText, container.pubkey, account);
      case "nip44":
        return await signingService.nip44Decrypt(container.cipherText, container.pubkey, account);
    }
  }

  promises = new Map<DecryptionContainer, Deferred<string>>();

  private decryptQueue: DecryptionContainer[] = [];
  private decryptQueueRunning = false;
  private async decryptNext() {
    const container = this.decryptQueue.pop();
    if (!container) {
      this.decryptQueueRunning = false;
      this.decryptQueue = [];
      return;
    }

    const promise = this.promises.get(container)!;

    try {
      if (!container.plaintext.value) {
        const plaintext = await this.decryptContainer(container);

        // set plaintext
        container.plaintext.next(plaintext);
        promise.resolve(plaintext);

        // remove promise
        this.promises.delete(container);
      }

      setTimeout(() => this.decryptNext(), 100);
    } catch (e) {
      if (e instanceof Error) {
        // set error
        container.error.next(e);
        promise.reject(e);

        // clear queue
        this.decryptQueueRunning = false;
        this.decryptQueue = [];
      }
    }
  }

  startDecryptionQueue() {
    if (!this.decryptQueueRunning) {
      this.decryptQueueRunning = true;
      this.decryptNext();
    }
  }

  requestDecrypt(container: DecryptionContainer) {
    if (container.plaintext.value) return Promise.resolve(container.plaintext.value);

    let p = this.promises.get(container);
    if (!p) {
      p = createDefer<string>();
      this.promises.set(container, p);

      this.decryptQueue.unshift(container);
      this.startDecryptionQueue();
    }
    return p;
  }
}

const decryptionCacheService = new DecryptionCache();

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.decryptionCacheService = decryptionCacheService;
}

export default decryptionCacheService;
