import { SubCloser } from "nostr-tools/abstract-pool";
import EventEmitter from "eventemitter3";
import { generateSecretKey, nip19, NostrEvent } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import dayjs from "dayjs";

import NostrWebRTCPeer, { Pool, RTCDescriptionEventKind, Signer } from "./nostr-webrtc-peer";
import { isHex } from "../helpers/nip19";
import { logger } from "../helpers/debug";
import SimpleSigner from "./simple-signer";

type EventMap = {
  call: [NostrEvent];
};

export default class NostrWebRtcBroker extends EventEmitter<EventMap> {
  log = logger.extend("NostrWebRtcBroker");
  signer: Signer;
  pool: Pool;
  defaultRelays: string[];
  iceServers: RTCIceServer[] = [];

  peers = new Map<string, NostrWebRTCPeer>();
  signers = new Map<string, Signer>();
  relays = new Map<string, string[]>();

  constructor(signer: Signer, pool: Pool, relays: string[]) {
    super();
    this.signer = signer;
    this.pool = pool;
    this.defaultRelays = relays;
  }

  getConnection(pubkey: string) {
    return this.peers.get(pubkey);
  }

  async requestConnection(uri: string) {
    const { pubkey, relays, key } = NostrWebRtcBroker.parseNostrWebRtcURI(uri);

    const cached = this.peers.get(pubkey);
    if (cached) return cached;

    this.log(`Creating new connection for ${pubkey}`);

    // set signer
    let signer = this.signer;
    if (key) {
      signer = new SimpleSigner(key);
      this.signers.set(pubkey, signer);
    }

    // set relays
    if (relays.length > 0) this.relays.set(pubkey, relays);
    else this.relays.set(pubkey, this.defaultRelays);

    const peer = new NostrWebRTCPeer(
      signer,
      this.pool,
      relays.length > 0 ? relays : this.defaultRelays,
      this.iceServers,
    );
    this.peers.set(pubkey, peer);
    await peer.makeCall(pubkey);

    return peer;
  }

  setPeerSigner(pubkey: string, signer: Signer) {
    this.signers.set(pubkey, signer);
  }

  async answerCall(event: NostrEvent): Promise<NostrWebRTCPeer> {
    if (this.peers.has(event.pubkey)) throw new Error("Already have a peer connection for this pubkey");

    // set signer
    let signer = this.signers.get(event.pubkey);
    if (!signer) {
      signer = this.signer;
      this.signers.set(event.pubkey, signer);
    }

    const peer = new NostrWebRTCPeer(signer, this.pool, this.defaultRelays);
    this.peers.set(event.pubkey, peer);
    await peer.answerCall(event);

    return peer;
  }

  closeConnection(pubkey: string) {
    const peer = this.peers.get(pubkey);
    if (peer) {
      this.log(`Hanging up connection to ${pubkey}`);
      peer.hangup();
      this.peers.delete(pubkey);
    }
  }

  listening = false;
  subscription?: SubCloser;

  async listenForCalls() {
    if (this.listening) throw new Error("Already listening");

    this.log("Listening for calls");

    this.listening = true;
    this.subscription = this.pool.subscribeMany(
      this.defaultRelays,
      [{ kinds: [RTCDescriptionEventKind], "#p": [await this.signer.getPublicKey()], since: dayjs().unix() }],
      {
        onevent: (event) => {
          this.emit("call", event);
        },
        onclose: () => {
          this.listening = false;
        },
      },
    );
  }

  stopListening() {
    if (!this.listening) return;

    this.log("Stop listening for calls");

    if (this.subscription) this.subscription.close();
    this.subscription = undefined;
    this.listening = false;
  }

  static parseNostrWebRtcURI(uri: string | URL) {
    const url = typeof uri === "string" ? new URL(uri) : uri;
    if (url.protocol !== "webrtc+nostr:") throw new Error("Incorrect protocol");
    const parsedPath = nip19.decode(url.pathname);
    const keyParam = url.searchParams.get("key");
    const relays = url.searchParams.getAll("relay");
    if (parsedPath.type !== "npub") throw new Error("Incorrect npub");
    const pubkey = parsedPath.data;
    if (keyParam && !isHex(keyParam)) throw new Error("Key must be in hex format");
    const key = keyParam ? hexToBytes(keyParam) : null;
    return { pubkey, key, relays };
  }

  static createNostrWebRtcURI(pubkey: string, relays: string[], key?: Uint8Array | boolean) {
    const uri = new URL(`webrtc+nostr:${nip19.npubEncode(pubkey)}`);
    for (const relay of relays) uri.searchParams.append("relay", relay);
    if (key === true) uri.searchParams.append("key", bytesToHex(generateSecretKey()));
    else if (key instanceof Uint8Array) uri.searchParams.append("key", bytesToHex(key));
    return uri.toString();
  }
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.NostrWebRtcBroker = NostrWebRtcBroker;
}
