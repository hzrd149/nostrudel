import { BehaviorSubject, Subject } from "rxjs";
import { ControlMessage, ControlResponse } from "@satellite-earth/core/types";
import { PrivateNodeConfig } from "@satellite-earth/core/types";
import { DatabaseStats } from "@satellite-earth/core/types/control-api/database.js";
import EventEmitter from "eventemitter3";

import BakeryRelay from "./bakery-connection";

type EventMap = {
  message: [ControlResponse];
  authenticated: [boolean];
};

export default class BakeryControlApi extends EventEmitter<EventMap> {
  node: BakeryRelay;

  config = new BehaviorSubject<PrivateNodeConfig | undefined>(undefined);
  /** @deprecated this should be a report */
  databaseStats = new Subject<DatabaseStats>();
  vapidKey = new BehaviorSubject<string | undefined>(undefined);

  constructor(node: BakeryRelay) {
    super();
    this.node = node;

    this.node.authenticated$.subscribe((authenticated) => {
      this.emit("authenticated", authenticated);
      if (authenticated) {
        this.node.sendControlMessage(["CONTROL", "CONFIG", "SUBSCRIBE"]);
        this.node.sendControlMessage(["CONTROL", "DATABASE", "SUBSCRIBE"]);
        this.node.sendControlMessage(["CONTROL", "REMOTE-AUTH", "SUBSCRIBE"]);
      }
    });

    this.node.controlResponse$.subscribe(this.handleControlResponse.bind(this));
  }

  handleControlResponse(response: ControlResponse) {
    this.emit("message", response);

    switch (response[1]) {
      case "CONFIG":
        if (response[2] === "CHANGED") this.config.next(response[3]);
        break;

      case "DATABASE":
        if (response[2] === "STATS") this.databaseStats.next(response[3]);
        break;

      case "NOTIFICATIONS":
        if (response[2] === "VAPID-KEY") this.vapidKey.next(response[3]);
        break;

      default:
        break;
    }
  }

  send(message: ControlMessage) {
    if (this.node.connected) this.node.send(JSON.stringify(message));
  }

  async setConfigField<T extends keyof PrivateNodeConfig>(field: T, value: PrivateNodeConfig[T]) {
    if (this.config.value === undefined) throw new Error("Config not synced");

    await this.send(["CONTROL", "CONFIG", "SET", field, value]);

    return new Promise<PrivateNodeConfig>((res) => {
      const sub = this.config.subscribe((config) => {
        if (config) res(config);
        sub.unsubscribe();
      });
    });
  }
}
