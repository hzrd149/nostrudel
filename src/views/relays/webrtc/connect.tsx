import { Debugger } from "debug";
import EventEmitter from "eventemitter3";
import dayjs from "dayjs";
import {
  EventTemplate,
  Filter,
  NostrEvent,
  SimplePool,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip44,
} from "nostr-tools";
import { SubCloser, SubscribeManyParams } from "nostr-tools/abstract-pool";

import { logger } from "../../../helpers/debug";

const RTCDescriptionEventKind = 25050;
const RTCICEEventKind = 25051;
type Signer = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (event: EventTemplate) => Promise<NostrEvent> | NostrEvent;
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
};

type Pool = {
  subscribeMany(relays: string[], filters: Filter[], params: SubscribeManyParams): SubCloser;
  publish(relays: string[], event: NostrEvent): Promise<string>[];
};

type EventMap = {
  connect: [];
  disconnect: [];
  incomingCall: [NostrEvent];
  message: [string];
};

class SimpleSigner {
  key: Uint8Array;
  constructor() {
    this.key = generateSecretKey();
  }

  async getPublicKey() {
    return getPublicKey(this.key);
  }
  async signEvent(event: EventTemplate) {
    return finalizeEvent(event, this.key);
  }

  nip44 = {
    encrypt: async (pubkey: string, plaintext: string) =>
      nip44.v2.encrypt(plaintext, nip44.v2.utils.getConversationKey(this.key, pubkey)),
    decrypt: async (pubkey: string, ciphertext: string) =>
      nip44.v2.decrypt(ciphertext, nip44.v2.utils.getConversationKey(this.key, pubkey)),
  };
}

const defaultPool = new SimplePool();

class WebRTCPeer extends EventEmitter<EventMap> {
  log: Debugger;
  signer: Signer;
  pool: Pool;
  peer?: string;
  relays: string[] = [];
  iceServers: RTCIceServer[] = [];

  connection?: RTCPeerConnection;
  channel?: RTCDataChannel;

  listening = false;
  subscription?: SubCloser;

  async isCaller() {
    if (!this.offerEvent) return null;
    return (await this.signer.getPublicKey()) === this.offerEvent?.pubkey;
  }
  get offer() {
    return this.connection?.localDescription;
  }
  offerEvent?: NostrEvent;
  get answer() {
    return this.connection?.remoteDescription;
  }
  answerEvent?: NostrEvent;

  private candidateQueue: RTCIceCandidateInit[] = [];

  constructor(signer: Signer, pool: Pool = defaultPool, relays?: string[], iceServers?: RTCIceServer[]) {
    super();
    this.log = logger.extend(`webrtc`);
    this.signer = signer;
    this.pool = pool;

    if (iceServers) this.iceServers = iceServers;
    if (relays) this.relays = relays;
  }

