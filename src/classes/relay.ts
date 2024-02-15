import { offlineMode } from "../services/offline-mode";
import relayScoreboardService from "../services/relay-scoreboard";
import { RawIncomingNostrEvent, NostrEvent, CountResponse } from "../types/nostr-event";
import { NostrOutgoingMessage } from "../types/nostr-query";
import ControlledObservable from "./controlled-observable";
import createDefer, { Deferred } from "./deferred";
import { PersistentSubject } from "./subject";

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
  subId: string;
  relay: Relay;
} & CountResponse;
export type IncomingEOSE = {
  type: "EOSE";
  subId: string;
  relay: Relay;
};
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

const CONNECTION_TIMEOUT = 1000 * 30;

export default class Relay {
  url: string;
  status = new PersistentSubject<number>(WebSocket.CLOSED);
  onOpen = new ControlledObservable<Relay>();
  onClose = new ControlledObservable<Relay>();
  onEvent = new ControlledObservable<IncomingEvent>();
  onNotice = new ControlledObservable<IncomingNotice>();
  onCount = new ControlledObservable<IncomingCount>();
  onEOSE = new ControlledObservable<IncomingEOSE>();
  onCommandResult = new ControlledObservable<IncomingCommandResult>();
  ws?: WebSocket;

  private connectionPromises: Deferred<void>[] = [];

  private connectionTimer?: () => void;
  private ejectTimer?: () => void;
  private intentionalClose = false;
  private subscriptionResTimer = new Map<string, () => void>();
  private queue: NostrOutgoingMessage[] = [];

  constructor(url: string) {
    this.url = url;
  }

  open() {
    if (offlineMode.value) return;

    if (this.okay) return;
    this.intentionalClose = false;
    this.ws = new WebSocket(this.url);

    this.connectionTimer = relayScoreboardService.relayConnectionTime.get(this.url).createTimer();
    const connectionTimeout: number = window.setTimeout(() => {
      // end the connection timer after CONNECTION_TIMEOUT
      if (this.connectionTimer) {
        this.connectionTimer();
        this.connectionTimer = undefined;

        for (const p of this.connectionPromises) p.reject();
        this.connectionPromises = [];
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
      this.status.next(this.ws!.readyState);

      this.ejectTimer = relayScoreboardService.relayEjectTime.get(this.url).createTimer();
      if (this.connectionTimer) {
        this.connectionTimer();
        this.connectionTimer = undefined;
      }

      this.sendQueued();

      for (const p of this.connectionPromises) p.resolve();
      this.connectionPromises = [];
    };
    this.ws.onclose = () => {
      this.onClose.next(this);
      this.status.next(this.ws!.readyState);

      if (!this.intentionalClose && this.ejectTimer) {
        this.ejectTimer();
        this.ejectTimer = undefined;
      }
    };
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  send(json: NostrOutgoingMessage) {
    if (this.connected) {
      this.ws?.send(JSON.stringify(json));

      // record start time
      if (json[0] === "REQ" || json[0] === "COUNT") {
        this.startSubResTimer(json[1]);
      }
    } else this.queue.push(json);
  }
  close() {
    this.ws?.close();
    this.intentionalClose = true;
    this.subscriptionResTimer.clear();
  }

  waitForConnection(): Promise<void> {
    if (this.connected) return Promise.resolve();
    const p = createDefer<void>();
    this.connectionPromises.push(p);
    return p;
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
    if (!event.data) return;

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
          this.onCount.next({ relay: this, type, subId: data[1], ...data[2] });
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
      console.log(event.data, e);
    }
  }
}
