import { Subject } from "rxjs";
import { IncomingNostrEvent, NostrEvent } from "../../types/nostr-event";
import { NostrOutgoingMessage } from "../../types/nostr-query";

export type IncomingEvent = {
  type: "EVENT";
  subId: string;
  body: NostrEvent;
};
export type IncomingNotice = {
  type: "NOTICE";
  message: string;
};
export type IncomingEOSE = {
  type: "EOSE";
  subId: string;
};

export enum Permission {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  ALL = 1 | 2,
}

export class Relay {
  url: string;
  onOpen: Subject<Relay>;
  onClose: Subject<Relay>;
  onEvent: Subject<IncomingEvent>;
  onNotice: Subject<IncomingNotice>;
  onEndOfStoredEvents: Subject<IncomingEOSE>;
  ws?: WebSocket;
  permission: Permission = Permission.ALL;

  constructor(url: string, permission: Permission = Permission.ALL) {
    this.url = url;

    this.onOpen = new Subject();
    this.onClose = new Subject();
    this.onEvent = new Subject();
    this.onNotice = new Subject();
    this.onEndOfStoredEvents = new Subject();

    this.permission = permission;
  }

  open() {
    if (this.okay) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onOpen.next(this);

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
    if (this.permission & Permission.WRITE) {
      if (this.connected) {
        this.ws?.send(JSON.stringify(json));
      }
    }
  }
  close() {
    this.ws?.close();
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

    if (!(this.permission & Permission.READ)) return;

    try {
      const data: IncomingNostrEvent = JSON.parse(event.data);
      const type = data[0];

      switch (type) {
        case "EVENT":
          this.onEvent.next({ type, subId: data[1], body: data[2] });
          break;
        case "NOTICE":
          this.onNotice.next({ type, message: data[1] });
          break;
        case "EOSE":
          this.onEndOfStoredEvents.next({ type, subId: data[1] });
          break;
      }
    } catch (e) {
      console.log(`Relay: Failed to parse event from ${this.url}`);
      console.log(event.data);
    }
  }
}
