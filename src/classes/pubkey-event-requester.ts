import dayjs from "dayjs";
import { NostrSubscription } from "./nostr-subscription";
import { SuperMap } from "./super-map";
import { NostrEvent } from "../types/nostr-event";
import Subject from "./subject";
import { NostrQuery } from "../types/nostr-query";

type pubkey = string;
type relay = string;

class PubkeyEventRequestSubscription {
  private subscription: NostrSubscription;
  private kind: number;
  private dTag?: string;

  private subjects = new SuperMap<pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private requestNext = new Set<pubkey>();

  private requestedPubkeys = new Map<pubkey, Date>();

  constructor(relay: string, kind: number, name?: string, dTag?: string) {
    this.kind = kind;
    this.dTag = dTag;
    this.subscription = new NostrSubscription(relay, undefined, name);

    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
    this.subscription.onEOSE.subscribe(this.handleEOSE.bind(this));
  }

  private handleEvent(event: NostrEvent) {
    // reject the event if its the wrong kind
    if (event.kind !== this.kind) return;
    // reject the event if has the wrong d tag or is missing one
    if (this.dTag && !event.tags.some((t) => t[0] === "d" && t[1] === this.dTag)) return;

    // remove the pubkey from the waiting list
    this.requestedPubkeys.delete(event.pubkey);

    const sub = this.subjects.get(event.pubkey);

    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
    }
  }
  private handleEOSE() {
    // relays says it has nothing left
    this.requestedPubkeys.clear();
  }

  getSubject(pubkey: string) {
    return this.subjects.get(pubkey);
  }

  requestEvent(pubkey: string) {
    const sub = this.subjects.get(pubkey);

    if (!sub.value) {
      this.requestNext.add(pubkey);
    }

    return sub;
  }

  update() {
    let needsUpdate = false;
    for (const pubkey of this.requestNext) {
      if (!this.requestedPubkeys.has(pubkey)) {
        this.requestedPubkeys.set(pubkey, new Date());
        needsUpdate = true;
      }
    }
    this.requestNext.clear();

    // prune pubkeys
    const timeout = dayjs().subtract(1, "minute");
    for (const [pubkey, date] of this.requestedPubkeys) {
      if (dayjs(date).isBefore(timeout)) {
        this.requestedPubkeys.delete(pubkey);
        needsUpdate = true;
      }
    }

    // update the subscription
    if (needsUpdate) {
      if (this.requestedPubkeys.size > 0) {
        const query: NostrQuery = { authors: Array.from(this.requestedPubkeys.keys()), kinds: [this.kind] };
        if (this.dTag) query["#d"] = [this.dTag];
        this.subscription.setQuery(query);
        if (this.subscription.state !== NostrSubscription.OPEN) {
          this.subscription.open();
        }
      } else if (this.subscription.state === NostrSubscription.OPEN) {
        this.subscription.close();
      }
    }
  }
}

export class PubkeyEventRequester {
  private kind: number;
  private name?: string;
  private dTag?: string;
  private subjects = new SuperMap<pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private subscriptions = new SuperMap<relay, PubkeyEventRequestSubscription>(
    (relay) => new PubkeyEventRequestSubscription(relay, this.kind, this.name, this.dTag)
  );

  constructor(kind: number, name?: string, dTag?: string) {
    this.kind = kind;
    this.name = name;
    this.dTag = dTag;
  }

  getSubject(pubkey: string) {
    return this.subjects.get(pubkey);
  }

  handleEvent(event: NostrEvent) {
    if (event.kind !== this.kind) return;
    const sub = this.subjects.get(event.pubkey);

    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
    }
  }

  private connected = new WeakSet<any>();
  requestEvent(pubkey: string, relays: string[]) {
    const sub = this.subjects.get(pubkey);

    for (const relay of relays) {
      const relaySub = this.subscriptions.get(relay).requestEvent(pubkey);

      if (!this.connected.has(relaySub)) {
        relaySub.subscribe((event) => event && this.handleEvent(event));
        this.connected.add(relaySub);
      }
    }

    return sub;
  }

  update() {
    for (const [relay, subscription] of this.subscriptions) {
      subscription.update();
    }
  }
}
