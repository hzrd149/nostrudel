import { RawIncomingNostrEvent, NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage } from "../types/nostr-query";
import { Subject } from "./subject";

export type IncomingEvent = {
  type: "EVENT";
  subId: string;
  body: NostrEvent;
  relay: Relay;
};
export type IncomingNotice = {
  type: "NOTICE";
  message: string;
  relay: Relay;
};
export type IncomingEOSE = {
  type: "EOSE";
  subId: string;
  relay: Relay;
};
// NIP-20
export type IncomingCommandResult = {
  type: "OK";
  eventId: string;
  status: boolean;
  message?: string;
  relay: Relay;
};

export enum RelayMode {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  ALL = 1 | 2,
}
export type RelayConfig = { url: string; mode: RelayMode };

export class Relay {
  url: string;
  onOpen = new Subject<Relay>();
  onClose = new Subject<Relay>();
  onEvent = new Subject<IncomingEvent>();
  onNotice = new Subject<IncomingNotice>();
  onEOSE = new Subject<IncomingEOSE>();
  onCommandResult = new Subject<IncomingCommandResult>();
  ws?: WebSocket;
  mode: RelayMode = RelayMode.ALL;

  private queue: NostrOutgoingMessage[] = [];

  constructor(url: string, mode: RelayMode = RelayMode.ALL) {
    this.url = url;
    this.mode = mode;
  }

  open() {
    if (this.okay) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onOpen.next(this);

      this.sendQueued();

      if (import.meta.env.DEV) {
        console.info(`Relay: ${this.url} connected`);
      }
    };
    this.ws.onclose = () => {
      this.onClose.next(this);

      if (import.meta.env.DEV) {
        console.info(`Relay: ${this.url} disconnected`);
      }
    };
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  send(json: NostrOutgoingMessage) {
    if (this.mode & RelayMode.WRITE) {
      if (this.connected) {
        this.ws?.send(JSON.stringify(json));
      } else this.queue.push(json);
    }
  }
  close() {
    this.ws?.close();
  }

  private sendQueued() {
    if (this.connected) {
      if (import.meta.env.DEV) {
        console.info(`Relay: ${this.url} sending ${this.queue.length} queued messages`);
      }
      for (const message of this.queue) {
        this.send(message);
      }
      this.queue = [];
    }
  }

  get okay() {
    return this.connected || this.connecting;
  }
  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  get connecting() {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }
  get closing() {
    return this.ws?.readyState === WebSocket.CLOSING;
  }
  get closed() {
    return this.ws?.readyState === WebSocket.CLOSED;
  }
  get state() {
    return this.ws?.readyState;
  }

  handleMessage(event: MessageEvent<string>) {
    // skip empty events
    if (!event.data) return;

    if (!(this.mode & RelayMode.READ)) return;

    try {
      const data: RawIncomingNostrEvent = JSON.parse(event.data);
      const type = data[0];

      switch (type) {
        case "EVENT":
          this.onEvent.next({ relay: this, type, subId: data[1], body: data[2] });
          break;
        case "NOTICE":
          this.onNotice.next({ relay: this, type, message: data[1] });
          break;
        case "EOSE":
          this.onEOSE.next({ relay: this, type, subId: data[1] });
          break;
        case "OK":
          this.onCommandResult.next({ relay: this, type, eventId: data[1], status: data[2], message: data[3] });
          break;
      }
    } catch (e) {
      console.log(`Relay: Failed to parse event from ${this.url}`);
      console.log(event.data);
    }
  }
}
