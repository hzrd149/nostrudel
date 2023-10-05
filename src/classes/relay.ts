import relayScoreboardService from "../services/relay-scoreboard";
import { RawIncomingNostrEvent, NostrEvent, CountResponse } from "../types/nostr-event";
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
export type IncomingCount = {
  type: "COUNT";
  relay: Relay;
} & CountResponse;
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

const CONNECTION_TIMEOUT = 1000 * 30;

export default class Relay {
  url: string;
  onOpen = new Subject<Relay>(undefined, false);
  onClose = new Subject<Relay>(undefined, false);
  onEvent = new Subject<IncomingEvent>(undefined, false);
  onNotice = new Subject<IncomingNotice>(undefined, false);
  onCount = new Subject<IncomingCount>(undefined, false);
  onEOSE = new Subject<IncomingEOSE>(undefined, false);
  onCommandResult = new Subject<IncomingCommandResult>(undefined, false);
  ws?: WebSocket;
  mode: RelayMode = RelayMode.ALL;

  private connectionTimer?: () => void;
  private ejectTimer?: () => void;
  private intentionalClose = false;
  private subscriptionResTimer = new Map<string, () => void>();
  private queue: NostrOutgoingMessage[] = [];

  constructor(url: string, mode: RelayMode = RelayMode.ALL) {
    this.url = url;
    this.mode = mode;
  }

  open() {
    if (this.okay) return;
    this.intentionalClose = false;
    this.ws = new WebSocket(this.url);

    this.connectionTimer = relayScoreboardService.relayConnectionTime.get(this.url).createTimer();
    const connectionTimeout: number = window.setTimeout(() => {
      // end the connection timer after CONNECTION_TIMEOUT
      if (this.connectionTimer) {
        this.connectionTimer();
        this.connectionTimer = undefined;
      }
      // relayScoreboardService.relayTimeouts.get(this.url).addIncident();
    }, CONNECTION_TIMEOUT);

    // for local dev, cancel timeout if module reloads
    if (import.meta.hot) {
      import.meta.hot.prune(() => {
        window.clearTimeout(connectionTimeout);
        this.ws?.close();
      });
    }

    this.ws.onopen = () => {
      window.clearTimeout(connectionTimeout);
      this.onOpen.next(this);

      this.ejectTimer = relayScoreboardService.relayEjectTime.get(this.url).createTimer();
      if (this.connectionTimer) {
        this.connectionTimer();
        this.connectionTimer = undefined;
      }

      this.sendQueued();
    };
    this.ws.onclose = () => {
      this.onClose.next(this);

      if (!this.intentionalClose && this.ejectTimer) {
        this.ejectTimer();
        this.ejectTimer = undefined;
      }
    };
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  send(json: NostrOutgoingMessage) {
    if (this.mode & RelayMode.WRITE) {
      if (this.connected) {
        this.ws?.send(JSON.stringify(json));

        // record start time
        if (json[0] === "REQ") {
          this.startSubResTimer(json[1]);
        }
      } else this.queue.push(json);
    }
  }
  close() {
    this.ws?.close();
    this.intentionalClose = true;
    this.subscriptionResTimer.clear();
  }

  private startSubResTimer(sub: string) {
    this.subscriptionResTimer.set(sub, relayScoreboardService.relayResponseTimes.get(this.url).createTimer());
  }
  private endSubResTimer(sub: string) {
    const endTimer = this.subscriptionResTimer.get(sub);
    if (endTimer) {
      endTimer();
      this.subscriptionResTimer.delete(sub);
    }
  }

  private sendQueued() {
    if (this.connected) {
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
          this.endSubResTimer(data[1]);
          break;
        case "NOTICE":
          this.onNotice.next({ relay: this, type, message: data[1] });
          break;
        case "COUNT":
          this.onCount.next({ relay: this, type, ...data[2] });
          break;
        case "EOSE":
          this.onEOSE.next({ relay: this, type, subId: data[1] });
          this.endSubResTimer(data[1]);
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
