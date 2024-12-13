import { EventTemplate, nip19 } from "nostr-tools";

import { NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchNostrLink } from "../regexp";
import { getThreadReferences } from "./event";
import { safeDecode } from "../nip19";
import { unique } from "../array";

import { getEventPointerRelayHint } from "../../services/relay-hints";

/** @deprecated use event factory instead */
function addTag(tags: Tag[], tag: Tag, overwrite = false) {
  if (tags.some((t) => t[0] === tag[0] && t[1] === tag[1])) {
    if (overwrite) {
      return tags.map((t) => {
        if (t[0] === tag[0] && t[1] === tag[1]) return tag;
        return t;
      });
    }
    return tags;
  }
  return [...tags, tag];
}

/** @deprecated use event factory instead */
function AddEtag(tags: Tag[], eventId: string, relayHint?: string, type?: string, overwrite = false) {
  const hint = relayHint || getEventPointerRelayHint(eventId) || "";

  const tag = type ? ["e", eventId, hint, type] : ["e", eventId, hint];

  if (tags.some((t) => t[0] === tag[0] && t[1] === tag[1] && t[3] === tag[3])) {
    if (overwrite) {
      return tags.map((t) => {
        if (t[0] === tag[0] && t[1] === tag[1]) return tag;
        return t;
      });
    }
    return tags;
  }
  return [...tags, tag];
}

/** adds the "root" and "reply" E tags */
export function addReplyTags(draft: EventTemplate, replyTo: NostrEvent) {
  const updated: EventTemplate = { ...draft, tags: Array.from(draft.tags) };

  const refs = getThreadReferences(replyTo);
  const rootId = refs.root?.e?.id ?? replyTo.id;
  const rootRelayHint = refs.root?.e?.relays?.[0];
  const replyId = replyTo.id;
  const replyRelayHint = getEventPointerRelayHint(replyId);

  updated.tags = AddEtag(updated.tags, rootId, rootRelayHint, "root", true);
  updated.tags = AddEtag(updated.tags, replyId, replyRelayHint, "reply", true);

  return updated;
}

/** ensure a list of pubkeys are present on an event */
export function ensureNotifyPubkeys(draft: EventTemplate, pubkeys: string[]) {
  const updated: EventTemplate = { ...draft, tags: Array.from(draft.tags) };

  for (const pubkey of pubkeys) {
    updated.tags = addTag(updated.tags, ["p", pubkey, "", "mention"], false);
  }

  return updated;
}

export function getPubkeysMentionedInContent(content: string, direct = false) {
  const matched = content.matchAll(getMatchNostrLink());

  const pubkeys: string[] = [];

  for (const match of matched) {
    const decode = safeDecode(match[2]);
    if (!decode) continue;

    switch (decode.type) {
      case "npub":
        pubkeys.push(decode.data);
        break;
      case "nprofile":
        pubkeys.push(decode.data.pubkey);
        break;
      case "nevent":
        if (decode.data.author && !direct) pubkeys.push(decode.data.author);
        break;
      case "naddr":
        if (decode.data.pubkey && !direct) pubkeys.push(decode.data.pubkey);
        break;
    }
  }

  return unique(pubkeys);
}

export function getAllEventsMentionedInContent(content: string) {
  const matched = content.matchAll(getMatchNostrLink());

  const events: nip19.EventPointer[] = [];

  for (const match of matched) {
    const decode = safeDecode(match[2]);
    if (!decode) continue;

    switch (decode.type) {
      case "note":
        events.push({ id: decode.data });
        break;
      case "nevent":
        events.push(decode.data);
        break;
    }
  }

  return events;
}
