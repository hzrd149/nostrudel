import { getReferences } from "../helpers/nostr-event";
import { NostrEvent } from "../types/nostr-event";
import { NostrRequest } from "./nostr-request";
import { NostrMultiSubscription } from "./nostr-multi-subscription";
import Subject, { PersistentSubject } from "./subject";

export class ThreadLoader {
  loading = new PersistentSubject(false);
  focusId = new PersistentSubject<string>("");
  rootId = new PersistentSubject<string>("");
  events = new PersistentSubject<Record<string, NostrEvent>>({});

  private relays: string[];
  private subscription: NostrMultiSubscription;

  constructor(relays: string[], eventId: string) {
    this.relays = relays;

    this.subscription = new NostrMultiSubscription(relays);

    this.subscription.onEvent.subscribe((event) => {
      this.events.next({ ...this.events.value, [event.id]: event });
    });

    this.updateEventId(eventId);
  }

  loadEvent() {
    this.loading.next(true);
    const request = new NostrRequest(this.relays);
    request.onEvent.subscribe((event) => {
      this.events.next({ ...this.events.value, [event.id]: event });

      this.checkAndUpdateRoot();

      request.cancel();
      this.loading.next(false);
    });
    request.start({ ids: [this.focusId.value] });
  }

  private checkAndUpdateRoot() {
    const event = this.events.value[this.focusId.value];

    if (event) {
      const refs = getReferences(event);
      const rootId = refs.rootId || event.id;
      // only update the root if its different
      if (rootId !== this.rootId.value) {
        this.rootId.next(rootId);
        this.loadRoot();
        this.updateSubscription();
      }
    }
  }

  loadRoot() {
    if (this.rootId.value) {
      const request = new NostrRequest(this.relays);
      request.onEvent.subscribe((event) => {
        this.events.next({ ...this.events.value, [event.id]: event });

        request.cancel();
      });
      request.start({ ids: [this.rootId.value] });
    }
  }

  private updateSubscription() {
    if (this.rootId.value) {
      this.subscription.setQuery({ "#e": [this.rootId.value], kinds: [1] });
      if (this.subscription.state !== NostrMultiSubscription.OPEN) {
        this.subscription.open();
      }
    }
  }

  updateEventId(eventId: string) {
    if (this.loading.value) {
      console.warn("trying to set eventId while loading");
      return;
    }

    this.focusId.next(eventId);

    const event = this.events.value[eventId];
    if (!event) {
      this.loadEvent();
    } else {
      this.checkAndUpdateRoot();
    }
  }

  open() {
    if (!this.loading.value && this.focusId.value && this.events.value[this.focusId.value]) {
      this.loadEvent();
    }
    this.updateSubscription();
  }
  close() {
    this.subscription.close();
  }
}
