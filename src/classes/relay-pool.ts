import { AbstractRelay } from "nostr-tools";
import dayjs from "dayjs";

import { logger } from "../helpers/debug";
import { safeRelayUrl, validateRelayURL } from "../helpers/relay";
import { offlineMode } from "../services/offline-mode";
import Subject, { PersistentSubject } from "./subject";
import verifyEventMethod from "../services/verify-event";
import SuperMap from "./super-map";
import processManager from "../services/process-manager";

export type Notice = {
  message: string;
  date: number;
};

export default class RelayPool {
  relays = new Map<string, AbstractRelay>();
  onRelayCreated = new Subject<AbstractRelay>();
  onRelayChallenge = new Subject<[AbstractRelay, string]>();

  notices = new SuperMap<AbstractRelay, PersistentSubject<Notice[]>>(() => new PersistentSubject<Notice[]>([]));

  connectionErrors = new SuperMap<AbstractRelay, Error[]>(() => []);
  connecting = new SuperMap<AbstractRelay, PersistentSubject<boolean>>(() => new PersistentSubject(false));

  log = logger.extend("RelayPool");

  getRelay(relayOrUrl: string | URL | AbstractRelay) {
    if (typeof relayOrUrl === "string") {
      const safeURL = safeRelayUrl(relayOrUrl);
      if (safeURL) {
        return this.relays.get(safeURL) || this.requestRelay(safeURL);
      } else return;
    } else if (relayOrUrl instanceof URL) {
      return this.relays.get(relayOrUrl.toString()) || this.requestRelay(relayOrUrl.toString());
    }

    return relayOrUrl;
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
      const r = new AbstractRelay(key, { verifyEvent: verifyEventMethod });
      r._onauth = (challenge) => this.onRelayChallenge.next([r, challenge]);
      r.onnotice = (notice) => this.handleRelayNotice(r, notice);

      this.relays.set(key, r);
      this.onRelayCreated.next(r);
    }

    const relay = this.relays.get(key) as AbstractRelay;
    if (connect && !relay.connected) this.requestConnect(relay);
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

  handleRelayNotice(relay: AbstractRelay, message: string) {
    const subject = this.notices.get(relay);
    subject.next([...subject.value, { message, date: dayjs().unix() }]);
  }

  disconnectFromUnused() {
    for (const [url, relay] of this.relays) {
      if (!relay.connected) continue;

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
