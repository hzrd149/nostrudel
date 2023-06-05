import { NostrEvent } from "../types/nostr-event";
import { PubkeyEventRequester } from "./pubkey-event-requester";

export class CachedPubkeyEventRequester extends PubkeyEventRequester {
  private readCacheDedupe = new Map<string, Promise<NostrEvent | undefined>>();
  async readCache(pubkey: string): Promise<NostrEvent | undefined> {
    return undefined;
  }
  async writeCache(pubkey: string, event: NostrEvent): Promise<any> {}

  handleEvent(event: NostrEvent) {
    const sub = this.getSubject(event.pubkey);
    if (!sub.value || event.created_at > sub.value.created_at) {
      this.writeCache(event.pubkey, event);
    }
    super.handleEvent(event);
  }

  requestEvent(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.getSubject(pubkey);

    if (!sub.value) {
      // only call this.readCache once per pubkey
      if (!this.readCacheDedupe.has(pubkey)) {
        const promise = this.readCacheDedupe.get(pubkey) || this.readCache(pubkey);
        this.readCacheDedupe.set(pubkey, promise);

        promise.then((cached) => {
          this.readCacheDedupe.delete(pubkey);

          if (cached) this.handleEvent(cached);

          if (!sub.value || alwaysRequest) super.requestEvent(pubkey, relays);
        });
      }
    } else if (alwaysRequest) {
      super.requestEvent(pubkey, relays);
    }

    return sub;
  }
}
