import { nip19 } from "nostr-tools";
import { getPubkeyFromDecodeResult, isHexKey, normalizeToHexPubkey } from "../helpers/nip19";
import { logger } from "../helpers/debug";
import { safeRelayUrl } from "../helpers/relay";
import NostrConnectSigner from "../classes/signers/nostr-connect-signer";

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

class NostrConnectService {
  log = logger.extend("NostrConnect");
  clients: NostrConnectSigner[] = [];

  getSigner(pubkey: string) {
    return this.clients.find((client) => client.pubkey === pubkey);
  }
  saveSigner(client: NostrConnectSigner) {
    if (!this.clients.includes(client)) this.clients.push(client);
  }

  createSigner(pubkey: string, relays: string[], secretKey?: string, provider?: string) {
    if (this.getSigner(pubkey)) throw new Error("A client for that pubkey already exists");

    const client = new NostrConnectSigner(pubkey, relays, secretKey, provider);
    client.log = this.log.extend(pubkey);

    this.log(`Created client for ${pubkey} using ${relays.join(", ")}`);

    return client;
  }

  fromHostedBunker(pubkey: string, relays: string[], provider?: string) {
    return this.createSigner(pubkey, relays, undefined, provider);
  }
  /** create client from: pubkey@wss://relay.com (with optional bunker://) */
  fromBunkerAddress(address: string) {
    const parts = address.replace("bunker://", "").split("@");
    if (parts.length !== 2) throw new Error("Invalid bunker address");
    const pubkey = normalizeToHexPubkey(parts[0]);
    const pathRelay = safeRelayUrl("wss://" + parts[1]);
    if (!pathRelay) throw new Error("Missing relay");
    if (!pubkey || !isHexKey(pubkey)) throw new Error("Missing pubkey");

    return this.createSigner(pubkey, [pathRelay]);
  }
  /** create client from: bunker://<pubkey>?relay=<relay> */
  fromBunkerURI(uri: string) {
    const url = new URL(uri);

    // firefox puts pubkey part in host, chrome puts pubkey in pathname
    const pubkey = url.host || url.pathname.replace("//", "");
    if (!isHexKey(pubkey)) throw new Error("Invalid connection URI");
    const relays = url.searchParams.getAll("relay");
    if (relays.length === 0) throw new Error("Missing relays");

    return this.createSigner(pubkey, relays);
  }
  /** create client from: pubkey#token */
  fromBunkerToken(pubkeyWithToken: string) {
    const [npub, hexToken] = pubkeyWithToken.split("#");
    const decoded = nip19.decode(npub);
    const pubkey = getPubkeyFromDecodeResult(decoded);
    if (!pubkey) throw new Error("Cant find pubkey");
    const relays = ["wss://relay.nsecbunker.com", "wss://nos.lol"];
    if (relays.length === 0) throw new Error("Missing relays");

    return this.createSigner(pubkey, relays);
  }
}

const nostrConnectService = new NostrConnectService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.nostrConnectService = nostrConnectService;
}

export default nostrConnectService;
