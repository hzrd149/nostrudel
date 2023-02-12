import moment from "moment";
import { BehaviorSubject, lastValueFrom, Subscription } from "rxjs";
import { nostrPostAction } from "../classes/nostr-post-action";
import { unique } from "../helpers/array";
import { DraftNostrEvent, RTag } from "../types/nostr-event";
import identity from "./identity";
import { RelayConfig, RelayMode } from "../classes/relay";
import userRelaysService from "./user-relays";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

class ClientRelayService {
  bootstrapRelays = new Set<string>();
  relays = new BehaviorSubject<RelayConfig[]>([]);
  writeRelays = new BehaviorSubject<RelayConfig[]>([]);
  readRelays = new BehaviorSubject<RelayConfig[]>([]);

  constructor() {
    let sub: Subscription;
    identity.pubkey.subscribe((pubkey) => {
      // clear the relay list until a new one can be fetched
      this.relays.next([]);

      if (sub) sub.unsubscribe();

      sub = userRelaysService.requestRelays(pubkey, Array.from(this.bootstrapRelays), true).subscribe((userRelays) => {
        if (!userRelays) return;

        this.relays.next(userRelays.relays);
      });
    });

    // add preset relays fromm nip07 extension to bootstrap list
    identity.relays.subscribe((presetRelays) => {
      for (const [url, opts] of Object.entries(presetRelays)) {
        if (opts.read) {
          clientRelaysService.bootstrapRelays.add(url);
        }
      }
    });

    this.relays.subscribe((relays) => this.writeRelays.next(relays.filter((r) => r.mode & RelayMode.WRITE)));
    this.relays.subscribe((relays) => this.readRelays.next(relays.filter((r) => r.mode & RelayMode.READ)));
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
      await lastValueFrom(results);

      // pass new event to the user relay service
      userRelaysService.handleEvent(event);
    }
  }

  getWriteUrls() {
    return this.relays.value.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
  }
  getReadUrls() {
    return this.relays.value.filter((r) => r.mode & RelayMode.READ).map((r) => r.url);
  }
}

const clientRelaysService = new ClientRelayService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.clientRelaysService = clientRelaysService;
}

export default clientRelaysService;
