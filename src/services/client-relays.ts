import moment from "moment";
import { nostrPostAction } from "../classes/nostr-post-action";
import { unique } from "../helpers/array";
import { DraftNostrEvent, RTag } from "../types/nostr-event";
import identityService from "./identity";
import { RelayConfig, RelayMode } from "../classes/relay";
import userRelaysService, { UserRelays } from "./user-relays";
import { PersistentSubject, Subject } from "../classes/subject";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

class ClientRelayService {
  bootstrapRelays = new Set<string>();
  relays = new PersistentSubject<RelayConfig[]>([
    //default relay list
    { url: "wss://relay.damus.io", mode: RelayMode.READ },
    { url: "wss://relay.snort.social", mode: RelayMode.READ },
    { url: "wss://nos.lol", mode: RelayMode.READ },
    { url: "wss://brb.io", mode: RelayMode.READ },
  ]);
  writeRelays = new PersistentSubject<RelayConfig[]>([]);
  readRelays = new PersistentSubject<RelayConfig[]>([]);

  constructor() {
    let lastSubject: Subject<UserRelays> | undefined;
    identityService.pubkey.subscribe((pubkey) => {
      // clear the relay list until a new one can be fetched
      // this.relays.next([]);

      if (lastSubject) {
        lastSubject.unsubscribe(this.handleRelayChanged, this);
        lastSubject = undefined;
      }

      lastSubject = userRelaysService.requestRelays(pubkey, Array.from(this.bootstrapRelays), true);

      lastSubject.subscribe(this.handleRelayChanged, this);
    });

    // add preset relays fromm nip07 extension to bootstrap list
    identityService.relays.subscribe((presetRelays) => {
      for (const [url, opts] of Object.entries(presetRelays)) {
        if (opts.read) {
          clientRelaysService.bootstrapRelays.add(url);
        }
      }
    });

    this.relays.subscribe((relays) => this.writeRelays.next(relays.filter((r) => r.mode & RelayMode.WRITE)));
    this.relays.subscribe((relays) => this.readRelays.next(relays.filter((r) => r.mode & RelayMode.READ)));
  }

  private handleRelayChanged(relays: UserRelays) {
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

    if (window.nostr) {
      const event = await window.nostr.signEvent(draft);

      const results = nostrPostAction(writeUrls, event);
      await results.onComplete;

      // pass new event to the user relay service
      userRelaysService.handleEvent(event);
    }
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
