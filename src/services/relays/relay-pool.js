import { Subject } from "rxjs";
import { Relay } from "./relay";
import settingsService from "../settings";

export class RelayPool {
  relays = new Map();
  relayClaims = new Map();
  onRelayCreated = new Subject();

  getRelays() {
    return Array.from(this.relays.values());
  }
  getRelayClaims(url) {
    if (!this.relayClaims.has(url)) {
      this.relayClaims.set(url, new Set());
    }
    return this.relayClaims.get(url);
  }

  requestRelay(url, connect = true) {
    if (!this.relays.has(url)) {
      const newRelay = new Relay(url);
      this.relays.set(url, newRelay);
      this.onRelayCreated.next(newRelay);
    }

    const relay = this.relays.get(url);
    if (connect && !relay.okay) {
      relay.open();
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
    for (const [url, relay] of this.relays.entries()) {
      const claims = this.getRelayClaims(url).size;
      if (!relay.okay && claims > 0) {
        relay.open();
      }
    }
  }

  // id can be anything
  addClaim(url, id) {
    this.getRelayClaims(url).add(id);
  }
  removeClaim(url, id) {
    this.getRelayClaims(url).delete(id);
  }

  get connectedCount() {
    let count = 0;
    for (const [url, relay] of this.relays.entries()) {
      if (relay.connected) count++;
    }
    return count;
  }
}

const relayPool = new RelayPool();

if (import.meta.env.DEV) {
  window.relayPool = relayPool;
}

setTimeout(async () => {
  const urls = await settingsService.getRelays();

  for (const url of urls) {
    relayPool.requestRelay(url);
  }
}, 1000 * 10);

export default relayPool;
