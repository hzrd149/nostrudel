import { Relay } from "./relay";

export class RelayPool {
  relays = new Map();
  relayClaims = new Map();

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
      this.relays.set(url, new Relay(url));
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

export default relayPool;
