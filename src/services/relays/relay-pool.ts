import { Subject } from "rxjs";
import { Relay } from "./relay";

export class RelayPool {
  relays = new Map<string, Relay>();
  relayClaims = new Map<string, Set<any>>();
  onRelayCreated = new Subject<Relay>();

  getRelays() {
    return Array.from(this.relays.values());
  }
  getRelayClaims(url: string) {
    if (!this.relayClaims.has(url)) {
      this.relayClaims.set(url, new Set());
    }
    return this.relayClaims.get(url) as Set<any>;
  }

  requestRelay(url: string, connect = true) {
    if (!this.relays.has(url)) {
      const newRelay = new Relay(url);
      this.relays.set(url, newRelay);
      this.onRelayCreated.next(newRelay);
    }

    const relay = this.relays.get(url) as Relay;
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
  addClaim(url: string, id: any) {
    this.getRelayClaims(url).add(id);
  }
  removeClaim(url: string, id: any) {
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
  // @ts-ignore
  window.relayPool = relayPool;
}

export default relayPool;
