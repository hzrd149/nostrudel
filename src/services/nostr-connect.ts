import { finalizeEvent, generateSecretKey, getPublicKey, nip04, nip19 } from "nostr-tools";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import NostrMultiSubscription from "../classes/nostr-multi-subscription";
import { getPubkeyFromDecodeResult, isHexKey } from "../helpers/nip19";
import { createSimpleQueryMap } from "../helpers/nostr/filter";
import { logger } from "../helpers/debug";
import { DraftNostrEvent, NostrEvent, isPTag } from "../types/nostr-event";
import createDefer, { Deferred } from "../classes/deferred";
import { truncatedId } from "../helpers/nostr/events";
import { NostrConnectAccount } from "./account";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

export enum NostrConnectMethod {
  Connect = "connect",
  Disconnect = "disconnect",
  GetPublicKey = "get_pubic_key",
  SignEvent = "sign_event",
  Nip04Encrypt = "nip04_encrypt",
  Nip04Decrypt = "nip04_decrypt",
}
type RequestParams = {
  [NostrConnectMethod.Connect]: [string] | [string, string];
  [NostrConnectMethod.Disconnect]: [];
  [NostrConnectMethod.GetPublicKey]: [];
  [NostrConnectMethod.SignEvent]: [string];
  [NostrConnectMethod.Nip04Encrypt]: [string, string];
  [NostrConnectMethod.Nip04Decrypt]: [string, string];
};
type ResponseResults = {
  [NostrConnectMethod.Connect]: "ack";
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

export class NostrConnectClient {
  sub: NostrMultiSubscription;
  log = logger.extend("NostrConnectClient");

  isConnected = false;
  pubkey: string;
  relays: string[];

  secretKey: string;
  publicKey: string;

  supportedMethods: NostrConnectMethod[] | undefined;

  constructor(pubkey: string, relays: string[], secretKey?: string) {
    this.sub = new NostrMultiSubscription(`${truncatedId(pubkey)}-nostr-connect`);
    this.pubkey = pubkey;
    this.relays = relays;

    this.secretKey = secretKey || bytesToHex(generateSecretKey());
    this.publicKey = getPublicKey(hexToBytes(this.secretKey));

    this.sub.onEvent.subscribe(this.handleEvent, this);
    this.sub.setQueryMap(createSimpleQueryMap(this.relays, { kinds: [24133], "#p": [this.publicKey] }));
  }

  open() {
    this.sub.open();
  }
  close() {
    this.sub.close();
  }

  private requests = new Map<string, Deferred<any>>();
  async handleEvent(event: NostrEvent) {
    if (event.kind !== 24133) return;

    const to = event.tags.find(isPTag)?.[1];
    if (!to) return;

    try {
      const responseStr = await nip04.decrypt(this.secretKey, this.pubkey, event.content);
      const response = JSON.parse(responseStr);
      if (response.id) {
        const p = this.requests.get(response.id);
        if (!p) return;
        if (response.error) {
          this.log(`ERROR: Got error for ${response.id}`, response);
          p.reject(new Error(response.error));
        } else if (response.result) {
          this.log(response.id, response);
          p.resolve(response.result);
        }
      }
    } catch (e) {}
  }

  private createEvent(content: string) {
    return finalizeEvent(
      {
        kind: 24133,
        created_at: dayjs().unix(),
        tags: [["p", this.pubkey]],
        content,
      },
      hexToBytes(this.secretKey),
    );
  }
  private async makeRequest<T extends NostrConnectMethod>(
    method: T,
    params: RequestParams[T],
  ): Promise<ResponseResults[T]> {
    const id = nanoid();
    const request: NostrConnectRequest<T> = { method, id, params };
    const encrypted = await nip04.encrypt(this.secretKey, this.pubkey, JSON.stringify(request));
    this.log(`Sending request ${id} (${method}) ${JSON.stringify(params)}`);
    this.sub.sendAll(this.createEvent(encrypted));

    const p = createDefer<ResponseResults[T]>();
    this.requests.set(id, p);
    return p;
  }

  connect(token?: string) {
    this.open();
    try {
      const result = this.makeRequest(NostrConnectMethod.Connect, token ? [this.publicKey, token] : [this.publicKey]);
      this.isConnected = true;
      return result;
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

  createClient(pubkey: string, relays: string[], secretKey?: string) {
    if (this.getClient(pubkey)) throw new Error("A client for that pubkey already exists");

    const client = new NostrConnectClient(pubkey, relays, secretKey);
    client.log = this.log.extend(pubkey);

    this.log(`Created client for ${pubkey} using ${relays.join(", ")}`);

    return client;
  }
  fromBunkerURI(uri: string) {
    const url = new URL(uri);

    const pubkey = url.pathname.replace(/^\/\//, "");
    if (!isHexKey(pubkey)) throw new Error("Invalid connection URI");
    const relays = url.searchParams.getAll("relay");
    if (relays.length === 0) throw new Error("Missing relays");

    return this.getClient(pubkey) || this.createClient(pubkey, relays);
  }
  fromNsecBunkerToken(token: string) {
    const [npub, hexToken] = token.split("#");
    const decoded = nip19.decode(npub);
    const pubkey = getPubkeyFromDecodeResult(decoded);
    if (!pubkey) throw new Error("Cant find pubkey");
    const relays = ["wss://relay.nsecbunker.com", "wss://nos.lol"];
    if (relays.length === 0) throw new Error("Missing relays");

    const client = this.getClient(pubkey) || this.createClient(pubkey, relays);
    return client;
  }
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
