import { safeRelayUrl, safeRelayUrls } from "../helpers/relay";
import relayPoolService from "../services/relay-pool";
import { NostrEvent } from "../types/nostr-event";
import { RelayMode } from "./relay";

export default class RelaySet extends Set<string> {
  get urls() {
    return Array.from(this);
  }
  getRelays() {
    return this.urls.map((url) => relayPoolService.requestRelay(url, false));
  }

  clone() {
    return new RelaySet(this);
  }
  merge(src: Iterable<string>): this {
    for (const url of src) this.add(url);
    return this;
  }

  static from(...sources: (Iterable<string> | undefined)[]) {
    const set = new RelaySet();
    for (const src of sources) {
      if (!src) continue;
      for (const url of src) {
        const safe = safeRelayUrl(url);
        if (safe) set.add(safe);
      }
    }
    return set;
  }

  static fromNIP65Event(event: NostrEvent, mode: RelayMode = RelayMode.ALL) {
    const set = new RelaySet();
    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1]) {
        const url = safeRelayUrl(tag[1]);
        if (!url) continue;
        if (tag[2] === "write" && mode & RelayMode.WRITE) set.add(url);
        else if (tag[2] === "read" && mode & RelayMode.READ) set.add(url);
        else set.add(url);
      }
    }
    return set;
  }
}
