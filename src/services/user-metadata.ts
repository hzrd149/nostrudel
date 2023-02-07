import { BehaviorSubject } from "rxjs";
import { Kind0ParsedContent } from "../types/nostr-event";
import db from "./db";
import settings from "./settings";
import { Subscription } from "./subscriptions";

class UserMetadata {
  requests = new Set<string>();
  subjects = new Map<string, BehaviorSubject<Kind0ParsedContent | null>>();
  subscription: Subscription;

  constructor(relayUrls: string[] = []) {
    this.subscription = new Subscription(relayUrls, undefined, "user-metadata");

    this.subscription.onEvent.subscribe((event) => {
      try {
        const metadata = JSON.parse(event.content);
        this.getUserSubject(event.pubkey).next(metadata);
        db.put("user-metadata", event);
      } catch (e) {}
    });

    setInterval(() => {
      this.pruneRequests();
    }, 1000 * 10);
  }

  private getUserSubject(pubkey: string) {
    if (!this.subjects.has(pubkey)) {
      this.subjects.set(
        pubkey,
        new BehaviorSubject<Kind0ParsedContent | null>(null)
      );
    }
    return this.subjects.get(
      pubkey
    ) as BehaviorSubject<Kind0ParsedContent | null>;
  }

  requestUserMetadata(pubkey: string, useCache = true) {
    const subject = this.getUserSubject(pubkey);

    const request = () => {
      if (!this.requests.has(pubkey)) {
        this.requests.add(pubkey);
        this.updateSubscription();
      }
    };
    if (useCache && !subject.getValue()) {
      db.get("user-metadata", pubkey).then((cachedEvent) => {
        if (cachedEvent) {
          try {
            subject.next(JSON.parse(cachedEvent.content));
          } catch (e) {
            request();
          }
        } else request();
      });
    } else request();

    return subject;
  }

  updateSubscription() {
    const pubkeys = Array.from(this.requests.keys());

    if (pubkeys.length === 0) {
      this.subscription.close();
    } else {
      this.subscription.setQuery({ authors: pubkeys, kinds: [0] });
      if (this.subscription.state === Subscription.CLOSED) {
        this.subscription.open();
      }
    }
  }

  pruneRequests() {
    let removed = false;
    const subjects = Array.from(this.subjects.entries());
    for (const [pubkey, subject] of subjects) {
      // if there is a request for the pubkey and no one is observing it. close the request
      if (this.requests.has(pubkey) && !subject.observed) {
        this.requests.delete(pubkey);
        removed = true;
      }
    }

    if (removed) this.updateSubscription();
  }
}

const userMetadata = new UserMetadata(settings.relays.getValue());

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMetadata = userMetadata;
}

export default userMetadata;
