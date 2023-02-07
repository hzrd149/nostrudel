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

export class Relay {
  url: string;
  onOpen: Subject<Relay>;
  onClose: Subject<Relay>;
  onEvent: Subject<IncomingEvent>;
  onNotice: Subject<IncomingNotice>;
  ws?: WebSocket;

  constructor(url: string) {
    this.url = url;

    this.onOpen = new Subject();
    this.onClose = new Subject();
    this.onEvent = new Subject();
    this.onNotice = new Subject();
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
    if (this.connected) {
      this.ws?.send(JSON.stringify(json));
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
      }
    } catch (e) {
      console.log(`Relay: Failed to parse event from ${this.url}`);
      console.log(event.data);
    }
  }
}
