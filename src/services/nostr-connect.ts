import { nip19 } from "nostr-tools";
import { NostrConnectSigner, SimpleSigner } from "applesauce-signer";
import { hexToBytes } from "@noble/hashes/utils";

import { getPubkeyFromDecodeResult, isHexKey, normalizeToHexPubkey } from "../helpers/nip19";
import { logger } from "../helpers/debug";
import { safeRelayUrl } from "../helpers/relay";
import relayPoolService from "./relay-pool";

/** @deprecated use account manager instead */
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

    const signer = secretKey ? new SimpleSigner(hexToBytes(secretKey)) : undefined;

    const client = new NostrConnectSigner({ pool: relayPoolService, pubkey, relays, signer, remote: provider });

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
