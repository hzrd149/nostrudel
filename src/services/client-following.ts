import moment from "moment";
import { BehaviorSubject, lastValueFrom, Subscription } from "rxjs";
import { nostrPostAction } from "../classes/nostr-post-action";
import { DraftNostrEvent, PTag } from "../types/nostr-event";
import clientRelaysService from "./client-relays";
import identity from "./identity";
import userContactsService from "./user-contacts";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

const following = new BehaviorSubject<PTag[]>([]);
const pendingDraft = new BehaviorSubject<DraftNostrEvent | null>(null);
const savingDraft = new BehaviorSubject(false);

let sub: Subscription | undefined;
function updateSub() {
  if (sub) {
    sub.unsubscribe();
    sub = undefined;
  }

  if (identity.pubkey.value) {
    sub = userContactsService
      .requestContacts(identity.pubkey.value, clientRelaysService.getReadUrls(), true)
      .subscribe((userContacts) => {
        if (!userContacts) return;

        following.next(
          userContacts.contacts.map((key) => {
            const relay = userContacts.contactRelay[key];
            if (relay) return ["p", key, relay];
            else return ["p", key];
          })
        );

        // reset the pending list since we just got a new contacts list
        pendingDraft.next(null);
      });
  }
}

identity.pubkey.subscribe(() => {
  // clear the following list until a new one can be fetched
  following.next([]);

  updateSub();
});

clientRelaysService.readRelays.subscribe(() => {
  updateSub();
});

function isFollowing(pubkey: string) {
  return following.value.some((t) => t[1] === pubkey);
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
    await lastValueFrom(results);

    savingDraft.next(false);

    // pass new event to contact list service
    userContactsService.handleEvent(event);
  }
}

function addContact(pubkey: string, relay?: string) {
  const newTag: PTag = relay ? ["p", pubkey, relay] : ["p", pubkey];
  if (isFollowing(pubkey)) {
    following.next(
      following.value.map((t) => {
        if (t[1] === pubkey) {
          return newTag;
        }
        return t;
      })
    );
  } else {
    following.next([...following.value, newTag]);
  }

  pendingDraft.next(getDraftEvent());
}
function removeContact(pubkey: string) {
  if (isFollowing(pubkey)) {
    following.next(following.value.filter((t) => t[1] !== pubkey));
    pendingDraft.next(getDraftEvent());
  }
}

const clientFollowingService = {
  following: following,
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
