import { Filter, NostrEvent } from "nostr-tools";
import { offlineMode } from "../services/offline-mode";
import relayScoreboardService from "../services/relay-scoreboard";
import ControlledObservable from "./controlled-observable";
import createDefer, { Deferred } from "./deferred";
import { PersistentSubject } from "./subject";

export type CountResponse = {
  count: number;
  approximate?: boolean;
};

export type IncomingEvent = ["EVENT", string, NostrEvent];
export type IncomingNotice = ["NOTICE", string];
export type IncomingCount = ["COUNT", string, CountResponse];
export type IncomingEOSE = ["EOSE", string];
export type IncomingCommandResult = ["OK", string, boolean] | ["OK", string, boolean, string];
export type IncomingMessage = IncomingEvent | IncomingNotice | IncomingCount | IncomingEOSE | IncomingCommandResult;

export type OutgoingEvent = ["EVENT", NostrEvent];
export type OutgoingRequest = ["REQ", string, ...Filter[]];
export type OutgoingCount = ["COUNT", string, ...Filter[]];
export type OutgoingClose = ["CLOSE", string];
export type OutgoingMessage = OutgoingEvent | OutgoingRequest | OutgoingClose | OutgoingCount;

export enum RelayMode {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  ALL = 1 | 2,
}

const CONNECTION_TIMEOUT = 1000 * 30;

export default class Relay {
  url: string;
  ws?: WebSocket;
  status = new PersistentSubject<number>(WebSocket.CLOSED);
  onOpen = new ControlledObservable<Relay>();
  onClose = new ControlledObservable<Relay>();

  onEvent = new ControlledObservable<IncomingEvent>();
  onNotice = new ControlledObservable<IncomingNotice>();
  onCount = new ControlledObservable<IncomingCount>();
  onEOSE = new ControlledObservable<IncomingEOSE>();
  onCommandResult = new ControlledObservable<IncomingCommandResult>();

  private connectionPromises: Deferred<void>[] = [];

  private connectionTimer?: () => void;
  private ejectTimer?: () => void;
  private intentionalClose = false;
  private subscriptionResTimer = new Map<string, () => void>();
  private queue: OutgoingMessage[] = [];

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
  send(json: OutgoingMessage) {
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

  handleMessage(message: MessageEvent<string>) {
    if (!message.data) return;

    try {
      const data: IncomingMessage = JSON.parse(message.data);
      const type = data[0];

      // all messages must have an argument
      if (!data[1]) return;

      switch (type) {
        case "EVENT":
          this.onEvent.next(data);
          this.endSubResTimer(data[1]);
          break;
        case "NOTICE":
          this.onNotice.next(data);
          break;
        case "COUNT":
          this.onCount.next(data);
          break;
        case "EOSE":
          this.onEOSE.next(data);
          this.endSubResTimer(data[1]);
          break;
        case "OK":
          this.onCommandResult.next(data);
          break;
      }
    } catch (e) {
      console.log(`Relay: Failed to parse massage from ${this.url}`);
      console.log(message.data, e);
    }
  }
}
