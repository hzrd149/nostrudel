import { NostrEvent, SimplePool } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import { logger } from "../helpers/debug";
import NostrWebRtcBroker from "../classes/nostr-webrtc-broker";
import WebRtcRelayClient from "../classes/webrtc-relay-client";
import WebRtcRelayServer from "../classes/webrtc-relay-server";
import verifyEventMethod from "./verify-event";
import SimpleSigner from "../classes/simple-signer";
import { localRelay } from "./local-relay";
import localSettings from "./local-settings";

class WebRtcRelaysService {
  log = logger.extend("NostrWebRtcBroker");
  broker: NostrWebRtcBroker;
  upstream: AbstractRelay | null;

  approved: string[] = [];

  calls: NostrEvent[] = [];
  get answered() {
    return this.calls.filter((event) => this.broker.peers.has(event.pubkey));
  }
  get unanswered() {
    return this.calls.filter((event) => this.broker.peers.has(event.pubkey) === false);
  }

  clients = new Map<string, WebRtcRelayClient>();
  servers = new Map<string, WebRtcRelayServer>();

  get relays() {
    return Array.from(this.clients.values());
  }

  constructor(broker: NostrWebRtcBroker, upstream: AbstractRelay | null) {
    this.upstream = upstream;
    this.broker = broker;
  }

  async handleCall(event: NostrEvent) {
    if (!this.calls.includes(event)) {
      this.log(`Received request from ${event.pubkey}`);
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
    this.log(`Accepting connection from ${event.pubkey}`);
    this.approved.push(event.pubkey);
    await this.handleCall(event);
  }

  async connect(uri: string) {
    this.log(`Connecting to ${uri}`);
    const peer = await this.broker.requestConnection(uri);
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

const webRtcRelaysService = new WebRtcRelaysService(
  new NostrWebRtcBroker(signer, new SimplePool(), ["wss://nos.lol", "wss://nostrue.com"]),
  localRelay as AbstractRelay | null,
);

webRtcRelaysService.start();

// if (import.meta.env.DEV) {
// @ts-expect-error
window.webRtcRelaysService = webRtcRelaysService;
// }

export default webRtcRelaysService;
