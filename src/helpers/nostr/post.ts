import { DraftNostrEvent, NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchEmoji, getMatchHashtag } from "../regexp";
import { getReferences } from "./events";
import { getEventRelays } from "../../services/event-relays";
import relayScoreboardService from "../../services/relay-scoreboard";
import { getPubkey, safeDecode } from "../nip19";
import { Emoji } from "../../providers/emoji-provider";

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
function AddEtag(tags: Tag[], eventId: string, type?: string, overwrite = false) {
  const relays = getEventRelays(eventId).value ?? [];
  const top = relayScoreboardService.getRankedRelays(relays)[0] ?? "";

  const tag = type ? ["e", eventId, top, type] : ["e", eventId, top];

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

  const rootId = refs.rootId ?? replyTo.id;
  const replyId = replyTo.id;

  updated.tags = AddEtag(updated.tags, rootId, "root", true);
  updated.tags = AddEtag(updated.tags, replyId, "reply", true);

  return updated;
}

/** ensure a list of pubkeys are present on an event */
export function ensureNotifyPubkeys(draft: DraftNostrEvent, pubkeys: string[]) {
  const updated: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

  for (const pubkey of pubkeys) {
    updated.tags = addTag(updated.tags, ["p", pubkey], false);
  }

  return updated;
}

export function correctContentMentions(content: string) {
  return content.replace(/(\s|^)(?:@)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi, "$1nostr:$2");
}

export function getContentMentions(content: string) {
  const matched = content.matchAll(/nostr:(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi);
  return Array.from(matched)
    .map((m) => {
      const parsed = safeDecode(m[1]);
      return parsed && getPubkey(parsed);
    })
    .filter(Boolean) as string[];
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

export function finalizeNote(draft: DraftNostrEvent) {
  let updated: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };
  updated.content = correctContentMentions(updated.content);
  updated = createHashtagTags(updated);
  return updated;
}
