import {
  EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  kinds,
  nip04,
  NostrEvent,
  verifyEvent,
} from "nostr-tools";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import MultiSubscription from "../multi-subscription";
import { logger } from "../../helpers/debug";
import createDefer, { Deferred } from "../deferred";
import { Nip07Signer } from "../../types/nostr-extensions";

export function isErrorResponse(response: any): response is NostrConnectErrorResponse {
  return !!response.error;
}

export enum NostrConnectMethod {
  Connect = "connect",
  CreateAccount = "create_account",
  Disconnect = "disconnect",
  GetPublicKey = "get_pubic_key",
  SignEvent = "sign_event",
  Nip04Encrypt = "nip04_encrypt",
  Nip04Decrypt = "nip04_decrypt",
  Nip44Encrypt = "nip44_encrypt",
  Nip44Decrypt = "nip44_decrypt",
}
type RequestParams = {
  [NostrConnectMethod.Connect]: [string] | [string, string] | [string, string, string];
  [NostrConnectMethod.CreateAccount]: [string, string] | [string, string, string] | [string, string, string, string];
  [NostrConnectMethod.Disconnect]: [];
  [NostrConnectMethod.GetPublicKey]: [];
  [NostrConnectMethod.SignEvent]: [string];
  [NostrConnectMethod.Nip04Encrypt]: [string, string];
  [NostrConnectMethod.Nip04Decrypt]: [string, string];
  [NostrConnectMethod.Nip44Encrypt]: [string, string];
  [NostrConnectMethod.Nip44Decrypt]: [string, string];
};
type ResponseResults = {
  [NostrConnectMethod.Connect]: "ack";
  [NostrConnectMethod.CreateAccount]: string;
  [NostrConnectMethod.Disconnect]: "ack";
  [NostrConnectMethod.GetPublicKey]: string;
  [NostrConnectMethod.SignEvent]: string;
  [NostrConnectMethod.Nip04Encrypt]: string;
  [NostrConnectMethod.Nip04Decrypt]: string;
  [NostrConnectMethod.Nip44Encrypt]: string;
  [NostrConnectMethod.Nip44Decrypt]: string;
};
export type NostrConnectRequest<N extends NostrConnectMethod> = { id: string; method: N; params: RequestParams[N] };
export type NostrConnectResponse<N extends NostrConnectMethod> = {
  id: string;
  result: ResponseResults[N];
  error?: string;
};
export type NostrConnectErrorResponse = {
  id: string;
  result: string;
  error: string;
};

export default class NostrConnectSigner implements Nip07Signer {
  sub: MultiSubscription;
  log = logger.extend("NostrConnectSigner");

  isConnected = false;
  /** remote user pubkey */
  pubkey?: string;
  provider?: string;
  relays: string[];

  secretKey: string;
  publicKey: string;

  verifyEvent: typeof verifyEvent = verifyEvent;

  supportedMethods: NostrConnectMethod[] | undefined;

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

