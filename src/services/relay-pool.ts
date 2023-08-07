import { Relay } from "../classes/relay";
import Subject from "../classes/subject";
import { logger } from "../helpers/debug";
import { normalizeRelayUrl } from "../helpers/url";

export class RelayPoolService {
  relays = new Map<string, Relay>();
  relayClaims = new Map<string, Set<any>>();
  onRelayCreated = new Subject<Relay>();

  log = logger.extend("RelayPool");

  getRelays() {
    return Array.from(this.relays.values());
  }
  getRelayClaims(url: string) {
    const normalized = normalizeRelayUrl(url);
    if (!this.relayClaims.has(normalized)) {
      this.relayClaims.set(normalized, new Set());
    }
    return this.relayClaims.get(normalized) as Set<any>;
  }

  requestRelay(url: string, connect = true) {
    const normalized = normalizeRelayUrl(url);
    if (!this.relays.has(normalized)) {
      const newRelay = new Relay(normalized);
      this.relays.set(normalized, newRelay);
      this.onRelayCreated.next(newRelay);
    }

    const relay = this.relays.get(normalized) as Relay;
    if (connect && !relay.okay) {
      try {
        relay.open();
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
    for (const [url, relay] of this.relays.entries()) {
      const claims = this.getRelayClaims(url).size;
      if (!relay.okay && claims > 0) {
        try {
          relay.open();
        } catch (e) {
          this.log(`Failed to connect to ${relay.url}`);
          this.log(e);
        }
      }
    }
  }

  // id can be anything
  addClaim(url: string, id: any) {
    const normalized = normalizeRelayUrl(url);
    this.getRelayClaims(normalized).add(id);
  }
  removeClaim(url: string, id: any) {
    const normalized = normalizeRelayUrl(url);
    this.getRelayClaims(normalized).delete(id);
  }

  get connectedCount() {
    let count = 0;
    for (const [url, relay] of this.relays.entries()) {
      if (relay.connected) count++;
    }
    return count;
  }
}

const relayPoolService = new RelayPoolService();

setInterval(() => {
  if (document.visibilityState === "visible") {
    relayPoolService.reconnectRelays();
    relayPoolService.pruneRelays();
  }
}, 1000 * 15);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    relayPoolService.reconnectRelays();
  }
});

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayPoolService = relayPoolService;
}

export default relayPoolService;
