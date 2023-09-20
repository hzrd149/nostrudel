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

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

const DEFAULT_RELAYS = [
  { url: "wss://relay.damus.io", mode: RelayMode.READ },
  { url: "wss://nostr.wine", mode: RelayMode.READ },
  { url: "wss://relay.snort.social", mode: RelayMode.READ },
  { url: "wss://eden.nostr.land", mode: RelayMode.READ },
  { url: "wss://nos.lol", mode: RelayMode.READ },
];

const userRelaysToRelayConfig: Connection<ParsedUserRelays, RelayConfig[], RelayConfig[] | undefined> = (
  userRelays,
  next,
) => next(userRelays.relays);

class ClientRelayService {
  bootstrapRelays = new Set<string>();
  relays = new PersistentSubject<RelayConfig[]>([]);
  writeRelays = new PersistentSubject<RelayConfig[]>([]);
  readRelays = new PersistentSubject<RelayConfig[]>([]);

  log = logger.extend("ClientRelays");

  constructor() {
    let lastSubject: Subject<ParsedUserRelays> | undefined;
    accountService.current.subscribe((account) => {
      if (!account) {
        this.log("No account, using default relays");
        this.relays.next(DEFAULT_RELAYS);
        return;
      } else this.relays.next([]);

      if (account.relays) {
        this.log("Found bootstrap relays");
        this.bootstrapRelays.clear();
        for (const relay of account.relays) {
          this.bootstrapRelays.add(relay);
        }
      }

      if (lastSubject) {
        this.log("Disconnecting from previous user relays");
        this.relays.disconnect(lastSubject);
        lastSubject = undefined;
      }

      // load the relays from cache or bootstrap relays
      this.log("Load users relays from cache or bootstrap relays");
      lastSubject = userRelaysService.requestRelays(account.pubkey, Array.from(this.bootstrapRelays));
      setTimeout(() => {
        // double check for new relay notes
        this.log("Requesting latest relays from the write relays");
        userRelaysService.requestRelays(account.pubkey, this.getWriteUrls(), { alwaysRequest: true });
      }, 1000);

      this.relays.connectWithHandler(lastSubject, userRelaysToRelayConfig);
    });

    // set the read and write relays
    this.relays.subscribe((relays) => {
      this.log("Got new relay list");
      this.writeRelays.next(relays.filter((r) => r.mode & RelayMode.WRITE));
      this.readRelays.next(relays.filter((r) => r.mode & RelayMode.READ));
    });
  }

  async addRelay(url: string, mode: RelayMode) {
    this.log(`Adding ${url} relay`);
    if (!this.relays.value.some((r) => r.url === url)) {
      const newRelays = [...this.relays.value, { url, mode }];
      await this.postUpdatedRelays(newRelays);
    }
  }
  async updateRelay(url: string, mode: RelayMode) {
    this.log(`Updating ${url} relay`);
    if (this.relays.value.some((r) => r.url === url)) {
      const newRelays = this.relays.value.map((r) => (r.url === url ? { url, mode } : r));
      await this.postUpdatedRelays(newRelays);
    }
  }
  async removeRelay(url: string) {
    this.log(`Removing ${url} relay`);
    if (this.relays.value.some((r) => r.url === url)) {
      const newRelays = this.relays.value.filter((r) => r.url !== url);
      await this.postUpdatedRelays(newRelays);
    }
  }

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
    // always write relay lists to wss://purplepag.es
    const writeUrls = unique([...oldRelayUrls, ...newRelayUrls, "wss://purplepag.es"]);

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
