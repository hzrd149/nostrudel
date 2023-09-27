import dayjs from "dayjs";
import { DraftNostrEvent, NostrEvent, isPTag } from "../../types/nostr-event";
import { MUTE_LIST_KIND, getPubkeysFromList, listAddPerson, listRemovePerson } from "./lists";

export function getPubkeysFromMuteList(muteList: NostrEvent | DraftNostrEvent) {
  const expirations = getPubkeysExpiration(muteList);
  return getPubkeysFromList(muteList).map((p) => ({
    pubkey: p.pubkey,
    expiration: expirations[p.pubkey] ?? Infinity,
  }));
}
export function getPubkeysExpiration(muteList: NostrEvent | DraftNostrEvent) {
  return muteList.tags.reduce<Record<string, number>>((dir, tag) => {
    if (tag[0] === "mute_expiration" && tag[1] && tag[2]) {
      const date = parseInt(tag[2]);
      if (dayjs.unix(date).isValid()) {
        return { ...dir, [tag[1]]: date };
      }
    }
    return dir;
  }, {});
}

export function createEmptyMuteList(): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    content: "",
    tags: [],
    kind: MUTE_LIST_KIND,
  };
}

export function muteListAddPubkey(muteList: NostrEvent | DraftNostrEvent, pubkey: string, expiration = Infinity) {
  let draft = listAddPerson(muteList, pubkey);
  if (expiration < Infinity) {
    draft = {
      ...draft,
      tags: [...draft.tags, ["mute_expiration", pubkey, String(expiration)]],
    };
  }

  return draft;
}
export function muteListRemovePubkey(muteList: NostrEvent | DraftNostrEvent, pubkey: string) {
  let draft = listRemovePerson(muteList, pubkey);

  draft = {
    ...draft,
    tags: draft.tags.filter((t) => {
      if (t[0] === "mute_expiration" && t[1] === pubkey) return false;
      return true;
    }),
  };

  return draft;
}

export function pruneExpiredPubkeys(muteList: NostrEvent | DraftNostrEvent) {
  const expirations = getPubkeysExpiration(muteList);
  const now = dayjs().unix();
  const draft: DraftNostrEvent = {
    kind: MUTE_LIST_KIND,
    content: muteList.content,
    created_at: now,
    tags: muteList.tags.filter((tag) => {
      // remove expired "expiration" tags
      if (tag[0] === "mute_expiration" && parseInt(tag[2]) < now) return false;
      // remove expired "p" tags
      if (isPTag(tag) && expirations[tag[1]] < now) return false;
      return true;
    }),
  };

  return draft;
}
