import { DraftNostrEvent, NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchEmoji, getMatchHashtag, getMatchNostrLink } from "../regexp";
import { getReferences } from "./events";
import { getPubkeyFromDecodeResult, safeDecode } from "../nip19";
import { Emoji } from "../../providers/global/emoji-provider";
import { EventSplit } from "./zaps";
import { unique } from "../array";
import relayHintService from "../../services/event-relay-hint";

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
export function addReplyTags(draft: DraftNostrEvent, replyTo: NostrEvent) {
  const updated: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

  const refs = getReferences(replyTo);
  const rootId = refs.root?.e?.id ?? replyTo.id;
  const rootRelayHint = refs.root?.e?.relays?.[0];
  const replyId = replyTo.id;
  const replyRelayHint = relayHintService.getEventPointerRelayHint(replyId);

  updated.tags = AddEtag(updated.tags, rootId, rootRelayHint, "root", true);
  updated.tags = AddEtag(updated.tags, replyId, replyRelayHint, "reply", true);

  return updated;
}

/** ensure a list of pubkeys are present on an event */
export function ensureNotifyPubkeys(draft: DraftNostrEvent, pubkeys: string[]) {
  const updated: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

  for (const pubkey of pubkeys) {
    updated.tags = addTag(updated.tags, ["p", pubkey, "", "mention"], false);
  }

  return updated;
}

export function correctContentMentions(content: string) {
  return content.replace(/(\s|^)(?:@)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi, "$1nostr:$2");
}

export function getContentMentions(content: string) {
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

export function ensureNotifyContentMentions(draft: DraftNostrEvent) {
  const mentions = getContentMentions(draft.content);
  return mentions.length > 0 ? ensureNotifyPubkeys(draft, mentions) : draft;
}

export function createHashtagTags(draft: DraftNostrEvent) {
  const updatedDraft: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

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

export function createEmojiTags(draft: DraftNostrEvent, emojis: Emoji[]) {
  const updatedDraft: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

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

export function setZapSplit(draft: DraftNostrEvent, split: EventSplit) {
  const updatedDraft: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

  // TODO: get best input relay for user
  const zapTags = split.map((p) => ["zap", p.pubkey, "", String(p.percent * 100)]);
  updatedDraft.tags.push(...zapTags);

  return updatedDraft;
}

export function finalizeNote(draft: DraftNostrEvent) {
  let updated: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };
  updated.content = correctContentMentions(updated.content);
  updated = createHashtagTags(updated);
  return updated;
}
