import dayjs from "dayjs";
import { utils, Kind } from "nostr-tools";

import NostrMultiSubscription from "../classes/nostr-multi-subscription";
import { NostrEvent, isPTag } from "../types/nostr-event";
import clientRelaysService from "./client-relays";
import SuperMap from "../classes/super-map";
import { PersistentSubject } from "../classes/subject";
import accountService from "./account";
import { createSimpleQueryMap } from "../helpers/nostr/filter";

function getMessageRecipient(event: NostrEvent): string | undefined {
  return event.tags.find(isPTag)?.[1];
}

/** @deprecated */
class DirectMessagesService {
  incomingSub: NostrMultiSubscription;
  outgoingSub: NostrMultiSubscription;
  conversations = new PersistentSubject<string[]>([]);
  messages = new SuperMap<string, PersistentSubject<NostrEvent[]>>(() => new PersistentSubject<NostrEvent[]>([]));
  from = dayjs().subtract(2, "day").unix();

  constructor() {
    this.incomingSub = new NostrMultiSubscription("incoming-direct-messages");
    this.incomingSub.onEvent.subscribe(this.receiveEvent, this);

    this.outgoingSub = new NostrMultiSubscription("outgoing-direct-messages");
    this.outgoingSub.onEvent.subscribe(this.receiveEvent, this);

    // reset the messages when the account changes
    accountService.current.subscribe((newAccount) => {
      this.messages.clear();
      this.conversations.next([]);

      if (!newAccount) return;
      this.updateSubscriptions();
    });

    // update relays when they change
    clientRelaysService.readRelays.subscribe(() => {
      this.updateSubscriptions();
    });
  }

  private updateSubscriptions() {
    const account = accountService.current.value;
    if (!account) return;
    const readRelays = clientRelaysService.getReadUrls();

    this.incomingSub.setQueryMap(
      createSimpleQueryMap(readRelays, {
        "#p": [account.pubkey],
        kinds: [Kind.EncryptedDirectMessage],
        since: this.from,
      }),
    );
    this.outgoingSub.setQueryMap(
      createSimpleQueryMap(readRelays, {
        authors: [account.pubkey],
        kinds: [Kind.EncryptedDirectMessage],
        since: this.from,
      }),
    );
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

  loadDateRange(from: number) {
    const account = accountService.current.value;
    if (!account) return;
    if (dayjs.unix(this.from).isBefore(this.from)) return;

    this.from = from;
    this.updateSubscriptions();

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

if (import.meta.env.DEV) {
  // @ts-ignore
  window.directMessagesService = directMessagesService;
}

export default directMessagesService;
