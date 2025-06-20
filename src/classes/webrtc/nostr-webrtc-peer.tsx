import { Debugger } from "debug";
import EventEmitter from "eventemitter3";
import dayjs from "dayjs";
import { EventTemplate, Filter, NostrEvent } from "nostr-tools";
import { SubCloser, SubscribeManyParams } from "nostr-tools/abstract-pool";
import { logger } from "../../helpers/debug";

export const RTCDescriptionEventKind = 25050;
export const RTCICEEventKind = 25051;

export type Signer = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (event: EventTemplate) => Promise<NostrEvent> | NostrEvent;
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
};

export type Pool = {
  subscribeMany(relays: string[], filters: Filter[], params: SubscribeManyParams): SubCloser;
  publish(relays: string[], event: NostrEvent): Promise<string>[];
};

type EventMap = {
  connected: [];
  disconnected: [];
  message: [string];
};

export default class NostrWebRTCPeer extends EventEmitter<EventMap> {
  log: Debugger;
  signer: Signer;
  pool: Pool;
  peer?: string;
  signalingRelays: string[] = [];
  iceServers: RTCIceServer[] = [];

  connection: RTCPeerConnection;
  channel?: RTCDataChannel;

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

  constructor(signer: Signer, pool: Pool, signalingRelays?: string[], iceServers?: RTCIceServer[]) {
    super();
    this.log = logger.extend(`NostrWebRTCPeer`);
    this.signer = signer;
    this.pool = pool;

    if (iceServers) this.iceServers = iceServers;
    if (signalingRelays) this.signalingRelays = signalingRelays;

    // create connection
    this.connection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.log("Created local connection");

    this.connection.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        this.candidateQueue.push(candidate.toJSON());
      } else this.flushCandidateQueue();
    };
    this.connection.onicegatheringstatechange = this.flushCandidateQueue.bind(this);
    this.connection.onconnectionstatechange = (event) => {
      switch (this.connection?.connectionState) {
        case "connected":
          this.emit("connected");
          break;
        case "disconnected":
          this.emit("disconnected");
          break;
      }
    };

    // receive data channel
    this.connection.ondatachannel = ({ channel }) => {
      this.log("Got data channel", channel.id, channel.label);

      if (channel.label !== "nostr") return;

      this.channel = channel;
      this.channel.onclose = this.onChannelStateChange.bind(this);
      this.channel.onopen = this.onChannelStateChange.bind(this);
      this.channel.onmessage = this.handleChannelMessage.bind(this);
    };
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

      this.log(`Publishing ${this.candidateQueue.length} ICE candidates`);
      await this.pool.publish(this.signalingRelays, iceEvent);
      this.candidateQueue = [];
    }
  }

  async makeCall(peer: string) {
    if (this.peer) throw new Error("Already calling peer");

    const pc = this.connection;

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
      tags: [["p", peer], ...this.signalingRelays.map((r) => ["relay", r])],
      created_at: dayjs().unix(),
    });

    this.log("Created offer");

    // listen for answers and ice events
    this.subscription = this.pool.subscribeMany(
      this.signalingRelays,
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
          this.log("Signaling subscription closed");
        },
      },
    );

    this.peer = peer;

    this.log("Publishing event", offerEvent.id);
    await this.pool.publish(this.signalingRelays, offerEvent);
    await pc.setLocalDescription(offer);

    this.offerEvent = offerEvent;
  }

  async handleAnswer(event: NostrEvent) {
    const pc = this.connection;

    if (!pc.localDescription) throw new Error("Got answer without offering");

    const plaintext = await this.signer.nip44.decrypt(event.pubkey, event.content);
    const answer = JSON.parse(plaintext) as RTCSessionDescriptionInit;
    if (answer.type !== "answer") throw new Error("Unexpected rtc description type");

    this.log("Got answer");

    await pc.setRemoteDescription(answer);

    this.answerEvent = event;
  }

  async answerCall(event: NostrEvent) {
    const pc = this.connection;

    this.log(`Answering call ${event.id} from ${event.pubkey}`);

    const plaintext = await this.signer.nip44.decrypt(event.pubkey, event.content);
    const offer = JSON.parse(plaintext) as RTCSessionDescriptionInit;
    if (offer.type !== "offer") throw new Error("Unexpected rtc description type");

    this.signalingRelays = event.tags.filter((t) => t[0] === "relay" && t[1]).map((t) => t[1]);
    this.log(`Switching to callers signaling relays`, this.signalingRelays);

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

    this.log("Created answer");

    this.peer = event.pubkey;
    this.offerEvent = event;

    // listen for ice events
    this.subscription = this.pool.subscribeMany(
      this.signalingRelays,
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
          this.log("Signaling subscription closed");
        },
      },
    );

    this.log("Publishing event", answerEvent.id);

    await this.pool.publish(this.signalingRelays, answerEvent);
    await pc.setLocalDescription(answer);
    this.answerEvent = answerEvent;

    // answered call, send ICE candidates
    await this.flushCandidateQueue();
  }

  private async handleICEEvent(event: NostrEvent) {
    if (!this.connection) throw new Error("Got ICE event without connection");
    const pc = this.connection;

    const plaintext = await this.signer.nip44.decrypt(event.pubkey, event.content);
    const candidates = JSON.parse(plaintext) as RTCIceCandidateInit[];

    this.log(`Got ${candidates.length} candidates`);

    for (const candidate of candidates) {
      await pc.addIceCandidate(candidate);
    }
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

  hangup() {
    this.log("Closing data channel");
    if (this.channel) this.channel.close();
    this.log("Closing connection");
    if (this.connection) this.connection.close();
  }
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.WebRTCPeer = NostrWebRTCPeer;
}
