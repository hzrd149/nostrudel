import { AbstractRelay, verifyEvent } from "nostr-tools";
import { logger } from "../helpers/debug";
import { validateRelayURL } from "../helpers/relay";
import { offlineMode } from "../services/offline-mode";
import Subject from "./subject";

export default class RelayPool {
  relays = new Map<string, AbstractRelay>();
  onRelayCreated = new Subject<AbstractRelay>();

  relayClaims = new Map<string, Set<any>>();

  log = logger.extend("RelayPool");

  getRelays() {
    return Array.from(this.relays.values());
  }
  getRelayClaims(url: string | URL) {
    url = validateRelayURL(url);
    const key = url.toString();
    if (!this.relayClaims.has(key)) {
      this.relayClaims.set(key, new Set());
    }
    return this.relayClaims.get(key) as Set<any>;
  }

  requestRelay(url: string | URL, connect = true) {
    url = validateRelayURL(url);
    const key = url.toString();
    if (!this.relays.has(key)) {
      const newRelay = new AbstractRelay(key, { verifyEvent });
      this.relays.set(key, newRelay);
      this.onRelayCreated.next(newRelay);
    }

    const relay = this.relays.get(key) as AbstractRelay;
    if (connect && !relay.connected) {
      try {
        relay.connect();
      } catch (e) {
        this.log(`Failed to connect to ${relay.url}`);
        this.log(e);
      }
    }
    return relay;
  }

  pruneRelays() {
    for (const [url, relay] of this.relays.entries()) {
      const claims = this.getRelayClaims(url).size;
      if (claims === 0) {
        relay.close();
      }
    }
  }
  reconnectRelays() {
    if (offlineMode.value) return;

    for (const [url, relay] of this.relays.entries()) {
      const claims = this.getRelayClaims(url).size;
      if (!relay.connected && claims > 0) {
        try {
          relay.connect();
        } catch (e) {
          this.log(`Failed to connect to ${relay.url}`);
          this.log(e);
        }
      }
    }
  }

  addClaim(relay: string | URL, id: any) {
    try {
      const key = validateRelayURL(relay).toString();
      this.getRelayClaims(key).add(id);
    } catch (error) {}
  }
  removeClaim(relay: string | URL, id: any) {
    try {
      const key = validateRelayURL(relay).toString();
      this.getRelayClaims(key).delete(id);
    } catch (error) {}
  }

  get connectedCount() {
    let count = 0;
    for (const [url, relay] of this.relays.entries()) {
      if (relay.connected) count++;
    }
    return count;
  }
}
