import moment, { MomentInput } from "moment";
import { NostrMultiSubscription } from "../classes/nostr-multi-subscription";
import { NostrEvent } from "../types/nostr-event";
import clientRelaysService from "./client-relays";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { SuperMap } from "../classes/super-map";
import { PersistentSubject } from "../classes/subject";
import accountService from "./account";
import { NostrQuery } from "../types/nostr-query";
import { convertTimestampToDate } from "../helpers/date";
import { Kind } from "nostr-tools";
import { getReferences } from "../helpers/nostr-event";

export function getMessageRecipient(event: NostrEvent): string | undefined {
  return getReferences(event).pubkeys[0];
}

class DirectMessagesService {
  incomingSub: NostrMultiSubscription;
  outgoingSub: NostrMultiSubscription;
  conversations = new PersistentSubject<string[]>([]);
  messages = new SuperMap<string, PersistentSubject<NostrEvent[]>>(() => new PersistentSubject<NostrEvent[]>([]));

  constructor() {
    this.incomingSub = new NostrMultiSubscription(
      clientRelaysService.getReadUrls(),
      undefined,
      "incoming-direct-messages"
    );
    this.incomingSub.onEvent.subscribe(this.receiveEvent, this);

    this.outgoingSub = new NostrMultiSubscription(
      clientRelaysService.getReadUrls(),
      undefined,
      "outgoing-direct-messages"
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
          since: moment().subtract(1, "day").unix(),
        });
      }
      if (this.outgoingSub.query) {
        this.outgoingSub.setQuery({
          ...this.outgoingSub.query,
          authors: [newAccount.pubkey],
          since: moment().subtract(1, "day").unix(),
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
    subject.next(insertEventIntoDescendingList(subject.value, event));

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

  loadDateRange(from: MomentInput) {
    const account = accountService.current.value;
    if (!account) return;

    if (this.incomingSub.query?.since && moment(convertTimestampToDate(this.incomingSub.query.since)).isBefore(from)) {
      // "since" is already set on the subscription and its older than "from"
      return;
    }

    const incomingQuery: NostrQuery = {
      kinds: [Kind.EncryptedDirectMessage],
      "#p": [account.pubkey],
      since: moment(from).unix(),
    };
    this.incomingSub.setQuery(incomingQuery);

    const outgoingQuery: NostrQuery = {
      kinds: [Kind.EncryptedDirectMessage],
      authors: [account.pubkey],
      since: moment(from).unix(),
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

const directMessagesService = new DirectMessagesService();

export default directMessagesService;
