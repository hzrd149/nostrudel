import { AbstractRelay } from "nostr-tools/abstract-relay";
import dayjs from "dayjs";

import { logger } from "../helpers/debug";
import { safeRelayUrl, validateRelayURL } from "../helpers/relay";
import Subject, { PersistentSubject } from "./subject";
import SuperMap from "./super-map";
import verifyEventMethod from "../services/verify-event";
import { offlineMode } from "../services/offline-mode";
import processManager from "../services/process-manager";
import signingService from "../services/signing";
import accountService from "../services/account";
import localSettings from "../services/local-settings";

export type Notice = {
  message: string;
  date: number;
  relay: AbstractRelay;
};

export type RelayAuthMode = "always" | "ask" | "never";

export default class RelayPool {
  log = logger.extend("RelayPool");

  relays = new Map<string, AbstractRelay>();
  onRelayCreated = new Subject<AbstractRelay>();
  onRelayChallenge = new Subject<[AbstractRelay, string]>();

  notices = new SuperMap<AbstractRelay, PersistentSubject<Notice[]>>(() => new PersistentSubject<Notice[]>([]));

  connectionErrors = new SuperMap<AbstractRelay, Error[]>(() => []);
  connecting = new SuperMap<AbstractRelay, PersistentSubject<boolean>>(() => new PersistentSubject(false));

  challenges = new SuperMap<AbstractRelay, Subject<string>>(() => new Subject<string>());
  authForPublish = new SuperMap<AbstractRelay, Subject<boolean>>(() => new Subject());
  authForSubscribe = new SuperMap<AbstractRelay, Subject<boolean>>(() => new Subject());

  authenticated = new SuperMap<AbstractRelay, Subject<boolean>>(() => new Subject());

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
      r._onauth = (challenge) => this.handleRelayChallenge(r, challenge);
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

  getRelayAuthStorageKey(relayOrUrl: string | URL | AbstractRelay) {
    let relay = this.getRelay(relayOrUrl);
    return `${relay!.url}-auth-mode`;
  }
  getRelayAuthMode(relayOrUrl: string | URL | AbstractRelay): RelayAuthMode | undefined {
    let relay = this.getRelay(relayOrUrl);
    if (!relay) return;

    const defaultMode = localSettings.defaultAuthenticationMode.value;
    const mode = (localStorage.getItem(this.getRelayAuthStorageKey(relay)) as RelayAuthMode) ?? undefined;

    return mode || defaultMode;
  }
  setRelayAuthMode(relayOrUrl: string | URL | AbstractRelay, mode: RelayAuthMode) {
    let relay = this.getRelay(relayOrUrl);
    if (!relay) return;

    localStorage.setItem(this.getRelayAuthStorageKey(relay), mode);
  }

  pendingAuth = new Map<AbstractRelay, Promise<string | undefined>>();
  async authenticate(
    relayOrUrl: string | URL | AbstractRelay,
    sign: Parameters<AbstractRelay["auth"]>[0],
    quite = true,
  ) {
    let relay = this.getRelay(relayOrUrl);
    if (!relay) return;

    const pending = this.pendingAuth.get(relay);
    if (pending) return pending;

    if (this.getRelayAuthMode(relay) === "never") throw new Error("Auth disabled for relay");

    if (!relay.connected) throw new Error("Not connected");

    const promise = new Promise<string | undefined>(async (res) => {
      if (!relay) return;

      try {
        const message = await relay.auth(sign);
        this.authenticated.get(relay).next(true);
        res(message);
      } catch (e) {
        e = e || new Error("Unknown error");
        if (e instanceof Error) {
          this.log(`Failed to authenticate to ${relay.url}`, e.message);
        }
        this.authenticated.get(relay).next(false);
        if (!quite) throw e;
      }

      this.pendingAuth.delete(relay);
    });

    this.pendingAuth.set(relay, promise);

    return await promise;
  }

  canSubscribe(relayOrUrl: string | URL | AbstractRelay) {
    let relay = this.getRelay(relayOrUrl);
    if (!relay) return false;

    return this.authForSubscribe.get(relay).value !== false;
  }

  private automaticallyAuthenticate(relay: AbstractRelay) {
    const authMode = this.getRelayAuthMode(relay);
    // only automatically authenticate if auth mode is set to "always"
    if (authMode === "always") {
      const account = accountService.current.value;
      if (!account) return;

      this.authenticate(relay, (draft) => {
        return signingService.requestSignature(draft, account);
      }).then(() => {
        this.log(`Automatically authenticated to ${relay.url}`);
      });
    }
  }

  private handleRelayChallenge(relay: AbstractRelay, challenge: string) {
    this.onRelayChallenge.next([relay, challenge]);
    this.challenges.get(relay).next(challenge);

    if (localSettings.proactivelyAuthenticate.value) {
      this.automaticallyAuthenticate(relay);
    }
  }

  handleRelayNotice(relay: AbstractRelay, message: string) {
    const subject = this.notices.get(relay);
    subject.next([...subject.value, { message, date: dayjs().unix(), relay }]);

    if (message.includes("auth-required")) {
      const authForSubscribe = this.authForSubscribe.get(relay);
      if (!authForSubscribe.value) authForSubscribe.next(true);

      // try to authenticate
      this.automaticallyAuthenticate(relay);
    }
  }

  disconnectFromUnused() {
    for (const [url, relay] of this.relays) {
      if (!relay.connected) continue;

      // don't disconnect from authenticated relays
      if (this.authenticated.get(relay).value) continue;

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

        // NOTE: fix nostr-tools not resetting the connection promise
        // @ts-expect-error
        relay.connectionPromise = false;
      }
    }
  }
}
