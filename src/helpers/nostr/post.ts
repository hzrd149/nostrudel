import { EventTemplate, kinds, nip18, nip19 } from "nostr-tools";
import { EventPointer } from "nostr-tools/nip19";
import { getInboxes, isPTag } from "applesauce-core/helpers";

import { NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchEmoji, getMatchHashtag, getMatchNostrLink } from "../regexp";
import { getThreadReferences } from "./event";
import { safeDecode } from "../nip19";
import { Emoji } from "../../providers/global/emoji-provider";
import { EventSplit } from "./zaps";
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

/** @deprecated use event factory instead */
function AddQuotePointerTag(tags: Tag[], pointer: EventPointer) {
  const hint = pointer.relays?.[0] || getEventPointerRelayHint(pointer.id) || "";

  const tag: string[] = ["q", pointer.id, hint];
  if (pointer.author) tag.push(pointer.author);

  if (tags.some((t) => t[0] === tag[0] && t[1] === tag[1] && t[3] === tag[3])) {
    // replace the tag
    return tags.map((t) => {
      if (t[0] === tag[0] && t[1] === tag[1]) return tag;
      return t;
    });
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

export function correctContentMentions(content: string) {
  return content.replaceAll(/(?<=^|\s)(?:@)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi, "nostr:$1");
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

export function ensureNotifyContentMentions(draft: EventTemplate) {
  const mentions = getPubkeysMentionedInContent(draft.content);
  return mentions.length > 0 ? ensureNotifyPubkeys(draft, mentions) : draft;
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
export function ensureTagContentMentions(draft: EventTemplate) {
  const mentions = getAllEventsMentionedInContent(draft.content);
  const updated: EventTemplate = { ...draft, tags: Array.from(draft.tags) };

  for (const pointer of mentions) {
    updated.tags = AddEtag(updated.tags, pointer.id, pointer.relays?.[0] ?? "", "mention", false);
    updated.tags = AddQuotePointerTag(updated.tags, pointer);
  }

  return updated;
}

/** @deprecated use includeContentHashtags from applesauce-factory instead */
export function createHashtagTags(draft: EventTemplate) {
  const updatedDraft: EventTemplate = { ...draft, tags: Array.from(draft.tags) };

  // create tags for all occurrences of #hashtag
  const matches = updatedDraft.content.matchAll(getMatchHashtag());
  for (const [_, space, hashtag] of matches) {
    const lower = hashtag.toLocaleLowerCase();
    if (!updatedDraft.tags.find((t) => t[0] === "t" && t[1] === lower)) {
      updatedDraft.tags.push(["t", lower]);
    }
  }

  return updatedDraft;
}

export function createEmojiTags(draft: EventTemplate, emojis: Emoji[]) {
  const updatedDraft: EventTemplate = { ...draft, tags: Array.from(draft.tags) };

  // create tags for all occurrences of #hashtag
  const matches = updatedDraft.content.matchAll(getMatchEmoji());
  for (const [_, name] of matches) {
    const emoji = emojis.find((e) => e.name === name);
    if (emoji?.url) {
      updatedDraft.tags = addTag(updatedDraft.tags, ["emoji", emoji.name, emoji.url]);
    }
  }

  return updatedDraft;
}

export function setZapSplit(draft: EventTemplate, split: EventSplit) {
  const updatedDraft: EventTemplate = { ...draft, tags: Array.from(draft.tags) };

  // TODO: get best input relay for user
  const zapTags = split.map((p) => ["zap", p.pubkey, "", String(p.percent * 100)]);
  updatedDraft.tags.push(...zapTags);

  return updatedDraft;
}

/** @deprecated use event factory instead */
export function finalizeNote(draft: EventTemplate) {
  let updated: EventTemplate = { ...draft, tags: Array.from(draft.tags) };
  updated.content = correctContentMentions(updated.content);
  updated = ensureTagContentMentions(updated);
  return updated;
}
