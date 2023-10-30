import dayjs from "dayjs";
import { utils, Kind } from "nostr-tools";

import NostrMultiSubscription from "../classes/nostr-multi-subscription";
import { NostrEvent, isPTag } from "../types/nostr-event";
import clientRelaysService from "./client-relays";
import SuperMap from "../classes/super-map";
import { PersistentSubject } from "../classes/subject";
import accountService from "./account";
import { NostrQuery } from "../types/nostr-query";

export function getMessageRecipient(event: NostrEvent): string | undefined {
  return event.tags.filter(isPTag)[0][1];
}

/** @deprecated */
class DirectMessagesService {
  incomingSub: NostrMultiSubscription;
  outgoingSub: NostrMultiSubscription;
  conversations = new PersistentSubject<string[]>([]);
  messages = new SuperMap<string, PersistentSubject<NostrEvent[]>>(() => new PersistentSubject<NostrEvent[]>([]));

  constructor() {
    this.incomingSub = new NostrMultiSubscription(
      clientRelaysService.getReadUrls(),
      undefined,
      "incoming-direct-messages",
    );
    this.incomingSub.onEvent.subscribe(this.receiveEvent, this);

    this.outgoingSub = new NostrMultiSubscription(
      clientRelaysService.getReadUrls(),
      undefined,
      "outgoing-direct-messages",
    );
    this.outgoingSub.onEvent.subscribe(this.receiveEvent, this);

    // reset the messages when the account changes
    accountService.current.subscribe((newAccount) => {
      this.messages.clear();
      this.conversations.next([]);

      if (!newAccount) return;

      // update subscriptions
      if (this.incomingSub.query) {
        this.incomingSub.setQuery({
          ...this.incomingSub.query,
          "#p": [newAccount.pubkey],
          since: dayjs().subtract(1, "day").unix(),
        });
      }
      if (this.outgoingSub.query) {
        this.outgoingSub.setQuery({
          ...this.outgoingSub.query,
          authors: [newAccount.pubkey],
          since: dayjs().subtract(1, "day").unix(),
        });
      }
    });

    // update relays when they change
    clientRelaysService.readRelays.subscribe((relays) => {
      const urls = relays.map((r) => r.url);
      this.incomingSub.setRelays(urls);
      this.outgoingSub.setRelays(urls);
    });
  }

  receiveEvent(event: NostrEvent) {
    const from = event.pubkey;
    const to = getMessageRecipient(event);
    if (!to) return;
    const pubkey = accountService.current.value?.pubkey;
    if (from !== pubkey && to !== pubkey) return;

    const conversation = from === pubkey ? to : from;
    const subject = this.messages.get(conversation);
    subject.next(utils.insertEventIntoDescendingList(subject.value, event));

    if (!this.conversations.value.includes(conversation)) {
      this.conversations.next([...this.conversations.value, conversation]);
    }
  }

  getUserMessages(from: string) {
    return this.messages.get(from);
  }

  getContactCount() {
    return this.messages.size;
  }

  loadDateRange(from: dayjs.ConfigType) {
    const account = accountService.current.value;
    if (!account) return;

    if (
      !Array.isArray(this.incomingSub.query) &&
      this.incomingSub.query?.since &&
      dayjs.unix(this.incomingSub.query.since).isBefore(from)
    ) {
      // "since" is already set on the subscription and its older than "from"
      return;
    }

    const incomingQuery: NostrQuery = {
      kinds: [Kind.EncryptedDirectMessage],
      "#p": [account.pubkey],
      since: dayjs(from).unix(),
    };
    this.incomingSub.setQuery(incomingQuery);

    const outgoingQuery: NostrQuery = {
      kinds: [Kind.EncryptedDirectMessage],
      authors: [account.pubkey],
      since: dayjs(from).unix(),
    };
    this.outgoingSub.setQuery(outgoingQuery);

    this.incomingSub.setRelays(clientRelaysService.getReadUrls());
    this.outgoingSub.setRelays(clientRelaysService.getReadUrls());

    if (this.incomingSub.state !== NostrMultiSubscription.OPEN) {
      this.incomingSub.open();
    }
    if (this.outgoingSub.state !== NostrMultiSubscription.OPEN) {
      this.outgoingSub.open();
    }
  }
}

/** @deprecated */
const directMessagesService = new DirectMessagesService();

export default directMessagesService;
