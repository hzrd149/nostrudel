import { EventTemplate, nip19 } from "nostr-tools";
import { NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchEmoji, getMatchHashtag, getMatchNostrLink } from "../regexp";
import { getThreadReferences } from "./event";
import { safeDecode } from "../nip19";
import { Emoji } from "../../providers/global/emoji-provider";
import { EventSplit } from "./zaps";
import { unique } from "../array";

import relayHintService from "../../services/event-relay-hint";
import userMailboxesService from "../../services/user-mailboxes";

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
function AddEtag(tags: Tag[], eventId: string, relayHint?: string, type?: string, overwrite = false) {
  const hint = relayHint || relayHintService.getEventPointerRelayHint(eventId) || "";

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
  const replyRelayHint = relayHintService.getEventPointerRelayHint(replyId);

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
  return content.replace(/(\s|^)(?:@)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi, "$1nostr:$2");
}

export function getPubkeysMentionedInContent(content: string) {
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
        if (decode.data.author) pubkeys.push(decode.data.author);
        break;
      case "naddr":
        if (decode.data.pubkey) pubkeys.push(decode.data.pubkey);
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
  }

  return updated;
}

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

export function finalizeNote(draft: EventTemplate) {
  let updated: EventTemplate = { ...draft, tags: Array.from(draft.tags) };
  updated.content = correctContentMentions(updated.content);
  updated = createHashtagTags(updated);
  updated = userMailboxesService.addPubkeyRelayHints(updated);
  updated = ensureTagContentMentions(updated);
  return updated;
}
