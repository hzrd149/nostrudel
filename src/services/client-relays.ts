import moment from "moment";
import { nostrPostAction } from "../classes/nostr-post-action";
import { unique } from "../helpers/array";
import { DraftNostrEvent, RTag } from "../types/nostr-event";
import accountService from "./account";
import { RelayConfig, RelayMode } from "../classes/relay";
import userRelaysService, { ParsedUserRelays } from "./user-relays";
import { PersistentSubject, Subject } from "../classes/subject";
import signingService from "./signing";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

const DEFAULT_RELAYS = [
  { url: "wss://relay.damus.io", mode: RelayMode.READ },
  { url: "wss://nostr.wine", mode: RelayMode.READ },
  { url: "wss://relay.snort.social", mode: RelayMode.READ },
  { url: "wss://eden.nostr.land", mode: RelayMode.READ },
  { url: "wss://nos.lol", mode: RelayMode.READ },
];

class ClientRelayService {
  bootstrapRelays = new Set<string>();
  relays = new PersistentSubject<RelayConfig[]>([]);
  writeRelays = new PersistentSubject<RelayConfig[]>([]);
  readRelays = new PersistentSubject<RelayConfig[]>([]);

  constructor() {
    let lastSubject: Subject<ParsedUserRelays> | undefined;
    accountService.current.subscribe((account) => {
      if (!account) {
        this.relays.next(DEFAULT_RELAYS);
        return;
      } else this.relays.next([]);

      if (account.relays) {
        this.bootstrapRelays.clear();
        for (const relay of account.relays) {
          this.bootstrapRelays.add(relay);
        }
      }

      if (lastSubject) {
        lastSubject.unsubscribe(this.handleRelayChanged, this);
        lastSubject = undefined;
      }

      // load the relays from cache or bootstrap relays
      lastSubject = userRelaysService.requestRelays(account.pubkey, Array.from(this.bootstrapRelays));
      setTimeout(() => {
        // double check for new relay notes
        userRelaysService.requestRelays(account.pubkey, this.getWriteUrls(), true);
      }, 1000);

      lastSubject.subscribe(this.handleRelayChanged, this);
    });

    this.relays.subscribe((relays) => this.writeRelays.next(relays.filter((r) => r.mode & RelayMode.WRITE)));
    this.relays.subscribe((relays) => this.readRelays.next(relays.filter((r) => r.mode & RelayMode.READ)));
  }

  private handleRelayChanged(relays: ParsedUserRelays) {
    this.relays.next(relays.relays);
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
      created_at: moment().unix(),
    };

    const newRelayUrls = newRelays.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
    const oldRelayUrls = this.relays.value.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
    const writeUrls = unique([...oldRelayUrls, ...newRelayUrls]);

    const current = accountService.current.value;
    if (!current) throw new Error("no account");
    const event = await signingService.requestSignature(draft, current);

    const results = nostrPostAction(writeUrls, event);
    await results.onComplete;

    // pass new event to the user relay service
    userRelaysService.receiveEvent(event);
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
