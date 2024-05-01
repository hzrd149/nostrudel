import { AbstractRelay } from "nostr-tools";

import { logger } from "../helpers/debug";
import { safeRelayUrl, validateRelayURL } from "../helpers/relay";
import { offlineMode } from "../services/offline-mode";
import Subject, { PersistentSubject } from "./subject";
import verifyEventMethod from "../services/verify-event";
import SuperMap from "./super-map";
import processManager from "../services/process-manager";

export default class RelayPool {
  relays = new Map<string, AbstractRelay>();
  onRelayCreated = new Subject<AbstractRelay>();
  onRelayChallenge = new Subject<[AbstractRelay, string]>();

  connectionErrors = new SuperMap<AbstractRelay, Error[]>(() => []);
  connecting = new SuperMap<AbstractRelay, PersistentSubject<boolean>>(() => new PersistentSubject(false));

  log = logger.extend("RelayPool");

  getRelay(relayOrUrl: string | URL | AbstractRelay) {
    let relay: AbstractRelay | undefined = undefined;

    if (typeof relayOrUrl === "string") {
      const safeURL = safeRelayUrl(relayOrUrl);
      if (safeURL) relay = this.relays.get(safeURL) || this.requestRelay(safeURL);
    } else if (relayOrUrl instanceof URL) {
      relay = this.relays.get(relayOrUrl.toString()) || this.requestRelay(relayOrUrl.toString());
    } else relay = relayOrUrl;

    return relay;
  }

  getRelays(urls?: Iterable<string | URL | AbstractRelay>) {
    if (urls) {
      const relays: AbstractRelay[] = [];
      for (const url of urls) {
        const relay = this.getRelay(url);
        if (relay) relays.push(relay);
      }
      return relays;
    }

    return Array.from(this.relays.values());
  }

  requestRelay(url: string | URL, connect = true) {
    url = validateRelayURL(url);

    const key = url.toString();
    if (!this.relays.has(key)) {
      const newRelay = new AbstractRelay(key, { verifyEvent: verifyEventMethod });
      newRelay._onauth = (challenge) => this.onRelayChallenge.next([newRelay, challenge]);
      this.relays.set(key, newRelay);
      this.onRelayCreated.next(newRelay);
    }

    const relay = this.relays.get(key) as AbstractRelay;
    if (connect) this.requestConnect(relay);
    return relay;
  }

  async waitForOpen(relayOrUrl: string | URL | AbstractRelay, quite = true) {
    let relay = this.getRelay(relayOrUrl);
    if (!relay) return Promise.reject("Missing relay");

    if (relay.connected) return true;

    try {
      // if the relay is connecting, wait. otherwise request a connection
      // @ts-expect-error
      (await relay.connectionPromise) || this.requestConnect(relay, quite);
      return true;
    } catch (err) {
      if (quite) return false;
      else throw err;
    }
  }

  async requestConnect(relayOrUrl: string | URL | AbstractRelay, quite = true) {
    let relay = this.getRelay(relayOrUrl);
    if (!relay) return;

    if (!relay.connected && !offlineMode.value) {
      this.connecting.get(relay).next(true);
      try {
        await relay.connect();
        this.connecting.get(relay).next(false);
      } catch (e) {
        e = e || new Error("Unknown error");
        if (e instanceof Error) {
          this.log(`Failed to connect to ${relay.url}`, e.message);
          this.connectionErrors.get(relay).push(e);
        }
        this.connecting.get(relay).next(false);
        if (!quite) throw e;
      }
    }
  }

  disconnectFromUnused() {
    for (const [url, relay] of this.relays) {
      let disconnect = true;
      for (const process of processManager.processes) {
        if (process.active && process.relays.has(relay)) {
          disconnect = false;
          break;
        }
      }

      if (disconnect) {
        this.log(`No active processes using ${relay.url}, disconnecting`);
        relay.close();
      }
    }
  }
}
