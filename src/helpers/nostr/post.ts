import { DraftNostrEvent, NostrEvent, PTag, Tag } from "../../types/nostr-event";
import { getMatchHashtag, getMentionNpubOrNote } from "../regexp";
import { normalizeToHex } from "../nip19";
import { getReferences } from "./event";
import { getEventRelays } from "../../services/event-relays";
import relayScoreboardService from "../../services/relay-scoreboard";

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
export function ensureNotifyUsers(draft: DraftNostrEvent, pubkeys: string[]) {
  const updated: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

  for (const pubkey of pubkeys) {
    updated.tags = addTag(updated.tags, ["p", pubkey], false);
  }

  return updated;
}

export function replaceAtMentions(draft: DraftNostrEvent) {
  const updatedDraft: DraftNostrEvent = { ...draft, tags: Array.from(draft.tags) };

  // replace all occurrences of @npub and @note
  while (true) {
    const match = getMentionNpubOrNote().exec(updatedDraft.content);
    if (!match || match.index === undefined) break;

    const hex = normalizeToHex(match[1]);
    if (!hex) continue;
    const mentionType = match[2] === "npub1" ? "p" : "e";

    // TODO: find the best relay for this user or note
    const existingMention = updatedDraft.tags.find((t) => t[0] === mentionType && t[1] === hex);
    const index = existingMention
      ? updatedDraft.tags.indexOf(existingMention)
      : updatedDraft.tags.push([mentionType, hex, "", "mention"]) - 1;

    // replace the npub1 or note1 with a mention tag #[0]
    const c = updatedDraft.content;
    updatedDraft.content = c.slice(0, match.index) + `#[${index}]` + c.slice(match.index + match[0].length);
  }

  return updatedDraft;
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

export function finalizeNote(draft: DraftNostrEvent) {
  let updated = draft;
  updated = replaceAtMentions(updated);
  updated = createHashtagTags(updated);
  return updated;
}
