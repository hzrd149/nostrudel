import EventEmitter from "eventemitter3";
import { Filter, NostrEvent } from "nostr-tools";
import { AbstractRelay, Subscription } from "nostr-tools/abstract-relay";

import NostrWebRTCPeer from "./nostr-webrtc-peer";
import { logger } from "../../helpers/debug";

type EventMap = {
  call: [NostrEvent];
};

export default class WebRtcRelayServer extends EventEmitter<EventMap> {
  log = logger.extend("WebRtcRelayServer");

  peer: NostrWebRTCPeer;
  upstream: AbstractRelay;

  // A map of subscriptions
  subscriptions = new Map<string, Subscription>();

  stats = {
    events: {
      sent: 0,
      received: 0,
    },
  };

  constructor(peer: NostrWebRTCPeer, upstream: AbstractRelay) {
    super();
    this.peer = peer;
    this.upstream = upstream;

    this.peer.on("message", this.handleMessage, this);
    this.peer.on("disconnected", this.handleDisconnect, this);
  }

  private send(data: any[]) {
    this.peer.send(JSON.stringify(data));
  }

  async handleMessage(message: string) {
    let data;

    try {
      data = JSON.parse(message);

      if (!Array.isArray(data)) throw new Error("Message is not an array");

      // Pass the data to appropriate handler
      switch (data[0]) {
        case "REQ":
          await this.handleSubscriptionMessage(data);
          break;
        case "EVENT":
          // only handle publish EVENT methods
          if (typeof data[1] !== "string") {
            await this.handleEventMessage(data);
          }
          break;
        case "CLOSE":
          await this.handleCloseMessage(data);
          break;
      }
    } catch (err) {
      this.log("Failed to handle message", message, err);
    }

    return data;
  }

  handleSubscriptionMessage(data: any[]) {
    const [_, id, ...filters] = data as [string, string, ...Filter[]];

    let sub = this.subscriptions.get(id);
    if (sub) {
      sub.filters = filters;
      sub.fire();
    } else {
      sub = this.upstream.subscribe(filters, {
        onevent: (event) => {
          this.stats.events.sent++;
          this.send(["EVENT", id, event]);
        },
        onclose: (reason) => this.send(["CLOSED", id, reason]),
        oneose: () => this.send(["EOSE", id]),
      });
    }
  }

  handleCloseMessage(data: any[]) {
    const [_, id] = data as [string, string, ...Filter[]];

    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.close();
      this.subscriptions.delete(id);
    }
  }

  async handleEventMessage(data: any[]) {
    const [_, event] = data as [string, NostrEvent];

    try {
      const result = await this.upstream.publish(event);
      this.stats.events.received++;
      this.peer.send(JSON.stringify(["OK", event.id, true, result]));
    } catch (error) {
      if (error instanceof Error) this.peer.send(JSON.stringify(["OK", event.id, false, error.message]));
    }
  }

  handleDisconnect() {
    for (const [_id, sub] of this.subscriptions) sub.close();
    this.subscriptions.clear();
  }

  destroy() {
    this.peer.off("message", this.handleMessage, this);
    this.peer.off("disconnected", this.handleDisconnect, this);
  }
}