  private createConnection() {
    if (this.connection) return this.connection;

    this.connection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.log("Created local connection");

    this.connection.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        this.candidateQueue.push(candidate.toJSON());
      } else this.flushCandidateQueue();
    };

    this.connection.onicegatheringstatechange = this.flushCandidateQueue.bind(this);

    this.connection.ondatachannel = ({ channel }) => {
      this.log("Got data channel", channel);

      if (channel.label !== "nostr") return;

      this.channel = channel;
      this.channel.onclose = this.onChannelStateChange.bind(this);
      this.channel.onopen = this.onChannelStateChange.bind(this);
      this.channel.onmessage = this.handleChannelMessage.bind(this);
    };

    return this.connection;
  }

  private async flushCandidateQueue() {
    if (this.connection?.iceGatheringState !== "complete") return;

    if (this.offerEvent && this.answerEvent && this.peer && this.candidateQueue.length > 0) {
      const cipherText = await this.signer.nip44.encrypt(this.peer, JSON.stringify(this.candidateQueue));
      const iceEvent = await this.signer.signEvent({
        kind: RTCICEEventKind,
        content: cipherText,
        tags: [["e", this.offerEvent.id]],
        created_at: dayjs().unix(),
      });

      this.log(`Publishing ICE candidates`, this.candidateQueue);
      await this.pool.publish(this.relays, iceEvent);
      this.candidateQueue = [];
    }
  }

  async makeCall(peer: string) {
    if (this.peer) throw new Error("Already calling peer");

    this.stopListening();
    const pc = this.createConnection();

    this.channel = pc.createDataChannel("nostr", { ordered: true });
    this.channel.onopen = this.onChannelStateChange.bind(this);
    this.channel.onclose = this.onChannelStateChange.bind(this);
    this.channel.onmessage = this.handleChannelMessage.bind(this);

    this.log(`Making call to ${peer} `);

    const offer = await pc.createOffer();
    const cipherText = await this.signer.nip44.encrypt(peer, JSON.stringify(offer));
    const offerEvent = await this.signer.signEvent({
      kind: RTCDescriptionEventKind,
      content: cipherText,
      tags: [["p", peer], ...this.relays.map((r) => ["relay", r])],
      created_at: dayjs().unix(),
    });

    this.log("Created offer", offer);

    // listen for answers and ice events
    this.subscription = this.pool.subscribeMany(
      this.relays,
      [
        {
          kinds: [RTCDescriptionEventKind, RTCICEEventKind],
          "#e": [offerEvent.id],
          authors: [peer],
        },
      ],
      {
        onevent: async (event: NostrEvent) => {
          if (!this.offerEvent) return;
          if (!event.tags.some((t) => t[0] === "e" && t[1] === this.offerEvent?.id)) return;

          console.log(event);

          switch (event.kind) {
            case RTCDescriptionEventKind:
              await this.handleAnswer(event);
              // got answer, send ICE candidates
              await this.flushCandidateQueue();
              break;
            case RTCICEEventKind:
              await this.handleICEEvent(event);
              break;
          }
        },
        onclose: () => {
          this.log("Subscription Closed");
        },
      },
    );

    this.peer = peer;

    this.log("Publishing event", offerEvent);
    await this.pool.publish(this.relays, offerEvent);
    await pc.setLocalDescription(offer);

    this.offerEvent = offerEvent;
  }

  async handleAnswer(event: NostrEvent) {
    const pc = this.createConnection();

    if (!pc.localDescription) throw new Error("Got answer without offering");

    const plaintext = await this.signer.nip44.decrypt(event.pubkey, event.content);
    const answer = JSON.parse(plaintext) as RTCSessionDescriptionInit;
    if (answer.type !== "answer") throw new Error("Unexpected rtc description type");

    this.log("Got answer", answer);

    await pc.setRemoteDescription(answer);

    this.answerEvent = event;
  }

  async answerCall(event: NostrEvent) {
    this.stopListening();
    const pc = this.createConnection();

    this.log(`Answering call ${event.id} from ${event.pubkey}`);

    const plaintext = await this.signer.nip44.decrypt(event.pubkey, event.content);
    const offer = JSON.parse(plaintext) as RTCSessionDescriptionInit;
    if (offer.type !== "offer") throw new Error("Unexpected rtc description type");

    this.relays = event.tags.filter((t) => t[0] === "relay" && t[1]).map((t) => t[1]);
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    const cipherText = await this.signer.nip44.encrypt(event.pubkey, JSON.stringify(answer));
    const answerEvent = await this.signer.signEvent({
      kind: RTCDescriptionEventKind,
      content: cipherText,
      tags: [
        ["p", event.pubkey],
        ["e", event.id],
      ],
      created_at: dayjs().unix(),
    });

    this.log("Created answer", answer);

    this.peer = event.pubkey;
    this.offerEvent = event;

    // listen for ice events
    this.subscription = this.pool.subscribeMany(
      this.relays,
      [{ kinds: [RTCICEEventKind], "#e": [event.id], authors: [event.pubkey] }],
      {
        onevent: async (event) => {
          if (!this.offerEvent) return;
          if (!event.tags.some((t) => t[0] === "e" && t[1] === this.offerEvent?.id)) return;

          switch (event.kind) {
            case RTCICEEventKind:
              await this.handleICEEvent(event);
              break;
          }
        },
        onclose: () => {
          this.log("Subscription Closed");
        },
      },
    );

    this.log("Publishing event", answerEvent);

    await this.pool.publish(this.relays, answerEvent);
    await pc.setLocalDescription(answer);
    this.answerEvent = answerEvent;

    // answered call, send ICE candidates
    await this.flushCandidateQueue();
  }

  private async handleICEEvent(event: NostrEvent) {
    if (!this.connection) throw new Error("Got ICE event without connection");
    const pc = this.createConnection();

    const plaintext = await this.signer.nip44.decrypt(event.pubkey, event.content);
    const candidates = JSON.parse(plaintext) as RTCIceCandidateInit[];

    this.log("Got candidates", candidates);

    for (let candidate of candidates) {
      await pc.addIceCandidate(candidate);
    }
  }

  async listenForCall() {
    if (this.listening) throw new Error("Already listening");

    this.listening = true;
    this.subscription = this.pool.subscribeMany(
      this.relays,
      [{ kinds: [RTCDescriptionEventKind], "#p": [await this.signer.getPublicKey()], since: dayjs().unix() }],
      {
        onevent: (event) => {
          this.emit("incomingCall", event);
        },
        onclose: () => {
          this.listening = false;
        },
      },
    );
  }

  stopListening() {
    if (!this.listening) return;

    if (this.subscription) this.subscription.close();
    this.subscription = undefined;
    this.listening = false;
  }

  private onChannelStateChange() {
    const readyState = this.channel?.readyState;
    console.log("Send channel state is: " + readyState);
  }

  private handleChannelMessage(event: MessageEvent<any>) {
    if (typeof event.data === "string") this.emit("message", event.data);
  }

  send(message: string) {
    this.channel?.send(message);
  }

  disconnect() {
    this.log("Closing data channel");
    if (this.channel) this.channel.close();
    if (this.connection) this.connection.close();
  }
}

// @ts-expect-error
window.SimpleSigner = SimpleSigner;
// @ts-expect-error
window.WebRTCPeer = WebRTCPeer;
