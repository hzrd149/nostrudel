import moment from "moment";
import { nostrPostAction } from "../classes/nostr-post-action";
import { PersistentSubject, Subject } from "../classes/subject";
import { DraftNostrEvent, PTag } from "../types/nostr-event";
import clientRelaysService from "./client-relays";
import accountService from "./account";
import userContactsService, { UserContacts } from "./user-contacts";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

const following = new PersistentSubject<PTag[]>([]);
const pendingDraft = new PersistentSubject<DraftNostrEvent | null>(null);
const savingDraft = new PersistentSubject(false);

function handleNewContacts(contacts: UserContacts | undefined) {
  if (!contacts) return;

  following.next(
    contacts.contacts.map((key) => {
      const relay = contacts.contactRelay[key];
      if (relay) return ["p", key, relay];
      else return ["p", key];
    })
  );

  // reset the pending list since we just got a new contacts list
  pendingDraft.next(null);
}

let sub: Subject<UserContacts> | undefined;
function updateSub() {
  const pubkey = accountService.current.value?.pubkey;
  if (sub) {
    sub.unsubscribe(handleNewContacts);
    sub = undefined;
  }

  if (pubkey) {
    sub = userContactsService.requestContacts(pubkey, clientRelaysService.getReadUrls(), true);

    sub.subscribe(handleNewContacts);
  }
}

accountService.current.subscribe(() => {
  // clear the following list until a new one can be fetched
  following.next([]);

  updateSub();
});

clientRelaysService.readRelays.subscribe(() => {
  updateSub();
});

function isFollowing(pubkey: string) {
  return !!following.value?.some((t) => t[1] === pubkey);
}

function getDraftEvent(): DraftNostrEvent {
  return {
    kind: 3,
    tags: following.value,
    // according to NIP-02 kind 3 events (contact list) can have any content and it should be ignored
    // https://github.com/nostr-protocol/nips/blob/master/02.md
    // some other clients are using the content to store relays.
    content: "",
    created_at: moment().unix(),
  };
}

async function savePending() {
  const draft = pendingDraft.value;
  if (!draft) return;

  if (window.nostr) {
    savingDraft.next(true);
    const event = await window.nostr.signEvent(draft);

    const results = nostrPostAction(clientRelaysService.getWriteUrls(), event);
    await results.onComplete;

    savingDraft.next(false);

    // pass new event to contact list service
    userContactsService.handleEvent(event);
  }
}

function addContact(pubkey: string, relay?: string) {
  const newTag: PTag = relay ? ["p", pubkey, relay] : ["p", pubkey];
  const pTags = following.value;
  if (isFollowing(pubkey)) {
    following.next(
      pTags.map((t) => {
        if (t[1] === pubkey) {
          return newTag;
        }
        return t;
      })
    );
  } else {
    following.next([...pTags, newTag]);
  }

  pendingDraft.next(getDraftEvent());
}
function removeContact(pubkey: string) {
  if (isFollowing(pubkey)) {
    const pTags = following.value;
    following.next(pTags.filter((t) => t[1] !== pubkey));
    pendingDraft.next(getDraftEvent());
  }
}

const clientFollowingService = {
  following,
  isFollowing,
  savingDraft,
  savePending,
  addContact,
  removeContact,
};

if (import.meta.env.DEV) {
  // @ts-ignore
  window.clientFollowingService = clientFollowingService;
}

export default clientFollowingService;
