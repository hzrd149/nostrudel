import dayjs from "dayjs";
import debug, { Debugger } from "debug";
import { NostrSubscription } from "./nostr-subscription";
import { SuperMap } from "./super-map";
import { NostrEvent } from "../types/nostr-event";
import Subject from "./subject";
import { NostrQuery } from "../types/nostr-query";
import { nameOrPubkey } from "../helpers/debug";

type pubkey = string;
type relay = string;

class PubkeyEventRequestSubscription {
  private subscription: NostrSubscription;
  private kind: number;
  private dTag?: string;

  private subjects = new SuperMap<pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private requestNext = new Set<pubkey>();

  private requestedPubkeys = new Map<pubkey, Date>();

  log: Debugger;

  constructor(relay: string, kind: number, name?: string, dTag?: string, log?: Debugger) {
    this.kind = kind;
    this.dTag = dTag;
    this.subscription = new NostrSubscription(relay, undefined, name);

    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
    this.subscription.onEOSE.subscribe(this.handleEOSE.bind(this));

    this.log = log || debug("misc");
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
      this.log(`Found newer event for ${nameOrPubkey(event.pubkey)}`);
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
      this.log(`Adding ${nameOrPubkey(pubkey)} to queue`);
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
        this.log(`Request for ${nameOrPubkey(pubkey)} expired`);
      }
    }

    // update the subscription
    if (needsUpdate) {
      if (this.requestedPubkeys.size > 0) {
        const query: NostrQuery = { authors: Array.from(this.requestedPubkeys.keys()), kinds: [this.kind] };
        if (this.dTag) query["#d"] = [this.dTag];

        this.log(`Updating query with ${query.authors?.length} pubkeys`);
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
    (relay) => new PubkeyEventRequestSubscription(relay, this.kind, this.name, this.dTag, this.log.extend(relay))
  );

  log: Debugger;

  constructor(kind: number, name?: string, dTag?: string, log?: Debugger) {
    this.kind = kind;
    this.name = name;
    this.dTag = dTag;

    this.log = log || debug("misc");
  }

  getSubject(pubkey: string) {
    return this.subjects.get(pubkey);
  }

  handleEvent(event: NostrEvent) {
    if (event.kind !== this.kind) return;

    const sub = this.subjects.get(event.pubkey);
    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      this.log(`New event for ${nameOrPubkey(event.pubkey)}`);
      sub.next(event);
    }
  }

  requestEvent(pubkey: string, relays: string[]) {
    this.log(`Requesting event for ${nameOrPubkey(pubkey)}`);
    const sub = this.subjects.get(pubkey);

    for (const relay of relays) {
      const relaySub = this.subscriptions.get(relay).requestEvent(pubkey);

      sub.connectWithHandler(relaySub, (event, next, current) => {
        if (event.kind !== this.kind) return;
        if (!current || event.created_at > current.created_at) {
          this.log(`Event for ${nameOrPubkey(event.pubkey)} from connection`);
          next(event);
        }
      });
    }

    return sub;
  }

  update() {
    for (const [relay, subscription] of this.subscriptions) {
      subscription.update();
    }
  }
}