  constructor(pubkey?: string, relays: string[] = [], secretKey?: string, provider?: string) {
    this.sub = new MultiSubscription(`${pubkey || "unknown"}-nostr-connect`);
    this.pubkey = pubkey;
    this.relays = relays;
    this.provider = provider;

    this.secretKey = secretKey || bytesToHex(generateSecretKey());
    this.publicKey = getPublicKey(hexToBytes(this.secretKey));

    this.sub.onEvent.subscribe((e) => this.handleEvent(e));
    this.sub.setRelays(this.relays);
    this.sub.setFilters([
      {
        kinds: [kinds.NostrConnect],
        "#p": [this.publicKey],
      },
    ]);

    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  async open() {
    this.sub.open();
    await this.sub.waitForAllConnection();
    this.log("Connected to relays", this.relays);
  }
  close() {
    this.sub.close();
  }

  handleAuthURL(url: string) {
    const popup = window.open(
      url,
      "auth",
      "width=400,height=600,resizable=no,status=no,location=no,toolbar=no,menubar=no",
    );
  }

  private requests = new Map<string, Deferred<any>>();
  private auths = new Set<string>();
  async handleEvent(event: NostrEvent) {
    if (!this.verifyEvent(event)) return;
    if (this.provider && event.pubkey !== this.provider) return;

    const to = event.tags.find((t) => t[0] === "p" && t[1])?.[1];
    if (!to) return;

    try {
      const responseStr = await nip04.decrypt(this.secretKey, event.pubkey, event.content);
      const response = JSON.parse(responseStr);

      // handle client connections
      if (!this.pubkey && response.result === "ack") {
        this.log("Got ack response from", event.pubkey);
        this.pubkey = event.pubkey;
        this.sub.name = `${event.pubkey}-nostr-connect`;
        this.isConnected = true;
        this.listenPromise?.resolve(response.result);
        this.listenPromise = null;
        return;
      }

      if (response.id) {
        const p = this.requests.get(response.id);
        if (!p) return;
        if (response.error) {
          this.log("Got Error", response.id, response.result, response.error);
          if (response.result === "auth_url") {
            if (!this.auths.has(response.id)) {
              this.auths.add(response.id);
              try {
                await this.handleAuthURL(response.error);
              } catch (e) {
                p.reject(e);
              }
            }
          } else p.reject(response);
        } else if (response.result) {
          this.log("Got Response", response.id, response.result);
          p.resolve(response.result);
        }
      }
    } catch (e) {}
  }

  private createEvent(content: string, target = this.pubkey, kind = kinds.NostrConnect) {
    if (!target) throw new Error("invalid target pubkey");
    return finalizeEvent(
      {
        kind,
        created_at: dayjs().unix(),
        tags: [["p", target]],
        content,
      },
      hexToBytes(this.secretKey),
    );
  }
  private async makeRequest<T extends NostrConnectMethod>(
    method: T,
    params: RequestParams[T],
    kind = kinds.NostrConnect,
  ): Promise<ResponseResults[T]> {
    if (!this.pubkey) throw new Error("pubkey not set");
    const id = nanoid(8);
    const request: NostrConnectRequest<T> = { id, method, params };
    const encrypted = await nip04.encrypt(this.secretKey, this.pubkey, JSON.stringify(request));
    const event = this.createEvent(encrypted, this.pubkey, kind);
    this.log(`Sending request ${id} (${method}) ${JSON.stringify(params)}`, event);
    this.sub.publish(event);

    const p = createDefer<ResponseResults[T]>();
    this.requests.set(id, p);
    return p;
  }
  private async makeAdminRequest<T extends NostrConnectMethod>(
    method: T,
    params: RequestParams[T],
    kind = 24133,
  ): Promise<ResponseResults[T]> {
    if (!this.provider) throw new Error("Missing provider");
    const id = nanoid(8);
    const request: NostrConnectRequest<T> = { id, method, params };
    const encrypted = await nip04.encrypt(this.secretKey, this.provider, JSON.stringify(request));
    const event = this.createEvent(encrypted, this.provider, kind);
    this.log(`Sending admin request ${id} (${method}) ${JSON.stringify(params)}`, event);
    this.sub.publish(event);

    const p = createDefer<ResponseResults[T]>();
    this.requests.set(id, p);
    return p;
  }

  async connect(token?: string, permissions?: string[]) {
    if (!this.pubkey) throw new Error("pubkey not set");
    await this.open();
    try {
      const result = await this.makeRequest(NostrConnectMethod.Connect, [
        this.pubkey,
        token || "",
        permissions?.join(",") ?? "",
      ]);
      this.isConnected = true;
      return result;
    } catch (e) {
      this.isConnected = false;
      this.close();
      throw e;
    }
  }

  listenPromise: Deferred<"ack"> | null = null;
  listen(): Promise<"ack"> {
    if (this.pubkey) throw new Error("Cant listen if there is already a pubkey");
    this.open();
    this.listenPromise = createDefer();
    return this.listenPromise;
  }

  async createAccount(name: string, domain: string, email?: string, permissions?: string[]) {
    await this.open();

    try {
      const newPubkey = await this.makeAdminRequest(NostrConnectMethod.CreateAccount, [
        name,
        domain,
        email || "",
        permissions?.join(",") ?? "",
      ]);
      this.pubkey = newPubkey;
      this.isConnected = true;
      return newPubkey;
    } catch (e) {
      this.isConnected = false;
      this.close();
      throw e;
    }
  }
  ensureConnected() {
    if (!this.isConnected) return this.connect();
  }
  disconnect() {
    return this.makeRequest(NostrConnectMethod.Disconnect, []);
  }

  async getPublicKey() {
    await this.ensureConnected();
    return this.makeRequest(NostrConnectMethod.GetPublicKey, []);
  }
  async signEvent(template: EventTemplate & { pubkey?: string }) {
    await this.ensureConnected();
    const eventString = await this.makeRequest(NostrConnectMethod.SignEvent, [JSON.stringify(template)]);
    const event = JSON.parse(eventString) as NostrEvent;
    if (!this.verifyEvent(event)) throw new Error("Invalid event");
    return event;
  }

  // NIP-04
  async nip04Encrypt(pubkey: string, plaintext: string) {
    await this.ensureConnected();
    return this.makeRequest(NostrConnectMethod.Nip04Encrypt, [pubkey, plaintext]);
  }
  async nip04Decrypt(pubkey: string, ciphertext: string) {
    await this.ensureConnected();
    const plaintext = await this.makeRequest(NostrConnectMethod.Nip04Decrypt, [pubkey, ciphertext]);

    // NOTE: not sure why this is here, best guess is some signer used to return results as '["plaintext"]'
    if (plaintext.startsWith('["') && plaintext.endsWith('"]')) return JSON.parse(plaintext)[0] as string;

    return plaintext;
  }

  // NIP-44
  async nip44Encrypt(pubkey: string, plaintext: string) {
    await this.ensureConnected();
    return this.makeRequest(NostrConnectMethod.Nip44Encrypt, [pubkey, plaintext]);
  }
  async nip44Decrypt(pubkey: string, ciphertext: string) {
    await this.ensureConnected();
    const plaintext = await this.makeRequest(NostrConnectMethod.Nip44Decrypt, [pubkey, ciphertext]);

    // NOTE: not sure why this is here, best guess is some signer used to return results as '["plaintext"]'
    if (plaintext.startsWith('["') && plaintext.endsWith('"]')) return JSON.parse(plaintext)[0] as string;

    return plaintext;
  }
}
