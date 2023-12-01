import dayjs from "dayjs";

import { unique } from "../helpers/array";
import { DraftNostrEvent, RTag } from "../types/nostr-event";
import accountService from "./account";
import { RelayConfig, RelayMode } from "../classes/relay";
import userRelaysService, { ParsedUserRelays } from "./user-relays";
import { Connection, PersistentSubject, Subject } from "../classes/subject";
import signingService from "./signing";
import { logger } from "../helpers/debug";
import NostrPublishAction from "../classes/nostr-publish-action";
import { COMMON_CONTACT_RELAY } from "../const";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

const DEFAULT_RELAYS = [
  { url: "wss://relay.damus.io", mode: RelayMode.READ },
  { url: "wss://nostr.wine", mode: RelayMode.READ },
  { url: "wss://relay.snort.social", mode: RelayMode.READ },
  { url: "wss://nos.lol", mode: RelayMode.READ },
  { url: "wss://purplerelay.com", mode: RelayMode.READ },
];

const userRelaysToRelayConfig: Connection<ParsedUserRelays, RelayConfig[], RelayConfig[] | undefined> = (
  userRelays,
  next,
) => next(userRelays.relays);

class ClientRelayService {
  // bootstrapRelays = new Set<string>();
  relays = new PersistentSubject<RelayConfig[]>([]);
  writeRelays = new PersistentSubject<RelayConfig[]>([]);
  readRelays = new PersistentSubject<RelayConfig[]>([]);

  log = logger.extend("ClientRelays");

  constructor() {
    accountService.loading.subscribe(this.handleAccountChange, this);
    accountService.current.subscribe(this.handleAccountChange, this);

    // set the read and write relays
    this.relays.subscribe((relays) => {
      this.log("Got new relay list", relays);
      this.writeRelays.next(relays.filter((r) => r.mode & RelayMode.WRITE));
      this.readRelays.next(relays.filter((r) => r.mode & RelayMode.READ));
    });
  }

  private userRequestRelaySubject: Subject<ParsedUserRelays> | undefined;
  private handleAccountChange() {
    if (accountService.loading.value) return;

    // disconnect the relay list subject
    if (this.userRequestRelaySubject) {
      this.relays.disconnect(this.userRequestRelaySubject);
      this.userRequestRelaySubject = undefined;
    }

    const account = accountService.current.value;
    if (!account) {
      this.log("No account, using default relays");
      this.relays.next(DEFAULT_RELAYS);
      return;
    }

    // clear relays
    this.relays.next([]);

    // connect the relay subject with the account relay subject
    this.userRequestRelaySubject = userRelaysService.getRelays(account.pubkey);
    this.relays.connectWithHandler(this.userRequestRelaySubject, userRelaysToRelayConfig);

    // load the relays from cache
    if (!userRelaysService.getRelays(account.pubkey).value) {
      this.log("Load users relay list from cache");
      userRelaysService.loadFromCache(account.pubkey).then(() => {
        if (this.relays.value.length === 0) {
          const bootstrapRelays = account.relays ?? [COMMON_CONTACT_RELAY];

          this.log("Loading relay list from bootstrap relays", bootstrapRelays);
          userRelaysService.requestRelays(account.pubkey, bootstrapRelays, { alwaysRequest: true });
        }
      });
    }

    // double check for new relay notes
    setTimeout(() => {
      if (this.relays.value.length === 0) return;

      this.log("Requesting latest relay list from relays");
      userRelaysService.requestRelays(account.pubkey, this.getWriteUrls(), { alwaysRequest: true });
    }, 5000);
  }

  /** @deprecated */
  async addRelay(url: string, mode: RelayMode) {
    this.log(`Adding ${url} relay`);
    if (!this.relays.value.some((r) => r.url === url)) {
      const newRelays = [...this.relays.value, { url, mode }];
      await this.postUpdatedRelays(newRelays);
    }
  }
  /** @deprecated */
  async updateRelay(url: string, mode: RelayMode) {
    this.log(`Updating ${url} relay`);
    if (this.relays.value.some((r) => r.url === url)) {
      const newRelays = this.relays.value.map((r) => (r.url === url ? { url, mode } : r));
      await this.postUpdatedRelays(newRelays);
    }
  }
  /** @deprecated */
  async removeRelay(url: string) {
    this.log(`Removing ${url} relay`);
    if (this.relays.value.some((r) => r.url === url)) {
      const newRelays = this.relays.value.filter((r) => r.url !== url);
      await this.postUpdatedRelays(newRelays);
    }
  }

  /** @deprecated */
  async postUpdatedRelays(newRelays: RelayConfig[]) {
    const rTags: RTag[] = newRelays.map((r) => {
      switch (r.mode) {
        case RelayMode.READ:
          return ["r", r.url, "read"];
        case RelayMode.WRITE:
          return ["r", r.url, "write"];
        case RelayMode.ALL:
        default:
          return ["r", r.url];
      }
    });

    const draft: DraftNostrEvent = {
      kind: 10002,
      tags: rTags,
      content: "",
      created_at: dayjs().unix(),
    };

    const newRelayUrls = newRelays.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
    const oldRelayUrls = this.relays.value.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
    const writeUrls = unique([...oldRelayUrls, ...newRelayUrls, COMMON_CONTACT_RELAY]);

    const current = accountService.current.value;
    if (!current) throw new Error("no account");
    const signed = await signingService.requestSignature(draft, current);

    const pub = new NostrPublishAction("Update Relays", writeUrls, signed);

    // pass new event to the user relay service
    userRelaysService.receiveEvent(signed);

    await pub.onComplete;
  }

  getWriteUrls() {
    return this.relays.value?.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
  }
  getReadUrls() {
    return this.relays.value?.filter((r) => r.mode & RelayMode.READ).map((r) => r.url);
  }
}

const clientRelaysService = new ClientRelayService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.clientRelaysService = clientRelaysService;
}

export default clientRelaysService;
