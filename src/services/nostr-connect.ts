import { finalizeEvent, generateSecretKey, getPublicKey, kinds, nip04, nip19 } from "nostr-tools";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import NostrMultiSubscription from "../classes/nostr-multi-subscription";
import { getPubkeyFromDecodeResult, isHexKey, normalizeToHexPubkey } from "../helpers/nip19";
import { createSimpleQueryMap } from "../helpers/nostr/filter";
import { logger } from "../helpers/debug";
import { DraftNostrEvent, NostrEvent, isPTag } from "../types/nostr-event";
import createDefer, { Deferred } from "../classes/deferred";
import { truncatedId } from "../helpers/nostr/event";
import { NostrConnectAccount } from "./account";
import { safeRelayUrl } from "../helpers/relay";

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
}
type RequestParams = {
  [NostrConnectMethod.Connect]: [string] | [string, string] | [string, string, string];
  [NostrConnectMethod.CreateAccount]: [string, string] | [string, string, string] | [string, string, string, string];
  [NostrConnectMethod.Disconnect]: [];
  [NostrConnectMethod.GetPublicKey]: [];
  [NostrConnectMethod.SignEvent]: [string];
  [NostrConnectMethod.Nip04Encrypt]: [string, string];
  [NostrConnectMethod.Nip04Decrypt]: [string, string];
};
type ResponseResults = {
  [NostrConnectMethod.Connect]: "ack";
  [NostrConnectMethod.CreateAccount]: string;
  [NostrConnectMethod.Disconnect]: "ack";
  [NostrConnectMethod.GetPublicKey]: string;
  [NostrConnectMethod.SignEvent]: string;
  [NostrConnectMethod.Nip04Encrypt]: string;
  [NostrConnectMethod.Nip04Decrypt]: string;
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

// FIXME list all requested perms
const Perms = "nip04_encrypt,nip04_decrypt,sign_event:0,sign_event:1,sign_event:3,sign_event:4,sign_event:6,sign_event:7"

export class NostrConnectClient {
  sub: NostrMultiSubscription;
  log = logger.extend("NostrConnectClient");

  isConnected = false;
  pubkey: string;
  provider?: string;
  relays: string[];

  secretKey: string;
  publicKey: string;

  supportedMethods: NostrConnectMethod[] | undefined;

  constructor(pubkey: string, relays: string[], secretKey?: string, provider?: string) {
    this.sub = new NostrMultiSubscription(`${truncatedId(pubkey)}-nostr-connect`);
    this.pubkey = pubkey;
    this.relays = relays;
    this.provider = provider;

    this.secretKey = secretKey || bytesToHex(generateSecretKey());
    this.publicKey = getPublicKey(hexToBytes(this.secretKey));

    this.sub.onEvent.subscribe((e) => this.handleEvent(e));
    this.sub.setQueryMap(
      createSimpleQueryMap(this.relays, {
        kinds: [kinds.NostrConnect, 24134],
        "#p": [this.publicKey],
      }),
    );
  }

  async open() {
    this.sub.open();
    await this.sub.waitForConnection();
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
    if (this.provider && event.pubkey !== this.provider) return;

    const to = event.tags.find(isPTag)?.[1];
    if (!to) return;

    try {
      const responseStr = await nip04.decrypt(this.secretKey, event.pubkey, event.content);
      const response = JSON.parse(responseStr);
      if (response.id) {
        const p = this.requests.get(response.id);
        if (!p) return;
        if (response.error) {
          this.log("Got Error", response.id, response.result, response.error);
          if (response.result === "auth_url") {
            if (!this.auths.has(response.id)) {
              this.auths.add(response.id)
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
    const id = nanoid(8);
    const request: NostrConnectRequest<T> = { id, method, params };
    const encrypted = await nip04.encrypt(this.secretKey, this.pubkey, JSON.stringify(request));
    const event = this.createEvent(encrypted, this.pubkey, kind);
    this.log(`Sending request ${id} (${method}) ${JSON.stringify(params)}`, event);
    this.sub.sendAll(event);

    const p = createDefer<ResponseResults[T]>();
    this.requests.set(id, p);
    return p;
  }
  private async makeAdminRequest<T extends NostrConnectMethod>(
    method: T,
    params: RequestParams[T],
    kind = 24134,
  ): Promise<ResponseResults[T]> {
    if (!this.provider) throw new Error("Missing provider");
    const id = nanoid(8);
    const request: NostrConnectRequest<T> = { id, method, params };
    const encrypted = await nip04.encrypt(this.secretKey, this.provider, JSON.stringify(request));
    const event = this.createEvent(encrypted, this.provider, kind);
    this.log(`Sending admin request ${id} (${method}) ${JSON.stringify(params)}`, event);
    this.sub.sendAll(event);

    const p = createDefer<ResponseResults[T]>();
    this.requests.set(id, p);
    return p;
  }

  async connect(token?: string) {
    await this.open();
    try {
      const result = await this.makeRequest(
        NostrConnectMethod.Connect,
        [this.pubkey, token || '', Perms],
      );
      this.isConnected = true;
      return result;
    } catch (e) {
      this.isConnected = false;
      this.close();
      throw e;
    }
  }

  async createAccount(name: string, domain: string, email?: string) {
    await this.open();

    try {
      const newPubkey = await this.makeAdminRequest(
        NostrConnectMethod.CreateAccount,
        [name, domain, email || '', Perms],
      );
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
  getPublicKey() {
    return this.makeRequest(NostrConnectMethod.GetPublicKey, []);
  }
  async signEvent(draft: DraftNostrEvent) {
    const eventString = await this.makeRequest(NostrConnectMethod.SignEvent, [JSON.stringify(draft)]);
    return JSON.parse(eventString) as NostrEvent;
  }
  nip04Encrypt(pubkey: string, plaintext: string) {
    return this.makeRequest(NostrConnectMethod.Nip04Encrypt, [pubkey, plaintext]);
  }
  async nip04Decrypt(pubkey: string, data: string) {
    const plaintext = await this.makeRequest(NostrConnectMethod.Nip04Decrypt, [pubkey, data]);
    if (plaintext.startsWith('["') && plaintext.endsWith('"]')) return JSON.parse(plaintext)[0] as string;
    else return plaintext;
  }
}

class NostrConnectService {
  log = logger.extend("NostrConnect");
  clients: NostrConnectClient[] = [];

  getClient(pubkey: string) {
    return this.clients.find((client) => client.pubkey === pubkey);
  }
  saveClient(client: NostrConnectClient) {
    if (!this.clients.includes(client)) this.clients.push(client);
  }

  createClient(pubkey: string, relays: string[], secretKey?: string, provider?: string) {
    if (this.getClient(pubkey)) throw new Error("A client for that pubkey already exists");

    const client = new NostrConnectClient(pubkey, relays, secretKey, provider);
    client.log = this.log.extend(pubkey);

    this.log(`Created client for ${pubkey} using ${relays.join(", ")}`);

    return client;
  }

  fromHostedBunker(pubkey: string, relays: string[], provider?: string) {
    return this.getClient(pubkey) || this.createClient(pubkey, relays, undefined, provider);
  }
  /** create client from: pubkey@wss://relay.com (with optional bunker://) */
  fromBunkerAddress(address: string) {
    const parts = address.replace("bunker://", "").split("@");
    if (parts.length !== 2) throw new Error("Invalid bunker address");
    const pubkey = normalizeToHexPubkey(parts[0]);
    const pathRelay = safeRelayUrl("wss://" + parts[1]);
    if (!pathRelay) throw new Error("Missing relay");
    if (!pubkey || !isHexKey(pubkey)) throw new Error("Missing pubkey");

    return this.getClient(pubkey) || this.createClient(pubkey, [pathRelay]);
  }
  /** create client from: bunker://<pubkey>?relay=<relay> */
  fromBunkerURI(uri: string) {
    const url = new URL(uri);

    // firefox puts pubkey part in host, chrome puts pubkey in pathname
    const pubkey = url.host || url.pathname.replace("//", "");
    if (!isHexKey(pubkey)) throw new Error("Invalid connection URI");
    const relays = url.searchParams.getAll("relay");
    if (relays.length === 0) throw new Error("Missing relays");

    return this.getClient(pubkey) || this.createClient(pubkey, relays);
  }
  /** create client from: pubkey#token */
  fromBunkerToken(pubkeyWithToken: string) {
    const [npub, hexToken] = pubkeyWithToken.split("#");
    const decoded = nip19.decode(npub);
    const pubkey = getPubkeyFromDecodeResult(decoded);
    if (!pubkey) throw new Error("Cant find pubkey");
    const relays = ["wss://relay.nsecbunker.com", "wss://nos.lol"];
    if (relays.length === 0) throw new Error("Missing relays");

    const client = this.getClient(pubkey) || this.createClient(pubkey, relays);
    return client;
  }
  /** create client from NIP-05 */
  fromAccount(account: NostrConnectAccount) {
    const existingClient = this.getClient(account.pubkey);
    if (existingClient) return existingClient;

    const client = this.createClient(account.pubkey, account.signerRelays, account.clientSecretKey);

    // presume the client has already connected
    this.saveClient(client);

    return client;
  }
}

const nostrConnectService = new NostrConnectService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.nostrConnectService = nostrConnectService;
}

export default nostrConnectService;
