import { unique } from "../helpers/array";

export class PubkeyRequestList {
  needsFlush = false;
  requests = new Map<string, Set<string>>();

  hasPubkey(pubkey: string) {
    return this.requests.has(pubkey);
  }
  addPubkey(pubkey: string, relays: string[] = []) {
    const pending = this.requests.get(pubkey);
    if (pending) {
      if (relays.length > 0) {
        this.needsFlush = true;
        // get or create the list of relays
        const r = this.requests.get(pubkey) ?? new Set();
        // add new relay urls to set
        relays.forEach((url) => r.add(url));
        this.requests.set(pubkey, r);
      }
    } else {
      this.needsFlush = true;
      this.requests.set(pubkey, new Set(relays));
    }
  }
  removePubkey(pubkey: string) {
    this.requests.delete(pubkey);
  }

  flush() {
    this.needsFlush = false;
    const pubkeys = Array.from(this.requests.keys());
    const relays = unique(
      Array.from(this.requests.values())
        .map((set) => Array.from(set))
        .flat()
    );

    return { pubkeys, relays };
  }
}
