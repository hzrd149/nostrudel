import dayjs from "dayjs";
import { getEventRelays } from "../services/event-relays";
import { DraftNostrEvent, isETag, isPTag, NostrEvent, RTag, Tag } from "../types/nostr-event";
import { RelayConfig, RelayMode } from "../classes/relay";
import accountService from "../services/account";
import { Kind, nip19 } from "nostr-tools";
import { matchNostrLink } from "./regexp";
import { getSharableNoteId } from "./nip19";
import relayScoreboardService from "../services/relay-scoreboard";

export function isReply(event: NostrEvent | DraftNostrEvent) {
  return event.kind === 1 && !!getReferences(event).replyId;
}

export function isRepost(event: NostrEvent | DraftNostrEvent) {
  const match = event.content.match(matchNostrLink);
  return event.kind === 6 || (match && match[0].length === event.content.length);
}

export function truncatedId(id: string, keep = 6) {
  return id.substring(0, keep) + "..." + id.substring(id.length - keep);
}

/**
 * returns an array of tag indexes that are referenced in the content
 * either with the legacy #[0] syntax or nostr:xxxxx links
 */
export function getContentTagRefs(content: string, tags: Tag[]) {
  const indexes = new Set();
  Array.from(content.matchAll(/#\[(\d+)\]/gi)).forEach((m) => indexes.add(parseInt(m[1])));

  const linkMatches = Array.from(content.matchAll(new RegExp(matchNostrLink, "gi")));
  for (const [_, _prefix, link] of linkMatches) {
    try {
      const decoded = nip19.decode(link);

      let type: string;
      let id: string;
      switch (decoded.type) {
        case "npub":
          id = decoded.data;
          type = "p";
          break;
        case "nprofile":
          id = decoded.data.pubkey;
          type = "p";
          break;
        case "note":
          id = decoded.data;
          type = "e";
          break;
        case "nevent":
          id = decoded.data.id;
          type = "e";
          break;
      }

      let t = tags.find((t) => t[0] === type && t[1] === id);
      if (t) {
        let index = tags.indexOf(t);
        indexes.add(index);
      }
    } catch (e) {}
  }

  return Array.from(indexes);
}

export function filterTagsByContentRefs(content: string, tags: Tag[], referenced = true) {
  const contentTagRefs = getContentTagRefs(content, tags);

  const newTags: Tag[] = [];
  for (let i = 0; i < tags.length; i++) {
    if (contentTagRefs.includes(i) === referenced) {
      newTags.push(tags[i]);
    }
  }
  return newTags;
}

export type EventReferences = ReturnType<typeof getReferences>;
export function getReferences(event: NostrEvent | DraftNostrEvent) {
  const eTags = event.tags.filter(isETag);
  const pTags = event.tags.filter(isPTag);

  const events = eTags.map((t) => t[1]);
  const contentTagRefs = getContentTagRefs(event.content, event.tags);

  let replyId = eTags.find((t) => t[3] === "reply")?.[1];
  let rootId = eTags.find((t) => t[3] === "root")?.[1];

  if (!rootId || !replyId) {
    // a direct reply dose not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md

    // this is not necessarily to spec. but if there is only one id (root or reply) then assign it to both
    // this handles the cases where a client only set a "reply" tag and no root
    rootId = replyId = rootId || replyId;
  }

  // legacy behavior
  // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
  const legacyTags = eTags.filter((t, i) => {
    // ignore it if there is a third piece of data
    if (t[3]) return false;
    const tagIndex = event.tags.indexOf(t);
    if (contentTagRefs.includes(tagIndex)) return false;
    return true;
  });
  if (!rootId && !replyId && legacyTags.length >= 1) {
    // console.info(`Using legacy threading behavior for ${event.id}`, event);

    // first tag is the root
    rootId = legacyTags[0][1];
    // last tag is reply
    replyId = legacyTags[legacyTags.length - 1][1] ?? rootId;
  }

  return {
    events,
    rootId,
    replyId,
    contentTagRefs,
  };
}

export function buildReply(event: NostrEvent, account = accountService.current.value): DraftNostrEvent {
  const refs = getReferences(event);
  const relay = getEventRelays(event.id).value?.[0] ?? "";

  const tags: NostrEvent["tags"] = [];

  const rootId = refs.rootId ?? event.id;
  const replyId = event.id;

  tags.push(["e", rootId, relay, "root"]);
  if (replyId !== rootId) {
    tags.push(["e", replyId, relay, "reply"]);
  }
  // add all ptags
  // TODO: omit my own pubkey
  const ptags = event.tags.filter(isPTag).filter((t) => !account || t[1] !== account.pubkey);
  tags.push(...ptags);
  // add the original authors pubkey if its not already there
  if (!ptags.some((t) => t[1] === event.pubkey)) {
    tags.push(["p", event.pubkey]);
  }

  return {
    kind: Kind.Text,
    // TODO: be smarter about picking relay
    tags,
    content: "",
    created_at: dayjs().unix(),
  };
}

export function buildRepost(event: NostrEvent): DraftNostrEvent {
  const relays = getEventRelays(event.id).value;
  const topRelay = relayScoreboardService.getRankedRelays(relays)[0] ?? "";

  const tags: NostrEvent["tags"] = [];
  tags.push(["e", event.id, topRelay]);

  return {
    kind: Kind.Repost,
    tags,
    content: "",
    created_at: dayjs().unix(),
  };
}

export function buildQuoteRepost(event: NostrEvent): DraftNostrEvent {
  const nevent = getSharableNoteId(event.id);

  return {
    kind: Kind.Text,
    tags: [],
    content: "nostr:" + nevent,
    created_at: dayjs().unix(),
  };
}

export function buildDeleteEvent(eventIds: string[], reason = ""): DraftNostrEvent {
  return {
    kind: Kind.EventDeletion,
    tags: eventIds.map((id) => ["e", id]),
    content: reason,
    created_at: dayjs().unix(),
  };
}

export function parseRTag(tag: RTag): RelayConfig {
  switch (tag[2]) {
    case "write":
      return { url: tag[1], mode: RelayMode.WRITE };
    case "read":
      return { url: tag[1], mode: RelayMode.READ };
    default:
      return { url: tag[1], mode: RelayMode.ALL };
  }
}
