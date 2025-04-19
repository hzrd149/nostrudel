import { isPTag } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { getPubkeysFromList, isPubkeyInList, listAddPerson, listRemovePerson } from "./lists";

export function getPubkeysFromMuteList(muteList: NostrEvent | EventTemplate) {
  const expirations = getPubkeysExpiration(muteList);
  return getPubkeysFromList(muteList).map((p) => ({
    pubkey: p.pubkey,
    expiration: expirations[p.pubkey] ?? Infinity,
  }));
}
export function getPubkeysExpiration(muteList: NostrEvent | EventTemplate) {
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
export function getPubkeyExpiration(muteList: NostrEvent, pubkey: string) {
  const tag = muteList.tags.find((tag) => {
    return tag[0] === "mute_expiration" && tag[1] === pubkey && tag[2];
  }, {});

  if (tag && tag[1] && tag[2]) {
    const date = parseInt(tag[2]);
    if (dayjs.unix(date).isValid()) return date;
  }
  return isPubkeyInList(muteList, pubkey) ? Infinity : 0;
}

/** @todo this should be handled by applesauce-factory */
export function createEmptyMuteList(): EventTemplate {
  return {
    created_at: dayjs().unix(),
    content: "",
    tags: [],
    kind: kinds.Mutelist,
  };
}

/** @todo this should be updated to use applesauce-factory when it supports updating lists */
export function muteListAddPubkey(muteList: NostrEvent | EventTemplate, pubkey: string, expiration = Infinity) {
  let draft = listAddPerson(muteList, pubkey);
  if (expiration < Infinity) {
    draft = {
      ...draft,
      tags: [...draft.tags, ["mute_expiration", pubkey, String(expiration)]],
    };
  }

  return draft;
}

/** @todo this should be updated to use applesauce-factory when it supports updating lists */
export function muteListRemovePubkey(muteList: NostrEvent | EventTemplate, pubkey: string) {
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

/** @todo this should be updated to use applesauce-factory when it supports updating lists */
export function pruneExpiredPubkeys(muteList: NostrEvent | EventTemplate) {
  const expirations = getPubkeysExpiration(muteList);
  const now = dayjs().unix();
  const draft: EventTemplate = {
    kind: kinds.Mutelist,
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
