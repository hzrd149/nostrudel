import { NostrEvent, SimplePool } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { SimpleSigner } from "applesauce-signers";

import { logger } from "../helpers/debug";
import NostrWebRtcBroker from "../classes/webrtc/nostr-webrtc-broker";
import WebRtcRelayClient from "../classes/webrtc/webrtc-relay-client";
import WebRtcRelayServer from "../classes/webrtc/webrtc-relay-server";
import NostrWebRTCPeer from "../classes/webrtc/nostr-webrtc-peer";
import verifyEventMethod from "./verify-event";
import localSettings from "./preferences";
import { DEFAULT_ICE_SERVERS } from "../const";

class WebRtcRelaysService {
  log = logger.extend("NostrWebRtcBroker");
  broker: NostrWebRtcBroker;
  pubkey?: string;
  upstream: AbstractRelay | null;

  approved: string[] = [];

  calls: NostrEvent[] = [];
  get answered() {
    const answered: { call: NostrEvent; peer: NostrWebRTCPeer; pubkey: string }[] = [];
    for (const call of this.calls) {
      const peer = this.broker.peers.get(call.pubkey);
      if (peer && peer.peer && peer.connection.connectionState !== "new") {
        answered.push({ call, peer, pubkey: peer.peer });
      }
    }
    return answered;
  }
  get pendingOutgoing() {
    const pending: { call: NostrEvent; peer: NostrWebRTCPeer }[] = [];
    for (const call of this.calls) {
      const pubkey = call.tags.find((t) => t[0] === "p" && t[1])?.[1];
      if (!pubkey) continue;
      const peer = this.broker.peers.get(pubkey);
      if (peer && peer.connection.connectionState === "new") pending.push({ call, peer });
    }
    return pending;
  }
  get pendingIncoming() {
    return this.calls.filter((event) => event.pubkey !== this.pubkey && this.broker.peers.has(event.pubkey) === false);
  }

  clients = new Map<string, WebRtcRelayClient>();
  servers = new Map<string, WebRtcRelayServer>();

  get relays() {
    return Array.from(this.clients.values());
  }

  constructor(broker: NostrWebRtcBroker, upstream: AbstractRelay | null) {
    this.upstream = upstream;
    this.broker = broker;

    this.getPubkey();
  }

  private async getPubkey() {
    const pubkey = await this.broker.signer.getPublicKey();
    this.pubkey = pubkey;
  }

  async handleCall(event: NostrEvent) {
    if (!this.calls.includes(event)) {
      this.log(`Received call from ${event.pubkey}`);
      this.calls.push(event);
    }

    if (this.approved.includes(event.pubkey)) {
      this.log(`Answering call from ${event.pubkey}`);
      const peer = await this.broker.answerCall(event);
      if (!peer.peer) return;

      if (this.upstream) {
        const server = new WebRtcRelayServer(peer, this.upstream);
        this.servers.set(peer.peer, server);
      }

      const client = new WebRtcRelayClient(peer, {
        websocketImplementation: WebSocket,
        verifyEvent: verifyEventMethod,
      });
      this.clients.set(peer.peer, client);
    }
  }

  async acceptCall(event: NostrEvent) {
    this.log(`Approving calls from ${event.pubkey}`);
    this.approved.push(event.pubkey);
    await this.handleCall(event);
  }

  async connect(uri: string) {
    this.log(`Connecting to ${uri}`);
    const peer = await this.broker.requestConnection(uri);
    if (!peer.peer) return;

    // add to the list of calls
    if (peer.offerEvent) this.calls.push(peer.offerEvent);

    if (this.upstream) {
      const server = new WebRtcRelayServer(peer, this.upstream);
      this.servers.set(peer.peer, server);
    }

    const client = new WebRtcRelayClient(peer, {
      websocketImplementation: WebSocket,
      verifyEvent: verifyEventMethod,
    });
    this.clients.set(peer.peer, client);
    await client.connect();
  }

  start() {
    this.broker.listenForCalls();
    this.broker.on("call", this.handleCall, this);
  }

  stop() {
    this.broker.stopListening();
    this.broker.off("call", this.handleCall, this);
  }
}

const signer = new SimpleSigner(localSettings.webRtcLocalIdentity.value);
const broker = new NostrWebRtcBroker(signer, new SimplePool(), ["wss://nos.lol", "wss://nostrue.com"]);
broker.iceServers = DEFAULT_ICE_SERVERS;

const webRtcRelaysService = new WebRtcRelaysService(broker, null);

webRtcRelaysService.start();

// if (import.meta.env.DEV) {
// @ts-expect-error
window.webRtcRelaysService = webRtcRelaysService;
// }

export default webRtcRelaysService;
