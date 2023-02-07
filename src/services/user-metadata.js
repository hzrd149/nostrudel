import { BehaviorSubject, Subject } from "rxjs";
import settingsService from "./settings";
import { Subscription } from "./subscriptions";

function waitOnSignal(signal) {
  return new Promise((res) => {
    const listener = (event) => {
      signal.removeListener(listener);
      res(event);
    };
    signal.addListener(listener);
  });
}

class UserMetadata {
  requests = new Map();

  constructor(relayUrls = []) {
    this.subscription = new Subscription(relayUrls, null, "user-metadata");

    this.subscription.onEvent.subscribe((event) => {
      try {
        const metadata = JSON.parse(event.content);
        this.requests.get(event.pubkey)?.next(metadata);
      } catch (e) {}
    });

    setInterval(() => {
      this.pruneRequests();
    }, 1000 * 10);
  }

  requestUserMetadata(pubkey) {
    if (!this.requests.has(pubkey)) {
      this.requests.set(pubkey, new BehaviorSubject(null));
      this.updateSubscription();
    }
    return this.requests.get(pubkey);
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
    const requests = Array.from(this.requests.entries());
    for (const [pubkey, subject] of requests) {
      if (!subject.observed) {
        subject.complete();
        this.requests.delete(pubkey);
        removed = true;
      }
    }

    if (removed) this.updateSubscription();
  }
}

const userMetadata = new UserMetadata(await settingsService.getRelays());

if (import.meta.env.DEV) {
  window.userMetadata = userMetadata;
}

export default userMetadata;
