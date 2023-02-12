import { NostrEvent } from "../types/nostr-event";
import { PubkeyEventRequester } from "./pubkey-event-requester";

export class CachedPubkeyEventRequester extends PubkeyEventRequester {
  async readCache(pubkey: string): Promise<NostrEvent | undefined> {
    return undefined;
  }
  async writeCache(pubkey: string, event: NostrEvent): Promise<any> {}

  handleEvent(event: NostrEvent) {
    this.writeCache(event.pubkey, event);
    super.handleEvent(event);
  }

  requestEvent(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.getSubject(pubkey);

    if (!sub.value || alwaysRequest) {
      this.readCache(pubkey).then((cached) => {
        if (cached && (!sub.value || cached.created_at > sub.value.created_at)) {
          sub.next(cached);
        }

        if (!sub.value || alwaysRequest) {
          super.requestEvent(pubkey, relays, alwaysRequest);
        }
      });
    }

    return sub;
  }
}
