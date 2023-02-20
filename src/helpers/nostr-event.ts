import moment from "moment";
import { getEventRelays } from "../services/event-relays";
import { DraftNostrEvent, isETag, isPTag, NostrEvent, RTag } from "../types/nostr-event";
import { RelayConfig, RelayMode } from "../classes/relay";
import accountService from "../services/account";
import { Kind } from "nostr-tools";

export function isReply(event: NostrEvent | DraftNostrEvent) {
  return event.tags.filter(isETag).some((tag) => tag[3] !== "mention");
}

export function isNote(event: NostrEvent | DraftNostrEvent) {
  return !isReply(event);
}

export function truncatedId(id: string, keep = 6) {
  return id.substring(0, keep) + "..." + id.substring(id.length - keep);
}

export type EventReferences = ReturnType<typeof getReferences>;
export function getReferences(event: NostrEvent | DraftNostrEvent) {
  const eTags = event.tags.filter(isETag);
  const pTags = event.tags.filter(isPTag);

  const events = eTags.map((t) => t[1]);
  const pubkeys = pTags.map((t) => t[1]);

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
  const legacyTags = eTags.filter((t) => !t[3]);
  if (!rootId && !replyId && legacyTags.length >= 1) {
    // console.info(`Using legacy threading behavior for ${event.id}`, event);

    // first tag is the root
    rootId = legacyTags[0][1];
    // last tag is reply
    replyId = legacyTags[legacyTags.length - 1][1] ?? rootId;
  }

  return {
    pubkeys,
    events,
    rootId,
    replyId,
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
    created_at: moment().unix(),
  };
}

export function buildShare(event: NostrEvent): DraftNostrEvent {
  const relay = getEventRelays(event.id).value?.[0] ?? "";

  const tags: NostrEvent["tags"] = [];
  tags.push(["e", event.id, relay, "mention"]);
  tags.push(["p", event.pubkey]);

  return {
    kind: Kind.Text,
    // TODO: be smarter about picking relay
    tags,
    content: "#[0]",
    created_at: moment().unix(),
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
